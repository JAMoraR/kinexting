"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { AnimatePresence, motion } from "framer-motion"
import { useTheme } from "next-themes"

import { ArrowLeft, Banknote, Building2, CheckCircle2, CreditCard, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import ThemeToggle from "@/components/theme-toggle"
import {
  mapCatalogPlansToPlans,
  type BillingCycle,
  type CatalogExtra,
  type Plan,
  type PricingCatalogResponse,
} from "@/lib/plans"
import { filterCountries, getCountryPhoneData, type CountryPhoneData } from "@/lib/country-phone-codes"

const flagComponents: Record<string, React.ComponentType<{ className?: string; title?: string }>> = {}

const loadFlags = async () => {
  try {
    const allFlags = await import("country-flag-icons/react/3x2")
    const validEntries = Object.entries(allFlags).filter(([key, value]) => {
      return /^[A-Z]{2}$/.test(key) && typeof value === "function"
    })

    Object.assign(flagComponents, Object.fromEntries(validEntries))
  } catch (error) {
    console.error("Error loading flag components", error)
  }
}

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

type PaymentFormProps = {
  onSuccess: () => void
  billingName: string
  payerPhone: string
  cardMethodEnabled: boolean
  cardholderName: string
  onCardholderNameChange: (value: string) => void
}

type PaymentSummary = {
  currency: string
  billing: "monthly" | "annual"
  plan: {
    id: string
    label: string
    amount: number
  }
  extras: Array<{
    id: string
    label: string
    amount: number
  }>
  total: number
}

type PreferredMethod = "card" | "oxxo" | "spei"
type CheckoutStep = "config" | "info" | "payment" | "complete"

type InvoiceFormData = {
  enabled: boolean
  rfc: string
  businessName: string
  email: string
}

type BusinessInfoFormData = {
  businessName: string
  businessType: string
  email: string
  country: string
  city: string
}

const PLAN_LABELS = {
  landing: "Landing",
  chatbot: "Chatbot",
  webapp: "Web App",
  "chatbot-webapp": "Chatbot + Web App",
} as const

const PLAN_IDS: Plan["id"][] = ["landing", "chatbot", "webapp", "chatbot-webapp"]
const STEP_KEYS: CheckoutStep[] = ["config", "info", "payment", "complete"]
const CHECKOUT_STEPS = ["Configuracion", "Informacion", "Pago", "Completar"]
const PHONE_REGEX = /^\+?[0-9][0-9\s-]{7,19}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RFC_REGEX = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i
const DOMAIN_REGEX = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,}$/i
const PERSON_NAME_ALLOWED_REGEX = /^[\p{L} .-]+$/u
const BUSINESS_NAME_ALLOWED_REGEX = /^[\p{L}\p{N} .,&-]+$/u
const BLOCKED_SYMBOLS_REGEX = /['"`;<>\\]/g

const DOMAIN_OPTIONS = [
  { id: "domain-1", label: "Usar un dominio que ya poseo" },
  { id: "domain-2", label: "Registrar un nuevo dominio" },
]

const BUSINESS_TYPES = [
  "Barberia",
  "Salon de belleza",
  "Clinica estetica",
  "Spa",
  "Consultorio",
  "Restaurante",
  "Otro",
]

const PAYMENT_METHODS: Array<{
  id: PreferredMethod
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: "card", label: "Tarjeta", icon: CreditCard },
  { id: "oxxo", label: "OXXO", icon: Banknote },
  { id: "spei", label: "SPEI", icon: Building2 },
]

const formatAmount = (amount: number, currency = "mxn") => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount / 100)
}

const normalizeDomain = (value: string) => value.trim().toLowerCase().replace(/^https?:\/\//, "")

const isValidEmail = (value: string) => EMAIL_REGEX.test(value.trim())

const isValidPhone = (value: string) => PHONE_REGEX.test(value.trim())

const isValidDomain = (value: string) => DOMAIN_REGEX.test(normalizeDomain(value))

const isValidRfc = (value: string) => RFC_REGEX.test(value.trim().toUpperCase())

const sanitizeGenericTextInput = (value: string) => value.replace(BLOCKED_SYMBOLS_REGEX, "")

const sanitizePersonNameInput = (value: string) =>
  sanitizeGenericTextInput(value)
    .replace(/[^\p{L} .-]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trimStart()

const sanitizeBusinessNameInput = (value: string) =>
  sanitizeGenericTextInput(value)
    .replace(/[^\p{L}\p{N} .,&-]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trimStart()

const sanitizeLocationInput = (value: string) =>
  sanitizeGenericTextInput(value)
    .replace(/[^\p{L}\p{N} .,-]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trimStart()

const isValidFullName = (value: string) => {
  const normalized = value.trim().replace(/\s+/g, " ")
  if (!normalized || normalized.split(" ").length < 3) return false
  return PERSON_NAME_ALLOWED_REGEX.test(normalized)
}

const isValidBusinessName = (value: string) => {
  const normalized = value.trim().replace(/\s+/g, " ")
  if (!normalized || normalized.length < 2) return false
  if (!BUSINESS_NAME_ALLOWED_REGEX.test(normalized)) return false
  return /[\p{L}\p{N}]/u.test(normalized)
}

const stepPanelVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.995 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.14, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.995,
    transition: { duration: 0.1, ease: "easeIn" as const },
  },
}

const dropdownVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.1, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.985,
    transition: { duration: 0.08, ease: "easeIn" as const },
  },
}

