"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Check, ChevronRight, ServerIcon, Shield, Zap, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

const COMPANY_NAME = "HostingPro"

const PLANS = [
  {
    id: "basic",
    title: "Básico",
    price: { biannual: 1175.69, annual: 1959.48 },
    period: "semestre",
    description: "Ideal para sitios web personales y profesionistas.",
    features: [
      "1 Sitio web",
      "4 GB NVMe",
      "Transferencia Ilimitada",
      "1 Cuenta de correo gratis",
      "SSL Gratuito",
      "SEO Básico",
      "Google Ads",
      "Soporte 24/7",
    ],
    differences: ["Dominio gratuito", "0 Herramientas de SEO", "CDN incluido"],
    buttonText: "Elegir Básico",
    buttonLink: "/configurar-plan?plan=basic",
    cheap: true,
  },
  {
    id: "advanced",
    title: "Avanzado",
    price: { biannual: 3217.75, annual: 5362.91 },
    period: "semestre",
    description: "Idóneo para sitios web de pequeños negocios físicos.",
    features: [
      "1 Sitio web",
      "6 GB NVMe",
      "Transferencia Ilimitada",
      "1 Cuenta de correo gratis",
      "Dominio gratuito",
      "SSL Gratuito",
      "SEO Avanzado",
      "Google Ads",
      "Soporte 24/7",
    ],
    differences: ["0 Herramientas de SEO", "CDN incluido"],
    buttonText: "Elegir Avanzado",
    buttonLink: "/configurar-plan?plan=advanced",
    popular: true,
  },
  {
    id: "professional",
    title: "Profesional",
    price: { biannual: 4793.01, annual: 7988.36 },
    period: "semestre",
    description: "Perfecto para sitios web profesionales y pequeñas empresas.",
    features: [
      "3 Sitios web",
      "20 GB NVMe",
      "Transferencia ilimitada",
      "2 Cuentas de correo gratis",
      "Dominio gratuito",
      "SSL Gratuito",
      "SEO Avanzado",
      "1 Herramienta de SEO",
      "Google Ads",
      "Soporte 24/7",
    ],
    differences: ["CDN incluido"],
    buttonText: "Elegir Profesional",
    buttonLink: "/configurar-plan?plan=professional",
    recommended: true,
  },
  {
    id: "enterprise",
    title: "Empresarial",
    price: { biannual: 8038.65, annual: 13397.76 },
    period: "semestre",
    description: "Para proyectos grandes con alto tráfico y necesidades avanzadas.",
    features: [
      "Sitios web ilimitados",
      "40 GB NVMe",
      "Transferencia ilimitada",
      "3 Cuentas de correo gratis",
      "Dominio gratuito",
      "SSL Gratuito",
      "SEO Avanzado",
      "3 Herramientas de SEO",
      "Google Ads",
      "CDN incluido",
      "Soporte prioritario 24/7",
    ],
    differences: [],
    buttonText: "Elegir Empresarial",
    buttonLink: "/configurar-plan?plan=enterprise",
    highQuality: true,
  },
]

// Actualizar el objeto planesData para que coincida con la nueva estructura
const planesData = PLANS.reduce((acc, plan) => {
  acc[plan.id] = {
    name: plan.title,
    monthlyPrice: plan.price.biannual, // Precio Semestral
    annualPrice: plan.price.annual, // Precio Anual
    features: plan.features,
    description: plan.description,
  }
  return acc
}, {})

// Datos de ejemplo para los extras
const extrasData = [
  {
    id: "extra-1",
    name: "CDN Premium",
    description: "Acelera la entrega de contenido en todo el mundo",
    monthlyPrice: 4.99,
    annualPrice: 3.99,
    icon: <Zap className="h-5 w-5" />,
  },
  {
    id: "extra-2",
    name: "Seguridad Avanzada",
    description: "Protección contra malware y ataques DDoS",
    monthlyPrice: 5.99,
    annualPrice: 4.99,
    icon: <Shield className="h-5 w-5" />,
  },
  {
    id: "extra-3",
    name: "Recursos Adicionales",
    description: "+25GB SSD y +10 bases de datos",
    monthlyPrice: 7.99,
    annualPrice: 6.49,
    icon: <ServerIcon className="h-5 w-5" />,
  },
]

// Datos de ejemplo para los dominios
const domainOptions = [
  { id: "domain-1", name: "Usar un dominio que ya poseo" },
  { id: "domain-2", name: "Registrar un nuevo dominio" },
  { id: "domain-3", name: "No necesito un dominio por ahora" },
]

