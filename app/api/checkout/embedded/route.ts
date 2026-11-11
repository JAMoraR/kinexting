import { NextResponse } from "next/server"
import type { Stripe } from "stripe"
import {
  cleanDomain,
  cleanEmail,
  cleanText,
  findOrCreateStripeCustomer,
  getSiteOrigin,
  getStripePublishableKey,
  getStripeSecretKey,
  getStripeServer,
  resolveBillingPeriodFromStripePrice,
  resolveExtraIdFromStripePrice,
  resolvePlanIdFromStripePrice,
  buildSafeIdempotencyKey,
  checkStripeKeysHealth,
} from "@/lib/stripe"
import {
  MASTER_EXTRAS,
  MASTER_PLANS,
  type BillingCycle,
  type PlanId,
} from "@/lib/plans"

const VALID_PLAN_IDS = new Set(["asistente", "recepcionista", "soporte-tecnico", "a-medida"])
const VALID_DOMAIN_OPTIONS = new Set(["domain-1", "domain-2"])
const MAX_EXTRA_IDS = 10
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_REQUESTS = 30

const globalStore = globalThis as unknown as {
  __checkoutEmbeddedRateLimit?: Map<string, { count: number; resetAt: number }>
}

if (!globalStore.__checkoutEmbeddedRateLimit) {
  globalStore.__checkoutEmbeddedRateLimit = new Map()
}

const rateLimitStore = globalStore.__checkoutEmbeddedRateLimit

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DOMAIN_REGEX = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,}$/i
const PHONE_REGEX = /^\+?[0-9][0-9\s-]{7,19}$/
const RFC_REGEX = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i
const PERSON_NAME_REGEX = /^[\p{L} .-]+$/u
const BUSINESS_NAME_REGEX = /^[\p{L}\p{N} .,&-]+$/u
const DISALLOWED_SYMBOLS_REGEX = /['"`;<>\\]/

const getClientIp = (request: Request): string => {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }
  return request.headers.get("x-real-ip") || "unknown"
}

