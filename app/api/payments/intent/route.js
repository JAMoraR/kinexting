import { NextResponse } from "next/server"
import { Stripe } from "stripe"
import { createHash } from "node:crypto"

const PLAN_IDS = new Set(["landing", "chatbot", "webapp", "chatbot-webapp"])
const PREFERRED_METHODS = new Set(["card", "oxxo", "spei"])
const DOMAIN_OPTIONS = new Set(["domain-1", "domain-2"])
const OXXO_MAX_AMOUNT_MXN = 1_000_000
const MAX_EXTRA_IDS = 10
const MAX_AMOUNT_MXN = 20_000_000
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_REQUESTS = 25

const globalForRateLimit = globalThis

if (!globalForRateLimit.__paymentIntentRateLimit) {
  globalForRateLimit.__paymentIntentRateLimit = new Map()
}

const rateLimitStore = globalForRateLimit.__paymentIntentRateLimit

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DOMAIN_REGEX = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,}$/i
const PHONE_REGEX = /^\+?[0-9][0-9\s-]{7,19}$/
const RFC_REGEX = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i
const IDEMPOTENCY_REGEX = /^[a-zA-Z0-9_-]{8,80}$/
const CUSTOMER_NAME_REGEX = /^(?=.{3,120}$)(?=.*[A-Za-z\u00C0-\u024F])[A-Za-z\u00C0-\u024F]+(?:[ .-][A-Za-z\u00C0-\u024F]+){2,}$/
const BUSINESS_NAME_REGEX = /^(?=.{2,160}$)(?=.*[A-Za-z0-9\u00C0-\u024F])[A-Za-z0-9\u00C0-\u024F .,&-]+$/
const DISALLOWED_SYMBOLS_REGEX = /['"`;<>\\]/

const cleanText = (value, maxLength = 120) => String(value || "").trim().slice(0, maxLength)

const cleanDomain = (value) => cleanText(value, 120).toLowerCase().replace(/^https?:\/\//, "")

const dedupeTextList = (value, maxItems = MAX_EXTRA_IDS) => {
  if (!Array.isArray(value)) return []

  const result = []
  const seen = new Set()

  for (const item of value) {
    const normalized = cleanText(item, 80)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    result.push(normalized)
    if (result.length >= maxItems) break
  }

  return result
}

const isValidEmail = (value) => !value || EMAIL_REGEX.test(value)

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

const requiresDomain = (planId) => planId !== "chatbot"

const toStripeMetadata = (value) => cleanText(value, 500)

const getCustomerEmail = (businessInfo, invoice) => {
  if (invoice?.enabled && invoice.email) return invoice.email
  if (businessInfo?.email) return businessInfo.email
  return undefined
}

const getPriceLabel = (price) => {
  const product = price.product && typeof price.product !== "string" ? price.product : null
  return price.nickname || product?.name || price.id
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

  const lookupKey = price.lookup_key ?? ""
  if (lookupKey.startsWith("plan.")) {
    const lookupParts = lookupKey.split(".")
    const inferred = lookupParts.slice(1, -1).join("-")
    if (PLAN_IDS.has(inferred)) return inferred
  }

  const productName = price.product && typeof price.product !== "string" ? price.product.name : ""
  const candidate = normalizeText(price.nickname || productName)

  if (candidate.includes("chatbot") && candidate.includes("web")) return "chatbot-webapp"
  if (candidate.includes("web app") || candidate === "webapp" || candidate === "web app") return "webapp"
  if (candidate.includes("chatbot")) return "chatbot"
  if (candidate.includes("landing")) return "landing"

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

const getInterval = (billing) => (billing === "annual" ? "year" : "month")

const isRecurringPlanPrice = (price, selectedPlanId) => {
  const interval = price.recurring?.interval
  return Boolean(interval && (interval === "month" || interval === "year") && resolvePlanId(price) === selectedPlanId)
}

const isRecurringExtraPrice = (price, selectedExtraId) => {
  const interval = price.recurring?.interval
  return Boolean(interval && (interval === "month" || interval === "year") && resolveExtraId(price) === selectedExtraId)
}

const pickPriceForInterval = (candidates, targetInterval) => {
  const exact = candidates.find((price) => price.recurring?.interval === targetInterval)
  if (exact) return exact

  return candidates.find((price) => price.recurring?.interval === "month") ?? null
}

const resolvePaymentMethodTypes = (preferredMethod, amount) => {
  const oxxoAllowed = amount <= OXXO_MAX_AMOUNT_MXN

  if (preferredMethod === "card") return ["card"]
  if (preferredMethod === "oxxo") {
    if (!oxxoAllowed) {
      throw new Error("El metodo OXXO solo permite montos de hasta $10,000 MXN")
    }
    return ["oxxo"]
  }
  if (preferredMethod === "spei") return ["customer_balance"]

  return ["card"]
}

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 415 })
    }

    const clientIp = getClientIp(request)
    if (isRateLimited(clientIp)) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." }, { status: 429 })
    }

    const secretKey = process.env.STRIPE_SECRET_KEY

    if (!secretKey) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 })
    }

    const payload = await request.json()
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const planId = cleanText(payload?.planId, 40)
    const billing = payload?.billing === "annual" ? "annual" : "monthly"
    const extraIds = dedupeTextList(payload?.extraIds)
    const selectedDomain = cleanText(payload?.selectedDomain, 40)
    const newDomain = cleanDomain(payload?.newDomain)
    const customerPhone = cleanText(payload?.customerPhone, 25)
    const businessInfo = payload?.businessInfo && typeof payload.businessInfo === "object" ? payload.businessInfo : null
    const customerName = cleanText(payload?.customerName, 120)
    const preferredMethod = cleanText(payload?.preferredMethod || "card", 20)
    const invoice = payload?.invoice && typeof payload.invoice === "object" ? payload.invoice : null
    const idempotencyHeader = cleanText(request.headers.get("x-idempotency-key"), 80)

    if (!planId || !PLAN_IDS.has(planId)) {
      return NextResponse.json({ error: "Invalid planId" }, { status: 400 })
    }

    if (!PREFERRED_METHODS.has(preferredMethod)) {
      return NextResponse.json({ error: "Metodo de pago invalido" }, { status: 400 })
    }

    if (requiresDomain(planId)) {
      if (!selectedDomain || !DOMAIN_OPTIONS.has(selectedDomain)) {
        return NextResponse.json({ error: "Selecciona una opcion de dominio valida" }, { status: 400 })
      }

      if (selectedDomain === "domain-2" && (!newDomain || !DOMAIN_REGEX.test(newDomain))) {
        return NextResponse.json({ error: "Ingresa un dominio valido para registrar" }, { status: 400 })
      }
    }

    if (!customerName || customerName.length < 2) {
      return NextResponse.json({ error: "Nombre completo requerido" }, { status: 400 })
    }

    if (DISALLOWED_SYMBOLS_REGEX.test(customerName) || !CUSTOMER_NAME_REGEX.test(customerName)) {
      return NextResponse.json({ error: "Escribe tu nombre y dos apellidos. Si tienes apellidos compuestos, escríbelos juntos." }, { status: 400 })
    }

    if (!customerPhone || !PHONE_REGEX.test(customerPhone)) {
      return NextResponse.json({ error: "Telefono invalido" }, { status: 400 })
    }

    if (!businessInfo) {
      return NextResponse.json({ error: "Faltan datos del negocio" }, { status: 400 })
    }

    const normalizedBusinessInfo = {
      businessName: cleanText(businessInfo.businessName, 160),
      businessType: cleanText(businessInfo.businessType, 120),
      email: cleanText(businessInfo.email, 160).toLowerCase(),
      country: cleanText(businessInfo.country, 120),
      city: cleanText(businessInfo.city, 120),
    }

    if (!normalizedBusinessInfo.businessName) {
      return NextResponse.json({ error: "Completa el nombre de tu negocio para continuar" }, { status: 400 })
    }

    if (
      DISALLOWED_SYMBOLS_REGEX.test(normalizedBusinessInfo.businessName) ||
      !BUSINESS_NAME_REGEX.test(normalizedBusinessInfo.businessName)
    ) {
      return NextResponse.json({ error: "Nombre del negocio invalido" }, { status: 400 })
    }

    if (!normalizedBusinessInfo.businessType) {
      return NextResponse.json({ error: "Selecciona el tipo de negocio para continuar" }, { status: 400 })
    }

    if (normalizedBusinessInfo.email && !isValidEmail(normalizedBusinessInfo.email)) {
      return NextResponse.json({ error: "Correo del negocio invalido" }, { status: 400 })
    }

    const normalizedInvoice = {
      enabled: Boolean(invoice?.enabled),
      rfc: cleanText(invoice?.rfc, 13).toUpperCase(),
      businessName: cleanText(invoice?.businessName, 160),
      email: cleanText(invoice?.email, 160).toLowerCase(),
    }

    if (normalizedInvoice.enabled) {
      if (!normalizedInvoice.rfc || !RFC_REGEX.test(normalizedInvoice.rfc)) {
        return NextResponse.json({ error: "RFC invalido para facturacion" }, { status: 400 })
      }

      if (!normalizedInvoice.businessName) {
        return NextResponse.json({ error: "Razon social requerida para facturacion" }, { status: 400 })
      }

      if (!normalizedInvoice.email || !isValidEmail(normalizedInvoice.email)) {
        return NextResponse.json({ error: "Correo de facturacion invalido" }, { status: 400 })
      }
    }

    if (idempotencyHeader && !IDEMPOTENCY_REGEX.test(idempotencyHeader)) {
      return NextResponse.json({ error: "Idempotency key invalida" }, { status: 400 })
    }

    const stripe = new Stripe(secretKey)

    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ["data.product"],
    })

    const targetInterval = getInterval(billing)
    const planCandidates = prices.data.filter((price) => isRecurringPlanPrice(price, planId))
    const basePlanPrice = pickPriceForInterval(planCandidates, targetInterval)

    if (!basePlanPrice?.unit_amount) {
      return NextResponse.json({ error: "Price not found for selected plan" }, { status: 400 })
    }

    let totalAmount = basePlanPrice.unit_amount
    const extraLineItems = []
    const unknownExtraIds = []

    for (const extraId of extraIds) {
      const extraCandidates = prices.data.filter((price) => isRecurringExtraPrice(price, extraId))
      const extraPrice = pickPriceForInterval(extraCandidates, targetInterval)
      if (extraPrice?.unit_amount) {
        totalAmount += extraPrice.unit_amount
        extraLineItems.push({
          id: extraId,
          label: getPriceLabel(extraPrice),
          amount: extraPrice.unit_amount,
        })
      } else {
        unknownExtraIds.push(extraId)
      }
    }

    if (unknownExtraIds.length > 0) {
      return NextResponse.json({ error: "Se detectaron extras invalidos" }, { status: 400 })
    }

    if (totalAmount <= 0 || totalAmount > MAX_AMOUNT_MXN) {
      return NextResponse.json({ error: "Monto fuera de rango" }, { status: 400 })
    }

    const customerEmail = getCustomerEmail(normalizedBusinessInfo, normalizedInvoice)
    const customer = await stripe.customers.create({
      email: customerEmail,
      name: customerName || undefined,
      phone: customerPhone || undefined,
      metadata: {
        planId,
        billing,
        selectedDomain: toStripeMetadata(selectedDomain),
        newDomain: toStripeMetadata(newDomain),
        customerName: toStripeMetadata(customerName),
        customerPhone: toStripeMetadata(customerPhone),
        businessName: toStripeMetadata(normalizedBusinessInfo.businessName),
        businessType: toStripeMetadata(normalizedBusinessInfo.businessType),
        businessEmail: toStripeMetadata(normalizedBusinessInfo.email),
        businessCountry: toStripeMetadata(normalizedBusinessInfo.country),
        businessCity: toStripeMetadata(normalizedBusinessInfo.city),
        invoiceRequested: normalizedInvoice.enabled ? "true" : "false",
        invoiceRfc: normalizedInvoice.enabled ? toStripeMetadata(normalizedInvoice.rfc) : "",
        invoiceBusinessName: normalizedInvoice.enabled ? toStripeMetadata(normalizedInvoice.businessName) : "",
        invoiceEmail: normalizedInvoice.enabled ? toStripeMetadata(normalizedInvoice.email) : "",
      },
    }, {
      idempotencyKey: createHash("sha256")
        .update(`${planId}:${billing}:${customerName}:${customerPhone}:${normalizedBusinessInfo.businessName}:${normalizedBusinessInfo.businessType}:${normalizedInvoice.enabled ? normalizedInvoice.rfc : ""}`)
        .digest("hex")
        .slice(0, 64),
    })

    const paymentMethodTypes = resolvePaymentMethodTypes(preferredMethod, totalAmount)
    const paymentMethodOptions = paymentMethodTypes.includes("customer_balance")
      ? {
          customer_balance: {
            funding_type: "bank_transfer",
            bank_transfer: {
              type: "mx_bank_transfer",
            },
          },
        }
      : undefined

    const idempotencySeed = idempotencyHeader
      ? `${planId}:${billing}:${idempotencyHeader}`
      : `${planId}:${billing}:${customerName}:${customerPhone}:${extraIds.join("|")}`

    const idempotencyKey = createHash("sha256")
      .update(idempotencySeed)
      .digest("hex")
      .slice(0, 64)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "mxn",
      customer: customer.id,
      receipt_email: customerEmail,
      payment_method_types: paymentMethodTypes,
      payment_method_options: paymentMethodOptions,
      metadata: {
        flow: "embedded-payment-element-trial",
        planId,
        billing,
        selectedDomain: toStripeMetadata(selectedDomain),
        newDomain: toStripeMetadata(newDomain),
        preferredMethod: toStripeMetadata(preferredMethod),
        customerName: toStripeMetadata(customerName),
        customerPhone: toStripeMetadata(customerPhone),
        businessName: toStripeMetadata(normalizedBusinessInfo.businessName),
        businessType: toStripeMetadata(normalizedBusinessInfo.businessType),
        businessEmail: toStripeMetadata(normalizedBusinessInfo.email),
        businessCountry: toStripeMetadata(normalizedBusinessInfo.country),
        businessCity: toStripeMetadata(normalizedBusinessInfo.city),
        invoiceRequested: normalizedInvoice.enabled ? "true" : "false",
        invoiceRfc: normalizedInvoice.enabled ? toStripeMetadata(normalizedInvoice.rfc) : "",
        invoiceBusinessName: normalizedInvoice.enabled ? toStripeMetadata(normalizedInvoice.businessName) : "",
        invoiceEmail: normalizedInvoice.enabled ? toStripeMetadata(normalizedInvoice.email) : "",
        extraIds: JSON.stringify(extraIds),
      },
    }, {
      idempotencyKey,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      summary: {
        currency: "mxn",
        billing,
        plan: {
          id: planId,
          label: getPriceLabel(basePlanPrice),
          amount: basePlanPrice.unit_amount,
        },
        extras: extraLineItems,
        total: totalAmount,
      },
    })
  } catch (error) {
    console.error("Failed to create PaymentIntent", error)

    const safeMessage = process.env.NODE_ENV !== "production" && error instanceof Error ? error.message : null

    if (error instanceof Error && error.message.includes("OXXO")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: safeMessage || "Failed to create payment intent" }, { status: 500 })
  }
}