const dropdownItemVariants = {
  hidden: { opacity: 0, x: -4 },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.08, delay: index * 0.006 },
  }),
}

const buildIdempotencyKey = (input: unknown) => {
  const raw = JSON.stringify(input)
  let hash = 2166136261

  for (let index = 0; index < raw.length; index += 1) {
    hash ^= raw.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  const normalized = (hash >>> 0).toString(16)
  return `intent_${normalized.padStart(8, "0")}`
}

const isPlanId = (value: string | null): value is Plan["id"] => Boolean(value && PLAN_IDS.includes(value as Plan["id"]))

const getPlanCategory = (planId: Plan["id"]) => {
  const hasChatbot = planId.includes("chatbot")
  const hasWeb = planId === "landing" || planId.includes("webapp")

  if (hasChatbot && hasWeb) return "both"
  if (hasChatbot) return "chatbot"
  return "web"
}

const extraMatchesPlan = (extra: CatalogExtra, planId: Plan["id"]) => {
  const category = extra.category || "general"
  const planCategory = getPlanCategory(planId)

  if (planCategory === "both") {
    return category === "web" || category === "chatbot" || category === "combo" || category === "general"
  }

  if (planCategory === "chatbot") {
    return category === "chatbot" || category === "general"
  }

  return category === "web" || category === "general"
}

const getExtraPriceCents = (extra: CatalogExtra, billing: BillingCycle) => {
  const amount = billing === "annual" ? extra.prices?.annual?.amount : extra.prices?.monthly?.amount
  return typeof amount === "number" ? Math.round(amount * 100) : 0
}

const getPlanPriceCents = (plan: Plan, billing: BillingCycle) => {
  const amount = billing === "annual" ? plan.price.annual : plan.price.monthly
  return Math.round(amount * 100)
}

function PaymentForm({
  onSuccess,
  billingName,
  payerPhone,
  cardMethodEnabled,
  cardholderName,
  onCardholderNameChange,
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    if (!billingName.trim() || !payerPhone.trim()) {
      setError("Completa nombre del titular y telefono para continuar.")
      return
    }

    setIsSubmitting(true)
    setError("")

    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/configurar-plan?status=success-element`,
        payment_method_data: {
          billing_details: {
            name: billingName,
            phone: payerPhone,
          },
        },
      },
    })

    if (result.error) {
      setError(result.error.message || "No se pudo completar el pago.")
      setIsSubmitting(false)
      return
    }

    if (result.paymentIntent?.status === "succeeded" || result.paymentIntent?.status === "processing") {
      onSuccess()
      setIsSubmitting(false)
      return
    }

    setError("No fue posible confirmar el pago.")
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {cardMethodEnabled && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Nombre del titular de la tarjeta</p>
          <input
            type="text"
            value={cardholderName}
            onChange={(event) => onCardholderNameChange(event.target.value)}
            placeholder="Nombre completo"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-sky-500"
          />
          {!cardholderName.trim() && <p className="text-xs text-amber-700">Completa el nombre del titular para pago con tarjeta.</p>}
        </div>
      )}
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={!stripe || isSubmitting || !billingName.trim() || !payerPhone.trim()}>
        {isSubmitting ? "Procesando..." : "Pagar ahora"}
      </Button>
    </form>
  )
}

function CheckoutPageContent() {
  const searchParams = useSearchParams()
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    loadFlags()
  }, [])

  const planParam = searchParams.get("plan")
  const billingParam = searchParams.get("billing")
  const selectedDomainParam = searchParams.get("selectedDomain") || ""
  const newDomainParam = searchParams.get("newDomain") || ""
  const extrasParam = searchParams.get("extras") || ""

  const [step, setStep] = useState<CheckoutStep>("config")
  const [completedStepIndex, setCompletedStepIndex] = useState(-1)

  const [plans, setPlans] = useState<Plan[]>([])
  const [catalogExtras, setCatalogExtras] = useState<CatalogExtra[]>([])
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)

  const [configError, setConfigError] = useState("")
  const [infoError, setInfoError] = useState("")

  const [selectedPlanId, setSelectedPlanId] = useState<Plan["id"]>(isPlanId(planParam) ? planParam : "landing")
  const [billingPeriod, setBillingPeriod] = useState<BillingCycle>(billingParam === "annual" ? "annual" : "monthly")
  const [selectedDomain, setSelectedDomain] = useState(selectedDomainParam)
  const [newDomain, setNewDomain] = useState(newDomainParam)
  const [selectedExtras, setSelectedExtras] = useState<string[]>(
    extrasParam
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  )

  const [clientSecret, setClientSecret] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [summary, setSummary] = useState<PaymentSummary | null>(null)

  const [preferredMethod, setPreferredMethod] = useState<PreferredMethod | null>(null)
  const allCountries = useMemo(() => getCountryPhoneData(), [])
  const [payerName, setPayerName] = useState("")
  const [selectedCountryIso, setSelectedCountryIso] = useState("")
  const [payerPhone, setPayerPhone] = useState("")
  const [phoneSearchQuery, setPhoneSearchQuery] = useState("")
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [filteredCountries, setFilteredCountries] = useState<CountryPhoneData[]>([])
  const countrySelectorRef = useRef<HTMLDivElement>(null)
  const [showBusinessTypeDropdown, setShowBusinessTypeDropdown] = useState(false)
  const businessTypeSelectorRef = useRef<HTMLDivElement>(null)
  const [cardholderName, setCardholderName] = useState("")
  const [businessInfo, setBusinessInfo] = useState<BusinessInfoFormData>({
    businessName: "",
    businessType: "",
    email: "",
    country: "",
    city: "",
  })
  const [invoice, setInvoice] = useState<InvoiceFormData>({
    enabled: false,
    rfc: "",
    businessName: "",
    email: "",
  })

  useEffect(() => {
    let isMounted = true

    const loadCatalog = async () => {
      try {
        const response = await fetch("/api/prices", { cache: "no-store" })
        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as PricingCatalogResponse
        if (!isMounted) {
          return
        }

        const mappedPlans = mapCatalogPlansToPlans(payload.plans)
        setPlans(mappedPlans)
        setCatalogExtras(Array.isArray(payload.extras) ? payload.extras : [])

        if (!isPlanId(planParam) && mappedPlans.length > 0) {
          setSelectedPlanId(mappedPlans[0].id)
        }
      } finally {
        if (isMounted) {
          setIsCatalogLoading(false)
        }
      }
    }

    loadCatalog()

    return () => {
      isMounted = false
    }
  }, [planParam])

  useEffect(() => {
    setFilteredCountries(filterCountries(phoneSearchQuery))
  }, [phoneSearchQuery])

  useEffect(() => {
    if (selectedCountryIso || allCountries.length === 0) {
      return
    }

    const region = new Intl.Locale(navigator.language).region?.toUpperCase() || ""
    const fallback = allCountries[0]
    const initialCountry = allCountries.find((country) => country.iso === region) || fallback

    if (initialCountry) {
      setSelectedCountryIso(initialCountry.iso)
    }
  }, [allCountries, selectedCountryIso])

  useEffect(() => {
    const onDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as Node

      if (!countrySelectorRef.current?.contains(target)) {
        setShowCountryDropdown(false)
      }

      if (!businessTypeSelectorRef.current?.contains(target)) {
        setShowBusinessTypeDropdown(false)
      }
    }

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowCountryDropdown(false)
      }
    }

    document.addEventListener("mousedown", onDocumentMouseDown)
    document.addEventListener("keydown", onDocumentKeyDown)

    return () => {
      document.removeEventListener("mousedown", onDocumentMouseDown)
      document.removeEventListener("keydown", onDocumentKeyDown)
    }
  }, [])

  const selectedCountry = useMemo(() => {
    if (allCountries.length === 0) {
      return null
    }

    return allCountries.find((country) => country.iso === selectedCountryIso) || allCountries[0]
  }, [allCountries, selectedCountryIso])

  const countryCode = selectedCountry?.code || ""

  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlanId) ?? null, [plans, selectedPlanId])
  const relevantExtras = useMemo(
    () => catalogExtras.filter((extra) => extraMatchesPlan(extra, selectedPlanId)),
    [catalogExtras, selectedPlanId]
  )

  useEffect(() => {
    const validExtraIds = new Set(relevantExtras.map((extra) => extra.id))
    setSelectedExtras((prev) => prev.filter((id) => validExtraIds.has(id)))
  }, [relevantExtras])

  useEffect(() => {
    const requiresDomain = selectedPlan ? getPlanCategory(selectedPlan.id) !== "chatbot" : false

    if (!requiresDomain) {
      setSelectedDomain("")
      setNewDomain("")
      return
    }

    setSelectedDomain((current) => current || DOMAIN_OPTIONS[0].id)
  }, [selectedPlan])

  const payload = useMemo(
    () => ({
      planId: selectedPlanId,
      billing: billingPeriod,
      selectedDomain,
      newDomain,
      extraIds: selectedExtras,
      preferredMethod,
      customerName: payerName,
      customerPhone: `${countryCode}${payerPhone}`.replace(/\s+/g, ""),
      businessInfo,
      invoice,
    }),
    [selectedPlanId, billingPeriod, selectedDomain, newDomain, selectedExtras, preferredMethod, payerName, payerPhone, countryCode, businessInfo, invoice]
  )

  const idempotencyKey = useMemo(() => buildIdempotencyKey(payload), [payload])
  const planLabel = PLAN_LABELS[selectedPlanId as keyof typeof PLAN_LABELS] || selectedPlanId || "Plan"
  const billingLabel = billingPeriod === "annual" ? "Anual" : "Mensual"

  const domainLabel = useMemo(() => {
    if (!selectedDomain) return "Sin dominio"
    if (selectedDomain === "domain-1") return "Usar dominio existente"
    if (selectedDomain === "domain-2") {
      return newDomain ? `Registrar: ${newDomain}` : "Registrar dominio nuevo"
    }
    return selectedDomain
  }, [newDomain, selectedDomain])

  const requiresDomain = selectedPlan ? getPlanCategory(selectedPlan.id) !== "chatbot" : false
  const isDomainSelectionValid =
    !requiresDomain || Boolean(selectedDomain && (selectedDomain !== "domain-2" || isValidDomain(newDomain)))

  const localSubtotal = selectedPlan ? getPlanPriceCents(selectedPlan, billingPeriod) : 0
  const localExtras = useMemo(
    () => selectedExtras.map((id) => relevantExtras.find((extra) => extra.id === id)).filter(Boolean) as CatalogExtra[],
    [selectedExtras, relevantExtras]
  )
  const localTotal = localSubtotal + localExtras.reduce((acc, extra) => acc + getExtraPriceCents(extra, billingPeriod), 0)

  useEffect(() => {
    let isMounted = true
    const abortController = new AbortController()

    const initIntent = async () => {
      try {
        if (step !== "payment" || !preferredMethod) {
          return
        }

        if (!payload.planId) {
          throw new Error("Falta plan seleccionado")
        }

        setIsLoading(true)
        setError("")
        setClientSecret("")
        setSummary(null)

        const response = await fetch("/api/payments/intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify(payload),
          signal: abortController.signal,
        })

        const data = await response.json()

        if (!response.ok || !data?.clientSecret) {
          throw new Error(data?.error || "No se pudo inicializar el pago")
        }

        if (!isMounted) {
          return
        }

        setClientSecret(data.clientSecret)
        setSummary(data.summary || null)
      } catch (initError) {
        if (initError instanceof Error && initError.name === "AbortError") {
          return
        }

        if (!isMounted) {
          return
        }

        const message = initError instanceof Error ? initError.message : "No se pudo inicializar el pago"
        setError(message)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initIntent()

    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [idempotencyKey, payload, preferredMethod, step])

  const goToInfo = () => {
    if (!selectedPlan) {
      setConfigError("Selecciona un plan para continuar.")
      return
    }

    if (!isDomainSelectionValid) {
      setConfigError("Completa una opcion de dominio valida para continuar.")
      return
    }

    setConfigError("")
    setCompletedStepIndex((current) => Math.max(current, 0))
    setStep("info")
  }

  const goToPayment = () => {
    if (!payerName.trim()) {
      setInfoError("Completa tu nombre completo para continuar.")
      return
    }

    if (!isValidFullName(payerName)) {
      setInfoError("Escribe tu nombre y dos apellidos. Si tienes apellidos compuestos, escríbelos juntos.")
      return
    }

    if (!payerPhone.trim()) {
      setInfoError("Completa tu telefono para continuar.")
      return
    }

    if (!isValidPhone(payerPhone)) {
      setInfoError("Ingresa un telefono valido para continuar.")
      return
    }

    if (!businessInfo.businessName.trim()) {
      setInfoError("Completa el nombre de tu negocio para continuar.")
      return
    }

    if (!isValidBusinessName(businessInfo.businessName)) {
      setInfoError("Ingresa un nombre de negocio valido (sin simbolos especiales).")
      return
    }

    if (!businessInfo.businessType) {
      setInfoError("Selecciona el tipo de negocio para continuar.")
      return
    }

    if (businessInfo.email.trim() && !isValidEmail(businessInfo.email)) {
      setInfoError("El correo del negocio no es valido.")
      return
    }

    if (invoice.enabled) {
      if (!isValidRfc(invoice.rfc)) {
        setInfoError("RFC invalido para facturacion.")
        return
      }

      if (!invoice.businessName.trim()) {
        setInfoError("Completa la razon social para facturacion.")
        return
      }

      if (!isValidEmail(invoice.email)) {
        setInfoError("Ingresa un correo de facturacion valido.")
        return
      }
    }

    setInfoError("")
    setCompletedStepIndex((current) => Math.max(current, 1))
    if (!cardholderName.trim()) {
      setCardholderName(payerName)
    }
    setStep("payment")
  }

  const handleStepClick = (targetStep: CheckoutStep) => {
    const targetIndex = STEP_KEYS.indexOf(targetStep)
    const maxAllowed = completedStepIndex + 1

    if (targetIndex <= maxAllowed) {
      setStep(targetStep)
    }
  }

  const visualStep = STEP_KEYS.indexOf(step)
  const currency = summary?.currency || "mxn"
  const subtotal = (step === "payment" || step === "complete") && summary ? summary.plan.amount : localSubtotal
  const total = (step === "payment" || step === "complete") && summary ? summary.total : localTotal

  const displayExtras =
    (step === "payment" || step === "complete") && summary
      ? summary.extras.map((item) => ({ id: item.id, label: item.label, amount: item.amount }))
      : localExtras.map((extra) => ({
          id: extra.id,
          label: extra.name || extra.id,
          amount: getExtraPriceCents(extra, billingPeriod),
        }))

  const cardMethodEnabled = preferredMethod === "card"
  const effectiveBillingName = cardMethodEnabled ? cardholderName : payerName
  const fullPhoneNumber = `${countryCode}${payerPhone}`.replace(/\s+/g, "")
  const shouldShowDomainLabel = requiresDomain && domainLabel !== "Sin dominio"
  const isPayerNameValid = isValidFullName(payerName)
  const isPayerPhoneValid = isValidPhone(payerPhone)
  const isBusinessNameFieldValid = isValidBusinessName(businessInfo.businessName)
  const isBusinessTypeFieldValid = Boolean(businessInfo.businessType)

  const getRequiredFieldClass = (isValid: boolean) =>
    `h-12 rounded-xl border border-l-4 border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-sky-500 ${
      isValid ? "!border-l-sky-500" : "!border-l-red-500"
    }`

  const stripeElementsOptions = useMemo(() => {
    if (!clientSecret) {
      return null
    }

    if (resolvedTheme === "dark") {
      return {
        clientSecret,
        appearance: {
          theme: "night" as const,
          variables: {
            colorPrimary: "#22d3ee",
            colorBackground: "#0f172a",
            colorText: "#e2e8f0",
            colorDanger: "#f87171",
            colorTextSecondary: "#94a3b8",
            borderRadius: "10px",
          },
        },
      }
    }

    return {
      clientSecret,
      appearance: {
        theme: "stripe" as const,
      },
    }
  }, [clientSecret, resolvedTheme])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#ecfeff,transparent_32%),radial-gradient(circle_at_90%_0%,#e0f2fe,transparent_28%),#f8fafc] py-8 md:py-12 dark:bg-[radial-gradient(circle_at_10%_10%,#1f2937,transparent_36%),radial-gradient(circle_at_90%_0%,#111827,transparent_34%),#020617]">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Link
            href="/configurar-plan"
            className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Regresar a configuracion
          </Link>

          <section className="overflow-visible rounded-3xl border border-[#dbe4f0] bg-white/95 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.3)] backdrop-blur elev-2 dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-[0_24px_60px_-36px_rgba(2,6,23,0.8)]">
            <header className="border-b border-[#e6edf5] px-6 py-6 md:px-10 dark:border-slate-700">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-300">Checkout</span>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <Button asChild variant="outline" size="sm" className="h-9 px-4 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                    <Link href="/configurar-plan?status=cancel">Cancelar</Link>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 md:gap-6">
                {CHECKOUT_STEPS.map((stepLabel, index) => {
                  const disabled = index > completedStepIndex + 1

                  return (
                    <div key={stepLabel} className="text-center">
                      <button
                        type="button"
                        onClick={() => handleStepClick(STEP_KEYS[index])}
                        disabled={disabled}
                        className={`mx-auto inline-flex min-w-[126px] items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm ${
                          index <= visualStep
                            ? "border-sky-200 bg-sky-100 text-sky-800 dark:border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-200"
                            : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                      >
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-[11px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">{index + 1}</span>
                        {stepLabel}
                      </button>
                    </div>
                  )
                })}
              </div>
            </header>

            <div className="grid md:grid-cols-[1.2fr,0.8fr]">
              <div className="space-y-9 px-6 py-8 md:px-10 md:py-10">
                <AnimatePresence mode="wait" initial={false}>
                {step === "config" && (
                  <motion.div
                    key="config"
                    variants={stepPanelVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-5 md:space-y-6"
                  >
                    <section className="space-y-5 rounded-2xl border border-[#dbe4f0] bg-[#f8fbff] p-5 md:p-6 elev-1">
                      <p className="text-base font-medium text-slate-900">Plan</p>
                      {isCatalogLoading ? (
                        <p className="text-sm text-slate-500">Cargando planes...</p>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {plans.map((plan) => {
                            const active = selectedPlanId === plan.id
                            const planPrice = getPlanPriceCents(plan, billingPeriod)

                            return (
                              <button
                                key={plan.id}
                                type="button"
                                onClick={() => setSelectedPlanId(plan.id)}
                                className={`rounded-xl border p-4 text-left transition ${
                                  active
                                    ? "border-sky-300 bg-sky-50 dark:border-cyan-500/40 dark:bg-cyan-500/10"
                                    : "border-slate-200 bg-white hover:border-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-cyan-500/50"
                                }`}
                              >
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{plan.title}</p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{billingPeriod === "annual" ? "Anual" : "Mensual"}</p>
                                <p className="mt-2 text-base font-semibold text-slate-800 dark:text-cyan-200">{formatAmount(planPrice)}</p>
                              </button>
                            )
                          })}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBillingPeriod("monthly")}
                          className={`h-10 rounded-xl border text-sm ${
                            billingPeriod === "monthly"
                              ? "border-sky-300 bg-sky-100 text-sky-900"
                              : "border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          Mensual
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingPeriod("annual")}
                          className={`h-10 rounded-xl border text-sm ${
                            billingPeriod === "annual"
                              ? "border-sky-300 bg-sky-100 text-sky-900"
                              : "border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          Anual
                        </button>
                      </div>
                    </section>

                    <section className="space-y-4 rounded-2xl border border-[#dbe4f0] bg-[#f8fbff] p-5 md:p-6 elev-1">
                      <p className="text-base font-medium text-slate-900">Extras</p>
                      {relevantExtras.length === 0 ? (
                        <p className="text-sm text-slate-500">No hay extras disponibles para este plan.</p>
                      ) : (
                        <div className="space-y-2">
                          {relevantExtras.map((extra) => {
                            const checked = selectedExtras.includes(extra.id)
                            const extraAmount = getExtraPriceCents(extra, billingPeriod)

                            return (
                              <label
                                key={extra.id}
                                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3"
                              >
                                <input
                                  type="checkbox"
                                  className="mt-0.5 h-4 w-4"
                                  checked={checked}
                                  onChange={() => {
                                    setSelectedExtras((prev) =>
                                      prev.includes(extra.id) ? prev.filter((id) => id !== extra.id) : [...prev, extra.id]
                                    )
                                  }}
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-slate-900">{extra.name || extra.id}</p>
                                  {extra.description && <p className="text-xs text-slate-500">{extra.description}</p>}
                                </div>
                                <span className="text-sm font-medium text-slate-800">{formatAmount(extraAmount)}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </section>

                    {requiresDomain && (
                      <section className="space-y-4 rounded-2xl border border-[#dbe4f0] bg-[#f8fbff] p-5 md:p-6 elev-1">
                        <p className="text-base font-medium text-slate-900">Dominio</p>
                        <div className="space-y-2">
                          {DOMAIN_OPTIONS.map((option) => (
                            <label key={option.id} className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="radio"
                                name="checkout-domain"
                                value={option.id}
                                checked={selectedDomain === option.id}
                                onChange={(event) => setSelectedDomain(event.target.value)}
                              />
                              {option.label}
                            </label>
                          ))}
                        </div>

                        {selectedDomain === "domain-2" && (
                          <input
                            type="text"
                            value={newDomain}
                            onChange={(event) => setNewDomain(event.target.value)}
                            placeholder="nuevo-dominio.com"
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500"
                          />
                        )}
                      </section>
                    )}

                    {configError && <p className="text-sm text-red-600">{configError}</p>}

                    <div className="flex justify-end pt-1 md:pt-2">
                      <Button onClick={goToInfo}>Continuar</Button>
                    </div>
                  </motion.div>
                )}

                {step === "info" && (
                  <motion.div
                    key="info"
                    variants={stepPanelVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-5 md:space-y-6"
                  >
                    <section className="space-y-5 rounded-2xl border border-[#dbe4f0] bg-[#f8fbff] p-5 md:p-6 elev-1">
                      <p className="text-base font-medium text-slate-900">Contacto</p>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={payerName}
                          onChange={(event) => setPayerName(sanitizePersonNameInput(event.target.value))}
                          placeholder="Nombre completo"
                          className={`w-full ${getRequiredFieldClass(isPayerNameValid)}`}
                        />
                        <div className="flex gap-3 sm:gap-4 relative">
                          <div ref={countrySelectorRef} className="relative flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setShowCountryDropdown((current) => !current)}
                              className="h-11 min-w-24 rounded-xl border border-slate-300 bg-white px-2 text-sm outline-none transition hover:border-sky-300 focus:border-sky-500 sm:min-w-28"
                            >
                              <span className="flex items-center justify-between gap-2">
                                <span className="flex items-center gap-2">
                                  {selectedCountry && flagComponents[selectedCountry.iso] ? (
                                    (() => {
                                      const FlagComponent = flagComponents[selectedCountry.iso]
                                      return <FlagComponent title={selectedCountry.name} className="h-4 w-6 rounded-sm" />
                                    })()
                                  ) : (
                                    <span className="h-4 w-6 rounded-sm bg-slate-200" />
                                  )}
                                  <span className="font-medium text-slate-700">{countryCode || "--"}</span>
                                </span>
                                <span className="text-xs text-slate-500">▾</span>
                              </span>
                            </button>

                            <AnimatePresence initial={false}>
                              {showCountryDropdown && (
                                <motion.div
                                  key="country-dropdown"
                                  variants={dropdownVariants}
                                  initial="hidden"
                                  animate="visible"
                                  exit="exit"
                                  className="absolute top-12 left-0 z-50 w-80 rounded-xl border border-slate-300 bg-white shadow-lg"
                                >
                                  <div className="border-b border-slate-200 p-2">
                                    <input
                                      type="text"
                                      value={phoneSearchQuery}
                                      onChange={(event) => setPhoneSearchQuery(event.target.value)}
                                      placeholder="Buscar por +52, MX o Mexico"
                                      className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500"
                                    />
                                  </div>

                                  <div className="max-h-48 overflow-y-auto py-1">
                                    {filteredCountries.length > 0 ? (
                                      filteredCountries.map((country, index) => {
                                        const FlagComponent = flagComponents[country.iso]
                                        return (
                                          <motion.button
                                            key={country.iso}
                                            type="button"
                                            custom={index}
                                            variants={dropdownItemVariants}
                                            initial="hidden"
                                            animate="visible"
                                            onClick={() => {
                                              setSelectedCountryIso(country.iso)
                                              setPhoneSearchQuery("")
                                              setShowCountryDropdown(false)
                                            }}
                                            className="flex w-full items-center gap-2 border-b border-slate-200 px-3 py-2 text-left text-sm hover:bg-sky-50 dark:border-slate-700 dark:hover:bg-slate-700 last:border-b-0"
                                          >
                                            {FlagComponent ? (
                                              <FlagComponent className="h-4 w-6 flex-shrink-0 rounded-sm" />
                                            ) : (
                                              <span className="h-4 w-6 flex-shrink-0 rounded-sm bg-slate-200" />
                                            )}
                                            <span className="font-medium text-slate-800 dark:text-slate-100">{country.code}</span>
                                            <span className="text-slate-500 dark:text-slate-300">{country.iso}</span>
                                            <span className="ml-auto text-slate-600 dark:text-slate-200">{country.name}</span>
                                          </motion.button>
                                        )
                                      })
                                    ) : (
                                      <div className="px-3 py-2 text-sm text-slate-500">No se encontraron paises</div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <input
                            type="tel"
                            value={payerPhone}
                            onChange={(event) => setPayerPhone(event.target.value.replace(/\D/g, ""))}
                            placeholder="Numero de WhatsApp"
                            className={`flex-1 ${getRequiredFieldClass(isPayerPhoneValid)}`}
                          />
                        </div>
                      </div>
                    </section>

                    <section className="space-y-5 rounded-2xl border border-[#dbe4f0] bg-[#f8fbff] p-5 md:p-6 elev-1">
                      <p className="text-base font-medium text-slate-900">Datos del negocio</p>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={businessInfo.businessName}
                          onChange={(event) =>
                            setBusinessInfo((current) => ({
                              ...current,
                              businessName: sanitizeBusinessNameInput(event.target.value),
                            }))
                          }
                          placeholder="Nombre del negocio"
                          className={`w-full ${getRequiredFieldClass(isBusinessNameFieldValid)}`}
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div ref={businessTypeSelectorRef} className="relative">
                            <button
                              type="button"
                              onClick={() => setShowBusinessTypeDropdown((current) => !current)}
                              className={`h-11 w-full rounded-xl border border-l-4 bg-white px-3 text-left text-sm outline-none transition hover:border-sky-300 focus:border-sky-500 ${
                                isBusinessTypeFieldValid ? "border-l-sky-500 text-slate-700" : "border-l-red-500 text-slate-500"
                              }`}
                            >
                              <span className="flex items-center justify-between gap-3">
                                <span className="truncate">
                                  {businessInfo.businessType || "Tipo de negocio"}
                                </span>
                                <span className="text-xs text-slate-500">▾</span>
                              </span>
                            </button>

                            <AnimatePresence initial={false}>
                              {showBusinessTypeDropdown && (
                                <motion.div
                                  key="business-type-dropdown"
                                  variants={dropdownVariants}
                                  initial="hidden"
                                  animate="visible"
                                  exit="exit"
                                  className="absolute top-12 left-0 z-50 w-full overflow-hidden rounded-xl border border-slate-300 bg-white shadow-lg"
                                >
                                  <div className="max-h-48 overflow-y-auto py-1">
                                    {BUSINESS_TYPES.map((type) => (
                                      <button
                                        key={type}
                                        type="button"
                                        onClick={() => {
                                          setBusinessInfo((current) => ({
                                            ...current,
                                            businessType: type,
                                          }))
                                          setShowBusinessTypeDropdown(false)
                                        }}
                                        className="flex w-full items-center justify-between border-b border-slate-200 px-3 py-2 text-left text-sm hover:bg-sky-50 dark:border-slate-700 dark:hover:bg-slate-700 last:border-b-0"
                                      >
                                        <span className="font-medium text-slate-700 dark:text-slate-100">{type}</span>
                                        {businessInfo.businessType === type && (
                                          <span className="text-xs font-semibold text-sky-600">Seleccionado</span>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <input
                            type="email"
                            value={businessInfo.email}
                            onChange={(event) =>
                              setBusinessInfo((current) => ({
                                ...current,
                                email: event.target.value,
                              }))
                            }
                            placeholder="Correo (opcional)"
                            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500"
                          />
                          <input
                            type="text"
                            value={businessInfo.country}
                            onChange={(event) =>
                              setBusinessInfo((current) => ({
                                ...current,
                                country: sanitizeLocationInput(event.target.value),
                              }))
                            }
                            placeholder="Pais (opcional)"
                            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500"
                          />
                          <input
                            type="text"
                            value={businessInfo.city}
                            onChange={(event) =>
                              setBusinessInfo((current) => ({
                                ...current,
                                city: sanitizeLocationInput(event.target.value),
                              }))
                            }
                            placeholder="Ciudad (opcional)"
                            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500"
                          />
                        </div>
                      </div>
                    </section>

                    {infoError && <p className="text-sm text-red-600">{infoError}</p>}

                    <div className="flex justify-between gap-3 pt-1 md:pt-2">
                      <Button variant="outline" onClick={() => setStep("config")}>Volver</Button>
                      <Button onClick={goToPayment}>Continuar</Button>
                    </div>
                  </motion.div>
                )}

                {step === "payment" && (
                  <motion.div
                    key="payment"
                    variants={stepPanelVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-5 md:space-y-6"
                  >
                    <div className="rounded-2xl bg-[#f8fbff] p-5 md:p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm text-slate-500">Metodos de pago</p>
                        <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => setStep("config")}>Editar configuracion</Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {PAYMENT_METHODS.map((method) => {
                          const isActive = preferredMethod === method.id
                          const Icon = method.icon
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => {
                                setPreferredMethod(method.id)
                                setError("")
                              }}
                              className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm transition-all ${
                                isActive
                                  ? "border-sky-300 bg-sky-500 text-white shadow-sm"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50"
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" /> {method.label}
                            </button>
                          )
                        })}
                      </div>

                    </div>

                    <section className="space-y-4 rounded-2xl border border-[#dbe4f0] bg-[#f8fbff] p-5 md:p-6 elev-1">
                      <p className="text-base font-medium text-slate-900">Facturacion</p>
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={invoice.enabled}
                          onChange={(event) => {
                            const enabled = event.target.checked
                            setInvoice((current) => ({ ...current, enabled }))
                          }}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        Quiero factura
                      </label>

                      <AnimatePresence initial={false}>
                        {invoice.enabled && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.18 }}
                            className="grid gap-3 sm:grid-cols-2"
                          >
                            <input
                              type="text"
                              value={invoice.rfc}
                              onChange={(event) => setInvoice((current) => ({ ...current, rfc: event.target.value }))}
                              placeholder="RFC"
                              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500"
                            />
                            <input
                              type="email"
                              value={invoice.email}
                              onChange={(event) => setInvoice((current) => ({ ...current, email: event.target.value }))}
                              placeholder="Correo de facturacion"
                              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500"
                            />
                            <input
                              type="text"
                              value={invoice.businessName}
                              onChange={(event) => setInvoice((current) => ({ ...current, businessName: event.target.value }))}
                              placeholder="Razon social"
                              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500 sm:col-span-2"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </section>

                    <section className="space-y-4 rounded-2xl border border-[#dbe4f0] bg-[#f7fafd] p-5 md:p-6 elev-1">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Lock className="h-4 w-4" />
                        <p className="text-sm font-medium">Procesar pago</p>
                      </div>

                      {!preferredMethod ? (
                        <p className="text-sm text-slate-500">Selecciona un método de pago para mostrar el formulario.</p>
                      ) : !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? (
                        <p className="text-sm text-red-600">Falta NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY en tu entorno.</p>
                      ) : isLoading ? (
                        <div className="space-y-3 text-sm text-slate-500">
                          <p>Inicializando pasarela...</p>
                          <div className="h-36 animate-pulse rounded-lg bg-slate-200" />
                        </div>
                      ) : error ? (
                        <p className="text-sm text-red-600">{error}</p>
                      ) : !stripeElementsOptions || !stripePromise ? (
                        <p className="text-sm text-red-600">No se pudo crear el formulario de pago.</p>
                      ) : (
                        <Elements stripe={stripePromise} options={stripeElementsOptions}>
                          <PaymentForm
                            billingName={effectiveBillingName}
                            payerPhone={payerPhone}
                            cardMethodEnabled={cardMethodEnabled}
                            cardholderName={cardholderName}
                            onCardholderNameChange={setCardholderName}
                            onSuccess={() => {
                              setCompletedStepIndex((current) => Math.max(current, 2))
                              setStep("complete")
                              setSuccessMessage("Pago procesado correctamente. Revisa el estado en Stripe.")
                            }}
                          />
                        </Elements>
                      )}
                    </section>
                  </motion.div>
                )}

                {step === "complete" && (
                  <motion.section
                    key="complete"
                    variants={stepPanelVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: 0.05 }}
                      className="flex items-center gap-2 text-emerald-700"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      <p className="text-base font-semibold">Pago completado</p>
                    </motion.div>
                    <p className="text-sm text-emerald-800">{successMessage || "Tu pago se proceso correctamente."}</p>
                    <div className="flex gap-3">
                      <Link href="/configurar-plan">
                        <Button>Volver a configurar</Button>
                      </Link>
                      <Button variant="outline" onClick={() => setStep("payment")}>Ver pago</Button>
                    </div>
                  </motion.section>
                )}
                </AnimatePresence>
              </div>

              <aside className="border-t border-[#e2e8f0] bg-[#f3f8fd] px-6 py-8 md:border-l md:border-t-0 md:px-8 md:py-10 dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm elev-2 dark:border-slate-700 dark:bg-slate-800/80">
                  <div className="mb-1 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{summary?.plan?.label || planLabel}</p>
                      <p className="mt-1 text-xs text-slate-500">{billingLabel}{shouldShowDomainLabel ? ` • ${domainLabel}` : ""}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{formatAmount(subtotal || total, currency)}</p>
                  </div>
                </div>

                <div className="space-y-3 border-b border-slate-200 pb-5 text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatAmount(subtotal, currency)}</span>
                  </div>
                  {displayExtras.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-slate-600">
                      <span>{item.label}</span>
                      <span>{formatAmount(item.amount, currency)}</span>
                    </div>
                  ))}
                  {!displayExtras.length && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Extras</span>
                      <span>{formatAmount(0, currency)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <p className="text-base font-semibold text-slate-900">Total</p>
                  <p className="text-2xl font-semibold tracking-tight text-slate-900">{formatAmount(total, currency)}</p>
                </div>
              </aside>
            </div>
          </section>
        </motion.div>
      </div>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#ecfeff,transparent_32%),radial-gradient(circle_at_90%_0%,#e0f2fe,transparent_28%),#f8fafc] py-8 md:py-12 dark:bg-[radial-gradient(circle_at_10%_10%,#1f2937,transparent_36%),radial-gradient(circle_at_90%_0%,#111827,transparent_34%),#020617]">
          <div className="container">
            <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-900/70" />
          </div>
        </main>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  )
}
