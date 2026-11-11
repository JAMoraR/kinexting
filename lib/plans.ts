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

export type CatalogPrice = {
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
  currency?: string
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

export const PLAN_FLAGS: Record<
  PlanId,
  { cheap?: boolean; popular?: boolean; recommended?: boolean; highQuality?: boolean }
> = {
  asistente: { cheap: true },
  recepcionista: { popular: true },
  "soporte-tecnico": { highQuality: true },
  "a-medida": { recommended: true },
}

export type MasterPlanDefinition = {
  id: PlanId
  category: PlanCategory
  title: string
  description: string
  features: string[]
  differences: string[]
  buttonText: string
  flags: { cheap?: boolean; popular?: boolean; recommended?: boolean; highQuality?: boolean }
  defaultPrices: {
    quarterly: { amount: number; currency: string }
    annual: { amount: number; currency: string }
  }
}

export const MASTER_PLANS: Record<PlanId, MasterPlanDefinition> = {
  asistente: {
    id: "asistente",
    category: "chatbot",
    title: "Plan Asistente",
    description:
      "Automatización inteligente de WhatsApp con IA + Sistema CRM completo para citas, catálogo, empleados y metas.",
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
    flags: { cheap: true },
    defaultPrices: {
      quarterly: { amount: 651, currency: "mxn" },
      annual: { amount: 2464, currency: "mxn" },
    },
  },
  recepcionista: {
    id: "recepcionista",
    category: "chatbot",
    title: "Plan Omnicanal",
    description:
      "Automatización omnicanal total: WhatsApp, Instagram, TikTok, Facebook y Chatbot Web + CRM Todo-en-Uno.",
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
    flags: { popular: true },
    defaultPrices: {
      quarterly: { amount: 1400, currency: "mxn" },
      annual: { amount: 4760, currency: "mxn" },
    },
  },
  "soporte-tecnico": {
    id: "soporte-tecnico",
    category: "both",
    title: "Plan Web App",
    description:
      "Plataforma Web App completa para tu negocio: portal web de clientes, panel de gestión y CRM Todo-en-Uno.",
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
    flags: { highQuality: true },
    defaultPrices: {
      quarterly: { amount: 1875, currency: "mxn" },
      annual: { amount: 6375, currency: "mxn" },
    },
  },
  "a-medida": {
    id: "a-medida",
    category: "both",
    title: "Plan Chatbot + Web App",
    description:
      "Solución Integral definitiva: Chatbot Omnicanal con IA en WhatsApp y redes sociales + Web App completa y CRM.",
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
    flags: { recommended: true },
    defaultPrices: {
      quarterly: { amount: 2999, currency: "mxn" },
      annual: { amount: 10196, currency: "mxn" },
    },
  },
}

export const MASTER_EXTRAS: CatalogExtra[] = [
  {
    id: "extra-whatsapp-business-api",
    name: "Línea WhatsApp Business API Adicional",
    category: "chatbot",
    description: "Conecta un número telefónico adicional con su propio agente conversacional de IA y bandeja independiente.",
    prices: {
      quarterly: { id: "default_extra_whatsapp_q", amount: 350, currency: "mxn" },
      annual: { id: "default_extra_whatsapp_a", amount: 1190, currency: "mxn" },
    },
  },
  {
    id: "extra-web-widget",
    name: "Chatbot Web Integrable",
    category: "chatbot",
    description: "Widget interactivo flotante integrable con 1 línea de código en tu sitio web existente o WordPress.",
    prices: {
      quarterly: { id: "default_extra_widget_q", amount: 250, currency: "mxn" },
      annual: { id: "default_extra_widget_a", amount: 850, currency: "mxn" },
    },
  },
  {
    id: "extra-soporte-dedicado",
    name: "Soporte Técnico Prioritario 24/7 con SLA 1h",
    category: "general",
    description: "Atención prioritaria de ingeniería por canal privado dedicado y garantía de resolución ágil.",
    prices: {
      quarterly: { id: "default_extra_soporte_q", amount: 450, currency: "mxn" },
      annual: { id: "default_extra_soporte_a", amount: 1530, currency: "mxn" },
    },
  },
  {
    id: "extra-dominio-hosting-pro",
    name: "Dominio .com / .mx + CDN y Hosting Pro",
    category: "web",
    description: "Registro y gestión de tu dominio comercial con certificado SSL wildcard y hosting Edge de alto rendimiento.",
    prices: {
      quarterly: { id: "default_extra_dominio_q", amount: 200, currency: "mxn" },
      annual: { id: "default_extra_dominio_a", amount: 680, currency: "mxn" },
    },
  },
  {
    id: "extra-integracion-custom",
    name: "Integración de Webhooks y APIs Personalizadas",
    category: "combo",
    description: "Sincronización bidireccional en tiempo real con tu ERP, CRM externo, sistema contable o base de datos.",
    prices: {
      quarterly: { id: "default_extra_custom_q", amount: 600, currency: "mxn" },
      annual: { id: "default_extra_custom_a", amount: 2040, currency: "mxn" },
    },
  },
]

export const buildPlanLink = (planId: PlanId, billing: BillingCycle) => {
  return `/checkout?plan=${planId}&billing=${billing}`
}

/**
 * Convierte un CatalogPlan de la API en el formato de visualización Plan.
 */
export const mapCatalogPlanToPlan = (catalogPlan: CatalogPlan): Plan => {
  const master = MASTER_PLANS[catalogPlan.id] || MASTER_PLANS.asistente

  const rawQuarterly = catalogPlan.prices?.quarterly?.amount
  const rawAnnual = catalogPlan.prices?.annual?.amount

  // Si Stripe proveyó precios válidos los usamos; si no, recurrimos al precio base del catálogo
  const quarterlyPrice =
    typeof rawQuarterly === "number" && rawQuarterly > 0
      ? rawQuarterly
      : typeof rawAnnual === "number" && rawAnnual > 0
      ? Math.round(rawAnnual / (4 * 0.85))
      : master.defaultPrices.quarterly.amount

  const annualPrice =
    typeof rawAnnual === "number" && rawAnnual > 0
      ? rawAnnual
      : Math.round(quarterlyPrice * 4 * 0.85)

  const features =
    Array.isArray(catalogPlan.features) && catalogPlan.features.length > 0
      ? catalogPlan.features
      : master.features

  const differences =
    Array.isArray(catalogPlan.differences) && catalogPlan.differences.length > 0
      ? catalogPlan.differences
      : master.differences

  const displayTitle = catalogPlan.title || master.title

  return {
    id: catalogPlan.id,
    category: catalogPlan.category || master.category,
    title: displayTitle,
    price: {
      quarterly: quarterlyPrice,
      annual: annualPrice,
    },
    period: "trimestre",
    description: catalogPlan.description || master.description,
    features,
    differences,
    buttonText: catalogPlan.buttonText || master.buttonText,
    cheap: catalogPlan.flags?.cheap ?? master.flags.cheap,
    popular: catalogPlan.flags?.popular ?? master.flags.popular,
    recommended: catalogPlan.flags?.recommended ?? master.flags.recommended,
    highQuality: catalogPlan.flags?.highQuality ?? master.flags.highQuality,
  }
}

/**
 * Mapea la lista de planes del catálogo mostrando ÚNICAMENTE los planes activos recibidos.
 */
export const mapCatalogPlansToPlans = (catalogPlans?: CatalogPlan[]): Plan[] => {
  if (Array.isArray(catalogPlans) && catalogPlans.length > 0) {
    return catalogPlans
      .filter((cp) => Boolean(cp && cp.id))
      .map((cp) => mapCatalogPlanToPlan(cp))
  }

  // Fallback seguro: únicamente el plan activo oficial (Plan Asistente)
  const master = MASTER_PLANS.asistente
  return [
    {
      id: master.id,
      category: master.category,
      title: master.title,
      price: {
        quarterly: master.defaultPrices.quarterly.amount,
        annual: master.defaultPrices.annual.amount,
      },
      period: "trimestre",
      description: master.description,
      features: master.features,
      differences: master.differences,
      buttonText: master.buttonText,
      cheap: master.flags.cheap,
      popular: master.flags.popular,
      recommended: master.flags.recommended,
      highQuality: master.flags.highQuality,
    },
  ]
}
