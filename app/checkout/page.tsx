"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Globe,
  HelpCircle,
  Lock,
  Mail,
  MapPin,
  Phone,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import ThemeToggle from "@/components/theme-toggle"
import {
  COMPANY_NAME,
  buildWhatsAppLink,
  mapCatalogPlansToPlans,
  PLAN_CATEGORY,
  type BillingCycle,
  type CatalogExtra,
  type Plan,
  type PlanId,
  type PricingCatalogResponse,
} from "@/lib/plans"
import { filterCountries, getCountryPhoneData, type CountryPhoneData } from "@/lib/country-phone-codes"

// Carga perezosa de banderas de países
const flagComponents: Record<string, React.ComponentType<{ className?: string; title?: string }>> = {}

const loadFlags = async () => {
  try {
    const allFlags = await import("country-flag-icons/react/3x2")
    const validEntries = Object.entries(allFlags).filter(([key, value]) => {
      return /^[A-Z]{2}$/.test(key) && typeof value === "function"
    })
    Object.assign(flagComponents, Object.fromEntries(validEntries))
  } catch (error) {
    console.error("Error al cargar banderas:", error)
  }
}

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

type CheckoutStep = "solution" | "business" | "payment"

type BusinessInfo = {
  businessName: string
  businessType: string
  city: string
  country: string
  website: string
  teamSize: string
}

type InvoiceData = {
  enabled: boolean
  rfc: string
  businessName: string
  email: string
}

const STEPS: Array<{ id: CheckoutStep; number: number; title: string; subtitle: string }> = [
  { id: "solution", number: 1, title: "Solución", subtitle: "Plan y ciclo" },
  { id: "business", number: 2, title: "Perfil del Negocio", subtitle: "Datos y contacto" },
  { id: "payment", number: 3, title: "Activación", subtitle: "Pago seguro" },
]

const BUSINESS_SECTORS = [
  "Clínica / Salud / Dental",
  "Belleza / Spa / Estética",
  "Restaurante / Cafetería",
  "Servicios Profesionales / Legal",
  "Inmobiliaria / Bienes Raíces",
  "E-commerce / Retail",
  "Gimnasio / Fitness",
  "Tecnología / Software",
  "Educación / Cursos",
  "Otro sector",
]

const TEAM_SIZES = [
  "1 a 3 colaboradores",
  "4 a 10 colaboradores",
  "11 a 50 colaboradores",
  "Más de 50 colaboradores",
]

const PLAN_LABELS: Record<string, string> = {
  asistente: "Plan Esencial (WhatsApp + CRM)",
  recepcionista: "Plan Omnicanal (WhatsApp + Redes Sociales + Webhook + CRM)",
  "soporte-tecnico": "Plan Soporte Avanzado",
  "a-medida": "Solución Enterprise",
}

const PLAN_IDS: PlanId[] = ["asistente", "recepcionista", "soporte-tecnico", "a-medida"]

const isPlanId = (value: string | null): value is PlanId => Boolean(value && PLAN_IDS.includes(value as PlanId))

const formatCurrency = (amount: number, currency = "MXN") => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+?[0-9][0-9\s-]{7,19}$/
const RFC_REGEX = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i

const isValidEmail = (email: string) => EMAIL_REGEX.test(email.trim())
const isValidPhone = (phone: string) => PHONE_REGEX.test(phone.trim())
const isValidRfc = (rfc: string) => RFC_REGEX.test(rfc.trim().toUpperCase())

const stepTransitionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.16, ease: "easeIn" as const },
  },
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    loadFlags()
  }, [])

  const planParam = searchParams.get("plan")
  const billingParam = searchParams.get("billing")
  const extrasParam = searchParams.get("extras") || ""

  // Estado del catálogo y planes
  const [plans, setPlans] = useState<Plan[]>([])
  const [catalogExtras, setCatalogExtras] = useState<CatalogExtra[]>([])
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)

  // Selección del plan y configuración
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("solution")
  const [completedSteps, setCompletedSteps] = useState<Set<CheckoutStep>>(new Set())

  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(
    isPlanId(planParam) ? planParam : "recepcionista"
  )
  const [billingPeriod, setBillingPeriod] = useState<BillingCycle>(
    billingParam === "annual" ? "annual" : "quarterly"
  )
  const [selectedExtras, setSelectedExtras] = useState<string[]>(
    extrasParam.split(",").map((s) => s.trim()).filter(Boolean)
  )

  // Datos de contacto del responsable
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [selectedCountryIso, setSelectedCountryIso] = useState("MX")
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [countrySearch, setCountrySearch] = useState("")
  const countryPickerRef = useRef<HTMLDivElement>(null)

  // Datos de la empresa / negocio
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    businessName: "",
    businessType: "Clínica / Salud / Dental",
    city: "",
    country: "México",
    website: "",
    teamSize: "1 a 3 colaboradores",
  })

  // Facturación fiscal
  const [invoice, setInvoice] = useState<InvoiceData>({
    enabled: false,
    rfc: "",
    businessName: "",
    email: "",
  })

  // Estado de validaciones y errores
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Estado de Stripe Embedded Checkout
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isInitializingStripe, setIsInitializingStripe] = useState(false)
  const [stripeInitError, setStripeInitError] = useState<string | null>(null)

  const allCountries = useMemo(() => getCountryPhoneData(), [])
  const filteredCountries = useMemo(() => filterCountries(countrySearch), [countrySearch])

  // Cargar catálogo de precios
  useEffect(() => {
    let isMounted = true

    const fetchCatalog = async () => {
      try {
        const response = await fetch("/api/prices", { cache: "no-store" })
        if (!response.ok) return

        const payload = (await response.json()) as PricingCatalogResponse
        if (!isMounted) return

        const mappedPlans = mapCatalogPlansToPlans(payload.plans)
        setPlans(mappedPlans)
        setCatalogExtras(Array.isArray(payload.extras) ? payload.extras : [])

        if (isPlanId(planParam)) {
          setSelectedPlanId(planParam)
        } else if (mappedPlans.length > 0) {
          const popular = mappedPlans.find((p) => p.popular) || mappedPlans[0]
          setSelectedPlanId(popular.id)
        }
      } catch (err) {
        console.error("Error al obtener catálogo:", err)
      } finally {
        if (isMounted) {
          setIsCatalogLoading(false)
        }
      }
    }

    fetchCatalog()

    return () => {
      isMounted = false
    }
  }, [planParam])

  // Cerrar selector de país al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryPickerRef.current && !countryPickerRef.current.contains(e.target as Node)) {
        setShowCountryPicker(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedCountry = useMemo(() => {
    return allCountries.find((c) => c.iso === selectedCountryIso) || allCountries[0]
  }, [allCountries, selectedCountryIso])

  const countryDialCode = selectedCountry?.code || "+52"

  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId) || null
  }, [plans, selectedPlanId])

  // Cálculo de precios
  const currentPlanPrice = useMemo(() => {
    if (!selectedPlan?.price) return 0
    if (billingPeriod === "annual") return selectedPlan.price.annual ?? 0
    return selectedPlan.price.quarterly ?? 0
  }, [selectedPlan, billingPeriod])

  const extrasTotal = useMemo(() => {
    return selectedExtras.reduce((sum, extraId) => {
      const extra = catalogExtras.find((e) => e.id === extraId)
      if (!extra?.prices) return sum
      const amount = billingPeriod === "annual" ? extra.prices.annual?.amount : extra.prices.quarterly?.amount
      return sum + (amount || 0)
    }, 0)
  }, [selectedExtras, catalogExtras, billingPeriod])

  const grandTotal = currentPlanPrice + extrasTotal

  // Validación de paso 2
  const validateBusinessStep = (): boolean => {
    const errors: Record<string, string> = {}

    if (!contactName.trim() || contactName.trim().split(" ").length < 2) {
      errors.contactName = "Ingresa tu nombre y apellido"
    }

    if (!contactEmail.trim() || !isValidEmail(contactEmail)) {
      errors.contactEmail = "Ingresa un correo electrónico corporativo válido"
    }

    const cleanNumber = contactPhone.replace(/\D/g, "")
    if (!cleanNumber || cleanNumber.length < 8) {
      errors.contactPhone = "Ingresa un número de WhatsApp / teléfono válido"
    }

    if (!businessInfo.businessName.trim() || businessInfo.businessName.trim().length < 2) {
      errors.businessName = "Ingresa el nombre comercial de tu negocio"
    }

    if (!businessInfo.businessType) {
      errors.businessType = "Selecciona el giro de tu empresa"
    }

    if (!businessInfo.city.trim()) {
      errors.city = "Ingresa la ciudad de operación de tu negocio"
    }

    if (invoice.enabled) {
      if (!invoice.rfc.trim() || !isValidRfc(invoice.rfc)) {
        errors.rfc = "RFC inválido para facturación fiscal (formato SAT)"
      }
      if (!invoice.businessName.trim()) {
        errors.invoiceBusinessName = "Razón social requerida para la factura"
      }
      if (!invoice.email.trim() || !isValidEmail(invoice.email)) {
        errors.invoiceEmail = "Correo electrónico fiscal inválido"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Inicializar Stripe Embedded Checkout
  const initStripeEmbedded = async () => {
    setIsInitializingStripe(true)
    setStripeInitError(null)

    try {
      const fullPhone = `${countryDialCode}${contactPhone.replace(/\D/g, "")}`

      const payload = {
        planId: selectedPlanId,
        billing: billingPeriod,
        extraIds: selectedExtras,
        customerName: contactName.trim(),
        customerEmail: contactEmail.trim().toLowerCase(),
        customerPhone: fullPhone,
        businessInfo: {
          businessName: businessInfo.businessName.trim(),
          businessType: businessInfo.businessType,
          city: businessInfo.city.trim(),
          country: businessInfo.country.trim(),
          website: businessInfo.website.trim(),
          teamSize: businessInfo.teamSize,
        },
        invoice: invoice.enabled
          ? {
              enabled: true,
              rfc: invoice.rfc.trim().toUpperCase(),
              businessName: invoice.businessName.trim(),
              email: invoice.email.trim().toLowerCase(),
            }
          : { enabled: false },
      }

      const response = await fetch("/api/checkout/embedded", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || !data.clientSecret) {
        throw new Error(data.error || "No fue posible inicializar la pasarela de pago")
      }

      setClientSecret(data.clientSecret)
    } catch (err) {
      console.error("Error al inicializar Stripe:", err)
      setStripeInitError(err instanceof Error ? err.message : "Error al conectar con Stripe")
    } finally {
      setIsInitializingStripe(false)
    }
  }

  const handleGoToBusiness = () => {
    if (selectedPlanId === "a-medida") {
      window.location.href = buildWhatsAppLink()
      return
    }
    setCompletedSteps((prev) => new Set([...prev, "solution"]))
    setCurrentStep("business")
  }

  const handleGoToPayment = async () => {
    if (!validateBusinessStep()) {
      return
    }
    setCompletedSteps((prev) => new Set([...prev, "solution", "business"]))
    setCurrentStep("payment")
    await initStripeEmbedded()
  }

  const handleStepClick = (stepId: CheckoutStep) => {
    if (stepId === "payment") {
      if (completedSteps.has("business") && validateBusinessStep()) {
        setCurrentStep("payment")
        if (!clientSecret) {
          initStripeEmbedded()
        }
      }
    } else if (stepId === "business") {
      if (completedSteps.has("solution")) {
        setCurrentStep("business")
      }
    } else {
      setCurrentStep("solution")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 text-slate-900 transition-colors duration-300 dark:bg-[#060c18] dark:text-slate-100 sm:py-12">
      <div className="container mx-auto max-w-6xl">
        {/* Barra superior de navegación */}
        <header className="mb-8 flex flex-col gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/configurar-plan"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Configurar planes
            </Link>

            <div className="hidden sm:block h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />

            <div className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 sm:flex">
              <ShieldCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              Pasarela Segura B2B
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Cifrado bancario SSL 256 bits</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Stepper moderno de progreso */}
        <nav aria-label="Progreso de contratación" className="mb-10">
          <div className="grid grid-cols-3 gap-2 sm:gap-6">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id
              const isDone = completedSteps.has(step.id) && !isActive

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  disabled={!isDone && !isActive && step.id === "payment" && !completedSteps.has("business")}
                  className={`group relative flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all sm:p-4 ${
                    isActive
                      ? "border-cyan-500/60 bg-white shadow-lg shadow-cyan-500/10 dark:border-cyan-500/40 dark:bg-slate-900/90 dark:shadow-cyan-950/20"
                      : isDone
                      ? "border-slate-200 bg-white/70 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700"
                      : "border-transparent bg-slate-200/50 opacity-60 dark:bg-slate-900/30"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all sm:h-9 sm:w-9 ${
                      isActive
                        ? "bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/25"
                        : isDone
                        ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : step.number}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-xs font-bold sm:text-sm ${
                        isActive
                          ? "text-slate-900 dark:text-slate-100"
                          : isDone
                          ? "text-slate-700 dark:text-slate-300"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="hidden truncate text-[11px] text-slate-500 dark:text-slate-400 sm:block">
                      {step.subtitle}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Layout principal: Columna de formulario (izquierda) + Resumen de Orden B2B (derecha) */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Contenedor dinámico de pasos */}
          <div className="lg:col-span-7 xl:col-span-8">
            <AnimatePresence mode="wait">
              {/* PASO 1: SELECCIÓN DE PLAN Y CICLO */}
              {currentStep === "solution" && (
                <motion.div
                  key="step-solution"
                  variants={stepTransitionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
                    <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                          1. Selecciona tu Nivel de Solución
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Elige entre automatización en WhatsApp o solución Omnicanal completa. Ambos niveles incluyen el Sistema CRM.
                        </p>
                      </div>

                      {/* Selector de Ciclo de Facturación */}
                      <div className="mt-3 inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-950 sm:mt-0">
                        <button
                          type="button"
                          onClick={() => setBillingPeriod("quarterly")}
                          className={`rounded-lg px-3.5 py-1 text-xs font-semibold transition ${
                            billingPeriod === "quarterly"
                              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                          }`}
                        >
                          Trimestral
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingPeriod("annual")}
                          className={`relative rounded-lg px-3.5 py-1 text-xs font-semibold transition ${
                            billingPeriod === "annual"
                              ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-sm"
                              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                          }`}
                        >
                          Anual
                          <span className="ml-1 rounded-sm bg-white/20 px-1 py-0.2 text-[9px] font-bold uppercase">
                            -15%
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Tarjetas de Planes */}
                    {isCatalogLoading ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                        <div className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {plans.map((plan) => {
                          const isSelected = selectedPlanId === plan.id
                          const price =
                            billingPeriod === "annual"
                              ? plan.price?.annual ?? 0
                              : plan.price?.quarterly ?? 0

                          const isEsencial = plan.id === "asistente"
                          const isOmnicanal = plan.id === "recepcionista"

                          return (
                            <div
                              key={plan.id}
                              onClick={() => setSelectedPlanId(plan.id)}
                              className={`group relative cursor-pointer rounded-2xl border p-5 transition-all ${
                                isSelected
                                  ? "border-cyan-500 bg-cyan-500/5 shadow-md shadow-cyan-500/10 dark:border-cyan-400 dark:bg-cyan-500/10"
                                  : "border-slate-200/90 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                      {plan.title}
                                    </h3>
                                    {isOmnicanal && (
                                      <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                                        Más Completo
                                      </span>
                                    )}
                                    {isEsencial && (
                                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                        Nivel 1
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                    {plan.description}
                                  </p>

                                  {/* Canales incluidos */}
                                  <div className="mt-3 flex flex-wrap gap-1.5">
                                    {isEsencial && (
                                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                                        WhatsApp Business
                                      </span>
                                    )}
                                    {isOmnicanal && (
                                      <>
                                        <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                                          WhatsApp
                                        </span>
                                        <span className="rounded-md bg-pink-500/10 px-2 py-0.5 text-[10px] font-semibold text-pink-700 dark:text-pink-300">
                                          Instagram DMs
                                        </span>
                                        <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                                          Facebook
                                        </span>
                                        <span className="rounded-md bg-slate-900/10 px-2 py-0.5 text-[10px] font-semibold text-slate-800 dark:bg-white/10 dark:text-slate-200">
                                          TikTok
                                        </span>
                                        <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-700 dark:text-cyan-300">
                                          Webhook Web
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  <div className="mt-2 text-[11px] font-medium text-cyan-700 dark:text-cyan-300">
                                    ✓ Incluye Sistema CRM Todo-en-Uno
                                  </div>
                                </div>

                                <div
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                                    isSelected
                                      ? "border-cyan-500 bg-cyan-500 text-white dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950"
                                      : "border-slate-300 dark:border-slate-700"
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                </div>
                              </div>

                              <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80">
                                <span className="text-xs font-medium text-slate-400">Inversión ({billingPeriod === "annual" ? "anual" : "trimestral"})</span>
                                {plan.hidePrice ? (
                                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                    A cotizar
                                  </span>
                                ) : (
                                  <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                                    {formatCurrency(price)}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div className="mt-8 flex justify-end">
                      <Button
                        onClick={handleGoToBusiness}
                        className="h-11 bg-gradient-to-r from-cyan-500 to-indigo-600 font-semibold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500"
                      >
                        Continuar a Datos del Negocio
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PASO 2: PERFIL DEL NEGOCIO Y CONTACTO (CAPTACIÓN B2B) */}
              {currentStep === "business" && (
                <motion.div
                  key="step-business"
                  variants={stepTransitionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        2. Datos del Negocio y Contacto Principal
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Esta información se utilizará para registrar la cuenta de tu empresa y personalizar el entrenamiento del agente.
                      </p>
                    </div>

                    {/* Sección A: Contacto del responsable */}
                    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                        <User className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                        <span>Titular / Responsable de la Cuenta</span>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Nombre completo */}
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Nombre completo del titular <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={contactName}
                            onChange={(e) => {
                              setContactName(e.target.value)
                              if (formErrors.contactName) {
                                setFormErrors((prev) => ({ ...prev, contactName: "" }))
                              }
                            }}
                            placeholder="Ej. Lic. Carlos Mendoza Reyes"
                            className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm outline-none transition dark:bg-slate-900 ${
                              formErrors.contactName
                                ? "border-red-500 ring-2 ring-red-500/20"
                                : "border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:focus:border-cyan-400"
                            }`}
                          />
                          {formErrors.contactName && (
                            <p className="text-xs text-red-500">{formErrors.contactName}</p>
                          )}
                        </div>

                        {/* Correo corporativo */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Correo corporativo / contacto <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              value={contactEmail}
                              onChange={(e) => {
                                setContactEmail(e.target.value)
                                if (formErrors.contactEmail) {
                                setFormErrors((prev) => ({ ...prev, contactEmail: "" }))
                                }
                              }}
                              placeholder="contacto@tuempresa.com"
                              className={`h-11 w-full rounded-xl border bg-white pl-9 pr-3.5 text-sm outline-none transition dark:bg-slate-900 ${
                                formErrors.contactEmail
                                  ? "border-red-500 ring-2 ring-red-500/20"
                                  : "border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:focus:border-cyan-400"
                              }`}
                            />
                            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                          </div>
                          {formErrors.contactEmail && (
                            <p className="text-xs text-red-500">{formErrors.contactEmail}</p>
                          )}
                        </div>

                        {/* Teléfono / WhatsApp con selector de país */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            WhatsApp de contacto empresarial <span className="text-red-500">*</span>
                          </label>

                          <div className="flex gap-2 relative">
                            {/* Selector de país */}
                            <div ref={countryPickerRef} className="relative">
                              <button
                                type="button"
                                onClick={() => setShowCountryPicker((prev) => !prev)}
                                className="flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium outline-none transition hover:border-slate-400 focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
                              >
                                {flagComponents[selectedCountry.iso] ? (
                                  (() => {
                                    const FlagComponent = flagComponents[selectedCountry.iso]
                                    return <FlagComponent className="h-3.5 w-5 rounded-xs" />
                                  })()
                                ) : (
                                  <span className="h-3.5 w-5 rounded-xs bg-slate-300" />
                                )}
                                <span className="text-xs text-slate-700 dark:text-slate-200">
                                  {countryDialCode}
                                </span>
                                <ChevronDown className="h-3 w-3 text-slate-400" />
                              </button>

                              {showCountryPicker && (
                                <div className="absolute top-12 left-0 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900">
                                  <div className="relative mb-2">
                                    <input
                                      type="text"
                                      value={countrySearch}
                                      onChange={(e) => setCountrySearch(e.target.value)}
                                      placeholder="Buscar país o prefijo..."
                                      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs outline-none focus:border-cyan-500 dark:border-slate-800 dark:bg-slate-950"
                                    />
                                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                  </div>

                                  <div className="max-h-52 overflow-y-auto">
                                    {filteredCountries.map((c) => {
                                      const FlagComp = flagComponents[c.iso]
                                      return (
                                        <button
                                          key={c.iso}
                                          type="button"
                                          onClick={() => {
                                            setSelectedCountryIso(c.iso)
                                            setShowCountryPicker(false)
                                            setCountrySearch("")
                                          }}
                                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                          {FlagComp ? (
                                            <FlagComp className="h-3 w-4.5 rounded-xs shrink-0" />
                                          ) : (
                                            <span className="h-3 w-4.5 rounded-xs bg-slate-300 shrink-0" />
                                          )}
                                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                                            {c.code}
                                          </span>
                                          <span className="truncate text-slate-600 dark:text-slate-400">
                                            {c.name}
                                          </span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Input de número */}
                            <input
                              type="tel"
                              value={contactPhone}
                              onChange={(e) => {
                                setContactPhone(e.target.value)
                                if (formErrors.contactPhone) {
                                  setFormErrors((prev) => ({ ...prev, contactPhone: "" }))
                                }
                              }}
                              placeholder="55 1234 5678"
                              className={`h-11 flex-1 rounded-xl border bg-white px-3.5 text-sm outline-none transition dark:bg-slate-900 ${
                                formErrors.contactPhone
                                  ? "border-red-500 ring-2 ring-red-500/20"
                                  : "border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:focus:border-cyan-400"
                              }`}
                            />
                          </div>
                          {formErrors.contactPhone && (
                            <p className="text-xs text-red-500">{formErrors.contactPhone}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sección B: Identidad del negocio */}
                    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                        <Building2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                        <span>Información de la Empresa</span>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Nombre del negocio */}
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Nombre comercial de la empresa <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={businessInfo.businessName}
                            onChange={(e) => {
                              setBusinessInfo((prev) => ({ ...prev, businessName: e.target.value }))
                              if (formErrors.businessName) {
                                setFormErrors((prev) => ({ ...prev, businessName: "" }))
                              }
                            }}
                            placeholder="Ej. Clínica Dental Sonrisas / Salón Élite"
                            className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm outline-none transition dark:bg-slate-900 ${
                              formErrors.businessName
                                ? "border-red-500 ring-2 ring-red-500/20"
                                : "border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:focus:border-cyan-400"
                            }`}
                          />
                          {formErrors.businessName && (
                            <p className="text-xs text-red-500">{formErrors.businessName}</p>
                          )}
                        </div>

                        {/* Sector o giro */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Giro o industria <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={businessInfo.businessType}
                            onChange={(e) => setBusinessInfo((prev) => ({ ...prev, businessType: e.target.value }))}
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
                          >
                            {BUSINESS_SECTORS.map((sector) => (
                              <option key={sector} value={sector}>
                                {sector}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Tamaño del equipo */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Tamaño de equipo
                          </label>
                          <select
                            value={businessInfo.teamSize}
                            onChange={(e) => setBusinessInfo((prev) => ({ ...prev, teamSize: e.target.value }))}
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
                          >
                            {TEAM_SIZES.map((size) => (
                              <option key={size} value={size}>
                                {size}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Ubicación Ciudad */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Ciudad de operación <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={businessInfo.city}
                              onChange={(e) => {
                                setBusinessInfo((prev) => ({ ...prev, city: e.target.value }))
                                if (formErrors.city) {
                                  setFormErrors((prev) => ({ ...prev, city: "" }))
                                }
                              }}
                              placeholder="Ej. Monterrey / CDMX"
                              className={`h-11 w-full rounded-xl border bg-white pl-9 pr-3.5 text-sm outline-none transition dark:bg-slate-900 ${
                                formErrors.city
                                  ? "border-red-500 ring-2 ring-red-500/20"
                                  : "border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:focus:border-cyan-400"
                              }`}
                            />
                            <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                          </div>
                          {formErrors.city && <p className="text-xs text-red-500">{formErrors.city}</p>}
                        </div>

                        {/* Sitio web o Redes */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Sitio web / Instagram (opcional)
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={businessInfo.website}
                              onChange={(e) => setBusinessInfo((prev) => ({ ...prev, website: e.target.value }))}
                              placeholder="instagram.com/tu_marca o web"
                              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3.5 text-sm outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
                            />
                            <Globe className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sección C: Facturación Fiscal CFDI 4.0 */}
                    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              ¿Requieres Factura Fiscal (CFDI)?
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Deducible para personas físicas o morales (México).
                            </p>
                          </div>
                        </div>

                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={invoice.enabled}
                            onChange={(e) => setInvoice((prev) => ({ ...prev, enabled: e.target.checked }))}
                            className="peer sr-only"
                          />
                          <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-cyan-500 peer-checked:after:translate-x-full peer-focus:outline-none dark:bg-slate-800" />
                        </label>
                      </div>

                      <AnimatePresence>
                        {invoice.enabled && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid gap-3 pt-2 sm:grid-cols-2"
                          >
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                RFC <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={invoice.rfc}
                                onChange={(e) => setInvoice((prev) => ({ ...prev, rfc: e.target.value.toUpperCase() }))}
                                placeholder="XAXX010101000"
                                maxLength={13}
                                className={`h-10 w-full rounded-xl border bg-white px-3 text-xs outline-none transition uppercase dark:bg-slate-900 ${
                                  formErrors.rfc ? "border-red-500" : "border-slate-300 focus:border-cyan-500 dark:border-slate-700"
                                }`}
                              />
                              {formErrors.rfc && <p className="text-[11px] text-red-500">{formErrors.rfc}</p>}
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Correo para Facturación <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="email"
                                value={invoice.email}
                                onChange={(e) => setInvoice((prev) => ({ ...prev, email: e.target.value }))}
                                placeholder="facturacion@empresa.com"
                                className={`h-10 w-full rounded-xl border bg-white px-3 text-xs outline-none transition dark:bg-slate-900 ${
                                  formErrors.invoiceEmail ? "border-red-500" : "border-slate-300 focus:border-cyan-500 dark:border-slate-700"
                                }`}
                              />
                              {formErrors.invoiceEmail && (
                                <p className="text-[11px] text-red-500">{formErrors.invoiceEmail}</p>
                              )}
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Razón Social completa <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={invoice.businessName}
                                onChange={(e) => setInvoice((prev) => ({ ...prev, businessName: e.target.value }))}
                                placeholder="Nombre o Razón Social registrada ante el SAT"
                                className={`h-10 w-full rounded-xl border bg-white px-3 text-xs outline-none transition dark:bg-slate-900 ${
                                  formErrors.invoiceBusinessName ? "border-red-500" : "border-slate-300 focus:border-cyan-500 dark:border-slate-700"
                                }`}
                              />
                              {formErrors.invoiceBusinessName && (
                                <p className="text-[11px] text-red-500">{formErrors.invoiceBusinessName}</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Botones de navegación del paso 2 */}
                    <div className="mt-8 flex items-center justify-between gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep("solution")}
                        className="h-11 border-slate-300 dark:border-slate-700"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Atrás
                      </Button>

                      <Button
                        type="button"
                        onClick={handleGoToPayment}
                        className="h-11 bg-gradient-to-r from-cyan-500 to-indigo-600 font-semibold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500"
                      >
                        Continuar al Pago Seguro
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PASO 3: STRIPE EMBEDDED CHECKOUT OFICIAL */}
              {currentStep === "payment" && (
                <motion.div
                  key="step-payment"
                  variants={stepTransitionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
                    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                          3. Activación y Pago Seguro
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Completa tu suscripción a través del entorno oficial y cifrado de Stripe.
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep("business")}
                        className="self-start text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 sm:self-auto"
                      >
                        Editar datos del negocio
                      </Button>
                    </div>

                    {/* Contenedor del Embed Oficial de Stripe */}
                    <div className="min-h-[460px] rounded-2xl border border-slate-200/90 bg-white p-2 dark:border-slate-800 dark:bg-slate-950/70">
                      {isInitializingStripe ? (
                        <div className="flex min-h-[420px] flex-col items-center justify-center text-center p-6">
                          <div className="relative mb-4">
                            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-500 dark:border-slate-800 dark:border-t-cyan-400" />
                            <Lock className="absolute inset-0 m-auto h-5 w-5 text-cyan-500" />
                          </div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Cargando pasarela bancaria segura...
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Estableciendo túnel cifrado con Stripe para {businessInfo.businessName || "tu negocio"}.
                          </p>
                        </div>
                      ) : stripeInitError ? (
                        <div className="flex min-h-[360px] flex-col items-center justify-center p-6 text-center">
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                            <ShieldCheck className="h-6 w-6" />
                          </div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            No se pudo inicializar la pasarela de pago
                          </p>
                          <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                            {stripeInitError}
                          </p>
                          <Button
                            onClick={initStripeEmbedded}
                            className="mt-5 h-9 bg-cyan-600 px-4 text-xs font-semibold text-white hover:bg-cyan-500"
                          >
                            Reintentar conexión
                          </Button>
                        </div>
                      ) : !clientSecret || !stripePromise ? (
                        <div className="flex min-h-[360px] items-center justify-center p-6 text-center text-sm text-slate-500">
                          Esperando credenciales de Stripe...
                        </div>
                      ) : (
                        <EmbeddedCheckoutProvider
                          stripe={stripePromise}
                          options={{ clientSecret }}
                        >
                          <EmbeddedCheckout className="w-full min-h-[480px] rounded-xl overflow-hidden" />
                        </EmbeddedCheckoutProvider>
                      )}
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800/80">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep("business")}
                        className="h-10 text-xs border-slate-300 dark:border-slate-700"
                      >
                        <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                        Modificar información
                      </Button>

                      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        <span>Transacción respaldada por Stripe Inc.</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* COLUMNA LATERAL: RESUMEN DE LA ORDEN & SUITE DE CONFIANZA B2B */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <div className="sticky top-8 space-y-6">
              {/* Tarjeta de Resumen */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sm:p-7">
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-500" />
                    <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      Resumen de la Solución
                    </h3>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    B2B SaaS
                  </span>
                </div>

                {/* Plan seleccionado */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800/80 dark:bg-slate-950/50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {selectedPlan?.title || PLAN_LABELS[selectedPlanId] || "Plan de IA"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Facturación {billingPeriod === "annual" ? "Anual (-15%)" : "Trimestral"}
                      </p>
                    </div>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      {formatCurrency(currentPlanPrice)}
                    </span>
                  </div>
                </div>

                {/* Previsualización dinámica de los datos del cliente */}
                {(businessInfo.businessName || contactName) && (
                  <div className="mt-4 space-y-1.5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-3.5 dark:bg-cyan-500/10">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                      Configuración personalizada para:
                    </p>
                    {businessInfo.businessName && (
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                        <Building2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        <span className="truncate">{businessInfo.businessName}</span>
                      </p>
                    )}
                    {contactName && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 truncate">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{contactName}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Desglose de totales */}
                <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Subtotal solución base</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {formatCurrency(currentPlanPrice)}
                    </span>
                  </div>

                  {extrasTotal > 0 && (
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Módulos extras</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {formatCurrency(extrasTotal)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Impuestos y tasas</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      Calculados en checkout
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-slate-200/80 pt-3 dark:border-slate-800">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Total a pagar
                    </span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                        {formatCurrency(grandTotal)}
                      </span>
                      <span className="block text-[10px] text-slate-400 dark:text-slate-500">
                        Moneda en Pesos Mexicanos (MXN)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suite de Confianza y Garantías B2B */}
              <div className="rounded-3xl border border-slate-200/90 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3.5">
                  Garantías de Servicio Kinexting
                </h4>

                <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-900 dark:text-slate-100">Activación en 24 horas:</strong> Puesta en marcha con soporte asistido.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-900 dark:text-slate-100">Facturación fiscal CFDI 4.0:</strong> Factura deducible enviada a tu correo.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-900 dark:text-slate-100">Stripe Embedded Security:</strong> Tus datos bancarios nunca tocan nuestros servidores.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-900 dark:text-slate-100">Soporte prioritario:</strong> Canal directo vía WhatsApp con especialistas.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#060c18]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-cyan-500 dark:border-slate-800 dark:border-t-cyan-400" />
            <p className="text-xs text-slate-500">Cargando pasarela de pago segura...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
