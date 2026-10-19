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
    title: "Plan Asistente",
    description: "Automatización inteligente de WhatsApp con IA + Sistema CRM completo para citas, catálogo, empleados y metas.",
    features: [
      "Agente conversacional de IA 24/7 en WhatsApp",
      "Sistema CRM Todo-en-Uno incluido (sin costo por usuario)",
      "Agenda y confirmación de citas en tiempo real",
      "Sincronización bidireccional con Google Calendar",
      "Catálogo digital de productos y servicios con links de cobro",
      "Módulo de promociones, cupones y ofertas",
      "Bandeja de mensajería para WhatsApp",
      "Gestión de empleados, turnos y asignación de chats",
      "Analíticas en tiempo real y tiempos de respuesta",
      "Metas y objetivos (semanales, mensuales, anuales)",
    ],
    differences: [
      "Redes sociales (Instagram, TikTok, Facebook)",
      "Chatbot Web integrable con webhook",
      "Plataforma Web App dedicada",
    ],
    buttonText: "Elegir Plan Asistente",
    defaultPrices: {
      quarterly: { amount: 625, currency: "mxn" },
      annual: { amount: 2117, currency: "mxn" },
    },
  },
  recepcionista: {
    title: "Plan Omnicanal",
    description: "Automatización omnicanal total: WhatsApp, Instagram, TikTok, Facebook y Chatbot Web con Webhook + CRM Todo-en-Uno.",
    features: [
      "Todo lo incluido en el Plan Asistente",
      "Automatización de WhatsApp Business API",
      "Automatización de mensajes directos en Instagram (DMs)",
      "Automatización de Facebook Messenger",
      "Automatización de mensajes directos en TikTok",
      "Chatbot Web integrable vía Webhook en tu web existente",
      "Bandeja unificada omnicanal (todos los chats en un solo inbox)",
      "Atribución y analíticas comparativas por canal",
      "Metas multicanal por colaborador y por negocio",
      "Soporte prioritario y puesta en marcha guiada",
    ],
    differences: [
      "Plataforma Web App dedicada",
    ],
    buttonText: "Elegir Plan Omnicanal",
    defaultPrices: {
      quarterly: { amount: 1400, currency: "mxn" },
      annual: { amount: 4760, currency: "mxn" },
    },
  },
  "soporte-tecnico": {
    title: "Plan Web App",
    description: "Plataforma Web App completa para tu negocio: portal web de clientes, panel de gestión y CRM Todo-en-Uno.",
    features: [
      "Plataforma Web App personalizada para tu negocio",
      "Portal web para clientes con gestión de citas y pedidos",
      "Panel de administración y CRM Todo-en-Uno",
      "Gestión avanzada de inventario, catálogo y servicios",
      "Integración de pagos en línea con Stripe",
      "Dominio personalizado y hosting de alta velocidad",
      "Analíticas avanzadas de conversión y métricas comerciales",
      "Soporte técnico prioritario y copias de seguridad continuas",
    ],
    differences: [
      "Automatización omnicanal en redes sociales",
    ],
    buttonText: "Elegir Plan Web App",
    defaultPrices: {
      quarterly: { amount: 1875, currency: "mxn" },
      annual: { amount: 6375, currency: "mxn" },
    },
  },
  "a-medida": {
    title: "Plan Chatbot + Web App",
    description: "Solución Integral definitiva: Chatbot Omnicanal con IA en WhatsApp y redes sociales + Web App completa y CRM.",
    features: [
      "Solución Integral: Chatbot Omnicanal + Web App completa",
      "Automatización en WhatsApp, Instagram, TikTok y Facebook",
      "Chatbot Web integrable con webhook en tiempo real",
      "Plataforma Web App dedicada con portal de clientes",
      "Sistema CRM Todo-en-Uno completo para citas, empleados y metas",
      "Catálogo digital de productos y servicios con cobro integrado",
      "Flujos personalizados y webhooks bidireccionales",
      "Onboarding técnico asistido y soporte prioritario 24/7",
    ],
    differences: [],
    buttonText: "Elegir Plan Integral",
    defaultPrices: {
      quarterly: { amount: 2999, currency: "mxn" },
      annual: { amount: 10196, currency: "mxn" },
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
    lookupKey.includes("personalizado") ||
    lookupKey.includes("tier4")
  ) {
    return "a-medida"
  }
  if (lookupKey.includes("tier1") || lookupKey.includes("asistente") || lookupKey.includes("landing")) {
    return "asistente"
  }
  if (
    lookupKey.includes("tier2") ||
    lookupKey.includes("omnicanal") ||
    lookupKey.includes("recepcionista") ||
    (lookupKey.includes("chatbot") && !lookupKey.includes("web"))
  ) {
    return "recepcionista"
  }
  if (
    lookupKey.includes("tier3") ||
    lookupKey.includes("soporte") ||
    lookupKey.includes("webapp") ||
    (lookupKey.includes("web") && !lookupKey.includes("chatbot"))
  ) {
    return "soporte-tecnico"
  }

  const productName = price.product && typeof price.product !== "string" ? price.product.name.toLowerCase() : ""
  const nickname = (price.nickname || "").toLowerCase()
  const text = nickname + " " + productName

  if (text.includes("a medida") || (text.includes("chatbot") && text.includes("web")) || text.includes("personalizado") || text.includes("tier 4")) {
    return "a-medida"
  }
  if (text.includes("asistente") || text.includes("landing") || text.includes("tier 1") || text.includes("tier1")) {
    return "asistente"
  }
  if (text.includes("recepcionista") || text.includes("omnicanal") || text.includes("tier 2") || text.includes("tier2") || (text.includes("chatbot") && !text.includes("web"))) {
    return "recepcionista"
  }
  if (text.includes("soporte") || text.includes("tier 3") || (text.includes("web") && !text.includes("chatbot"))) {
    return "soporte-tecnico"
  }

  return null
}

