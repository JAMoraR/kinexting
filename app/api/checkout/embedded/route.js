import { NextResponse } from "next/server"
import { Stripe } from "stripe"
import { createHash } from "node:crypto"

const PLAN_IDS = new Set(["asistente", "recepcionista", "soporte-tecnico", "a-medida"])
const DOMAIN_OPTIONS = new Set(["domain-1", "domain-2"])
const MAX_EXTRA_IDS = 10
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_REQUESTS = 30

const globalForRateLimit = globalThis

if (!globalForRateLimit.__checkoutEmbeddedRateLimit) {
  globalForRateLimit.__checkoutEmbeddedRateLimit = new Map()
}

const rateLimitStore = globalForRateLimit.__checkoutEmbeddedRateLimit

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DOMAIN_REGEX = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,}$/i
const PHONE_REGEX = /^\+?[0-9][0-9\s-]{7,19}$/
const RFC_REGEX = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i
const IDEMPOTENCY_REGEX = /^[a-zA-Z0-9_-]{8,80}$/
const PERSON_NAME_REGEX = /^[\p{L} .-]+$/u
const BUSINESS_NAME_REGEX = /^[\p{L}\p{N} .,&-]+$/u
const DISALLOWED_SYMBOLS_REGEX = /['"`;<>\\]/

const cleanText = (value, maxLength = 160) => String(value || "").trim().slice(0, maxLength)
const cleanDomain = (value) => cleanText(value, 120).toLowerCase().replace(/^https?:\/\//, "")

const dedupeTextList = (value, maxItems = MAX_EXTRA_IDS) => {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  const result = []

  for (const item of value) {
    const normalized = cleanText(item, 80)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    result.push(normalized)
    if (result.length >= maxItems) break
  }

  return result
}

const isValidEmail = (value) => Boolean(value && EMAIL_REGEX.test(value))

const getClientIp = (request) => {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }
  return request.headers.get("x-real-ip") || "unknown"
}

const isRateLimited = (clientIp) => {
  const now = Date.now()
  const entry = rateLimitStore.get(clientIp)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  if (entry.count >= RATE_LIMIT_REQUESTS) {
    return true
  }

  entry.count += 1
  return false
}

const requiresDomain = (planId) => planId === "a-medida"

const PERIOD_SUFFIX_MAP = {
  quarterly: "_trimester",
  semiannual: "_semester",
  annual: "_year",
}

const PERIOD_SUFFIXES = ["_trimester", "_semester", "_year"]

const PERIOD_MAP = {
  _trimester: "quarterly",
  _semester: "semiannual",
  _year: "annual",
}

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const resolvePlanId = (price) => {
  const metadataId = price.metadata?.plan_id
  if (metadataId && PLAN_IDS.has(metadataId)) return metadataId

  const lookupKey = (price.lookup_key || "").toLowerCase()
  if (
    lookupKey.includes("a-medida") ||
    lookupKey.includes("chatbot_webapp") ||
    lookupKey.includes("chatbot-webapp") ||
    lookupKey.includes("personalizado")
  ) {
    return "a-medida"
  }
  if (lookupKey.includes("asistente") || lookupKey.includes("landing")) return "asistente"
  if (lookupKey.includes("recepcionista") || (lookupKey.includes("chatbot") && !lookupKey.includes("web"))) {
    return "recepcionista"
  }
  if (
    lookupKey.includes("soporte") ||
    lookupKey.includes("webapp") ||
    (lookupKey.includes("web") && !lookupKey.includes("chatbot"))
  ) {
    return "soporte-tecnico"
  }

  const productName = price.product && typeof price.product !== "string" ? price.product.name.toLowerCase() : ""
  const nickname = (price.nickname || "").toLowerCase()
  const text = nickname + " " + productName

  if (text.includes("a medida") || (text.includes("chatbot") && text.includes("web")) || text.includes("personalizado")) {
    return "a-medida"
  }
  if (text.includes("asistente") || text.includes("landing")) return "asistente"
  if (text.includes("recepcionista") || (text.includes("chatbot") && !text.includes("web"))) return "recepcionista"
  if (text.includes("soporte") || (text.includes("web") && !text.includes("chatbot"))) return "soporte-tecnico"

  return null
}

const resolvePlanPeriod = (price) => {
  const lookupKey = (price.lookup_key || "").toLowerCase()
  if (
    lookupKey.endsWith("_year") ||
    lookupKey.endsWith("_annual") ||
    lookupKey.endsWith(".annual") ||
    lookupKey.endsWith("_anual")
  ) {
    return "annual"
  }
  if (lookupKey.endsWith("_semester") || lookupKey.endsWith("_semiannual")) return "semiannual"
  if (lookupKey.endsWith("_trimester") || lookupKey.endsWith("_quarterly")) return "quarterly"
  if (lookupKey.endsWith("_monthly") || lookupKey.endsWith(".monthly") || lookupKey.endsWith("_mes")) return "monthly"

  const interval = price.recurring?.interval
  if (interval === "year") return "annual"
  if (interval === "month") return "monthly"
  return null
}

const resolveExtraId = (price) => {
  const metadataId = price.metadata?.extra_id
  if (metadataId) return metadataId

  const lookupKey = price.lookup_key ?? ""
  if (lookupKey.startsWith("extra.")) {
    const lookupParts = lookupKey.split(".")
    const inferred = lookupParts.slice(1, -1).join("-")
    if (inferred) return inferred
  }

  return null
}

const isExtraPrice = (price, selectedExtraId) => {
  const interval = price.recurring?.interval
  return Boolean(interval && (interval === "month" || interval === "year") && resolveExtraId(price) === selectedExtraId)
}

const pickExtraPrice = (candidates, billing) => {
  if (billing === "annual") {
    const exact = candidates.find((price) => price.recurring?.interval === "year")
    if (exact) return exact
  }
  return candidates.find((price) => price.recurring?.interval === "month") ?? null
}

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 415 })
    }

    const clientIp = getClientIp(request)
    if (isRateLimited(clientIp)) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Intenta en un minuto." }, { status: 429 })
    }

    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: "Configuración de Stripe incompleta (falta STRIPE_SECRET_KEY)" }, { status: 500 })
    }

    const payload = await request.json()
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }

    const planId = cleanText(payload?.planId, 40)
    const billing = payload?.billing === "semiannual" ? "semiannual" : payload?.billing === "annual" ? "annual" : "quarterly"
    const extraIds = dedupeTextList(payload?.extraIds)
    const selectedDomain = cleanText(payload?.selectedDomain, 40)
    const newDomain = cleanDomain(payload?.newDomain)
    const customerName = cleanText(payload?.customerName, 120)
    const customerEmail = cleanText(payload?.customerEmail, 160).toLowerCase()
    const customerPhone = cleanText(payload?.customerPhone, 30)
    const businessInfo = payload?.businessInfo && typeof payload.businessInfo === "object" ? payload.businessInfo : {}
    const invoice = payload?.invoice && typeof payload.invoice === "object" ? payload.invoice : null
    const idempotencyHeader = cleanText(request.headers.get("x-idempotency-key"), 80)

    // Validaciones
    if (!planId || !PLAN_IDS.has(planId)) {
      return NextResponse.json({ error: "Plan seleccionado inválido" }, { status: 400 })
    }

    if (!customerName || customerName.length < 3) {
      return NextResponse.json({ error: "Nombre completo del contacto requerido" }, { status: 400 })
    }

    if (DISALLOWED_SYMBOLS_REGEX.test(customerName) || !PERSON_NAME_REGEX.test(customerName)) {
      return NextResponse.json({ error: "Ingresa un nombre de contacto válido (sin símbolos especiales)" }, { status: 400 })
    }

    if (!customerEmail || !isValidEmail(customerEmail)) {
      return NextResponse.json({ error: "Correo electrónico corporativo inválido" }, { status: 400 })
    }

    if (!customerPhone || !PHONE_REGEX.test(customerPhone)) {
      return NextResponse.json({ error: "Teléfono / WhatsApp de contacto inválido" }, { status: 400 })
    }

    const normalizedBusinessName = cleanText(businessInfo.businessName, 160)
    const normalizedBusinessType = cleanText(businessInfo.businessType, 80)
    const normalizedCity = cleanText(businessInfo.city, 80)
    const normalizedCountry = cleanText(businessInfo.country, 80)
    const normalizedWebsite = cleanText(businessInfo.website, 160)
    const normalizedTeamSize = cleanText(businessInfo.teamSize, 40)

    if (!normalizedBusinessName || normalizedBusinessName.length < 2) {
      return NextResponse.json({ error: "Nombre de la empresa o negocio requerido" }, { status: 400 })
    }

    if (DISALLOWED_SYMBOLS_REGEX.test(normalizedBusinessName) || !BUSINESS_NAME_REGEX.test(normalizedBusinessName)) {
      return NextResponse.json({ error: "Nombre de negocio inválido (sin caracteres especiales)" }, { status: 400 })
    }

    if (!normalizedBusinessType) {
      return NextResponse.json({ error: "Selecciona el tipo o sector de tu negocio" }, { status: 400 })
    }

    if (requiresDomain(planId)) {
      if (!selectedDomain || !DOMAIN_OPTIONS.has(selectedDomain)) {
        return NextResponse.json({ error: "Selecciona una opción de dominio válida" }, { status: 400 })
      }
      if (selectedDomain === "domain-2" && (!newDomain || !DOMAIN_REGEX.test(newDomain))) {
        return NextResponse.json({ error: "Ingresa un dominio válido para registrar" }, { status: 400 })
      }
    }

    // Validación opcional de Facturación
    const isInvoiceEnabled = Boolean(invoice?.enabled)
    const invoiceRfc = cleanText(invoice?.rfc, 13).toUpperCase()
    const invoiceBusinessName = cleanText(invoice?.businessName, 160)
    const invoiceEmail = cleanText(invoice?.email, 160).toLowerCase()

    if (isInvoiceEnabled) {
      if (!invoiceRfc || !RFC_REGEX.test(invoiceRfc)) {
        return NextResponse.json({ error: "RFC inválido para facturación fiscal (CFDI)" }, { status: 400 })
      }
      if (!invoiceBusinessName || invoiceBusinessName.length < 2) {
        return NextResponse.json({ error: "Razón social requerida para facturación" }, { status: 400 })
      }
      if (!invoiceEmail || !isValidEmail(invoiceEmail)) {
        return NextResponse.json({ error: "Correo fiscal inválido" }, { status: 400 })
      }
    }

    if (idempotencyHeader && !IDEMPOTENCY_REGEX.test(idempotencyHeader)) {
      return NextResponse.json({ error: "Idempotency key inválida" }, { status: 400 })
    }

    const stripe = new Stripe(secretKey)

    // Obtener catálogo de precios
    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ["data.product"],
    })

    const planSuffix = PERIOD_SUFFIX_MAP[billing]
    const expectedLookupKey = `${planId}${planSuffix}`
    let basePlanPrice = prices.data.find((price) => price.lookup_key === expectedLookupKey)

    if (!basePlanPrice) {
      basePlanPrice = prices.data.find(
        (price) => resolvePlanId(price) === planId && resolvePlanPeriod(price) === billing
      )
    }

    if (!basePlanPrice && billing === "annual") {
      basePlanPrice = prices.data.find(
        (price) => resolvePlanId(price) === planId && resolvePlanPeriod(price) === "annual"
      )
    }

    if (!basePlanPrice) {
      basePlanPrice = prices.data.find(
        (price) => resolvePlanId(price) === planId && resolvePlanPeriod(price) === "monthly"
      )
    }

    if (!basePlanPrice) {
      basePlanPrice = prices.data.find((price) => resolvePlanId(price) === planId)
    }

    if (!basePlanPrice) {
      return NextResponse.json({ error: "No se encontró el precio en Stripe para el plan seleccionado" }, { status: 400 })
    }

    const lineItems = [{ price: basePlanPrice.id, quantity: 1 }]
    const unknownExtraIds = []

    for (const extraId of extraIds) {
      const extraCandidates = prices.data.filter((price) => isExtraPrice(price, extraId))
      const extraPrice = pickExtraPrice(extraCandidates, billing)
      if (extraPrice) {
        lineItems.push({ price: extraPrice.id, quantity: 1 })
      } else {
        unknownExtraIds.push(extraId)
      }
    }

    if (unknownExtraIds.length > 0) {
      return NextResponse.json({ error: "Se detectaron extras no disponibles" }, { status: 400 })
    }

    // Crear o buscar Customer en Stripe
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    })

    let customerId
    const customerMetadata = {
      businessName: normalizedBusinessName,
      businessType: normalizedBusinessType,
      city: normalizedCity,
      country: normalizedCountry,
      website: normalizedWebsite,
      teamSize: normalizedTeamSize,
      invoiceRequested: isInvoiceEnabled ? "true" : "false",
      invoiceRfc: isInvoiceEnabled ? invoiceRfc : "",
      invoiceBusinessName: isInvoiceEnabled ? invoiceBusinessName : "",
    }

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
      await stripe.customers.update(customerId, {
        name: customerName,
        phone: customerPhone,
        metadata: customerMetadata,
      })
    } else {
      const newCustomer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
        metadata: customerMetadata,
      })
      customerId = newCustomer.id
    }

    const origin = new URL(request.url).origin
    const returnUrl = `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`

    const sessionMetadata = {
      planId,
      billing,
      selectedDomain,
      newDomain,
      customerName,
      customerEmail,
      customerPhone,
      businessName: normalizedBusinessName,
      businessType: normalizedBusinessType,
      city: normalizedCity,
      country: normalizedCountry,
      website: normalizedWebsite,
      teamSize: normalizedTeamSize,
      invoiceRequested: isInvoiceEnabled ? "true" : "false",
      invoiceRfc: isInvoiceEnabled ? invoiceRfc : "",
      invoiceBusinessName: isInvoiceEnabled ? invoiceBusinessName : "",
      invoiceEmail: isInvoiceEnabled ? invoiceEmail : "",
      extraIds: JSON.stringify(extraIds),
    }

    const idempotencySeed = idempotencyHeader
      ? `${planId}:${billing}:${idempotencyHeader}`
      : `${planId}:${billing}:${customerEmail}:${customerPhone}:${normalizedBusinessName}`

    const idempotencyKey = createHash("sha256")
      .update(idempotencySeed)
      .digest("hex")
      .slice(0, 64)

    // Crear la sesión de checkout en modo EMBEDDED
    const session = await stripe.checkout.sessions.create(
      {
        ui_mode: "embedded",
        mode: "subscription",
        customer: customerId,
        line_items: lineItems,
        return_url: returnUrl,
        metadata: sessionMetadata,
        locale: "es",
        allow_promotion_codes: true,
      },
      {
        idempotencyKey,
      }
    )

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
    })
  } catch (error) {
    console.error("Error creando Stripe Embedded Checkout session:", error)
    const message = process.env.NODE_ENV !== "production" && error instanceof Error ? error.message : "Error al inicializar la pasarela de pago segura"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
