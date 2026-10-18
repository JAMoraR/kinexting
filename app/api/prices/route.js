import { NextResponse } from "next/server"
import { Stripe } from "stripe"

const PLAN_IDS = new Set(["asistente", "recepcionista", "soporte-tecnico", "a-medida"])

const PLAN_FLAGS = {
  asistente: { cheap: true },
  recepcionista: { popular: true },
  "soporte-tecnico": { highQuality: true },
  "a-medida": { recommended: true },
}

const PLAN_METADATA_FALLBACKS = {
  asistente: {
    title: "Asistente IA",
    description: "Asistente virtual con IA para automatizar conversaciones y atención al cliente.",
    features: [
      "Agente conversacional de IA 24/7",
      "Integración directa con WhatsApp",
      "Respuestas automáticas a dudas frecuentes",
      "Captación y registro de prospectos",
      "Puesta en marcha guiada",
    ],
    differences: ["Gestión de citas y sincronización de calendario", "Soporte técnico especializado con IA"],
    buttonText: "Elegir Asistente",
    defaultPrices: {
      quarterly: { amount: 2100, currency: "mxn" },
      semiannual: { amount: 4200, currency: "mxn" },
      annual: { amount: 7140, currency: "mxn" },
    },
  },
  recepcionista: {
    title: "Recepcionista IA",
    description: "Recepcionista digital que gestiona llamadas, citas y mensajes automáticamente.",
    features: [
      "Agente recepcionista con IA multicanal",
      "Gestión y confirmación de citas en tiempo real",
      "Sincronización con Google Calendar y WhatsApp",
      "Recordatorios automáticos para evitar inasistencias",
      "Panel de control y registro de conversaciones",
      "Soporte prioritario 24/7",
    ],
    differences: ["Resolución técnica avanzada de incidencias"],
    buttonText: "Elegir Recepcionista",
    defaultPrices: {
      quarterly: { amount: 4650, currency: "mxn" },
      semiannual: { amount: 9300, currency: "mxn" },
      annual: { amount: 15810, currency: "mxn" },
    },
  },
  "soporte-tecnico": {
    title: "Soporte Técnico IA",
    description: "Soporte técnico automatizado con IA para resolver incidencias y tickets 24/7.",
    features: [
      "Agente de soporte técnico avanzado con IA",
      "Resolución de dudas técnicas complejas",
      "Entrenamiento con la documentación de tu empresa",
      "Escalamiento inteligente a agentes humanos",
      "Métricas de atención y analítica",
      "Soporte técnico prioritario dedicado",
    ],
    differences: [],
    buttonText: "Elegir Soporte Técnico",
    defaultPrices: {
      quarterly: { amount: 5625, currency: "mxn" },
      semiannual: { amount: 11250, currency: "mxn" },
      annual: { amount: 19125, currency: "mxn" },
    },
  },
  "a-medida": {
    title: "A Medida",
    description: "Solución personalizada adaptada a las necesidades específicas de tu negocio.",
    features: [
      "Agentes de IA ilimitados a medida",
      "Integraciones con CRM, ERP y bases de datos",
      "Flujos conversacionales y acciones personalizadas",
      "Gerente de cuenta técnico y SLA dedicado",
      "Soporte corporativo 24/7",
    ],
    differences: [],
    buttonText: "Cotizar por WhatsApp",
    defaultPrices: {
      quarterly: null,
      semiannual: null,
      annual: { amount: 30590, currency: "mxn" },
    },
  },
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

const parseList = (value) => {
  if (!value) return []
  return String(value)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
}

const isCatalogExtra = (price) => {
  const metadataId = price.metadata?.extra_id
  if (metadataId) return true

  const lookupKey = price.lookup_key ?? ""
  return lookupKey.startsWith("extra.")
}

const ensureExtraEntry = (extrasById, extraId, price) => {
  if (extrasById.has(extraId)) return extrasById.get(extraId)

  const product = price.product && typeof price.product !== "string" ? price.product : null
  const entry = {
    id: extraId,
    category: price.metadata?.category || "general",
    name: price.metadata?.name || product?.name || extraId,
    description: price.metadata?.description || product?.description || "",
    prices: {
      monthly: null,
      annual: null,
    },
  }

  extrasById.set(extraId, entry)
  return entry
}

export async function GET() {
  const secretKey = process.env.STRIPE_SECRET_KEY

  const generateFallbackResponse = () => {
    const plans = Object.entries(PLAN_METADATA_FALLBACKS).map(([id, meta]) => ({
      id,
      title: meta.title,
      description: meta.description,
      features: meta.features,
      differences: meta.differences,
      buttonText: meta.buttonText,
      flags: PLAN_FLAGS[id],
      prices: meta.defaultPrices,
    }))

    return NextResponse.json({
      prices: [],
      plans,
      extras: [],
      currency: "mxn",
    })
  }

  if (!secretKey) {
    return generateFallbackResponse()
  }

  try {
    const stripe = new Stripe(secretKey)
    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ["data.product"],
    })

    const plansById = new Map()
    const extrasById = new Map()

    for (const planId of ["asistente", "recepcionista", "soporte-tecnico", "a-medida"]) {
      const fallback = PLAN_METADATA_FALLBACKS[planId]
      plansById.set(planId, {
        id: planId,
        title: fallback.title,
        description: fallback.description,
        features: fallback.features,
        differences: fallback.differences,
        buttonText: fallback.buttonText,
        flags: PLAN_FLAGS[planId],
        prices: {
          quarterly: null,
          semiannual: null,
          annual: null,
        },
        _rawPrices: {},
      })
    }

    prices.data.forEach((price) => {
      const interval = price.recurring?.interval
      if (!interval || (interval !== "month" && interval !== "year")) {
        return
      }

      const planId = resolvePlanId(price)
      const period = resolvePlanPeriod(price)

      if (planId && period) {
        const plan = plansById.get(planId)
        if (plan) {
          const product = price.product && typeof price.product !== "string" ? price.product : null
          const productFeatures = Array.isArray(product?.marketing_features)
            ? product.marketing_features.map((f) => f?.name).filter(Boolean)
            : []
          const metadataFeatures = parseList(price.metadata?.features)

          if (metadataFeatures.length > 0) {
            plan.features = metadataFeatures
          } else if (productFeatures.length > 0) {
            plan.features = productFeatures
          }

          if (price.metadata?.description || product?.description) {
            plan.description = price.metadata?.description || product?.description || plan.description
          }

          const amount = Number((price.unit_amount ?? 0) / 100)
          const priceObj = {
            id: price.id,
            amount,
            currency: price.currency,
          }

          plan._rawPrices[period] = priceObj

          if (period === "annual") plan.prices.annual = priceObj
          if (period === "semiannual") plan.prices.semiannual = priceObj
          if (period === "quarterly") plan.prices.quarterly = priceObj
        }
        return
      }

      if (isCatalogExtra(price)) {
        const extraId = price.metadata?.extra_id
        if (extraId) {
          const extra = ensureExtraEntry(extrasById, extraId, price)
          const targetInterval = interval === "month" ? "monthly" : "annual"
          extra.prices[targetInterval] = {
            id: price.id,
            amount: Number((price.unit_amount ?? 0) / 100),
            currency: price.currency,
          }
        }
      }
    })

    // Calcular derivaciones periódicas si no existen de forma explícita en Stripe
    for (const [planId, plan] of plansById.entries()) {
      if (planId === "a-medida") continue

      const monthlyObj = plan._rawPrices["monthly"]
      if (monthlyObj) {
        if (!plan.prices.quarterly) {
          plan.prices.quarterly = {
            id: monthlyObj.id,
            amount: monthlyObj.amount * 3,
            currency: monthlyObj.currency,
          }
        }
        if (!plan.prices.semiannual) {
          plan.prices.semiannual = {
            id: monthlyObj.id,
            amount: monthlyObj.amount * 6,
            currency: monthlyObj.currency,
          }
        }
        if (!plan.prices.annual) {
          plan.prices.annual = {
            id: monthlyObj.id,
            amount: Math.round(monthlyObj.amount * 12 * 0.85),
            currency: monthlyObj.currency,
          }
        }
      } else {
        // Si no hay monthly, usar defaults de precios
        const fallback = PLAN_METADATA_FALLBACKS[planId]
        if (!plan.prices.quarterly) plan.prices.quarterly = fallback.defaultPrices.quarterly
        if (!plan.prices.semiannual) plan.prices.semiannual = fallback.defaultPrices.semiannual
        if (!plan.prices.annual) plan.prices.annual = fallback.defaultPrices.annual
      }
    }

    const plans = Array.from(plansById.values()).map((p) => {
      const copy = { ...p }
      delete copy._rawPrices
      return copy
    })

    const extras = Array.from(extrasById.values()).filter(
      (extra) => extra.prices.monthly && extra.prices.annual
    )

    return NextResponse.json({
      prices: prices.data,
      plans,
      extras,
      currency: "mxn",
    })
  } catch (error) {
    console.error("Failed to retrieve Stripe prices, using resilient fallback:", error)
    return generateFallbackResponse()
  }
}
