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

export const PLAN_CATEGORY: Record<PlanId, PlanCategory> = {
  asistente: "chatbot",
  recepcionista: "chatbot",
  "soporte-tecnico": "chatbot",
  "a-medida": "both",
}

const PLAN_COPY: Record<PlanId, { description: string; features: string[]; differences: string[] }> = {
  asistente: {
    description: "Asistente virtual con IA para automatizar conversaciones y atención al cliente.",
    features: [
      "Agente conversacional de IA 24/7",
      "Integración directa con WhatsApp",
      "Respuestas automáticas a dudas frecuentes",
      "Captación y registro de prospectos",
      "Puesta en marcha guiada",
    ],
    differences: [
      "Gestión de citas y sincronización de calendario",
      "Soporte técnico especializado con IA",
    ],
  },
  recepcionista: {
    description: "Recepcionista digital que gestiona llamadas, citas y mensajes automáticamente.",
    features: [
      "Agente recepcionista con IA multicanal",
      "Gestión y confirmación de citas en tiempo real",
      "Sincronización con Google Calendar y WhatsApp",
      "Recordatorios automáticos para evitar inasistencias",
      "Panel de control y registro de conversaciones",
      "Soporte prioritario 24/7",
    ],
    differences: [
      "Resolución técnica avanzada de incidencias",
    ],
  },
  "soporte-tecnico": {
    description: "Soporte técnico automatizado con IA para resolver incidencias 24/7.",
    features: [
      "Agente de soporte técnico avanzado con IA",
      "Resolución de dudas técnicas complejas",
      "Entrenamiento con la documentación de tu empresa",
      "Escalamiento inteligente a agentes humanos",
      "Métricas de atención y analítica",
      "Soporte técnico prioritario dedicado",
    ],
    differences: [],
  },
  "a-medida": {
    description: "Solución personalizada adaptada a las necesidades específicas de tu negocio.",
    features: [
      "Agentes de IA ilimitados a medida",
      "Integraciones con CRM, ERP y bases de datos",
      "Flujos conversacionales y acciones personalizadas",
      "Gerente de cuenta técnico y SLA dedicado",
      "Soporte corporativo 24/7",
    ],
    differences: [],
  },
}

export const buildPlanLink = (planId: PlanId, billing: BillingCycle) => {
  if (planId === "a-medida") {
    return buildWhatsAppLink()
  }
  return `/configurar-plan?plan=${planId}&billing=${billing}`
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

  return {
    id: catalogPlan.id,
    category: catalogPlan.category || PLAN_CATEGORY[catalogPlan.id] || "chatbot",
    title: catalogPlan.title || catalogPlan.id,
    price: {
      quarterly: quarterlyPrice,
      semiannual: semiannualPrice,
      annual: annualPrice,
    },
    period: "trimestral",
    description: staticCopy?.description || catalogPlan.description || "",
    features,
    differences: staticCopy?.differences || (Array.isArray(catalogPlan.differences) ? catalogPlan.differences : []),
    buttonText: catalogPlan.buttonText || `Elegir ${catalogPlan.title || catalogPlan.id}`,
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