const isRateLimited = (clientIp: string): boolean => {
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

const dedupeTextList = (value: unknown, maxItems = MAX_EXTRA_IDS): string[] => {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const result: string[] = []

  for (const item of value) {
    const normalized = cleanText(item, 80)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    result.push(normalized)
    if (result.length >= maxItems) break
  }

  return result
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 415 })
    }

    const clientIp = getClientIp(request)
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Por favor intenta de nuevo en un minuto." },
        { status: 429 }
      )
    }

    const secretKey = getStripeSecretKey()
    if (!secretKey) {
      return NextResponse.json(
        { error: "Configuración de Stripe incompleta (falta STRIPE_SECRET_KEY en el servidor)" },
        { status: 500 }
      )
    }

    // Advertencia en logs si hay incompatibilidad de entornos (live vs test)
    const health = checkStripeKeysHealth()
    if (health.warning) {
      console.warn("[Stripe Warning]:", health.warning)
    }

    const payload = await request.json().catch(() => null)
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Payload inválido o malformado" }, { status: 400 })
    }

    const planId = cleanText(payload.planId, 40) as PlanId
    const billing: BillingCycle = payload.billing === "annual" ? "annual" : "quarterly"
    const extraIds = dedupeTextList(payload.extraIds)
    const selectedDomain = cleanText(payload.selectedDomain, 40)
    const newDomain = cleanDomain(payload.newDomain)
    const customerName = cleanText(payload.customerName, 120)
    const customerEmail = cleanEmail(payload.customerEmail)
    const customerPhone = cleanText(payload.customerPhone, 30)
    const businessInfo = payload.businessInfo && typeof payload.businessInfo === "object" ? payload.businessInfo : {}
    const invoice = payload.invoice && typeof payload.invoice === "object" ? payload.invoice : null
    const newsletterOptIn = Boolean(payload.newsletter)
    const termsAccepted = Boolean(payload.termsAccepted)
    const privacyAccepted = Boolean(payload.privacyAccepted)
    const cancellationAccepted = Boolean(payload.cancellationAccepted)
    const idempotencyHeader = cleanText(request.headers.get("x-idempotency-key"), 80)

    // Validaciones de negocio
    if (!planId || !VALID_PLAN_IDS.has(planId)) {
      return NextResponse.json({ error: "El plan seleccionado no es válido" }, { status: 400 })
    }

    if (!customerName || customerName.length < 3) {
      return NextResponse.json({ error: "Nombre completo del contacto requerido (mínimo 3 caracteres)" }, { status: 400 })
    }

    if (DISALLOWED_SYMBOLS_REGEX.test(customerName) || !PERSON_NAME_REGEX.test(customerName)) {
      return NextResponse.json({ error: "Ingresa un nombre de contacto válido (sin símbolos especiales)" }, { status: 400 })
    }

    if (!customerEmail || !EMAIL_REGEX.test(customerEmail)) {
      return NextResponse.json({ error: "Correo electrónico corporativo inválido" }, { status: 400 })
    }

    if (!customerPhone || !PHONE_REGEX.test(customerPhone)) {
      return NextResponse.json({ error: "Teléfono / WhatsApp de contacto inválido" }, { status: 400 })
    }

    const normalizedBusinessName = cleanText(businessInfo.businessName, 160)
    const normalizedBusinessType = cleanText(businessInfo.businessType, 80)
    const normalizedCity = cleanText(businessInfo.city, 80)
    const normalizedCountry = cleanText(businessInfo.country, 80) || "México"
    const normalizedWebsite = cleanText(businessInfo.website, 160)
    const normalizedTeamSize = cleanText(businessInfo.teamSize, 40)

    if (!normalizedBusinessName || normalizedBusinessName.length < 2) {
      return NextResponse.json({ error: "Nombre comercial de la empresa requerido" }, { status: 400 })
    }

    if (DISALLOWED_SYMBOLS_REGEX.test(normalizedBusinessName) || !BUSINESS_NAME_REGEX.test(normalizedBusinessName)) {
      return NextResponse.json({ error: "Nombre comercial inválido (sin caracteres especiales)" }, { status: 400 })
    }

    if (!normalizedBusinessType) {
      return NextResponse.json({ error: "Selecciona el sector o tipo de tu negocio" }, { status: 400 })
    }

    // Validación de dominio si aplica
    if (selectedDomain && VALID_DOMAIN_OPTIONS.has(selectedDomain)) {
      if (selectedDomain === "domain-2" && newDomain && !DOMAIN_REGEX.test(newDomain)) {
        return NextResponse.json({ error: "El dominio ingresado no tiene un formato válido" }, { status: 400 })
      }
    }

    // Validación de Facturación Fiscal (CFDI México)
    const isInvoiceEnabled = Boolean(invoice?.enabled)
    const invoiceRfc = cleanText(invoice?.rfc, 13).toUpperCase()
    const invoiceBusinessName = cleanText(invoice?.businessName, 160)
    const invoiceEmail = cleanEmail(invoice?.email)

    if (isInvoiceEnabled) {
      if (!invoiceRfc || !RFC_REGEX.test(invoiceRfc)) {
        return NextResponse.json({ error: "RFC inválido para facturación fiscal (formato SAT)" }, { status: 400 })
      }
      if (!invoiceBusinessName || invoiceBusinessName.length < 2) {
        return NextResponse.json({ error: "Razón social requerida para emitir factura fiscal" }, { status: 400 })
      }
      if (!invoiceEmail || !EMAIL_REGEX.test(invoiceEmail)) {
        return NextResponse.json({ error: "Correo fiscal inválido para envío de factura" }, { status: 400 })
      }
    }

    const stripe = getStripeServer()
    const masterPlan = MASTER_PLANS[planId] || MASTER_PLANS.asistente

    // Buscar precios activos en Stripe
    const stripePrices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ["data.product"],
    })

    // Heurística de búsqueda del precio base del plan en Stripe
    let basePriceId: string | null = null

    // 1. Coincidencia por lookup_key exacto o convención
    const planCandidate = stripePrices.data.find((price) => {
      const pId = resolvePlanIdFromStripePrice(price)
      const pPeriod = resolveBillingPeriodFromStripePrice(price)
      return pId === planId && pPeriod === billing
    })

    if (planCandidate) {
      basePriceId = planCandidate.id
    }

    // Construcción de line_items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

    if (basePriceId) {
      lineItems.push({
        price: basePriceId,
        quantity: 1,
      })
    } else {
      // Si el plan no tiene un precio previo creado en Stripe Dashboard,
      // creamos el precio recurrente inline mediante price_data para garantizar que el checkout nunca falle.
      const defaultPrice = masterPlan.defaultPrices[billing]
      lineItems.push({
        price_data: {
          currency: defaultPrice.currency,
          unit_amount: Math.round(defaultPrice.amount * 100),
          recurring: {
            interval: billing === "annual" ? "year" : "month",
            interval_count: billing === "annual" ? 1 : 3,
          },
          product_data: {
            name: `${masterPlan.title} (${billing === "annual" ? "Anual" : "Trimestral"})`,
            description: masterPlan.description,
            metadata: {
              plan_id: planId,
              billing,
            },
          },
        },
        quantity: 1,
      })
    }

    // Agregar Extras / Complementos seleccionados
    for (const extraId of extraIds) {
      // 1. Buscar si existe en Stripe
      const extraStripePrice = stripePrices.data.find((p) => {
        const id = resolveExtraIdFromStripePrice(p)
        const period = resolveBillingPeriodFromStripePrice(p)
        return id === extraId && (period === billing || period === "quarterly")
      })

      if (extraStripePrice) {
        lineItems.push({
          price: extraStripePrice.id,
          quantity: 1,
        })
      } else {
        // 2. Si no existe en Stripe, buscar en el catálogo maestro y crear inline
        const catalogExtra = MASTER_EXTRAS.find((e) => e.id === extraId)
        if (catalogExtra && catalogExtra.prices) {
          const extraPriceObj = billing === "annual" ? catalogExtra.prices.annual : catalogExtra.prices.quarterly
          if (extraPriceObj && extraPriceObj.amount > 0) {
            lineItems.push({
              price_data: {
                currency: extraPriceObj.currency,
                unit_amount: Math.round(extraPriceObj.amount * 100),
                recurring: {
                  interval: billing === "annual" ? "year" : "month",
                  interval_count: billing === "annual" ? 1 : 3,
                },
                product_data: {
                  name: catalogExtra.name || extraId,
                  description: catalogExtra.description || "",
                  metadata: {
                    extra_id: extraId,
                    billing,
                  },
                },
              },
              quantity: 1,
            })
          }
        }
      }
    }

    // Metadatos unificados para el Customer y la Subscription
    const businessMetadata: Record<string, string> = {
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
      newsletterOptIn: newsletterOptIn ? "true" : "false",
      termsAccepted: termsAccepted ? "true" : "false",
      privacyAccepted: privacyAccepted ? "true" : "false",
      cancellationAccepted: cancellationAccepted ? "true" : "false",
      extraIds: JSON.stringify(extraIds),
    }

    const customerCountryCode =
      normalizedCountry.toLowerCase().includes("mex") || normalizedCountry.toLowerCase().includes("méx")
        ? "MX"
        : "MX"

    // Crear o recuperar el Customer en Stripe de forma robusta con país para cálculo oficial de IVA
    const customerId = await findOrCreateStripeCustomer(stripe, {
      email: customerEmail,
      name: customerName,
      phone: customerPhone,
      address: {
        country: customerCountryCode,
        city: normalizedCity || undefined,
      },
      metadata: businessMetadata,
    })

    const origin = getSiteOrigin(request)
    const returnUrl = `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`

    // Clave de idempotencia única por intento
    const idempotencyKey = idempotencyHeader
      ? buildSafeIdempotencyKey("header", [idempotencyHeader])
      : buildSafeIdempotencyKey("checkout", [
          planId,
          billing,
          customerId,
          extraIds.join(","),
          // Agrupado en ventanas de 5 segundos para permitir reintentos legítimos de red
          Math.floor(Date.now() / 5000),
        ])

    // Crear la sesión en modo Embedded con suscripción recurrente e IVA SAT (16%) automático
    const session = await stripe.checkout.sessions.create(
      {
        ui_mode: "embedded",
        mode: "subscription",
        customer: customerId,
        customer_update: {
          name: "auto",
          address: "auto",
        },
        automatic_tax: {
          enabled: true,
        },
        tax_id_collection: {
          enabled: true,
        },
        line_items: lineItems,
        return_url: returnUrl,
        metadata: businessMetadata,
        subscription_data: {
          metadata: businessMetadata,
          description: `${masterPlan.title} (${billing === "annual" ? "Anual" : "Trimestral"}) - ${normalizedBusinessName}`,
        },
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
      publishableKey: getStripePublishableKey(),
    })
  } catch (error) {
    console.error("Error al crear sesión de Stripe Embedded Checkout:", error)
    const isDev = process.env.NODE_ENV !== "production"
    const message =
      isDev && error instanceof Error
        ? error.message
        : "No fue posible inicializar la pasarela de pago segura de Stripe. Por favor verifica tus datos e intenta nuevamente."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
