"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { Bot, CheckIcon, ServerIcon, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PricingCard from "@/components/pricing-card"
import FaqAccordion from "@/components/faq-accordion"
import Squares from '@/components/ui/reactbites/Backgrounds/Squares/Squares';
import ThemeToggle from "@/components/theme-toggle"
import { COMPANY_NAME, buildPlanLink, mapCatalogPlansToPlans, type Plan, type PricingCatalogResponse } from "@/lib/plans"

export default function Home() {
  // Referencias para las secciones
  const pricingRef = useRef<HTMLElement>(null)
  const comparisonRef = useRef<HTMLElement>(null)
  const servicesRef = useRef<HTMLElement>(null)
  const faqRef = useRef<HTMLElement>(null)
  const contactRef = useRef<HTMLElement>(null)

  // Referencias para animaciones
  const heroRef = useRef<HTMLDivElement>(null)
  const isHeroInView = useInView(heroRef, { once: true })

  const pricingHeaderRef = useRef<HTMLDivElement>(null)
  const isPricingHeaderInView = useInView(pricingHeaderRef, { once: true, margin: "-100px" })

  const comparisonHeaderRef = useRef<HTMLDivElement>(null)
  const isComparisonHeaderInView = useInView(comparisonHeaderRef, { once: true, margin: "-100px" })

  const servicesHeaderRef = useRef<HTMLDivElement>(null)
  const isServicesHeaderInView = useInView(servicesHeaderRef, { once: true, margin: "-100px" })

  const faqHeaderRef = useRef<HTMLDivElement>(null)
  const isFaqHeaderInView = useInView(faqHeaderRef, { once: true, margin: "-100px" })

  const ctaRef = useRef<HTMLDivElement>(null)
  const isCtaInView = useInView(ctaRef, { once: true, margin: "-100px" })

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
  const [planType, setPlanType] = useState<"chatbot" | "web" | "all">("all")
  const [plans, setPlans] = useState<Plan[]>([])
  const [isPricingLoading, setIsPricingLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadPlans = async () => {
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
      } catch {
        if (isMounted) {
          setPlans([])
        }
      } finally {
        if (isMounted) {
          setIsPricingLoading(false)
        }
      }
    }

    loadPlans()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredPlans = plans.filter((plan) => {
    if (planType === "all") return true
    if (planType === "chatbot") return plan.id.includes("chatbot")
    return plan.id.includes("web") || plan.id === "landing"
  }).sort((a, b) => {
    const currentPriceA = billingCycle === "monthly" ? a.price.monthly : a.price.annual
    const currentPriceB = billingCycle === "monthly" ? b.price.monthly : b.price.annual
    return currentPriceA - currentPriceB
  })

  const getPricingGridClass = (count: number) => {
    if (count <= 1) return "grid-cols-1 max-w-md"
    if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-4xl"
    if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl"
    return "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 max-w-7xl"
  }

  // Función para desplazamiento suave
  const scrollToSection = (elementRef: React.RefObject<HTMLElement | null>) => {
    if (elementRef.current) {
      window.scrollTo({
        top: elementRef.current.offsetTop - 80, // Ajuste para el header fijo
        behavior: "smooth",
      })
    }
  }

  // Variantes para animaciones
  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  }

  const staggerContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 elev-1">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, ease: "easeInOut", repeat: 0 }}
            >
              <ServerIcon className="h-6 w-6 text-indigo-600" />
            </motion.div>
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl font-bold"
            >
              {COMPANY_NAME}
            </motion.span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Link
                href="#pricing"
                className="text-sm font-medium hover:text-indigo-600 transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection(pricingRef)
                }}
              >
                Planes
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Link
                href="#comparison"
                className="text-sm font-medium hover:text-indigo-600 transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection(comparisonRef)
                }}
              >
                Comparación
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Link
                href="#services"
                className="text-sm font-medium hover:text-indigo-600 transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection(servicesRef)
                }}
              >
                Servicios
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <Link
                href="#faq"
                className="text-sm font-medium hover:text-indigo-600 transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection(faqRef)
                }}
              >
                FAQ
              </Link>
            </motion.div>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.8 }}
            >
              <Link
                href="#contact"
                className="hidden md:block"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection(contactRef)
                }}
              >
                <Button variant="outline">Contacto</Button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.9 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/configurar-plan">
                <Button className="bg-indigo-600 hover:bg-indigo-700">Comenzar</Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <motion.section
          //className="relative overflow-hidden py-24 md:py-32"
          className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 py-24 md:py-32 dark:from-slate-950 dark:via-slate-900 dark:to-[#0b1222]"
        >
          {/* Squares Background */}
          <div className="absolute inset-0">
            <Squares 
              speed={0.15} 
              squareSize={60}
              direction='diagonal' // up, down, left, right, diagonal
              borderColor='#fff'
              hoverFillColor='transparent'
            />
          </div>
          <div className="container relative">
            <div className="grid gap-8 md:grid-cols-2 md:gap-12 items-center">
              <div className="space-y-6" ref={heroRef}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <Badge className="bg-white/10 text-white hover:bg-white/20 border-none">
                    Para negocios de servicios
                  </Badge>
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-4xl font-bold tracking-tighter text-white sm:text-5xl xl:text-6xl/none"
                >
                  Llena tu agenda con
                  <br />
                    <span className="text-cyan-300 [text-shadow:0_2px_10px_rgba(34,211,238,0.45)]"> más citas</span>
                  <br />
                  y menos esfuerzo
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="max-w-[600px] text-white/90 md:text-xl"
                >
                  Sitio web, automatización y atención inteligente para barberias, salones, spas, consultorios y consultoras.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="flex flex-row flex-wrap gap-3 sm:gap-4"
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="#pricing"
                      onClick={(e) => {
                        e.preventDefault()
                        scrollToSection(pricingRef)
                      }}
                    >
                      <Button size="lg" className="border border-white/20 bg-slate-950/80 text-white hover:bg-slate-900/90 dark:bg-slate-900/90 dark:text-white">
                        Ver planes
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="border border-cyan-200/40 bg-sky-400 font-semibold text-slate-950 shadow-[0_8px_24px_rgba(34,211,238,0.4)] hover:bg-sky-300 hover:shadow-[0_12px_30px_rgba(34,211,238,0.5)] dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300">
                      Prueba gratuita
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={isHeroInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative mx-auto max-w-[500px]"
              >
                <div className="relative rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4 backdrop-blur elev-3">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <div className="flex gap-1">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 text-center text-xs text-white/60">chatbot en vivo</div>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-white/90 sm:space-y-2 sm:text-sm">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35, duration: 0.2 }}
                      className="flex max-w-full items-center gap-1.5 sm:max-w-[95%] sm:gap-2"
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white sm:h-7 sm:w-7">
                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <div className="w-fit max-w-[82%] rounded-xl bg-white/10 px-2 py-1.5 leading-snug sm:max-w-[90%] sm:px-3 sm:py-2">
                        Hola, tienen cita hoy para corte y barba?
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.2 }}
                      className="ml-auto flex max-w-full flex-row-reverse items-center gap-1.5 sm:max-w-[95%] sm:gap-2"
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/25 text-cyan-100 sm:h-7 sm:w-7">
                        <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <div className="inline-block w-auto max-w-[82%] rounded-xl bg-cyan-400/20 px-2 py-1.5 leading-snug text-cyan-100 sm:max-w-[90%] sm:px-2.5">
                        <span className="block text-right">Si, te puedo agendar a las 5:30 pm o 6:00 pm. Cual</span>
                        <span className="block text-left">prefieres?</span>
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.65, duration: 0.2 }}
                      className="flex max-w-full items-center gap-1.5 sm:max-w-[95%] sm:gap-2"
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white sm:h-7 sm:w-7">
                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <div className="w-fit max-w-[82%] rounded-xl bg-white/10 px-2 py-1.5 leading-snug sm:max-w-[90%] sm:px-3 sm:py-2">
                        6:00 pm por favor.
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.2 }}
                      className="ml-auto flex max-w-full flex-row-reverse items-center gap-1.5 sm:max-w-[95%] sm:gap-2"
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/25 text-cyan-100 sm:h-7 sm:w-7">
                        <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <div className="inline-block w-auto max-w-[82%] rounded-xl bg-cyan-400/20 px-2 py-1.5 text-right leading-snug text-cyan-100 sm:max-w-[90%] sm:px-2.5">
                        Listo, tu cita quedo confirmada para hoy 6:00 pm.
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.95, duration: 0.2 }}
                      className="flex max-w-full items-center gap-1.5 sm:max-w-[95%] sm:gap-2"
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white sm:h-7 sm:w-7">
                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <div className="w-fit max-w-[82%] rounded-xl bg-white/10 px-2 py-1.5 leading-snug sm:max-w-[90%] sm:px-3 sm:py-2">
                        Wow, que facil fue. Gracias.
                      </div>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1, duration: 0.25 }}
                    className="mt-3 rounded-xl border border-cyan-200/60 bg-gradient-to-r from-cyan-400/40 to-indigo-400/35 px-2.5 py-2 text-base text-cyan-50 shadow-[0_0_0_1px_rgba(103,232,249,0.35),0_14px_28px_rgba(14,165,233,0.3)] backdrop-blur-sm sm:px-3 sm:text-base"
                  >
                    <span className="mb-1 inline-flex rounded-full border border-cyan-100/35 bg-cyan-200/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-50">Empieza hoy</span>
                    <p>Asi de simple puede ser para tu negocio. Activa tu plan y convierte mensajes en citas.</p>
                  </motion.div>
                </div>
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                  className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-purple-600/30 blur-2xl"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                  className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-indigo-600/30 blur-2xl"
                />
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Business Benefits Section */}
        <section
          id="services"
          ref={servicesRef}
          className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950"
        >
          <div className="container">
            <div className="mb-12 text-center" ref={servicesHeaderRef}>
              <motion.h2
                variants={fadeInUpVariants}
                initial="hidden"
                animate={isServicesHeaderInView ? "visible" : "hidden"}
                className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl"
              >
                Beneficios para negocios de <span className="text-indigo-600 dark:text-indigo-400">servicios</span>
              </motion.h2>
              <motion.p
                variants={fadeInUpVariants}
                initial="hidden"
                animate={isServicesHeaderInView ? "visible" : "hidden"}
                transition={{ delay: 0.2 }}
                className="mx-auto mt-4 max-w-[700px] text-slate-600 dark:text-slate-300"
              >
                Pensado para barberias, salones, spas, consultorios y consultoras que quieren mas clientes y mejor atencion.
              </motion.p>
            </div>

            <motion.div
              variants={staggerContainerVariants}
              initial="hidden"
              animate={isServicesHeaderInView ? "visible" : "hidden"}
              className="grid gap-6 lg:grid-cols-[1.1fr_1fr]"
            >
              <motion.div variants={itemVariants}>
                <Card className="h-full rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-md shadow-[0_8px_24px_rgba(2,6,23,0.08)] transition-shadow hover:shadow-[0_12px_30px_rgba(2,6,23,0.14)] dark:border-slate-700 dark:bg-slate-900/75 dark:shadow-[0_8px_24px_rgba(2,6,23,0.38)] dark:hover:shadow-[0_12px_30px_rgba(2,6,23,0.5)]">
                  <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white">Resultados que se sienten en el dia a dia</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-300">
                      Mas citas, mejor seguimiento y una imagen profesional en cada contacto.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_16px_rgba(2,6,23,0.08)] dark:border-slate-700 dark:bg-slate-800 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_16px_rgba(2,6,23,0.3)]">
                      <p className="text-xs uppercase tracking-wide text-indigo-600 dark:text-cyan-300">Agenda</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">+Citas</p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Mas reservas desde web y WhatsApp</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_16px_rgba(2,6,23,0.08)] dark:border-slate-700 dark:bg-slate-800 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_16px_rgba(2,6,23,0.3)]">
                      <p className="text-xs uppercase tracking-wide text-indigo-600 dark:text-cyan-300">Atencion</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">+Rapida</p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Respuestas claras sin perder clientes</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_16px_rgba(2,6,23,0.08)] dark:border-slate-700 dark:bg-slate-800 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_16px_rgba(2,6,23,0.3)]">
                      <p className="text-xs uppercase tracking-wide text-indigo-600 dark:text-cyan-300">Reputacion</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">+Confianza</p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Tu marca se ve seria y profesional</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 backdrop-blur-md shadow-[0_6px_16px_rgba(2,6,23,0.08)] dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-[0_6px_16px_rgba(2,6,23,0.3)]">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">1. Te encuentran y te escriben mas</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Tu negocio aparece claro, confiable y con llamada a la accion directa.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 backdrop-blur-md shadow-[0_6px_16px_rgba(2,6,23,0.08)] dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-[0_6px_16px_rgba(2,6,23,0.3)]">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">2. Atiendes mejor sin saturarte</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Menos tiempo en tareas repetidas y mas foco en tus clientes.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 backdrop-blur-md shadow-[0_6px_16px_rgba(2,6,23,0.08)] dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-[0_6px_16px_rgba(2,6,23,0.3)]">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">3. Te recomiendan con mas facilidad</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Una experiencia profesional mejora opiniones y retorno de clientes.</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" ref={pricingRef} className="border-t border-slate-200/80 bg-white py-16 md:py-24 dark:border-slate-800 dark:bg-slate-950">
          <div className="container">
            <div className="text-center mb-4" ref={pricingHeaderRef}>
              <motion.h2
                variants={fadeInUpVariants}
                initial="hidden"
                animate={isPricingHeaderInView ? "visible" : "hidden"}
                className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl"
              >
                Nuestros <span className="text-indigo-600">Planes</span>
              </motion.h2>
            </div>
            <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as "monthly" | "annual")} className="w-full max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isPricingHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex justify-center"
              >
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="monthly" className="text-xs sm:text-sm">Mensual</TabsTrigger>
                  <TabsTrigger value="annual" className="text-xs sm:text-sm">Anual (15% descuento)</TabsTrigger>
                </TabsList>
              </motion.div>
              <Tabs value={planType} onValueChange={(value) => setPlanType(value as "chatbot" | "web" | "all")} className="w-full max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isPricingHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="flex justify-center mb-8"
                >
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="chatbot" className="text-xs sm:text-sm">Chatbot</TabsTrigger>
                    <TabsTrigger value="web" className="text-xs sm:text-sm">Web</TabsTrigger>
                    <TabsTrigger value="all" className="text-xs sm:text-sm">Todo</TabsTrigger>
                  </TabsList>
                </motion.div>
              </Tabs>
              <TabsContent value={billingCycle} className="space-y-4">
                {isPricingLoading ? (
                  <div className={`grid gap-6 mx-auto w-full ${getPricingGridClass(4)}`}>
                    {[0, 1, 2, 3].map((index) => (
                      <Card key={index} className="h-full">
                        <CardHeader className="space-y-3">
                          <Skeleton className="h-6 w-24" />
                          <Skeleton className="h-9 w-28" />
                          <Skeleton className="h-4 w-full" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-5/6" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-10 w-full mt-6" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    variants={staggerContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className={`grid gap-6 mx-auto w-full ${getPricingGridClass(filteredPlans.length)}`}
                  >
                    <AnimatePresence mode="popLayout">
                      {filteredPlans.map((plan) => (
                        <motion.div
                          key={plan.id}
                          layout
                          variants={itemVariants}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          transition={{ duration: 0.3 }}
                          className="h-full"
                        >
                          <PricingCard
                            title={plan.title}
                            price={billingCycle === "monthly" ? plan.price.monthly : plan.price.annual}
                            period={billingCycle === "monthly" ? "mensual" : "anual"}
                            description={plan.description}
                            features={plan.features}
                            differences={plan.differences}
                            buttonText={plan.buttonText}
                            buttonLink={buildPlanLink(plan.id, billingCycle)}
                            cheap={plan.cheap}
                            popular={plan.popular}
                            recommended={plan.recommended}
                            highQuality={plan.highQuality}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Comparison Section */}
        <section id="comparison" ref={comparisonRef} className="py-16 md:py-24">
          <div className="container">
            <div className="text-center mb-12" ref={comparisonHeaderRef}>
              <motion.h2
                variants={fadeInUpVariants}
                initial="hidden"
                animate={isComparisonHeaderInView ? "visible" : "hidden"}
                className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl"
              >
                Comparación de <span className="text-indigo-600">Planes</span>
              </motion.h2>
              <motion.p
                variants={fadeInUpVariants}
                initial="hidden"
                animate={isComparisonHeaderInView ? "visible" : "hidden"}
                transition={{ delay: 0.2 }}
                className="mx-auto mt-4 max-w-[700px] text-muted-foreground"
              >
                Compara nuestros planes para encontrar el que mejor se adapte a tus necesidades.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isComparisonHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 p-2 elev-2 dark:border-slate-700 dark:bg-slate-900/70"
            >
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-4 px-4 text-left">Características</th>
                    {plans.map((plan) => (
                      <th key={plan.id} className="py-4 px-4 text-center">
                        {plan.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Sitios web */}
                  <tr className="border-b">
                    <td className="py-4 px-4 font-medium">Sitios web</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="py-4 px-4 text-center">
                        {plan.features.find((feature) => feature.toLowerCase().includes("sitio web") || feature.toLowerCase().includes("sitios web")) || "-"}
                      </td>
                    ))}
                  </tr>

                  {/* Almacenamiento */}
                  <tr className="border-b">
                    <td className="py-4 px-4 font-medium">Almacenamiento</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="py-4 px-4 text-center">
                        {plan.features.find((feature) => feature.includes("GB NVMe")) || "-"}
                      </td>
                    ))}
                  </tr>

                  {/* Google Ads */}
                  <tr className="border-b">
                    <td className="py-4 px-4 font-medium">Google Ads</td>
                    {plans.map(() => (
                      <td key={Math.random()} className="py-4 px-4 text-center">
                        Personalizado
                      </td>
                    ))}
                  </tr>

                  {/* Herramientas de SEO */}
                  <tr className="border-b">
                    <td className="py-4 px-4 font-medium">Herramientas de SEO</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="py-4 px-4 text-center">
                        {plan.features.find((feature) => feature.includes("Herramienta de SEO") || feature.includes("Herramientas de SEO")) || "0"}
                      </td>
                    ))}
                  </tr>

                  {/* SSL */}
                  <tr className="border-b">
                    <td className="py-4 px-4 font-medium">SSL</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="py-4 px-4 text-center">
                        {plan.features.includes("SSL Gratuito") ? (
                          <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          "-"
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Soporte */}
                  <tr className="border-b">
                    <td className="py-4 px-4 font-medium">Soporte</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="py-4 px-4 text-center">
                        {plan.id === "chatbot-webapp"
                          ? "Prioritario"
                          : plan.features.includes("Soporte 24/7")
                          ? "24/7"
                          : "-"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" ref={faqRef} className="py-16 md:py-24 bg-slate-50">
          <div className="container">
            <div className="text-center mb-12" ref={faqHeaderRef}>
              <motion.h2
                variants={fadeInUpVariants}
                initial="hidden"
                animate={isFaqHeaderInView ? "visible" : "hidden"}
                className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl"
              >
                Preguntas <span className="text-indigo-600">Frecuentes</span>
              </motion.h2>
              <motion.p
                variants={fadeInUpVariants}
                initial="hidden"
                animate={isFaqHeaderInView ? "visible" : "hidden"}
                transition={{ delay: 0.2 }}
                className="mx-auto mt-4 max-w-[700px] text-muted-foreground"
              >
                Dudas comunes de barberias, salones, spas, consultorios y consultoras antes de empezar.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isFaqHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mx-auto max-w-3xl"
            >
              <FaqAccordion
                items={[
                  {
                    question: "¿Esto tambien funciona para mi tipo de negocio?",
                    answer:
                      "Si atiendes clientes por cita o mensaje, si. Esta solucion esta pensada para barberias, salones, spas, consultorios y consultoras que necesitan mas visibilidad, mas contacto y mejor seguimiento.",
                  },
                  {
                    question: "¿En cuanto tiempo puedo empezar a recibir clientes?",
                    answer:
                      "En la mayoria de los casos puedes salir rapido con una version inicial y luego optimizar. El objetivo es que empieces a captar contactos cuanto antes.",
                  },
                  {
                    question: "¿Me ayudan con WhatsApp, formularios y seguimiento?",
                    answer:
                      "Si. Se puede conectar todo para que los mensajes lleguen de forma clara y no se pierdan oportunidades. La idea es que cada uno de tus clientes tenga una ruta sencilla para agendar o pedir informacion.",
                  },
                  {
                    question: "¿Puedo usar mi dominio actual o mis redes actuales?",
                    answer:
                      "Claro. Si ya tienes dominio o presencia en redes, se integra. No necesitas empezar desde cero para mejorar tu presencia digital.",
                  },
                  {
                    question: "¿Que pasa si no tengo fotos, textos o estructura?",
                    answer:
                      "No hay problema. Te guiamos con una estructura clara para mostrar servicios, precios, ubicacion y formas de contacto. Avanzas aunque no tengas todo listo desde el dia uno.",
                  },
                  {
                    question: "¿Hay contratos forzosos o permanencia?",
                    answer:
                      "No necesitas atarte a largo plazo para probar. Puedes escalar conforme tu negocio crece y adaptar el plan segun tus resultados.",
                  },
                ]}
              />
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container">
            <motion.div
              ref={ctaRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isCtaInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6 }}
              className="rounded-xl bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 p-8 md:p-12 lg:p-16 relative overflow-hidden elev-3"
            >
              <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 8,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
                className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-600/30 blur-3xl"
              />
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 10,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
                className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-600/30 blur-3xl"
              />
              <div className="relative z-10 max-w-3xl mx-auto text-center">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl"
                >
                  Comienza hoy mismo con {COMPANY_NAME}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mt-4 text-white/90 md:text-xl"
                >
                  Únete a miles de desarrolladores y empresas que confían en nosotros para sus proyectos web.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="#pricing"
                      onClick={(e) => {
                        e.preventDefault()
                        scrollToSection(pricingRef)
                      }}
                    >
                      <Button size="lg" className="border border-white/20 bg-slate-950/80 text-white hover:bg-slate-900/90 dark:bg-slate-900/90 dark:text-white">
                        Ver planes
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="#contact"
                      onClick={(e) => {
                        e.preventDefault()
                        scrollToSection(contactRef)
                      }}
                    >
                      <Button size="lg"  className="bg-sky-400 text-slate-950 hover:bg-sky-300 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 font-semibold">
                        Contactar con ventas
                      </Button>
                    </Link>
                  </motion.div>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={isCtaInView ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="mt-6 text-sm text-white/80"
                >
                  Sin contratos a largo plazo. Cancela cuando quieras.
                </motion.p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" ref={contactRef} className="py-16 md:py-24 bg-slate-50">
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Ponte en <span className="text-indigo-600">Contacto</span>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  ¿Tienes alguna pregunta o necesitas ayuda? Nuestro equipo está aquí para ayudarte.
                </p>
                <div className="mt-8 space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-4"
                  >
                    <div className="rounded-full bg-indigo-100 p-2 text-indigo-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.1 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.1 4.18 2 2 0 0 1 4.12 2h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.05 12.05 0 0 0 2.81.7 2 2 0 0 1 1.72 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold">Teléfono</h3>
                      <p className="text-muted-foreground">+52 983 308 9883</p>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-4"
                  >
                    <div className="rounded-full bg-indigo-100 p-2 text-indigo-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold">Soporte</h3>
                      <p className="text-muted-foreground">soporte@kinexting.com</p>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-4"
                  >
                    <div className="rounded-full bg-indigo-100 p-2 text-indigo-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold">Contacto</h3>
                      <p className="text-muted-foreground">contacto@kinexting.com</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
                className="rounded-xl border bg-card p-6 elev-2"
              >
                <h3 className="text-xl font-bold">Envíanos un mensaje</h3>
                <form className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      viewport={{ once: true }}
                      className="space-y-2"
                    >
                      <label
                        htmlFor="name"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Nombre
                      </label>
                      <input
                        id="name"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 elev-1"
                        placeholder="Tu nombre"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                      viewport={{ once: true }}
                      className="space-y-2"
                    >
                      <label
                        htmlFor="email"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 elev-1"
                        placeholder="tu@email.com"
                      />
                    </motion.div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    viewport={{ once: true }}
                    className="space-y-2"
                  >
                    <label
                      htmlFor="subject"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Asunto
                    </label>
                    <input
                      id="subject"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 elev-1"
                      placeholder="Asunto de tu mensaje"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                    viewport={{ once: true }}
                    className="space-y-2"
                  >
                    <label
                      htmlFor="message"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Mensaje
                    </label>
                    <textarea
                      id="message"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 elev-1"
                      placeholder="Tu mensaje"
                    />
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 }}
                    viewport={{ once: true }}
                  >
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Enviar mensaje</Button>
                  </motion.div>
                </form>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative mt-16 border-t border-slate-800 bg-slate-900 text-white dark:border-cyan-900/40 dark:bg-gradient-to-b dark:from-[#050b17] dark:via-[#071128] dark:to-[#030712] dark:text-white dark:shadow-[0_-20px_50px_rgba(2,6,23,0.7)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/45 to-transparent dark:via-cyan-300/55" />
        <div className="container py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5"
          >
            <div className="col-span-1 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <ServerIcon className="h-6 w-6 text-indigo-400" />
                <span className="text-xl font-bold">{COMPANY_NAME}</span>
              </div>
              <p className="text-slate-400 mb-4 max-w-xs">
                Soluciones de hosting profesional para profesionistas, desarrolladores y empresas. Rendimiento, seguridad y soporte
                técnico 24/7.
              </p>
              <div className="flex gap-4">
                <motion.a
                  whileHover={{ scale: 1.1, color: "#ffffff" }}
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1, color: "#ffffff" }}
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  </svg>
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1, color: "#ffffff" }}
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1, color: "#ffffff" }}
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect width="4" height="12" x="2" y="9" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </motion.a>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-4">Servicios</h3>
              <ul className="space-y-2">
                <motion.li whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    Hosting Web
                  </a>
                </motion.li>
                <motion.li whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    Dominios
                  </a>
                </motion.li>
                <motion.li whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    Correos
                  </a>
                </motion.li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Empresa</h3>
              <ul className="space-y-2">
                <motion.li whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    Sobre nosotros
                  </a>
                </motion.li>
                <motion.li whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    Prensa
                  </a>
                </motion.li>
                <motion.li whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    Contacto
                  </a>
                </motion.li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Soporte</h3>
              <ul className="space-y-2">
                <motion.li whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    Centro de ayuda
                  </a>
                </motion.li>
                <motion.li whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    Estado del sistema
                  </a>
                </motion.li>
                <motion.li whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    Tutoriales
                  </a>
                </motion.li>
              </ul>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4"
          >
            <p className="text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} {COMPANY_NAME}. Todos los derechos reservados.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                Términos de servicio
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                Política de privacidad
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                Cookies
              </a>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}