export default function ConfigurarPlan() {
  const searchParams = useSearchParams()
  const planParam = searchParams.get("plan") || "profesional"
  const billingParam = searchParams.get("billing") || "monthly"

  const [planData, setPlanData] = useState(planesData.professional)
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    billingParam === "annual" ? "annual" : "monthly",
  )
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string>("domain-3")
  const [newDomain, setNewDomain] = useState<string>("")
  const [totalPrice, setTotalPrice] = useState<number>(0)

  // Establecer el plan seleccionado basado en los parámetros de URL
  useEffect(() => {
    if (planParam && planesData[planParam as keyof typeof planesData]) {
      setPlanData(planesData[planParam as keyof typeof planesData])
    } else {
      setPlanData(planesData.professional)
    }
  }, [planParam])

  // Calcular el precio total cuando cambian las selecciones
  useEffect(() => {
    let price = billingPeriod === "monthly" ? planData.monthlyPrice : planData.annualPrice

    selectedExtras.forEach((extraId) => {
      const extra = extrasData.find((e) => e.id === extraId)
      if (extra) {
        price += billingPeriod === "monthly" ? extra.monthlyPrice : extra.annualPrice
      }
    })

    setTotalPrice(price)
  }, [billingPeriod, selectedExtras, planData])

  // Manejar la selección de extras
  const toggleExtra = (extraId: string) => {
    setSelectedExtras((prev) => (prev.includes(extraId) ? prev.filter((id) => id !== extraId) : [...prev, extraId]))
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
              {planData.name}
            </motion.span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-muted-foreground">
            Personaliza tu plan de hosting y añade extras para potenciar tu experiencia.
          </motion.p>
          {/* Selector de planes */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 mb-8">
            {Object.entries(planesData).map(([planKey, plan]) => (
              <motion.div
                key={planKey}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300 }}
                onClick={() => {
                  setPlanData(plan)
                  // Actualizar la URL sin recargar la página
                  const url = new URL(window.location.href)
                  url.searchParams.set("plan", planKey)
                  window.history.pushState({}, "", url)
                }}
              >
                <Card
                  className={`cursor-pointer transition-all ${planData.name === plan.name ? "border-2 border-indigo-600 bg-indigo-50/30" : "hover:border-indigo-300"}`}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                      {planData.name === plan.name && <Badge className="bg-indigo-600">Seleccionado</Badge>}
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-2xl font-bold">
                        ${billingPeriod === "monthly" ? plan.monthlyPrice : plan.annualPrice}
                      </span>
                      <span className="text-muted-foreground">
                        /{billingPeriod === "monthly" ? "Semestral" : "Anual"}
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

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Columna principal de configuración */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="lg:col-span-2 space-y-8"
          >
            {/* Período de facturación */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Período de facturación</CardTitle>
                  <CardDescription>Elige entre facturación Semestral o anual</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs
                    defaultValue={billingPeriod}
                    onValueChange={(value) => setBillingPeriod(value as "monthly" | "annual")}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="monthly">
                        Semestral{" "}
                        <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">15% descuento</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="annual">
                        Anual{" "}
                        <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">25% descuento</Badge>
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
                          Facturación Semestral con renovación automática. Facturación con un 15% de descuento.
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
                          Facturación Anual con renovación automática. Facturación con un 25% de descuento.
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
                  <CardDescription>Añade servicios adicionales a tu plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {extrasData.map((extra) => (
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
                                    ? `$${extra.monthlyPrice}/Semestral`
                                    : `$${extra.annualPrice}/Anual`}
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
                </CardContent>
              </Card>
            </motion.div>

            {/* Dominio */}
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
          </motion.div>

          {/* Resumen del pedido */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
            className="lg:sticky lg:top-24 lg:h-fit"
          >
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle>Resumen del pedido (Falta vincular pasarela de pago)</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-4">
                  <motion.div
                    key={planData.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">
                        Plan {planData.name}{" "}
                        <Badge className="ml-1 bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
                          {billingPeriod === "monthly" ? "Semestral" : "Anual"}
                        </Badge>
                      </h3>
                      <motion.span
                        key={`${planData.name}-${billingPeriod}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-medium"
                      >
                        {billingPeriod === "monthly"
                          ? `$${planData.monthlyPrice}/Semestral`
                          : `$${planData.annualPrice}/Anual`}
                      </motion.span>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.ul
                        key={`features-${planData.name}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-2 space-y-1 text-sm text-muted-foreground"
                      >
                        {planData.features.map((feature, index) => (
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
                          const extra = extrasData.find((e) => e.id === extraId)
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
                                  ? `$${extra.monthlyPrice}/Semestral`
                                  : `$${extra.annualPrice}/Semestral`}
                              </span>
                            </motion.li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </div>
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
                    ${totalPrice.toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{billingPeriod === "monthly" ? "Semestral" : "Anual"}
                    </span>
                  </motion.div>
                </div>

                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 mt-2">
                  <motion.span
                    initial={{ x: 0 }}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="flex items-center"
                  >
                    Continuar al pago <ChevronRight className="ml-1 h-4 w-4" />
                  </motion.span>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
