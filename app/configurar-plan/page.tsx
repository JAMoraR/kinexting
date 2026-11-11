"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { motion } from "framer-motion"
import { ArrowLeft, Check, ChevronRight, ServerIcon, Shield, Zap, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import ThemeToggle from "@/components/theme-toggle"
import {
  COMPANY_NAME,
  buildWhatsAppLink,
  mapCatalogPlansToPlans,
  PLAN_CATEGORY,
  MASTER_EXTRAS,
  type BillingCycle,
  type CatalogExtra,
  type Plan,
  type PlanId,
  type PricingCatalogResponse,
} from "@/lib/plans"

type PlanData = {
  id: PlanId
  name: string
  quarterlyPrice: number
  annualPrice: number
  features: string[]
  description: string
  hidePrice?: boolean
}

type ExtraSection = {
  id: string
  title: string
  extras: CatalogExtra[]
}

const toPlanesData = (plans: Plan[]) =>
  plans.reduce((acc, plan) => {
    acc[plan.id] = {
      id: plan.id,
      name: plan.title,
      quarterlyPrice: plan.price?.quarterly ?? 0,
      annualPrice: plan.price?.annual ?? 0,
      features: plan.features,
      description: plan.description,
      hidePrice: plan.hidePrice,
    }
    return acc
  }, {} as Record<PlanId, PlanData>)

const domainOptions = [
  { id: "domain-1", name: "Usar un dominio que ya poseo" },
  { id: "domain-2", name: "Registrar un nuevo dominio" },
]

const PLAN_IDS: PlanId[] = ["asistente", "recepcionista", "soporte-tecnico", "a-medida"]

const isPlanId = (value: string | null): value is PlanId =>
  Boolean(value && PLAN_IDS.includes(value as PlanId))

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

const getPlanCategory = (planId: PlanId) => {
  return PLAN_CATEGORY[planId] || "chatbot"
}

const extraMatchesPlan = (extra: CatalogExtra, planId: PlanId) => {
  const category = extra.category || "general"
  const planCategory = getPlanCategory(planId)

  if (planCategory === "both") {
    return category === "web" || category === "chatbot" || category === "combo" || category === "general"
  }

  return category === "chatbot" || category === "general"
}

const getExtraIcon = (category?: string) => {
  switch (category) {
    case "chatbot":
      return <Plus className="h-5 w-5" />
    case "combo":
      return <ServerIcon className="h-5 w-5" />
    case "general":
      return <Shield className="h-5 w-5" />
    case "web":
    default:
      return <Zap className="h-5 w-5" />
  }
}

const getExtraSectionsByPlan = (planId: PlanId, catalogExtras: CatalogExtra[]): ExtraSection[] => {
  const relevantExtras = catalogExtras.filter((extra) => extraMatchesPlan(extra, planId))
  const planCategory = getPlanCategory(planId)
  const categoryOrder =
    planCategory === "both"
      ? ["web", "chatbot", "combo", "general"]
      : planCategory === "chatbot"
      ? ["chatbot", "general"]
      : ["web", "general"]

  const sectionsByCategory = new Map<string, CatalogExtra[]>()

  relevantExtras.forEach((extra) => {
    const category = extra.category || "general"
    const items = sectionsByCategory.get(category) || []
    items.push(extra)
    sectionsByCategory.set(category, items)
  })

  return categoryOrder
    .map((category) => {
      const extras = sectionsByCategory.get(category) || []
      if (extras.length === 0) {
        return null
      }

      const title =
        category === "chatbot"
          ? "Extras para Chatbot"
          : category === "combo"
          ? "Extras combinados"
          : category === "general"
          ? "Otros servicios"
          : "Extras para Web"

      return {
        id: category,
        title,
        extras,
      }
    })
    .filter((section): section is ExtraSection => section !== null)
}

export default function ConfigurarPlan() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [plans, setPlans] = useState<Plan[]>([])
  const [catalogExtras, setCatalogExtras] = useState<CatalogExtra[]>([])
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [trialError, setTrialError] = useState("")
  const [checkoutError, setCheckoutError] = useState("")

  const planesData = useMemo(() => toPlanesData(plans), [plans])
  const defaultPlanId: PlanId = (plans.find((plan) => plan.popular)?.id ?? plans[0]?.id ?? "asistente") as PlanId
  const planParam = searchParams.get("plan")
  const billingParam = searchParams.get("billing") || "quarterly"

  const initialPlanId = isPlanId(planParam) ? planParam : defaultPlanId
  const initialPlan = planesData[initialPlanId] ?? null
  const initialBilling: BillingCycle = billingParam === "annual" ? "annual" : "quarterly"

  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(initialPlanId)
  const [planData, setPlanData] = useState<PlanData | null>(initialPlan)
  const [billingPeriod, setBillingPeriod] = useState<BillingCycle>(initialBilling)
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string>("")
  const [newDomain, setNewDomain] = useState<string>("")
  const [totalPrice, setTotalPrice] = useState<number>(0)

  const extraSections = useMemo(
    () => getExtraSectionsByPlan(selectedPlanId, catalogExtras),
    [selectedPlanId, catalogExtras],
  )
  const sortedPlanCards = useMemo(
    () =>
      Object.values(planesData).sort((a, b) => {
        if (a.id === "a-medida" && b.id !== "a-medida") return 1
        if (b.id === "a-medida" && a.id !== "a-medida") return -1
        const priceA = billingPeriod === "annual" ? a.annualPrice : a.quarterlyPrice
        const priceB = billingPeriod === "annual" ? b.annualPrice : b.quarterlyPrice
        return priceA - priceB
      }),
    [planesData, billingPeriod],
  )
  const availableExtras = useMemo(
    () => extraSections.flatMap((section) => section.extras),
    [extraSections],
  )
  const extrasMap = useMemo(
    () => new Map(availableExtras.map((extra) => [extra.id, extra] as const)),
    [availableExtras],
  )
  const requiresDomain = getPlanCategory(selectedPlanId) !== "chatbot"
  const isDomainSelectionValid = !requiresDomain || selectedDomain !== ""
  const shouldShowPlanSkeleton = isCatalogLoading && sortedPlanCards.length === 0
  const activePlanData = planData

  useEffect(() => {
    let isMounted = true

    const loadCatalog = async () => {
      try {
        const response = await fetch("/api/prices", { cache: "no-store" })
        if (!response.ok) {
          if (isMounted) {
            setPlans(mapCatalogPlansToPlans([]))
            setCatalogExtras(MASTER_EXTRAS)
          }
          return
        }

        const payload = (await response.json()) as PricingCatalogResponse
        if (!isMounted) {
          return
        }

        setPlans(mapCatalogPlansToPlans(payload.plans))
        setCatalogExtras(
          Array.isArray(payload.extras) && payload.extras.length > 0 ? payload.extras : MASTER_EXTRAS
        )
      } catch {
        if (isMounted) {
          setPlans(mapCatalogPlansToPlans([]))
          setCatalogExtras(MASTER_EXTRAS)
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
  }, [])

  useEffect(() => {
    const fallbackPlan = Object.values(planesData)[0] ?? null

    if (planParam && planParam in planesData) {
      const validPlanId = planParam as PlanId
      setSelectedPlanId(validPlanId)
      setPlanData(planesData[validPlanId])
      return
    }

    if (planesData[defaultPlanId]) {
      setSelectedPlanId(defaultPlanId)
      setPlanData(planesData[defaultPlanId])
      return
    }

    if (fallbackPlan) {
      setSelectedPlanId(fallbackPlan.id)
      setPlanData(fallbackPlan)
      return
    }

    setPlanData(null)
  }, [planParam, defaultPlanId, planesData])

  useEffect(() => {
    setBillingPeriod(billingParam === "annual" ? "annual" : "quarterly")
  }, [billingParam])

  useEffect(() => {
    const validExtraIds = new Set(availableExtras.map((extra) => extra.id))
    setSelectedExtras((prev) => prev.filter((extraId) => validExtraIds.has(extraId)))
  }, [availableExtras])

  useEffect(() => {
    if (!requiresDomain) {
      setSelectedDomain("")
      setNewDomain("")
      return
    }

    setSelectedDomain((prev) => prev || domainOptions[0].id)
  }, [requiresDomain, selectedPlanId])

  useEffect(() => {
    if (!activePlanData) {
      setTotalPrice(0)
      return
    }

    let price = billingPeriod === "annual" ? activePlanData.annualPrice : activePlanData.quarterlyPrice

    selectedExtras.forEach((extraId) => {
      const extra = extrasMap.get(extraId)
      if (extra) {
        const eQuarterly = extra.prices?.quarterly?.amount ?? 0
        const eAnnual = extra.prices?.annual?.amount ?? 0
        price += billingPeriod === "annual" ? eAnnual : eQuarterly
      }
    })

    setTotalPrice(price)
  }, [billingPeriod, selectedExtras, activePlanData, extrasMap])

  const toggleExtra = (extraId: string) => {
    setSelectedExtras((prev) => (prev.includes(extraId) ? prev.filter((id) => id !== extraId) : [...prev, extraId]))
  }

  const handleCheckout = async () => {
    if (!activePlanData || isCheckoutLoading) {
      return
    }

    if (selectedPlanId === "a-medida") {
      window.location.href = buildWhatsAppLink()
      return
    }

    if (!isDomainSelectionValid) {
      setCheckoutError("Selecciona una opción de dominio para continuar.")
      return
    }

    try {
      setCheckoutError("")
      setIsCheckoutLoading(true)

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: selectedPlanId,
          billing: billingPeriod,
          extraIds: selectedExtras,
          selectedDomain,
          newDomain,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error || "No se pudo iniciar el checkout")
      }

      window.location.href = payload.url
    } catch {
      setCheckoutError("No fue posible iniciar el pago. Intenta de nuevo en unos segundos.")
    } finally {
      setIsCheckoutLoading(false)
    }
  }

  const handleTrialPayment = async () => {
    if (!activePlanData) {
      return
    }

    if (selectedPlanId === "a-medida") {
      window.location.href = buildWhatsAppLink()
      return
    }

    if (!isDomainSelectionValid) {
      setTrialError("Selecciona una opción de dominio para continuar.")
      return
    }

    setTrialError("")
    const params = new URLSearchParams({
      plan: selectedPlanId,
      billing: billingPeriod,
      selectedDomain,
      newDomain,
    })

    if (selectedExtras.length > 0) {
      params.set("extras", selectedExtras.join(","))
    }

    router.push(`/checkout?${params.toString()}`)
  }

  // Animaciones para los contenedores
  const containerVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1] as const,
        staggerChildren: 0.08,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.25,
        ease: [0.23, 1, 0.32, 1] as const,
      },
    },
  }

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
      },
    },
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060c18]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 elev-1">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ServerIcon className="h-6 w-6 text-indigo-600 dark:text-cyan-400" />
            <span className="text-xl font-bold">{COMPANY_NAME}</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <Link href="/">
              <Button variant="ghost" size="sm" className="h-10 px-3">
                Cancelar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-6 sm:py-8 md:py-12 pb-28 xl:pb-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex flex-col gap-2 mb-6 sm:mb-8"
        >
          <Link href="/" className="mb-1 inline-flex w-fit items-center py-1 text-sm text-muted-foreground hover:text-indigo-600 dark:hover:text-cyan-400">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver a planes
          </Link>
          <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold tracking-tight">
            Configura tu plan{" "}
            <span className="text-indigo-600 dark:text-cyan-400">
              {activePlanData?.name || ""}
            </span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-sm sm:text-base text-muted-foreground">
            Personaliza tu solución y añade módulos opcionales para potenciar tu operación.
          </motion.p>
          {/* Selector de planes */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mt-5 sm:mt-6 mb-4 sm:mb-8">
            {shouldShowPlanSkeleton
              ? [0, 1, 2, 3].map((index) => (
                  <Card key={index} className="h-full">
                    <CardContent className="p-5 sm:p-6 space-y-3">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-8 w-28" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-4 w-3/5" />
                    </CardContent>
                  </Card>
                ))
              : sortedPlanCards.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.985 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                onClick={() => {
                  setSelectedPlanId(plan.id)
                  setPlanData(plan)
                  const url = new URL(window.location.href)
                  url.searchParams.set("plan", plan.id)
                  url.searchParams.set("billing", billingPeriod)
                  window.history.pushState({}, "", url)
                }}
              >
                <Card
                  className={`h-full cursor-pointer transition-all ${activePlanData?.name === plan.name ? "border-2 border-indigo-600 dark:border-cyan-400 bg-indigo-50/30 dark:bg-cyan-500/5 shadow-[0_10px_28px_rgba(79,70,229,0.28)] dark:shadow-[0_10px_30px_rgba(56,189,248,0.22)]" : "hover:border-indigo-300 hover:shadow-[0_8px_22px_rgba(15,23,42,0.14)] dark:hover:shadow-[0_10px_30px_rgba(2,6,23,0.55)]"}`}
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-bold text-base sm:text-lg">{plan.name}</h3>
                      {activePlanData?.name === plan.name && <Badge className="shrink-0 bg-indigo-600 dark:bg-cyan-400 dark:text-slate-950">Seleccionado</Badge>}
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      {!plan.hidePrice && (
                        <>
                          <span className="text-2xl font-bold font-mono">
                            {formatCurrency(billingPeriod === "annual" ? plan.annualPrice : plan.quarterlyPrice)}
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            /{billingPeriod === "annual" ? "Anual" : "Trimestral"}
                          </span>
                        </>
                      )}
                      {plan.hidePrice && (
                        <span className="text-muted-foreground text-sm">Precio personalizado</span>
                      )}
                    </div>
                    <ul className="text-xs sm:text-sm space-y-1.5 mt-4">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-4 w-4 shrink-0 mt-0.5 text-indigo-600 dark:text-cyan-400" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="flex items-center gap-2 text-indigo-600 dark:text-cyan-400 font-medium">
                          <Plus className="h-4 w-4 shrink-0" />
                          <span>{plan.features.length - 3} características más</span>
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <div className="grid gap-6 sm:gap-8 xl:grid-cols-3">
          {/* Columna principal de configuración */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="xl:col-span-2 space-y-6 sm:space-y-8"
          >
            {/* Período de facturación */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Período de facturación</CardTitle>
                  <CardDescription>Elige entre facturación trimestral o anual</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={billingPeriod}
                    onValueChange={(value) => setBillingPeriod(value as "quarterly" | "annual")}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="quarterly">
                        Trimestral
                      </TabsTrigger>
                      <TabsTrigger value="annual">
                        Anual (-15%)
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="quarterly" className="mt-4">
                      <p className="text-sm text-muted-foreground">
                        Facturación Trimestral con renovación automática.
                      </p>
                    </TabsContent>
                    <TabsContent value="annual" className="mt-4">
                      <p className="text-sm text-muted-foreground">
                        Facturación Anual con 15% de ahorro y renovación automática.
                      </p>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>

            {/* Extras */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Servicios opcionales</CardTitle>
                  <CardDescription>
                    {getPlanCategory(selectedPlanId) === "both"
                      ? "Tu plan incluye chatbot y web. Los servicios disponibles se cargan desde Stripe."
                      : getPlanCategory(selectedPlanId) === "chatbot"
                      ? "Tu plan es chatbot. Solo se muestran servicios de esa categoría desde Stripe."
                      : "Tu plan es web. Solo se muestran servicios de esa categoría desde Stripe."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {extraSections.length > 0 ? (
                    extraSections.map((section) => (
                      <div key={section.id} className="space-y-3">
                        <h3 className="text-sm font-semibold text-indigo-700 dark:text-cyan-400">{section.title}</h3>
                        {section.extras.map((extra) => {
                          const isSelected = selectedExtras.includes(extra.id)
                          const quarterlyAmount = extra.prices?.quarterly?.amount ?? 0
                          const annualAmount = extra.prices?.annual?.amount ?? 0
                          const price = billingPeriod === "annual" ? annualAmount : quarterlyAmount

                          return (
                            <Card
                              key={extra.id}
                              onClick={() => toggleExtra(extra.id)}
                              className={`cursor-pointer border-2 transition-all duration-200 ${
                                isSelected
                                  ? "border-indigo-600 dark:border-cyan-400 bg-indigo-50/50 dark:bg-cyan-500/5 shadow-[0_8px_22px_rgba(79,70,229,0.22)] dark:shadow-[0_10px_28px_rgba(56,189,248,0.2)]"
                                  : "hover:border-indigo-200 hover:shadow-[0_8px_22px_rgba(15,23,42,0.12)] dark:hover:shadow-[0_10px_28px_rgba(2,6,23,0.5)]"
                              }`}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3 min-w-0">
                                    <div
                                      className={`shrink-0 rounded-full p-2 ${
                                        isSelected ? "bg-indigo-100 text-indigo-600 dark:bg-cyan-500/20 dark:text-cyan-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                      }`}
                                    >
                                      {getExtraIcon(extra.category)}
                                    </div>
                                    <div className="min-w-0">
                                      <h3 className="font-medium text-sm sm:text-base">{extra.name || extra.id}</h3>
                                      <p className="text-xs sm:text-sm text-muted-foreground">{extra.description || ""}</p>
                                      <p className="mt-1 text-xs sm:text-sm font-semibold text-indigo-600 dark:text-cyan-400 font-mono">
                                        {typeof price === "number" ? `${formatCurrency(price)}/${billingPeriod === "annual" ? "Anual" : "Trimestral"}` : "Precio no disponible"}
                                      </p>
                                    </div>
                                  </div>
                                  <div onClick={(e) => e.stopPropagation()} className="shrink-0 pt-0.5">
                                    <Switch checked={isSelected} onCheckedChange={() => toggleExtra(extra.id)} />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                      No hay servicios sincronizados desde Stripe para este plan.
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Resumen del pedido */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
            className="xl:sticky xl:top-24 xl:h-fit"
          >
            <Card className="border-2 shadow-[0_10px_30px_rgba(15,23,42,0.14)] dark:shadow-[0_14px_36px_rgba(2,6,23,0.6)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl">Resumen del pedido</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                {shouldShowPlanSkeleton || !activePlanData ? (
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                <div className="space-y-4">
                  <motion.div
                    key={activePlanData?.name || "loading"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-medium text-sm sm:text-base">
                        Plan {activePlanData?.name || ""}{" "}
                        <Badge className="ml-1 bg-indigo-100 text-indigo-800 hover:bg-indigo-100 dark:bg-cyan-500/20 dark:text-cyan-300">
                          {billingPeriod === "annual" ? "Anual" : "Trimestral"}
                        </Badge>
                      </h3>
                      {!activePlanData?.hidePrice && (
                        <span className="font-semibold font-mono text-sm sm:text-base">
                          {billingPeriod === "annual"
                            ? `${formatCurrency(activePlanData?.annualPrice ?? 0)}/Anual`
                            : `${formatCurrency(activePlanData?.quarterlyPrice ?? 0)}/Trimestral`}
                        </span>
                      )}
                      {activePlanData?.hidePrice && (
                        <span className="text-sm text-muted-foreground">Precio personalizado</span>
                      )}
                    </div>
                    <ul className="mt-2.5 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                      {(activePlanData?.features ?? []).map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  {selectedExtras.length > 0 && (
                    <div>
                      <Separator className="my-4" />
                      <h3 className="font-medium text-sm mb-2">Extras seleccionados</h3>
                      <ul className="space-y-2">
                        {selectedExtras.map((extraId) => {
                          const extra = extrasMap.get(extraId)
                          if (!extra) return null
                          return (
                            <li
                              key={extraId}
                              className="flex items-center justify-between gap-2 text-xs sm:text-sm"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="shrink-0 rounded-full bg-indigo-100 dark:bg-cyan-500/20 p-1 text-indigo-600 dark:text-cyan-400">{getExtraIcon(extra.category)}</div>
                                <span className="truncate">{extra.name}</span>
                              </div>
                              <span className="shrink-0 font-mono">
                                {billingPeriod === "annual"
                                  ? `${formatCurrency(extra.prices?.annual?.amount ?? 0)}/Anual`
                                  : `${formatCurrency(extra.prices?.quarterly?.amount ?? 0)}/Trimestral`}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </div>
                )}
              </CardContent>
              <Separator />
              <CardFooter className="pt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between w-full">
                  <div className="font-medium text-base sm:text-lg text-slate-900 dark:text-slate-100">Total</div>
                  {!activePlanData?.hidePrice && (
                    <div className="font-bold text-lg text-slate-900 dark:text-slate-100 font-mono">
                      {formatCurrency(totalPrice)}
                      <span className="text-xs sm:text-sm font-sans font-normal text-slate-600 dark:text-slate-300">
                        /{billingPeriod === "annual" ? "Anual" : "Trimestral"}
                      </span>
                    </div>
                  )}
                  {activePlanData?.hidePrice && (
                    <span className="text-sm text-muted-foreground">Precio personalizado</span>
                  )}
                </div>

                <Button
                  className="group mt-1 h-11 w-full bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 font-semibold active:scale-[0.98]"
                  onClick={handleTrialPayment}
                  disabled={!activePlanData}
                >
                  <span className="flex items-center transition-transform duration-200 ease-out group-hover:translate-x-1">
                    {selectedPlanId === "a-medida" ? "Cotizar por WhatsApp" : "Continuar al pago"}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </span>
                </Button>

                {trialError && <p className="w-full text-sm text-red-600">{trialError}</p>}
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Barra fija inferior en móvil / tablet (xl:hidden) */}
      <div className="xl:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200/80 dark:border-slate-800 bg-background/95 backdrop-blur-lg px-4 py-3 pb-safe shadow-[0_-8px_24px_rgba(2,6,23,0.12)]">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-muted-foreground">
              {activePlanData?.name || "Plan seleccionado"}
            </p>
            {!activePlanData?.hidePrice ? (
              <p className="font-mono text-base font-extrabold text-slate-900 dark:text-slate-100">
                {formatCurrency(totalPrice)}
                <span className="ml-1 font-sans text-xs font-normal text-muted-foreground">
                  /{billingPeriod === "annual" ? "año" : "trim."}
                </span>
              </p>
            ) : (
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">A cotizar</p>
            )}
          </div>
          <Button
            className="h-11 shrink-0 bg-indigo-600 px-5 text-white hover:bg-indigo-700 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 font-semibold active:scale-[0.98]"
            onClick={handleTrialPayment}
            disabled={!activePlanData}
          >
            {selectedPlanId === "a-medida" ? "Cotizar" : "Continuar al pago"}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
