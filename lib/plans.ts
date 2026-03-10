export const COMPANY_NAME = "Kinexting"

export type BillingCycle = "monthly" | "annual"

export type Plan = {
  id: "landing" | "chatbot" | "webapp" | "chatbot-webapp"
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

export const PLANS: Plan[] = [
  {
    id: "landing",
    title: "Landing",
    price: { monthly: 504.99, annual: 5138.99 },
    period: "mensual",
    description: "Ideal para quienes buscan una presencia online con un sitio web optimizado.",
    features: ["Sitio web", "Dominio gratuito", "SSL", "SEO", "Google Ads", "Soporte 24/7"],
    differences: ["Web administrativa", "Base de datos", "Chatbot de IA", "Creditos de IA", "Mensajes por hora"],
    buttonText: "Elegir Landing",
    cheap: true,
  },
  {
    id: "chatbot",
    title: "Chatbot",
    price: { monthly: 976.99, annual: 9960.99 },
    period: "mensual",
    description: "Perfecto para quienes quieren automatizar su atención al cliente y mejorar la interacción.",
    features: ["Chatbot de IA", "$300 en creditos de IA por mes", "200 mensajes por hora", "Base de datos", "Soporte 24/7"],
    differences: ["Sitio web", "Web administrativa", "Dominio gratuito", "SSL", "SEO", "Google Ads"],
    buttonText: "Elegir Chatbot",
    popular: true,
  },
  {
    id: "webapp",
    title: "Web App",
    price: { monthly: 1098.99, annual: 11208.99 },
    period: "mensual",
    description: "Perfecto para sitios web profesionales y pequeñas empresas.",
    features: [
      "Sitio web",
      "Web administrativa",
      "Base de datos",
      "Dominio gratuito",
      "SSL",
      "SEO",
      "Google Ads",
      "Soporte 24/7",
    ],
    differences: ["Chatbot de IA", "Creditos de IA", "Mensajes por hora"],
    buttonText: "Elegir Web App",
    recommended: true,
  },
  {
    id: "chatbot-webapp",
    title: "Chatbot + web app",
    price: { monthly: 1871.99, annual: 19092.99 },
    period: "mensual",
    description: "Ideal para negocios que buscan lo mejor en automatización y presencia online.",
    features: [
      "Chatbot de IA",
      "$300 en creditos de IA por mes",
      "200 mensajes por hora",
      "Sitio web",
      "Web administrativa",
      "Base de datos",
      "Dominio gratuito",
      "SSL",
      "SEO",
      "Google Ads",
      "Soporte prioritario 24/7",
    ],
    differences: [],
    buttonText: "Elegir Chatbot + Web App",
    highQuality: true,
  },
]

export const buildPlanLink = (planId: Plan["id"], billing: BillingCycle) =>
  `/configurar-plan?plan=${planId}&billing=${billing}`
