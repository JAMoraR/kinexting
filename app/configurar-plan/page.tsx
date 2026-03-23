"use client"

import { useState, useEffect, useMemo, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Check, ChevronRight, ServerIcon, Shield, Zap, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  COMPANY_NAME,
  mapCatalogPlansToPlans,
  type BillingCycle,
  type CatalogExtra,
  type Plan,
  type PricingCatalogResponse,
} from "@/lib/plans"

type PlanData = {
  id: Plan["id"]
  name: string
  monthlyPrice: number
  annualPrice: number
  features: string[]
  description: string
}

type ExtraItem = {
  id: string
  name: string
  description: string
  monthlyPrice: number
  annualPrice: number
  icon: ReactNode
}

type ExtraSection = {
  id: string
  title: string
  extras: ExtraItem[]
}

const toPlanesData = (plans: Plan[]) =>
  plans.reduce((acc, plan) => {
    acc[plan.id] = {
      id: plan.id,
      name: plan.title,
      monthlyPrice: plan.price.monthly,
      annualPrice: plan.price.annual,
      features: plan.features,
      description: plan.description,
    }
    return acc
  }, {} as Record<Plan["id"], PlanData>)

const webExtras: ExtraItem[] = [
  {
    id: "web-cdn",
    name: "CDN Premium",
    description: "Acelera la entrega de contenido en todo el mundo",
    monthlyPrice: 4.99,
    annualPrice: 3.99,
    icon: <Zap className="h-5 w-5" />,
  },
  {
    id: "web-security",
    name: "Seguridad Avanzada",
    description: "Protección contra malware y ataques DDoS",
    monthlyPrice: 5.99,
    annualPrice: 4.99,
    icon: <Shield className="h-5 w-5" />,
  },
]

const chatbotExtras: ExtraItem[] = [
  {
    id: "chatbot-messages",
    name: "Mensajes adicionales",
    description: "+500 mensajes por hora para temporadas de alta demanda",
    monthlyPrice: 8.99,
    annualPrice: 7.49,
    icon: <Plus className="h-5 w-5" />,
  },
  {
    id: "chatbot-ia-credits",
    name: "Créditos IA extra",
    description: "+$150 en créditos mensuales para respuestas avanzadas",
    monthlyPrice: 12.99,
    annualPrice: 10.99,
    icon: <Zap className="h-5 w-5" />,
  },
]

const comboExtras: ExtraItem[] = [
  {
    id: "combo-resources",
    name: "Recursos Adicionales",
    description: "+25GB SSD y +10 bases de datos",
    monthlyPrice: 7.99,
    annualPrice: 6.49,
    icon: <ServerIcon className="h-5 w-5" />,
  },
]

const domainOptions = [
  { id: "domain-1", name: "Usar un dominio que ya poseo" },
  { id: "domain-2", name: "Registrar un nuevo dominio" },
]

const PLAN_IDS: Plan["id"][] = ["landing", "chatbot", "webapp", "chatbot-webapp"]

const isPlanId = (value: string | null): value is Plan["id"] =>
  Boolean(value && PLAN_IDS.includes(value as Plan["id"]))

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

const getPlanCategory = (planId: Plan["id"]) => {
  const hasChatbot = planId.includes("chatbot")
  const hasWeb = planId === "landing" || planId.includes("webapp")

  if (hasChatbot && hasWeb) return "both"
  if (hasChatbot) return "chatbot"
  return "web"
}

const mergeExtrasWithCatalog = (baseExtras: ExtraItem[], catalogExtras: CatalogExtra[]) => {
  const catalogMap = new Map(catalogExtras.map((extra) => [extra.id, extra]))

  return baseExtras.map((extra) => {
    const catalog = catalogMap.get(extra.id)
    if (!catalog) {
      return extra
    }

    return {
      ...extra,
      name: catalog.name || extra.name,
      description: catalog.description || extra.description,
      monthlyPrice: catalog.prices?.monthly?.amount ?? extra.monthlyPrice,
      annualPrice: catalog.prices?.annual?.amount ?? extra.annualPrice,
    }
  })
}