const resolvePlanPeriod = (price) => {
  const lookupKey = (price.lookup_key || "").toLowerCase()
  if (
    lookupKey.includes("year") ||
    lookupKey.includes("annual") ||
    lookupKey.includes("anual") ||
    lookupKey.includes("yearly")
  ) {
    return "annual"
  }
  if (
    lookupKey.includes("quarter") ||
    lookupKey.includes("trimest") ||
    lookupKey.includes("_3m")
  ) {
    return "quarterly"
  }

  const interval = price.recurring?.interval
  const intervalCount = price.recurring?.interval_count || 1

  if (interval === "year" || (interval === "month" && intervalCount === 12)) return "annual"
  if (interval === "month" && intervalCount === 3) return "quarterly"
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
      quarterly: null,
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
          annual: null,
        },
      })
    }

    prices.data.forEach((price) => {
      const interval = price.recurring?.interval
      if (!interval || (interval !== "month" && interval !== "year")) {
        return
      }

      const planId = resolvePlanId(price)
      const period = resolvePlanPeriod(price)

      if (planId && (period === "quarterly" || period === "annual")) {
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

          plan.prices[period] = priceObj
        }
        return
      }

      if (isCatalogExtra(price)) {
        const extraId = price.metadata?.extra_id
        if (extraId) {
          const extra = ensureExtraEntry(extrasById, extraId, price)
          const targetInterval = period === "quarterly" ? "quarterly" : "annual"
          extra.prices[targetInterval] = {
            id: price.id,
            amount: Number((price.unit_amount ?? 0) / 100),
            currency: price.currency,
          }
        }
      }
    })

    // Solo devolver planes que tengan al menos un precio registrado en Stripe
    const plans = Array.from(plansById.values()).filter(
      (plan) => plan.prices.quarterly !== null || plan.prices.annual !== null
    )

    const extras = Array.from(extrasById.values()).filter(
      (extra) => extra.prices.quarterly || extra.prices.annual
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
