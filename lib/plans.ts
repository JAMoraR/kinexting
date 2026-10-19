export const COMPANY_NAME = "Kinexting"

export const WHATSAPP_NUMBER = "521234567890"

export const buildWhatsAppLink = () =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola, quiero cotizar un plan a medida")}`

export type PlanId = "asistente" | "recepcionista" | "soporte-tecnico" | "a-medida"

export type PlanCategory = "chatbot" | "both"

export type BillingCycle = "quarterly" | "annual"

export type Plan = {
  id: PlanId
  category: PlanCategory
  title: string
  price?: { quarterly?: number; annual?: number }
  period: string
  description: string
  features: string[]
  differences: string[]
  buttonText: string
  cheap?: boolean
  popular?: boolean
  recommended?: boolean
  highQuality?: boolean
  hidePrice?: boolean
}

type CatalogPrice = {
  id: string
  amount: number
  currency: string
}

export type CatalogPlan = {
  id: PlanId
  category?: PlanCategory
  title?: string
  description?: string
  features?: string[]
  differences?: string[]
  buttonText?: string
  flags?: {
    cheap?: boolean
    popular?: boolean
    recommended?: boolean
    highQuality?: boolean
  }
  prices?: {
    quarterly?: CatalogPrice | null
    annual?: CatalogPrice | null
  }
}

export type CatalogExtra = {
  id: string
  category?: string
  name?: string
  description?: string
  prices?: {
    quarterly?: CatalogPrice | null
    annual?: CatalogPrice | null
  }
}

export type PricingCatalogResponse = {
  plans?: CatalogPlan[]
  extras?: CatalogExtra[]
}

export const PLAN_TITLES: Record<PlanId, string> = {
  asistente: "Plan Asistente",
  recepcionista: "Plan Omnicanal",
  "soporte-tecnico": "Plan Web App",
  "a-medida": "Plan Chatbot + Web App",
}

export const PLAN_CATEGORY: Record<PlanId, PlanCategory> = {
  asistente: "chatbot",
  recepcionista: "chatbot",
  "soporte-tecnico": "both",
  "a-medida": "both",
}

const PLAN_COPY: Record<PlanId, { description: string; features: string[]; differences: string[] }> = {
  asistente: {
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
  },
  recepcionista: {
    description: "Automatización omnicanal total: WhatsApp, Instagram, TikTok, Facebook y Chatbot Web + CRM Todo-en-Uno.",
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
  },
  "soporte-tecnico": {
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
  },
  "a-medida": {
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
  },
}

export const buildPlanLink = (planId: PlanId, billing: BillingCycle) => {
  return `/checkout?plan=${planId}&billing=${billing}`
}

export const mapCatalogPlanToPlan = (catalogPlan: CatalogPlan): Plan | null => {
  const staticCopy = PLAN_COPY[catalogPlan.id]

  const rawQuarterly = catalogPlan.prices?.quarterly?.amount
  const rawAnnual = catalogPlan.prices?.annual?.amount

  if (typeof rawQuarterly !== "number" && typeof rawAnnual !== "number") {
    if (!catalogPlan.title && !staticCopy) return null
  }

  const quarterlyPrice = typeof rawQuarterly === "number" ? rawQuarterly : (rawAnnual ? Math.round(rawAnnual / (4 * 0.85)) : 0)
  const annualPrice = typeof rawAnnual === "number" ? rawAnnual : Math.round(quarterlyPrice * 4 * 0.85)

  const features =
    Array.isArray(catalogPlan.features) && catalogPlan.features.length > 0
      ? catalogPlan.features
      : staticCopy?.features || []

  const displayTitle = catalogPlan.title || PLAN_TITLES[catalogPlan.id] || catalogPlan.id

  return {
    id: catalogPlan.id,
    category: catalogPlan.category || PLAN_CATEGORY[catalogPlan.id] || "chatbot",
    title: displayTitle,
    price: {
      quarterly: quarterlyPrice,
      annual: annualPrice,
    },
    period: "trimestre",
    description: staticCopy?.description || catalogPlan.description || "",
    features,
    differences: staticCopy?.differences || (Array.isArray(catalogPlan.differences) ? catalogPlan.differences : []),
    buttonText: catalogPlan.buttonText || `Elegir ${displayTitle}`,
    cheap: Boolean(catalogPlan.flags?.cheap),
    popular: Boolean(catalogPlan.flags?.popular),
    recommended: Boolean(catalogPlan.flags?.recommended),
    highQuality: Boolean(catalogPlan.flags?.highQuality),
  }
}

export const mapCatalogPlansToPlans = (catalogPlans: CatalogPlan[] | undefined): Plan[] => {
  const sortByPrice = (items: Plan[]) =>
    [...items].sort((a, b) => {
      const quarterlyDiff = (a.price?.quarterly ?? 0) - (b.price?.quarterly ?? 0)
      if (quarterlyDiff !== 0) return quarterlyDiff

      const annualDiff = (a.price?.annual ?? 0) - (b.price?.annual ?? 0)
      if (annualDiff !== 0) return annualDiff

      return a.title.localeCompare(b.title)
    })

  if (!Array.isArray(catalogPlans) || catalogPlans.length === 0) {
    return []
  }

  const mapped = catalogPlans
    .map(mapCatalogPlanToPlan)
    .filter((plan): plan is Plan => plan !== null)

  return mapped.length > 0 ? sortByPrice(mapped) : []
}