const getExtraSectionsByPlan = (
  planId: Plan["id"],
  mergedWebExtras: ExtraItem[],
  mergedChatbotExtras: ExtraItem[],
  mergedComboExtras: ExtraItem[],
): ExtraSection[] => {
  const category = getPlanCategory(planId)

  if (category === "both") {
    return [
      { id: "web", title: "Extras para Web", extras: mergedWebExtras },
      { id: "chatbot", title: "Extras para Chatbot", extras: mergedChatbotExtras },
      { id: "combo", title: "Extras combinados", extras: mergedComboExtras },
    ]
  }

  if (category === "chatbot") {
    return [{ id: "chatbot", title: "Extras para Chatbot", extras: mergedChatbotExtras }]
  }

  return [{ id: "web", title: "Extras para Web", extras: mergedWebExtras }]
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
  const defaultPlanId = plans.find((plan) => plan.popular)?.id ?? plans[0]?.id ?? "landing"
  const planParam = searchParams.get("plan")
  const billingParam = searchParams.get("billing") || "monthly"

  const initialPlanId = isPlanId(planParam) ? planParam : defaultPlanId
  const initialPlan = planesData[initialPlanId] ?? null
  const initialBilling: BillingCycle = billingParam === "annual" ? "annual" : "monthly"

  const [selectedPlanId, setSelectedPlanId] = useState<Plan["id"]>(initialPlanId)
  const [planData, setPlanData] = useState<PlanData | null>(initialPlan)
  const [billingPeriod, setBillingPeriod] = useState<BillingCycle>(initialBilling)
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string>("")
  const [newDomain, setNewDomain] = useState<string>("")
  const [totalPrice, setTotalPrice] = useState<number>(0)

  const mergedWebExtras = useMemo(
    () => mergeExtrasWithCatalog(webExtras, catalogExtras.filter((extra) => extra.category === "web")),
    [catalogExtras],
  )
  const mergedChatbotExtras = useMemo(
    () => mergeExtrasWithCatalog(chatbotExtras, catalogExtras.filter((extra) => extra.category === "chatbot")),
    [catalogExtras],
  )
  const mergedComboExtras = useMemo(
    () => mergeExtrasWithCatalog(comboExtras, catalogExtras.filter((extra) => extra.category === "combo")),
    [catalogExtras],
  )

  const extraSections = useMemo(
    () => getExtraSectionsByPlan(selectedPlanId, mergedWebExtras, mergedChatbotExtras, mergedComboExtras),
    [selectedPlanId, mergedWebExtras, mergedChatbotExtras, mergedComboExtras],
  )
  const sortedPlanCards = useMemo(
    () =>
      Object.values(planesData).sort((a, b) => {
        const priceA = billingPeriod === "monthly" ? a.monthlyPrice : a.annualPrice
        const priceB = billingPeriod === "monthly" ? b.monthlyPrice : b.annualPrice
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
            setPlans([])
          }
          return
        }

        const payload = (await response.json()) as PricingCatalogResponse
        if (!isMounted) {
          return
        }

        setPlans(mapCatalogPlansToPlans(payload.plans))
        setCatalogExtras(Array.isArray(payload.extras) ? payload.extras : [])
      } catch {
        if (isMounted) {
          setPlans([])
          setCatalogExtras([])
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
      const validPlanId = planParam as Plan["id"]
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
    setBillingPeriod(billingParam === "annual" ? "annual" : "monthly")
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

    let price = billingPeriod === "monthly" ? activePlanData.monthlyPrice : activePlanData.annualPrice

    selectedExtras.forEach((extraId) => {
      const extra = extrasMap.get(extraId)
      if (extra) {
        price += billingPeriod === "monthly" ? extra.monthlyPrice : extra.annualPrice
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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  }

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <ServerIcon className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-bold">{COMPANY_NAME}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                Cancelar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-8 md:py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex flex-col gap-2 mb-8"
        >
          <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-indigo-600 mb-2">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver a planes
          </Link>
          <motion.h1 variants={itemVariants} className="text-3xl font-bold tracking-tight">
            Configura tu plan{" "}
            <motion.span
              initial={{ color: "#4f46e5" }}
              animate={{ color: "#6366f1" }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
              className="text-indigo-600"
            >
              {activePlanData?.name || ""}
            </motion.span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-muted-foreground">
            Personaliza tu plan de hosting y añade extras para potenciar tu experiencia.
          </motion.p>
          {/* Selector de planes */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mt-6 mb-8">
            {shouldShowPlanSkeleton
              ? [0, 1, 2, 3].map((index) => (
                  <Card key={index} className="h-full">
                    <CardContent className="p-6 space-y-3">
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
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300 }}
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
                  className={`h-full cursor-pointer transition-all ${activePlanData?.name === plan.name ? "border-2 border-indigo-600 bg-indigo-50/30" : "hover:border-indigo-300"}`}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                      {activePlanData?.name === plan.name && <Badge className="bg-indigo-600">Seleccionado</Badge>}
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-2xl font-bold">
                        {formatCurrency(billingPeriod === "monthly" ? plan.monthlyPrice : plan.annualPrice)}
                      </span>
                      <span className="text-muted-foreground">
                        /{billingPeriod === "monthly" ? "Mensual" : "Anual"}
                      </span>
                    </div>
                    <ul className="text-sm space-y-1 mt-4">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-indigo-600" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="flex items-center gap-2 text-indigo-600">
                          <Plus className="h-4 w-4" />
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

        <div className="grid gap-8 xl:grid-cols-3">
          {/* Columna principal de configuración */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="xl:col-span-2 space-y-8"
          >
            {/* Período de facturación */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Período de facturación</CardTitle>
                  <CardDescription>Elige entre facturación mensual o anual</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={billingPeriod}
                    onValueChange={(value) => setBillingPeriod(value as "monthly" | "annual")}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="monthly">
                        Mensual
                      </TabsTrigger>
                      <TabsTrigger value="annual">
                        Anual{" "}
                        <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">15% descuento</Badge>
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="monthly" className="mt-4">
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="text-sm text-muted-foreground">
                          Facturación Mensual con renovación automática.
                        </p>
                      </motion.div>
                    </TabsContent>
                    <TabsContent value="annual" className="mt-4">
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="text-sm text-muted-foreground">
                          Facturación Anual con renovación automática. Facturación con un 15% de descuento.
                        </p>
                      </motion.div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>

            {/* Extras */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Extras opcionales (Todavía falta checar esto)</CardTitle>
                  <CardDescription>
                    {getPlanCategory(selectedPlanId) === "both"
                      ? "Tu plan incluye chatbot y web. Elige extras por lista."
                      : getPlanCategory(selectedPlanId) === "chatbot"
                      ? "Tu plan es chatbot. Solo se muestran extras de chatbot."
                      : "Tu plan es web. Solo se muestran extras de web."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {extraSections.map((section) => (
                    <div key={section.id} className="space-y-3">
                      <h3 className="text-sm font-semibold text-indigo-700">{section.title}</h3>
                      {section.extras.map((extra) => (
                        <motion.div
                          key={extra.id}
                          initial={{ scale: 1 }}
                          whileHover={{ scale: 1.01 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Card
                            className={`border-2 transition-all duration-300 ${
                              selectedExtras.includes(extra.id)
                                ? "border-indigo-600 bg-indigo-50/50"
                                : "hover:border-indigo-200"
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`rounded-full p-2 ${
                                      selectedExtras.includes(extra.id)
                                        ? "bg-indigo-100 text-indigo-600"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {extra.icon}
                                  </div>
                                  <div>
                                    <h3 className="font-medium">{extra.name}</h3>
                                    <p className="text-sm text-muted-foreground">{extra.description}</p>
                                    <p className="mt-1 text-sm font-medium text-indigo-600">
                                      {billingPeriod === "monthly"
                                        ? `${formatCurrency(extra.monthlyPrice)}/Mensual`
                                        : `${formatCurrency(extra.annualPrice)}/Anual`}
                                    </p>
                                  </div>
                                </div>
                                <Switch
                                  checked={selectedExtras.includes(extra.id)}
                                  onCheckedChange={() => toggleExtra(extra.id)}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Dominio */}
            {requiresDomain && (
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Configuración de dominio (Falta consultar disponibilidad y hacer al compra de dominios)
                    </CardTitle>
                    <CardDescription>Configura el dominio para tu sitio web</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={selectedDomain} onValueChange={setSelectedDomain} className="space-y-4">
                      {domainOptions.map((option) => (
                        <div
                          key={option.id}
                          className={`flex items-center space-x-2 rounded-lg border p-4 transition-all duration-200 ${
                            selectedDomain === option.id ? "border-indigo-600 bg-indigo-50/50" : ""
                          }`}
                        >
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                            {option.name}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    {!isDomainSelectionValid && (
                      <p className="mt-3 text-sm text-red-600">Debes seleccionar una opción de dominio para continuar.</p>
                    )}

                    {selectedDomain === "domain-2" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="domain-name">Nombre de dominio</Label>
                          <div className="flex gap-2">
                            <input
                              id="domain-name"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="midominio"
                              value={newDomain}
                              onChange={(e) => setNewDomain(e.target.value)}
                            />
                            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                              <option value=".com">.com</option>
                              <option value=".es">.es</option>
                              <option value=".net">.net</option>
                              <option value=".org">.org</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>

          {/* Resumen del pedido */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
            className="xl:sticky xl:top-24 xl:h-fit"
          >
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle>Resumen del pedido</CardTitle>
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">
                        Plan {activePlanData?.name || ""}{" "}
                        <Badge className="ml-1 bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
                          {billingPeriod === "monthly" ? "Mensual" : "Anual"}
                        </Badge>
                      </h3>
                      <motion.span
                        key={`${activePlanData?.name || "loading"}-${billingPeriod}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-medium"
                      >
                        {billingPeriod === "monthly"
                          ? `${formatCurrency(activePlanData?.monthlyPrice ?? 0)}/Mensual`
                          : `${formatCurrency(activePlanData?.annualPrice ?? 0)}/Anual`}
                      </motion.span>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.ul
                        key={`features-${activePlanData?.name || "loading"}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-2 space-y-1 text-sm text-muted-foreground"
                      >
                        {(activePlanData?.features ?? []).map((feature, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-2"
                          >
                            <Check className="h-4 w-4 text-green-500" />
                            <span>{feature}</span>
                          </motion.li>
                        ))}
                      </motion.ul>
                    </AnimatePresence>
                  </motion.div>

                  {selectedExtras.length > 0 && (
                    <div>
                      <Separator className="my-4" />
                      <h3 className="font-medium mb-2">Extras seleccionados</h3>
                      <ul className="space-y-2">
                        {selectedExtras.map((extraId) => {
                          const extra = extrasMap.get(extraId)
                          if (!extra) return null
                          return (
                            <motion.li
                              key={extraId}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <div className="rounded-full bg-indigo-100 p-1 text-indigo-600">{extra.icon}</div>
                                <span>{extra.name}</span>
                              </div>
                              <span>
                                {billingPeriod === "monthly"
                                  ? `${formatCurrency(extra.monthlyPrice)}/Mensual`
                                  : `${formatCurrency(extra.annualPrice)}/Anual`}
                              </span>
                            </motion.li>
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
                  <div className="font-medium text-lg">Total</div>
                  <motion.div
                    key={totalPrice}
                    initial={{ scale: 1.1, color: "#4f46e5" }}
                    animate={{ scale: 1, color: "#000000" }}
                    transition={{ duration: 0.3 }}
                    className="font-bold text-lg"
                  >
                    {formatCurrency(totalPrice)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{billingPeriod === "monthly" ? "Mensual" : "Anual"}
                    </span>
                  </motion.div>
                </div>

                {checkoutError && <p className="w-full text-sm text-red-600">{checkoutError}</p>}

                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 mt-2"
                  onClick={handleCheckout}
                  disabled={!activePlanData || isCheckoutLoading}
                >
                  <motion.span
                    initial={{ x: 0 }}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="flex items-center"
                  >
                    {isCheckoutLoading ? "Redirigiendo..." : "Continuar al pago"}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </motion.span>
                </Button>

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleTrialPayment}
                  disabled={!activePlanData}
                >
                  Prueba
                </Button>

                {trialError && <p className="w-full text-sm text-red-600">{trialError}</p>}
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
