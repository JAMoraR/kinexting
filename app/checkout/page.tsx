"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { AnimatePresence, motion } from "framer-motion"

import { ArrowLeft, Banknote, Building2, CheckCircle2, CreditCard, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  COMPANY_NAME,
  mapCatalogPlansToPlans,
  type BillingCycle,
  type CatalogExtra,
  type Plan,
  type PricingCatalogResponse,
} from "@/lib/plans"

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

type PaymentFormProps = {
  onSuccess: () => void
  billingName: string
  payerPhone: string
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

type PreferredMethod = "all" | "card" | "oxxo" | "spei"
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
  { id: "all", label: "Todos", icon: CreditCard },
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

function PaymentForm({ onSuccess, billingName, payerPhone }: PaymentFormProps) {
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
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={!stripe || isSubmitting}>
        {isSubmitting ? "Procesando..." : "Pagar ahora"}
      </Button>
    </form>
  )
}

export default function CheckoutPage() {
  const searchParams = useSearchParams()

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

  const [preferredMethod, setPreferredMethod] = useState<PreferredMethod>("all")
  const [payerName, setPayerName] = useState("")
  const [payerPhone, setPayerPhone] = useState("")
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
      customerPhone: payerPhone,
      businessInfo,
      invoice,
    }),
    [selectedPlanId, billingPeriod, selectedDomain, newDomain, selectedExtras, preferredMethod, payerName, payerPhone, businessInfo, invoice]
  )

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
  const isDomainSelectionValid = !requiresDomain || Boolean(selectedDomain && (selectedDomain !== "domain-2" || newDomain.trim()))

  const localSubtotal = selectedPlan ? getPlanPriceCents(selectedPlan, billingPeriod) : 0
  const localExtras = useMemo(
    () => selectedExtras.map((id) => relevantExtras.find((extra) => extra.id === id)).filter(Boolean) as CatalogExtra[],
    [selectedExtras, relevantExtras]
  )
  const localTotal = localSubtotal + localExtras.reduce((acc, extra) => acc + getExtraPriceCents(extra, billingPeriod), 0)

  useEffect(() => {
    let isMounted = true

    const initIntent = async () => {
      try {
        if (step !== "payment") {
          return
        }

        if (!payload.planId) {
          throw new Error("Falta plan seleccionado")
        }

        setIsLoading(true)
        setError("")

        const response = await fetch("/api/payments/intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
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
    }
  }, [payload, step])

  const goToInfo = () => {
    if (!selectedPlan) {
      setConfigError("Selecciona un plan para continuar.")
      return
    }

    if (!isDomainSelectionValid) {
      setConfigError("Completa la opcion de dominio para continuar.")
      return
    }

    setConfigError("")
    setCompletedStepIndex((current) => Math.max(current, 0))
    setStep("info")
  }

  const goToPayment = () => {
    if (!payerName.trim() || !payerPhone.trim()) {
      setInfoError("Completa nombre del titular y telefono.")
      return
    }

    if (
      !businessInfo.businessName.trim() ||
      !businessInfo.businessType ||
      !businessInfo.email.trim() ||
      !businessInfo.country.trim() ||
      !businessInfo.city.trim()
    ) {
      setInfoError("Completa los datos del negocio para continuar.")
      return
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

  const cardMethodEnabled = preferredMethod === "all" || preferredMethod === "card"
  const effectiveBillingName = cardMethodEnabled ? cardholderName : payerName

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#ecfeff,transparent_32%),radial-gradient(circle_at_90%_0%,#e0f2fe,transparent_28%),#f8fafc] py-6 md:py-10">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Link
            href="/configurar-plan"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Regresar a configuracion
          </Link>

          <section className="overflow-hidden rounded-3xl border border-[#dbe4f0] bg-white/95 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.3)] backdrop-blur">
            <header className="border-b border-[#e6edf5] px-5 py-5 md:px-8">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-[36px] font-extrabold tracking-tight text-slate-700 md:text-[40px]">{COMPANY_NAME}</p>
                <span className="text-sm text-slate-500">Checkout</span>
              </div>

              <div className="grid grid-cols-4 gap-2 md:gap-4">
                {CHECKOUT_STEPS.map((stepLabel, index) => {
                  const disabled = index > completedStepIndex + 1

                  return (
                    <div key={stepLabel} className="text-center">
                      <button
                        type="button"
                        onClick={() => handleStepClick(STEP_KEYS[index])}
                        disabled={disabled}
                        className={`mx-auto inline-flex min-w-[110px] items-center justify-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                          index <= visualStep
                            ? "border-sky-200 bg-sky-100 text-sky-800"
                            : "border-slate-200 bg-white text-slate-500"
                        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                      >
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/70 text-[11px]">{index + 1}</span>
                        {stepLabel}
                      </button>
                    </div>
                  )
                })}
              </div>
            </header>

            <div className="grid md:grid-cols-[1.2fr,0.8fr]">
              <div className="space-y-7 px-5 py-6 md:px-8 md:py-8">
                {step === "config" && (
                  <>
                    <section className="space-y-4 rounded-2xl border border-[#dbe4f0] bg-[#f8fbff] p-4 md:p-5">
                      <p className="text-base font-medium text-slate-900">Plan</p>
                      {isCatalogLoading ? (
                        <p className="text-sm text-slate-500">Cargando planes...</p>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
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
                                    ? "border-sky-300 bg-sky-50"
                                    : "border-slate-200 bg-white hover:border-sky-200"
                                }`}
                              >
                                <p className="text-sm font-semibold text-slate-900">{plan.title}</p>
                                <p className="mt-1 text-xs text-slate-500">{billingPeriod === "annual" ? "Anual" : "Mensual"}</p>
                                <p className="mt-2 text-base font-semibold text-slate-800">{formatAmount(planPrice)}</p>
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

                    <section className="space-y-3 rounded-2xl border border-[#dbe4f0] bg-[#f8fbff] p-4 md:p-5">
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
                      <section className="space-y-3 rounded-2xl border border-[#dbe4f0] bg-[#f8fbff] p-4 md:p-5">
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

                    <div className="flex justify-end">
                      <Button onClick={goToInfo}>Continuar</Button>
                    </div>
                  </>
                )}

                {step === "info" && (
                  <>
                    <section className="space-y-4 rounded-2xl border border-[#dbe4f0] bg-[#f8fbff] p-4 md:p-5">
                      <p className="text-base font-medium text-slate-900">Contacto</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          type="text"
                          value={payerName}
                          onChange={(event) => setPayerName(event.target.value)}
                          placeholder="Nombre del titular"
                          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500"
                        />
                        <input
                          type="tel"
                          value={payerPhone}
                          onChange={(event) => setPayerPhone(event.target.value)}
                          placeholder="Telefono (WhatsApp)"
                          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500"
                        />
                      </div>
                    </section>

                    <section className="space-y-4 rounded-2xl border border-[#dbe4f0] bg-[#f8fbff] p-4 md:p-5">
                      <p className="text-base font-medium text-slate-900">Datos del negocio</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          type="text"
                          value={businessInfo.businessName}
                          onChange={(event) =>
                            setBusinessInfo((current) => ({
                              ...current,
                              businessName: event.target.value,
                            }))
                          }
                          placeholder="Nombre del negocio"
                          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500"
                        />
                        <select
                          value={businessInfo.businessType}
                          onChange={(event) =>
                            setBusinessInfo((current) => ({
                              ...current,
                              businessType: event.target.value,
                            }))
                          }
                          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500"
                        >
                          <option value="">Tipo de negocio</option>
                          {BUSINESS_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <input
                          type="email"
                          value={businessInfo.email}
                          onChange={(event) =>
                            setBusinessInfo((current) => ({
                              ...current,
                              email: event.target.value,
                            }))
                          }
                          placeholder="Correo del negocio"
                          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500"
                        />
                        <input
                          type="text"
                          value={businessInfo.country}
                          onChange={(event) =>
                            setBusinessInfo((current) => ({
                              ...current,
                              country: event.target.value,
                            }))
                          }
                          placeholder="Pais"
                          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500"
                        />
                        <input
                          type="text"
                          value={businessInfo.city}
                          onChange={(event) =>
                            setBusinessInfo((current) => ({
                              ...current,
                              city: event.target.value,
                            }))
                          }
                          placeholder="Ciudad"
                          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500 sm:col-span-2"
                        />
                      </div>
                    </section>

                    {infoError && <p className="text-sm text-red-600">{infoError}</p>}

                    <div className="flex justify-between gap-3">
                      <Button variant="outline" onClick={() => setStep("config")}>Volver</Button>
                      <Button onClick={goToPayment}>Continuar</Button>
                    </div>
                  </>
                )}

                {step === "payment" && (
                  <>
                    <div className="rounded-2xl bg-[#f8fbff] p-4 md:p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm text-slate-500">Metodos de pago</p>
                        <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => setStep("config")}>Editar configuracion</Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-4">
                        {PAYMENT_METHODS.map((method) => {
                          const isActive = preferredMethod === method.id
                          const Icon = method.icon
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setPreferredMethod(method.id)}
                              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm transition-all ${
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

                    <section className="space-y-3 rounded-2xl border border-[#dbe4f0] bg-[#f8fbff] p-4 md:p-5">
                      <p className="text-base font-medium text-slate-900">Pago</p>
                      {cardMethodEnabled && (
                        <input
                          type="text"
                          value={cardholderName}
                          onChange={(event) => setCardholderName(event.target.value)}
                          placeholder="Nombre del titular"
                          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500"
                        />
                      )}
                    </section>

                    <section className="space-y-3 rounded-2xl border border-[#dbe4f0] bg-[#f8fbff] p-4 md:p-5">
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

                    <section className="space-y-3 rounded-2xl border border-[#dbe4f0] bg-[#f7fafd] p-4 md:p-5">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Lock className="h-4 w-4" />
                        <p className="text-sm font-medium">Procesar pago</p>
                      </div>

                      {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? (
                        <p className="text-sm text-red-600">Falta NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY en tu entorno.</p>
                      ) : isLoading ? (
                        <div className="space-y-3 text-sm text-slate-500">
                          <p>Inicializando pasarela...</p>
                          <div className="h-36 animate-pulse rounded-lg bg-slate-200" />
                        </div>
                      ) : error ? (
                        <p className="text-sm text-red-600">{error}</p>
                      ) : !clientSecret || !stripePromise ? (
                        <p className="text-sm text-red-600">No se pudo crear el formulario de pago.</p>
                      ) : (
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                          <PaymentForm
                            billingName={effectiveBillingName}
                            payerPhone={payerPhone}
                            onSuccess={() => {
                              setCompletedStepIndex((current) => Math.max(current, 2))
                              setStep("complete")
                              setSuccessMessage("Pago procesado correctamente. Revisa el estado en Stripe.")
                            }}
                          />
                        </Elements>
                      )}

                      {cardMethodEnabled && !cardholderName.trim() && (
                        <p className="text-xs text-amber-700">Completa el nombre del titular para pago con tarjeta.</p>
                      )}
                    </section>
                  </>
                )}

                {step === "complete" && (
                  <section className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 className="h-5 w-5" />
                      <p className="text-base font-semibold">Pago completado</p>
                    </div>
                    <p className="text-sm text-emerald-800">{successMessage || "Tu pago se proceso correctamente."}</p>
                    <div className="flex gap-3">
                      <Link href="/configurar-plan">
                        <Button>Volver a configurar</Button>
                      </Link>
                      <Button variant="outline" onClick={() => setStep("payment")}>Ver pago</Button>
                    </div>
                  </section>
                )}
              </div>

              <aside className="border-t border-[#e2e8f0] bg-[#f3f8fd] px-5 py-6 md:border-l md:border-t-0 md:px-7 md:py-8">
                <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-1 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{summary?.plan?.label || planLabel}</p>
                      <p className="mt-1 text-xs text-slate-500">{billingLabel} • {domainLabel}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{formatAmount(subtotal || total, currency)}</p>
                  </div>
                </div>

                <div className="space-y-2 border-b border-slate-200 pb-4 text-sm">
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

                <div className="mt-4 flex items-center justify-between">
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
