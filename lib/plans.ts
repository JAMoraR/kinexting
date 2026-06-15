export const COMPANY_NAME = "Kinexting"

export type PlanId = "asistente" | "recepcionista" | "soporte-tecnico" | "a-medida"

export type PlanCategory = "chatbot" | "web" | "both"

export type BillingCycle = "monthly" | "annual"

export type Plan = {
  id: PlanId
  category: PlanCategory
  title: string
  price: { monthly: number; annual: number }
  period: string
  description: string
  features: string[]
  differences: string[]
  buttonText: string
  cheap?: boolean
  popular?: boolean
  recommended?: boolean
  highQuality?: boolean
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
    monthly?: CatalogPrice | null
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

const PLAN_COPY: Record<PlanId, { description: string; differences: string[] }> = {
  asistente: {
    description: "Asistente virtual con IA para automatizar conversaciones y atención al cliente.",
    differences: [],
  },
  recepcionista: {
    description: "Recepcionista digital que gestiona llamadas, citas y mensajes automáticamente.",
    differences: [],
  },
  "soporte-tecnico": {
    description: "Soporte técnico automatizado con IA para resolver incidencias 24/7.",
    differences: [],
  },
  "a-medida": {
    description: "Solución personalizada adaptada a las necesidades específicas de tu negocio.",
    differences: [],
  },
}

export const buildPlanLink = (planId: PlanId, billing: BillingCycle) =>
  `/configurar-plan?plan=${planId}&billing=${billing}`

export const mapCatalogPlanToPlan = (catalogPlan: CatalogPlan): Plan | null => {
  const monthlyPrice = catalogPlan.prices?.monthly?.amount
  const annualPrice = catalogPlan.prices?.annual?.amount
  const staticCopy = PLAN_COPY[catalogPlan.id]

  if (typeof monthlyPrice !== "number" || typeof annualPrice !== "number") {
    return null
  }

  return {
    id: catalogPlan.id,
    category: catalogPlan.category || PLAN_CATEGORY[catalogPlan.id] || "chatbot",
    title: catalogPlan.title || catalogPlan.id,
    price: {
      monthly: monthlyPrice,
      annual: annualPrice,
    },
    period: "mensual",
    description: staticCopy?.description || catalogPlan.description || "",
    features: Array.isArray(catalogPlan.features) ? catalogPlan.features : [],
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
      const monthlyDiff = a.price.monthly - b.price.monthly
      if (monthlyDiff !== 0) return monthlyDiff

      const annualDiff = a.price.annual - b.price.annual
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
