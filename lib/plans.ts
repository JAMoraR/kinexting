export const COMPANY_NAME = "Kinexting"

export const WHATSAPP_NUMBER = "521234567890"

export const buildWhatsAppLink = () =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola, quiero cotizar un plan a medida")}`

export type PlanId = "asistente" | "recepcionista" | "soporte-tecnico" | "a-medida"

export type PlanCategory = "chatbot" | "both"

export type BillingCycle = "quarterly" | "semiannual" | "annual"

export type Plan = {
  id: PlanId
  category: PlanCategory
  title: string
  price?: { quarterly: number; semiannual: number; annual: number }
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
    semiannual?: CatalogPrice | null
    annual?: CatalogPrice | null
  }
}

export type CatalogExtra = {
  id: string
  category?: string
  name?: string
  description?: string
  prices?: {
    monthly?: CatalogPrice | null
    annual?: CatalogPrice | null
  }
}

export type PricingCatalogResponse = {
  plans?: CatalogPlan[]
  extras?: CatalogExtra[]
}

export const PLAN_TITLES: Record<PlanId, string> = {
  asistente: "Plan Esencial",
  recepcionista: "Plan Omnicanal",
  "soporte-tecnico": "Plan Soporte Avanzado",
  "a-medida": "Solución Enterprise",
}

export const PLAN_CATEGORY: Record<PlanId, PlanCategory> = {
  asistente: "chatbot",
  recepcionista: "both",
  "soporte-tecnico": "chatbot",
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
      "Metas y objetivos (semanales, mensuales, anuales o plazo indeterminado)",
    ],
    differences: [
      "Chatbot Web integrable con webhook en web existente",
      "Redes sociales (Instagram DMs, TikTok, Facebook Messenger)",
      "Bandeja unificada omnicanal de redes sociales",
    ],
  },
  recepcionista: {
    description: "Automatización omnicanal total: WhatsApp, Instagram, TikTok, Facebook y Chatbot Web con Webhook + CRM Todo-en-Uno.",
    features: [
      "Todo lo incluido en el Plan Esencial",
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
    differences: [],
  },
  "soporte-tecnico": {
    description: "Soporte técnico y resolución de incidencias con IA para empresas con requerimientos operativos intensivos.",
    features: [
      "Agente de soporte técnico avanzado con IA",
      "Resolución de dudas técnicas complejas 24/7",
      "Entrenamiento con documentación y manuales extensos",
      "Escalamiento inteligente a agentes humanos",
      "CRM Todo-en-Uno con módulo de tickets y analíticas",
      "Soporte técnico prioritario dedicado",
    ],
    differences: [],
  },
  "a-medida": {
    description: "Solución personalizada y arquitectura a medida adaptada a las necesidades específicas de tu empresa.",
    features: [
      "Agentes de IA y canales ilimitados a medida",
      "Integraciones profundas con CRM externo, ERP y bases de datos",
      "Flujos conversacionales y webhooks bidireccionales a medida",
      "Gerente de cuenta técnico y SLA corporativo",
      "Soporte corporativo prioritario 24/7",
    ],
    differences: [],
  },
}

export const buildPlanLink = (planId: PlanId, billing: BillingCycle) => {
  if (planId === "a-medida") {
    return buildWhatsAppLink()
  }
  return `/checkout?plan=${planId}&billing=${billing}`
}

export const mapCatalogPlanToPlan = (catalogPlan: CatalogPlan): Plan | null => {
  const staticCopy = PLAN_COPY[catalogPlan.id]

  if (catalogPlan.id === "a-medida") {
    return {
      id: catalogPlan.id,
      category: catalogPlan.category || PLAN_CATEGORY[catalogPlan.id] || "both",
      title: catalogPlan.title || "A Medida",
      period: "trimestral",
      description: staticCopy?.description || catalogPlan.description || "",
      features:
        Array.isArray(catalogPlan.features) && catalogPlan.features.length > 0
          ? catalogPlan.features
          : staticCopy?.features || [],
      differences: staticCopy?.differences || (Array.isArray(catalogPlan.differences) ? catalogPlan.differences : []),
      buttonText: "Cotizar por WhatsApp",
      hidePrice: true,
      recommended: true,
    }
  }

  const rawQuarterly = catalogPlan.prices?.quarterly?.amount
  const rawSemiannual = catalogPlan.prices?.semiannual?.amount
  const rawAnnual = catalogPlan.prices?.annual?.amount

  // Fallbacks para que ningún plan se descarte si algún periodo fue derivado
  const basePrice =
    typeof rawQuarterly === "number"
      ? rawQuarterly
      : typeof rawAnnual === "number"
      ? Math.round(rawAnnual / 4)
      : typeof rawSemiannual === "number"
      ? Math.round(rawSemiannual / 2)
      : null

  if (basePrice === null) {
    return null
  }

  const quarterlyPrice = typeof rawQuarterly === "number" ? rawQuarterly : basePrice
  const semiannualPrice = typeof rawSemiannual === "number" ? rawSemiannual : basePrice * 2
  const annualPrice = typeof rawAnnual === "number" ? rawAnnual : Math.round(basePrice * 4 * 0.85)

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
      semiannual: semiannualPrice,
      annual: annualPrice,
    },
    period: "trimestral",
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
      if (a.id === "a-medida" && b.id !== "a-medida") return 1
      if (b.id === "a-medida" && a.id !== "a-medida") return -1

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
