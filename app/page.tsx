"use client"

import type React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  CheckIcon,
  Clock,
  Database,
  Globe,
  Inbox,
  Layers,
  Menu,
  MessageSquare,
  Send,
  ServerIcon,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  Target,
  TrendingUp,
  User,
  Users,
  X,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import PricingCard from "@/components/pricing-card"
import FaqAccordion from "@/components/faq-accordion"
import Squares from '@/components/ui/reactbites/Backgrounds/Squares/Squares';
import { useIsMobile } from "@/hooks/use-mobile"
import ThemeToggle from "@/components/theme-toggle"
import { COMPANY_NAME, buildPlanLink, mapCatalogPlansToPlans, PLAN_CATEGORY, type Plan, type PlanId, type PricingCatalogResponse } from "@/lib/plans"
import Image from "next/image"

export default function Home() {
  const clientsAccessUrl = process.env.NODE_ENV === "production" ? "https://clientes.kinexting.com" : "http://localhost:3001"

  // Referencias para las secciones
  const pricingRef = useRef<HTMLElement>(null)
  const comparisonRef = useRef<HTMLElement>(null)
  const servicesRef = useRef<HTMLElement>(null)
  const crmRef = useRef<HTMLElement>(null)
  const faqRef = useRef<HTMLElement>(null)
  const contactRef = useRef<HTMLElement>(null)

  // Referencias para animaciones
  const heroRef = useRef<HTMLDivElement>(null)
  const isHeroInView = useInView(heroRef, { once: true })

  const crmHeaderRef = useRef<HTMLDivElement>(null)
  const isCrmHeaderInView = useInView(crmHeaderRef, { once: true, margin: "-100px" })

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

  const benefitsResultsRef = useRef<HTMLDivElement>(null)
  const isBenefitsResultsInView = useInView(benefitsResultsRef, { once: true, margin: "-80px" })

  const benefitsListRef = useRef<HTMLDivElement>(null)
  const isBenefitsListInView = useInView(benefitsListRef, { once: true, margin: "-80px" })

  const pricingCardsRef = useRef<HTMLDivElement>(null)
  const isPricingCardsInView = useInView(pricingCardsRef, { once: true, margin: "-80px" })

  const comparisonTableRef = useRef<HTMLDivElement>(null)
  const isComparisonTableInView = useInView(comparisonTableRef, { once: true, margin: "-80px" })

  const footerRef = useRef<HTMLElement>(null)
  const isFooterInView = useInView(footerRef, { once: true, margin: "-120px" })

  const [billingCycle, setBillingCycle] = useState<"quarterly" | "annual">("quarterly")
  const [planType, setPlanType] = useState<"chatbot" | "all">("all")
  const [plans, setPlans] = useState<Plan[]>([])
  const [isPricingLoading, setIsPricingLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isMobile = useIsMobile()

  useEffect(() => {
    let isMounted = true

    const loadPlans = async () => {
      try {
        const response = await fetch("/api/prices", { cache: "no-store" })
        if (!response.ok) {
          if (isMounted) {
            setPlans(mapCatalogPlansToPlans([]))
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
          setPlans(mapCatalogPlansToPlans([]))
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
    const category = plan.category || PLAN_CATEGORY[plan.id as PlanId] || "chatbot"
    return category === "chatbot" || category === "both"
  }).sort((a, b) => {
    const currentPriceA = billingCycle === "quarterly" ? (a.price?.quarterly ?? 0) : (a.price?.annual ?? 0)
    const currentPriceB = billingCycle === "quarterly" ? (b.price?.quarterly ?? 0) : (b.price?.annual ?? 0)
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
        top: elementRef.current.offsetTop - 70, // Ajuste para el header fijo
        behavior: "smooth",
      })
    }
  }

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.location.pathname === "/") {
      e.preventDefault();
      scrollToSection(heroRef);
    }
  };

  const handleServiceClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    type: "chatbot" | "all",
    cycle?: "quarterly" | "annual"
  ) => {
    e.preventDefault();

    setPlanType(type);
    if (cycle) {
      setBillingCycle(cycle);
    }

    scrollToSection(pricingRef);
  };

  // Variantes para animaciones con curva exponencial fuerte (--ease-out)
  const EASE_OUT_EXPO: [number, number, number, number] = [0.23, 1, 0.32, 1]

  const fadeInUpVariants = useMemo(() => ({
    hidden: { opacity: 0, y: isMobile ? 12 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: isMobile ? 0.35 : 0.5,
        ease: EASE_OUT_EXPO,
      },
    },
  }), [isMobile])

  const getServiceCardMotion = (index: number, count: number, mobile: boolean) => {
    if (mobile) {
      return {
        initial: { opacity: 0, y: 12 },
        whileInView: { opacity: 1, y: 0 },
        transition: {
          duration: 0.32,
          ease: EASE_OUT_EXPO,
          delay: index * 0.06,
        },
        viewport: { once: true, amount: 0.1 },
      }
    }

    const middleIndex = Math.floor(count / 2)
    const isMiddleCard = count % 2 === 1 && index === middleIndex
    const slideFromLeft = count % 2 === 0 ? index < count / 2 : index < middleIndex

    return {
      initial: isMiddleCard
        ? { opacity: 0, y: 24 }
        : { opacity: 0, x: slideFromLeft ? -48 : 48 },
      whileInView: { opacity: 1, x: 0, y: 0 },
      transition: {
        duration: 0.48,
        ease: EASE_OUT_EXPO,
        delay: index * 0.08,
      },
      viewport: { once: true, amount: 0.3 },
    }
  }

  const getFooterSideMotion = (side: "left" | "right", delay = 0, mobile: boolean) => ({
    initial: { opacity: 0, x: mobile ? 0 : (side === "left" ? -32 : 32) },
    whileInView: { opacity: 1, x: 0 },
    transition: {
      duration: mobile ? 0.32 : 0.48,
      ease: EASE_OUT_EXPO,
      delay,
    },
    viewport: { once: true, amount: mobile ? 0.1 : 0.3 },
  })

  const comparisonPlans = ["Plan Esencial (Nivel 1)", "Plan Omnicanal (Nivel 2)", "Solución Enterprise"] as const

  const comparisonRows = [
    {
      category: "CANALES DE ATENCIÓN CON IA",
      rows: [
        {
          label: "WhatsApp",
          values: [true, true, true],
        },
        {
          label: "Chatbot Web (Integrable con Webhook en web existente)",
          values: [false, true, true],
        },
        {
          label: "Instagram DMs y Comentarios",
          values: [false, true, true],
        },
        {
          label: "Facebook Messenger",
          values: [false, true, true],
        },
        {
          label: "Mensajería Directa en TikTok",
          values: [false, true, true],
        },
        {
          label: "Bandeja Unificada de Conversaciones",
          values: ["Solo WhatsApp", "Todas las Redes + Web", "A Medida"],
        },
      ],
    },
    {
      category: "SISTEMA CRM INTEGRADO (SIN COSTO POR USUARIO)",
      rows: [
        {
          label: "Gestión y Agenda de Citas 24/7",
          values: [true, true, true],
        },
        {
          label: "Sincronización Bidireccional con Calendario",
          values: [true, true, true],
        },
        {
          label: "Recordatorios Preventivos de Citas por WhatsApp",
          values: [true, true, true],
        },
        {
          label: "Catálogo Digital de Servicios y Productos",
          values: [true, true, true],
        },
        {
          label: "Módulo de Promociones, Campañas y Cupones",
          values: [true, true, true],
        },
        {
          label: "Gestión de Empleados, Turnos y Permisos",
          values: [true, true, true],
        },
        {
          label: "Analíticas en Tiempo Real y Tiempos de Respuesta",
          values: [true, true, true],
        },
        {
          label: "Metas y Objetivos (Semanales, Mensuales, Anuales, Indeterminadas)",
          values: [true, true, true],
        },
      ],
    },
    {
      category: "SOPORTE Y PUESTA EN MARCHA",
      rows: [
        {
          label: "Puesta en Marcha y Entrenamiento Inicial",
          values: ["Guiada", "Prioritaria", "Arquitecto Dedicado"],
        },
        {
          label: "Soporte Técnico",
          values: ["24/7 Estándar", "24/7 Prioritario", "SLA Dedicado 24/7"],
        },
        {
          label: "Usuarios y Colaboradores en CRM",
          values: ["Ilimitados", "Ilimitados", "Ilimitados"],
        },
      ],
    },
  ] as const

  const renderComparisonCell = (value: boolean | string) => {
    if (value === true) {
      return <CheckIcon className="mx-auto h-5 w-5 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.25)]" aria-hidden="true" />
    }
    if (typeof value === "string") {
      return <span className="text-sm font-medium text-slate-400/80">{value}</span>
    }

    return <X className="mx-auto h-5 w-5 text-slate-500" aria-hidden="true" />
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 elev-1">
        <div className="container flex h-16 items-center justify-between gap-2">
          <Link href="/" onClick={handleLogoClick} className="flex items-center gap-2 shrink-0">
            {isMobile ? (
              <>
                <Image
                  src="/logos/minimalBlack.png"
                  alt={COMPANY_NAME}
                  width={28}
                  height={28}
                  className="h-7 w-auto block dark:hidden"
                  priority
                />
                <Image
                  src="/logos/minimalWhite.png"
                  alt={COMPANY_NAME}
                  width={28}
                  height={28}
                  className="h-7 w-auto hidden dark:block"
                  priority
                />
                <span className="text-lg sm:text-xl font-bold tracking-tight">
                  {COMPANY_NAME}
                </span>
              </>
            ) : (
              <>
                <Image
                  src="/logos/fullBlack.png"
                  alt={COMPANY_NAME}
                  width={130}
                  height={32}
                  className="h-8 w-auto block dark:hidden"
                  priority
                />
                <Image
                  src="/logos/fullWhite.png"
                  alt={COMPANY_NAME}
                  width={130}
                  height={32}
                  className="h-8 w-auto hidden dark:block"
                  priority
                />
              </>
            )}
          </Link>
          <nav className="hidden md:flex gap-6">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.15, ease: EASE_OUT_EXPO }}
            >
              <Link
                href="#services"
                className="text-sm font-medium hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection(servicesRef)
                }}
              >
                Beneficios
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.2, ease: EASE_OUT_EXPO }}
            >
              <Link
                href="#crm"
                className="text-sm font-medium hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection(crmRef)
                }}
              >
                CRM Todo-en-Uno
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.25, ease: EASE_OUT_EXPO }}
            >
              <Link
                href="#pricing"
                className="text-sm font-medium hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection(pricingRef)
                }}
              >
                Planes
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.3, ease: EASE_OUT_EXPO }}
            >
              <Link
                href="#comparison"
                className="text-sm font-medium hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection(comparisonRef)
                }}
              >
                Comparación
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.35, ease: EASE_OUT_EXPO }}
            >
              <Link
                href="#faq"
                className="text-sm font-medium hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection(faqRef)
                }}
              >
                FAQ
              </Link>
            </motion.div>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
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
            <Link href="/checkout">
              <Button className="h-10 px-3.5 sm:px-4 text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 font-semibold active:scale-[0.97] transition-transform duration-150">
                Comenzar
              </Button>
            </Link>

            {/* Menú Móvil (Drawer) */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Abrir menú de navegación"
                  className="md:hidden h-10 w-10 shrink-0 active:scale-95 transition-transform duration-150"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(85vw,320px)] flex flex-col justify-between p-6">
                <div>
                  <SheetHeader className="text-left border-b border-border/60 pb-4">
                    <SheetTitle className="flex items-center gap-2 text-lg font-bold">
                      <Image
                        src="/logos/minimalBlack.png"
                        alt={COMPANY_NAME}
                        width={24}
                        height={24}
                        className="h-6 w-auto block dark:hidden"
                      />
                      <Image
                        src="/logos/minimalWhite.png"
                        alt={COMPANY_NAME}
                        width={24}
                        height={24}
                        className="h-6 w-auto hidden dark:block"
                      />
                      <span>{COMPANY_NAME}</span>
                    </SheetTitle>
                  </SheetHeader>

                  <nav className="mt-6 flex flex-col gap-1" aria-label="Navegación móvil">
                    {[
                      { label: "Beneficios", ref: servicesRef, href: "#services" },
                      { label: "CRM Todo-en-Uno", ref: crmRef, href: "#crm" },
                      { label: "Planes y Precios", ref: pricingRef, href: "#pricing" },
                      { label: "Comparación de Niveles", ref: comparisonRef, href: "#comparison" },
                      { label: "Preguntas Frecuentes", ref: faqRef, href: "#faq" },
                      { label: "Contacto", ref: contactRef, href: "#contact" },
                    ].map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={(e) => {
                          e.preventDefault()
                          setMobileMenuOpen(false)
                          setTimeout(() => scrollToSection(item.ref), 150)
                        }}
                        className="flex min-h-[44px] items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted active:bg-muted/80"
                      >
                        <span>{item.label}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </a>
                    ))}
                    <Link
                      href="/sobre-nosotros"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-[44px] items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <span>Sobre nosotros</span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </nav>
                </div>

                <div className="space-y-3 border-t border-border/60 pt-4 pb-safe">
                  <Link href="/checkout" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                    <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 font-semibold">
                      Contratar Ahora
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/configurar-plan" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                    <Button variant="outline" className="w-full h-11 font-medium">
                      Personalizar Plan
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <motion.section
          className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 py-12 sm:py-20 md:py-28 lg:py-32 dark:from-slate-950 dark:via-slate-900 dark:to-[#0b1222]"
        >
          {/* Squares Background */}
          <div className="absolute inset-0">
            <Squares 
              speed={0.15} 
              squareSize={60}
              direction='diagonal'
              borderColor='#fff'
              hoverFillColor='transparent'
            />
          </div>
          <div className="container relative">
            <div className="grid gap-8 md:grid-cols-2 md:gap-12 items-center">
              <div className="space-y-5 sm:space-y-6" ref={heroRef}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                  transition={{ duration: 0.45, delay: 0.05, ease: EASE_OUT_EXPO }}
                >
                  <Badge className="bg-white/10 text-white hover:bg-white/20 border-none text-xs sm:text-sm py-1 px-3">
                    Automatización con IA + Sistema CRM
                  </Badge>
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.12, ease: EASE_OUT_EXPO }}
                  className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl xl:text-6xl/none text-balance leading-[1.12]"
                >
                  Llena tu agenda y controla tu negocio con{" "}
                  <span className="text-cyan-300 [text-shadow:0_2px_10px_rgba(34,211,238,0.45)]">
                    IA y CRM Todo-en-Uno
                  </span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: EASE_OUT_EXPO }}
                  className="max-w-[600px] text-sm sm:text-base text-white/90 md:text-xl leading-relaxed"
                >
                  Automatiza tu atención en WhatsApp y Redes Sociales con Inteligencia Artificial. Centraliza citas, catálogo, empleados, analíticas y metas en una plataforma diseñada para hacer crecer tu facturación.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.28, ease: EASE_OUT_EXPO }}
                  className="flex flex-col xs:flex-row sm:flex-row flex-wrap gap-3 sm:gap-4 pt-1"
                >
                  <Link
                    href="#pricing"
                    className="w-full sm:w-auto"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToSection(pricingRef)
                    }}
                  >
                    <Button size="lg" className="w-full sm:w-auto h-12 sm:h-11 border border-white/20 bg-slate-950/80 text-white hover:bg-slate-900/90 dark:bg-slate-900/90 dark:text-white font-semibold active:scale-[0.98] transition-transform duration-150">
                      Ver Planes
                    </Button>
                  </Link>
                  <Link
                    href="#crm"
                    className="w-full sm:w-auto"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToSection(crmRef)
                    }}
                  >
                    <Button size="lg" className="w-full sm:w-auto h-12 sm:h-11 border border-cyan-200/40 bg-sky-400 font-semibold text-slate-950 shadow-[0_8px_24px_rgba(34,211,238,0.4)] hover:bg-sky-300 hover:shadow-[0_12px_30px_rgba(34,211,238,0.5)] dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 active:scale-[0.98] transition-transform duration-150">
                      Explorar CRM
                    </Button>
                  </Link>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, x: isMobile ? 0 : 40, y: isMobile ? 16 : 0 }}
                animate={isHeroInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: isMobile ? 0 : 40, y: isMobile ? 16 : 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT_EXPO }}
                className="relative mx-auto w-full max-w-[500px]"
              >
                <div className="relative rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 backdrop-blur elev-3">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex gap-1 shrink-0">
                        <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-500" />
                        <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-yellow-500" />
                        <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-500" />
                      </div>
                      <span className="truncate text-[11px] font-medium text-white/70">Atención Multicanal con IA</span>
                    </div>
                    <span className="shrink-0 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      WhatsApp + Redes
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs text-white/90 sm:text-sm">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.2 }}
                      className="flex max-w-full items-start gap-2 sm:max-w-[95%]"
                    >
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white sm:h-7 sm:w-7 mt-0.5">
                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <div className="w-fit max-w-[85%] rounded-xl bg-white/10 px-2.5 py-1.5 leading-snug sm:max-w-[90%] sm:px-3 sm:py-2">
                        Hola, ¿tienen disponibilidad mañana en la tarde y qué costo tiene?
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.45, duration: 0.2 }}
                      className="ml-auto flex max-w-full flex-row-reverse items-start gap-2 sm:max-w-[95%]"
                    >
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-300/25 text-cyan-100 sm:h-7 sm:w-7 mt-0.5">
                        <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <div className="inline-block w-auto max-w-[85%] rounded-xl bg-cyan-400/20 px-2.5 py-1.5 text-right leading-snug text-cyan-100 sm:max-w-[90%] sm:px-3 sm:py-2">
                        ¡Hola! Claro, el servicio tiene un costo de <strong>$450 MXN</strong>. Tenemos espacio disponible a las <strong>4:00 PM</strong> o <strong>5:30 PM</strong>. ¿Cuál te acomoda mejor?
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.2 }}
                      className="flex max-w-full items-start gap-2 sm:max-w-[95%]"
                    >
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white sm:h-7 sm:w-7 mt-0.5">
                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <div className="w-fit max-w-[85%] rounded-xl bg-white/10 px-2.5 py-1.5 leading-snug sm:max-w-[90%] sm:px-3 sm:py-2">
                        A las 4:00 PM por favor.
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.75, duration: 0.2 }}
                      className="ml-auto flex max-w-full flex-row-reverse items-start gap-2 sm:max-w-[95%]"
                    >
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-300/25 text-cyan-100 sm:h-7 sm:w-7 mt-0.5">
                        <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <div className="inline-block w-auto max-w-[85%] rounded-xl bg-cyan-400/20 px-2.5 py-1.5 text-right leading-snug text-cyan-100 sm:max-w-[90%] sm:px-3 sm:py-2">
                        ✓ ¡Listo! Tu cita quedó confirmada para mañana a las 4:00 PM. Te enviamos recordatorio 2 horas antes.
                      </div>
                    </motion.div>
                  </div>

                  {/* Widget CRM Live Sync */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.25 }}
                    className="mt-3 rounded-xl border border-cyan-200/50 bg-slate-950/70 p-2.5 sm:p-3 text-xs text-white shadow-lg backdrop-blur-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1 border-b border-white/10 pb-1.5 text-[11px]">
                      <span className="flex items-center gap-1.5 font-bold text-cyan-300">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>Sincronizado con CRM Kinexting</span>
                      </span>
                      <span className="text-[10px] text-white/60">Tiempo real</span>
                    </div>

                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="rounded-lg bg-white/5 p-2 flex sm:block items-center justify-between">
                        <span className="text-[10px] text-white/60 block">Cita en Calendario</span>
                        <strong className="text-white">Mañana · 4:00 PM</strong>
                      </div>
                      <div className="rounded-lg bg-white/5 p-2 flex sm:block items-center justify-between">
                        <span className="text-[10px] text-white/60 block">Meta Semanal Negocio</span>
                        <strong className="text-emerald-400">85% (34/40)</strong>
                      </div>
                    </div>
                  </motion.div>
                </div>
                <div className="pointer-events-none absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-purple-600/25 blur-2xl" />
                <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-indigo-600/25 blur-2xl" />
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Business Benefits Section - Rediseño Bento Grid Impeccable */}
        <section
          id="services"
          ref={servicesRef}
          className="relative overflow-hidden py-14 sm:py-20 md:py-32 bg-slate-50/70 dark:bg-[#060c18] border-t border-slate-200/80 dark:border-slate-800/80"
        >
          {/* Luces ambientales tenues */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="container relative z-10 mx-auto max-w-6xl">
            <div className="mb-10 sm:mb-14 text-center max-w-3xl mx-auto" ref={servicesHeaderRef}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={isServicesHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300 mb-4"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Impacto Real en tu Negocio
              </motion.div>

              <motion.h2
                variants={fadeInUpVariants}
                initial="hidden"
                animate={isServicesHeaderInView ? "visible" : "hidden"}
                className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-slate-900 dark:text-white"
              >
                Beneficios diseñados para hacer <span className="text-cyan-600 dark:text-cyan-400">crecer tu negocio</span>
              </motion.h2>

              <motion.p
                variants={fadeInUpVariants}
                initial="hidden"
                animate={isServicesHeaderInView ? "visible" : "hidden"}
                transition={{ delay: 0.12 }}
                className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300"
              >
                Automatiza la atención y convierte cada mensaje en una cita confirmada, sin saturar a tu equipo ni perder clientes por demoras.
              </motion.p>
            </div>

            {/* Bento Grid Asimétrico */}
            <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-12">
              {/* CARD 1: 7 cols - Atención 24/7 y Conversión en Vivo */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                whileHover={isMobile ? undefined : { y: -4 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white/80 p-5 sm:p-7 shadow-lg shadow-slate-200/40 backdrop-blur-xl transition-all duration-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-cyan-950/10 lg:col-span-7"
              >
                <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-gradient-to-br from-cyan-500/15 to-indigo-500/10 blur-3xl pointer-events-none" />

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                      <Zap className="h-3.5 w-3.5" />
                      Disponibilidad Total
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Respuesta Inmediata
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Atención que nunca duerme: Convierte mensajes en ventas
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    El 68% de las consultas ocurren fuera de horario comercial. Tu agente IA responde en menos de 2 segundos, califica al cliente y asegura la cita en el acto.
                  </p>
                </div>

                {/* Widget Gráfico: Simulación interactiva de WhatsApp */}
                <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-3.5 sm:p-4 shadow-inner dark:border-slate-800/80 dark:bg-slate-950/70">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Agente Kinexting en línea
                      </span>
                    </div>
                    <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                      Latencia: 1.2s
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5 text-xs">
                    {/* Mensaje del cliente */}
                    <div className="flex justify-end">
                      <div className="max-w-[88%] rounded-2xl rounded-tr-xs bg-slate-200 px-3.5 py-2 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                        <p>Hola, ¿tienen espacio para mañana en la tarde? Quiero agendar un servicio.</p>
                        <span className="mt-1 block text-right text-[9px] text-slate-400">10:42 PM</span>
                      </div>
                    </div>

                    {/* Mensaje del agente */}
                    <div className="flex justify-start">
                      <div className="max-w-[92%] rounded-2xl rounded-tl-xs bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 px-3.5 py-2 text-slate-900 dark:text-slate-100">
                        <p>
                          ¡Hola! Claro que sí. Tenemos espacios a las <strong>4:00 PM</strong> y <strong>5:30 PM</strong>. ¿Te reservo a las 4:00 PM?
                        </p>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-cyan-500/15 pt-1.5">
                          <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-700 dark:text-cyan-300">
                            ✓ Confirmar 4:00 PM
                          </span>
                          <span className="text-[9px] text-slate-400">10:42 PM · Doble check</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-200/50 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                      +45% citas captadas fuera de horario
                    </span>
                    <span>WhatsApp API Oficial</span>
                  </div>
                </div>
              </motion.div>

              {/* CARD 2: 5 cols - Agenda Automatizada & Cero Inasistencias */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: 0.08, ease: EASE_OUT_EXPO }}
                whileHover={isMobile ? undefined : { y: -4 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white/80 p-5 sm:p-7 shadow-lg shadow-slate-200/40 backdrop-blur-xl transition-all duration-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-cyan-950/10 lg:col-span-5"
              >
                <div className="absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-gradient-to-tr from-indigo-500/15 to-purple-500/10 blur-3xl pointer-events-none" />

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                      <Calendar className="h-3.5 w-3.5" />
                      Agenda Blindada
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Auto-Sync
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Agenda sincronizada y cero inasistencias
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Sincronización directa con calendario y recordatorios preventivos automáticos vía WhatsApp para reducir cancelaciones de último minuto.
                  </p>
                </div>

                {/* Widget Gráfico: Tarjeta de Cita y Calendario */}
                <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-3.5 sm:p-4 dark:border-slate-800/80 dark:bg-slate-950/70">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Cita Confirmada
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Mañana · 4:00 PM (45 min)
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Sincronizada
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-200/60 pt-3 text-xs dark:border-slate-800/60">
                    <div className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300">
                      <span>Recordatorio programado:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">2 horas antes</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300">
                      <span>Tasa de asistencia:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">+80% cumplimiento</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* CARD 3: 5 cols - Ahorro de Tiempo y Foco Operativo */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: 0.14, ease: EASE_OUT_EXPO }}
                whileHover={isMobile ? undefined : { y: -4 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white/80 p-5 sm:p-7 shadow-lg shadow-slate-200/40 backdrop-blur-xl transition-all duration-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-cyan-950/10 lg:col-span-5"
              >
                <div className="absolute -top-20 -left-20 h-52 w-52 rounded-full bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 blur-3xl pointer-events-none" />

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      <Clock className="h-3.5 w-3.5" />
                      Eficiencia Operativa
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Foco en tu Servicio
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Tu equipo enfocado en atender, no en contestar lo mismo
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Filtra automáticamente las preguntas repetitivas de precios, servicios, dirección y formas de pago, liberando decenas de horas semanales.
                  </p>
                </div>

                {/* Widget Gráfico: Métricas de Ahorro de Tiempo */}
                <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-3.5 sm:p-4 dark:border-slate-800/80 dark:bg-slate-950/70">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        ~20 hrs
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400"> / semana liberadas</span>
                    </div>
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                      87% consultas resueltas
                    </span>
                  </div>

                  {/* Barra de progreso de automatización */}
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600" />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5 pt-1 text-[10px]">
                    <span className="rounded-md bg-slate-200/70 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      ✓ Precios y menús
                    </span>
                    <span className="rounded-md bg-slate-200/70 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      ✓ Ubicación y Waze
                    </span>
                    <span className="rounded-md bg-slate-200/70 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      ✓ Formas de pago
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* CARD 4: 7 cols - Precisión Empresarial y Tono de Marca */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: 0.18, ease: EASE_OUT_EXPO }}
                whileHover={isMobile ? undefined : { y: -4 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white/80 p-5 sm:p-7 shadow-lg shadow-slate-200/40 backdrop-blur-xl transition-all duration-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-cyan-950/10 lg:col-span-7"
              >
                <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-gradient-to-bl from-cyan-500/15 to-blue-500/10 blur-3xl pointer-events-none" />

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Cero Alucinaciones
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Datos Verificados
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Entrenado con tu negocio: Respuestas exactas y tono profesional
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    El agente aprende tus políticas de cancelación, catálogo de servicios, precios y promociones. Tus clientes reciben información 100% veraz y coherente con tu identidad de marca.
                  </p>
                </div>

                {/* Widget Gráfico: Matriz de Conocimiento y Confiabilidad */}
                <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-3.5 sm:p-4 dark:border-slate-800/80 dark:bg-slate-950/70">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white p-2.5 shadow-xs dark:border-slate-800 dark:bg-slate-900/80">
                      <CheckCircle2 className="h-4 w-4 text-cyan-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          Catálogo de Precios
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Sincronizado al 100%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white p-2.5 shadow-xs dark:border-slate-800 dark:bg-slate-900/80">
                      <CheckCircle2 className="h-4 w-4 text-cyan-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          Políticas y Cancelaciones
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Reglas de negocio claras
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white p-2.5 shadow-xs dark:border-slate-800 dark:bg-slate-900/80">
                      <CheckCircle2 className="h-4 w-4 text-cyan-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          Horarios y Sucursales
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Ubicación y disponibilidad
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white p-2.5 shadow-xs dark:border-slate-800 dark:bg-slate-900/80">
                      <CheckCircle2 className="h-4 w-4 text-cyan-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          Tono de Marca Exclusivo
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Cálido y ejecutivo
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/50 pt-2 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                      Índice de precisión conversacional
                    </span>
                    <span className="font-black text-cyan-600 dark:text-cyan-400">
                      99.8%
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CRM Todo-en-Uno Section */}
        <section
          id="crm"
          ref={crmRef}
          className="relative overflow-hidden py-14 sm:py-20 md:py-32 bg-slate-900 text-white dark:bg-[#070d1a] border-t border-slate-800"
        >
          {/* Luces de fondo */}
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[300px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />
          <div className="absolute bottom-10 right-1/4 w-[450px] h-[300px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="container relative z-10 mx-auto max-w-6xl">
            <div className="mb-10 sm:mb-14 text-center max-w-3xl mx-auto" ref={crmHeaderRef}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={isCrmHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-300 mb-4"
              >
                <Layers className="h-3.5 w-3.5" />
                Sistema de Gestión Integral
              </motion.div>

              <motion.h2
                variants={fadeInUpVariants}
                initial="hidden"
                animate={isCrmHeaderInView ? "visible" : "hidden"}
                className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-white"
              >
                El CRM Todo-en-Uno que impulsa <span className="text-cyan-400">tu operación diaria</span>
              </motion.h2>

              <motion.p
                variants={fadeInUpVariants}
                initial="hidden"
                animate={isCrmHeaderInView ? "visible" : "hidden"}
                transition={{ delay: 0.12 }}
                className="mt-4 text-base sm:text-lg text-slate-300"
              >
                Sin costos adicionales por usuario. Controla citas, catálogo, empleados, promociones y objetivos desde una sola plataforma conectada en tiempo real a tus conversaciones.
              </motion.p>
            </div>

            {/* Grid Bento de Módulos CRM */}
            <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-12">
              {/* MODULO 1: Bandeja Unificada (7 cols) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                whileHover={isMobile ? undefined : { y: -4 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70 p-5 sm:p-7 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/40 lg:col-span-7"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                      <Inbox className="h-3.5 w-3.5" />
                      Bandeja Unificada
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Omnicanal
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Todos tus chats en una sola bandeja
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Centraliza mensajes de WhatsApp, Instagram, TikTok, Facebook y Chatbot Web. Tu equipo atiende sin saltar de app en app ni perder prospectos.
                  </p>
                </div>

                {/* Micro-UI: Selector de Canales y Chat Activo */}
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 sm:p-4">
                  <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-3 text-xs">
                    <span className="rounded-lg bg-cyan-500/20 px-2.5 py-1 font-bold text-cyan-300 border border-cyan-500/30">
                      Todos (29)
                    </span>
                    <span className="rounded-lg bg-white/5 px-2.5 py-1 text-slate-400">
                      WhatsApp (16)
                    </span>
                    <span className="rounded-lg bg-white/5 px-2.5 py-1 text-slate-400">
                      Instagram (8)
                    </span>
                    <span className="rounded-lg bg-white/5 px-2.5 py-1 text-slate-400">
                      TikTok (3)
                    </span>
                    <span className="rounded-lg bg-white/5 px-2.5 py-1 text-slate-400">
                      Web (2)
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/5 p-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center font-bold text-white text-[11px]">
                        IG
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">@andrea.castillo</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          &ldquo;¿Tienen cita para mañana a las 5?&rdquo;
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      ✓ Atendido por IA
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* MODULO 2: Agenda y Citas 24/7 (5 cols) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: 0.08, ease: EASE_OUT_EXPO }}
                whileHover={isMobile ? undefined : { y: -4 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70 p-5 sm:p-7 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/40 lg:col-span-5"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                      <Calendar className="h-3.5 w-3.5" />
                      Agenda Inteligente
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Calendario
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-bold tracking-tight text-white">
                    Citas y reservas sin inasistencias
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Sincronización en tiempo real y recordatorios preventivos automáticos vía WhatsApp para asegurar la llegada del cliente.
                  </p>
                </div>

                {/* Micro-UI: Citas */}
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 sm:p-4 space-y-2.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <span className="font-semibold text-white">Recordatorios automáticos</span>
                    <span className="text-emerald-400 font-bold">Activo 24/7</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1 text-slate-300">
                    <span>Aviso 24 horas antes:</span>
                    <span className="text-white font-medium">WhatsApp automatizado</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1 text-slate-300">
                    <span>Aviso 2 horas antes:</span>
                    <span className="text-white font-medium">Confirmación en 1 clic</span>
                  </div>
                </div>
              </motion.div>

              {/* MODULO 3: Catálogo de Servicios y Productos (5 cols) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: 0.12, ease: EASE_OUT_EXPO }}
                whileHover={isMobile ? undefined : { y: -4 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70 p-5 sm:p-7 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/40 lg:col-span-5"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                      <Tag className="h-3.5 w-3.5" />
                      Catálogo Digital
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Cobro Inmediato
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-bold tracking-tight text-white">
                    Servicios, precios y cobros en el chat
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Muestra tu oferta actualizada y comparte links de pago directos para que los clientes paguen o dejen anticipos al reservar.
                  </p>
                </div>

                {/* Micro-UI: Servicio Card */}
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">Corte & Tratamiento VIP</p>
                      <p className="text-[11px] text-slate-400">Duración: 50 min</p>
                    </div>
                    <span className="shrink-0 text-sm font-extrabold text-cyan-400">$650 MXN</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2 text-[11px] text-slate-400">
                    <span>Link Stripe / Transferencia</span>
                    <span className="text-emerald-400 font-semibold">✓ Listo para enviar</span>
                  </div>
                </div>
              </motion.div>

              {/* MODULO 4: Promociones y Campañas (7 cols) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: 0.16, ease: EASE_OUT_EXPO }}
                whileHover={isMobile ? undefined : { y: -4 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70 p-5 sm:p-7 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-purple-500/40 lg:col-span-7"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                      <Sparkles className="h-3.5 w-3.5" />
                      Marketing & Fidelización
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Cupones y Difusión
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Promociones y campañas segmentadas
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Crea códigos de descuento por temporada y reactiva a clientes que no han agendado en las últimas semanas con mensajes directos.
                  </p>
                </div>

                {/* Micro-UI: Campaña Activa */}
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-xs font-bold text-purple-300">
                        CUPÓN: PROMO20
                      </span>
                      <span className="text-xs text-slate-300">-20% en segunda cita</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold">Activo</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                    <span>Clientes reactivados: <strong>38 citas</strong></span>
                    <span className="text-cyan-400 font-semibold">+18.5% tasa de retorno</span>
                  </div>
                </div>
              </motion.div>

              {/* MODULO 5: Gestión de Empleados y Turnos (6 cols) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: 0.2, ease: EASE_OUT_EXPO }}
                whileHover={isMobile ? undefined : { y: -4 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70 p-5 sm:p-7 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/40 lg:col-span-6"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                      <Users className="h-3.5 w-3.5" />
                      Equipo de Trabajo
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Sin costo por usuario
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-bold tracking-tight text-white">
                    Gestión de empleados y asignación de turnos
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Asigna conversaciones automáticamente por especialidad o turno rotativo. Supervisa las conversaciones y el desempeño de tus colaboradores.
                  </p>
                </div>

                {/* Micro-UI: Lista de colaboradores */}
                <div className="mt-6 space-y-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 sm:p-4 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 shrink-0 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px]">
                        DR
                      </div>
                      <span className="font-semibold text-white truncate">Dr. Daniel Ramos (Especialista)</span>
                    </div>
                    <span className="shrink-0 text-[10px] text-emerald-400 font-bold">En turno</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 shrink-0 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                        CR
                      </div>
                      <span className="font-semibold text-white truncate">Carlos Rivera (Atención)</span>
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-400">3 chats activos</span>
                  </div>
                </div>
              </motion.div>

              {/* MODULO 6: Analíticas y Metas (Semanales, Mensuales, Anuales) (6 cols) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: 0.24, ease: EASE_OUT_EXPO }}
                whileHover={isMobile ? undefined : { y: -4 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70 p-5 sm:p-7 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/40 lg:col-span-6"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                      <Target className="h-3.5 w-3.5" />
                      Metas y Analíticas
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      En Tiempo Real
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-bold tracking-tight text-white">
                    Metas semanales, mensuales y anuales
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Define objetivos de facturación, citas y tiempos de respuesta. Monitorea el progreso con cada conversación atendida.
                  </p>
                </div>

                {/* Micro-UI: Metas */}
                <div className="mt-6 space-y-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 sm:p-4 text-xs">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-1 text-slate-300 mb-1">
                      <span>Meta Semanal: 40 Citas</span>
                      <strong className="text-cyan-400">34 / 40 (85%)</strong>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500" />
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-1 text-slate-300 mb-1">
                      <span>Meta Mensual: $120,000 MXN</span>
                      <strong className="text-emerald-400">$104,500 MXN (87%)</strong>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Section - 1 Servicio en 2 Niveles Flagship */}
        <section id="pricing" ref={pricingRef} className="border-t border-slate-200/80 bg-white py-16 md:py-24 dark:border-slate-800 dark:bg-slate-950">
          <div className="container">
            <div className="text-center mb-6 max-w-3xl mx-auto" ref={pricingHeaderRef}>
              <motion.h2
                variants={fadeInUpVariants}
                initial="hidden"
                animate={isPricingHeaderInView ? "visible" : "hidden"}
                className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-slate-900 dark:text-white"
              >
                Planes y <span className="text-indigo-600 dark:text-cyan-400">Precios Transparentes</span>
              </motion.h2>
              <motion.p
                variants={fadeInUpVariants}
                initial="hidden"
                animate={isPricingHeaderInView ? "visible" : "hidden"}
                transition={{ delay: 0.15 }}
                className="mt-3 text-base text-slate-600 dark:text-slate-300"
              >
                Elige el plan ideal para tu negocio. Facturación flexible trimestral o anual con 13% de ahorro. Todos los planes incluyen el Sistema CRM y puesta en marcha guiada.
              </motion.p>
            </div>

            <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as "quarterly" | "annual")} className="w-full max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isPricingHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex justify-center mb-10"
              >
                <TabsList className="grid w-full max-w-xs grid-cols-2">
                  <TabsTrigger value="quarterly" className="text-xs sm:text-sm">Trimestral</TabsTrigger>
                  <TabsTrigger value="annual" className="text-xs sm:text-sm">
                    Anual <span className="ml-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">(-13%)</span>
                  </TabsTrigger>
                </TabsList>
              </motion.div>

              <TabsContent value={billingCycle} className="space-y-8">
                {isPricingLoading ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
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
                  <>
                    <div ref={pricingCardsRef} className={`grid gap-6 ${getPricingGridClass(filteredPlans.length)} mx-auto`}>
                      {filteredPlans.map((plan, index) => {
                        const entrance = getServiceCardMotion(index, filteredPlans.length, isMobile)

                        return (
                          <motion.div
                            key={plan.id}
                            layout={!isMobile}
                            initial="initial"
                            whileInView="whileInView"
                            variants={{
                              initial: entrance.initial,
                              whileInView: entrance.whileInView,
                            }}
                            transition={entrance.transition}
                            viewport={entrance.viewport}
                            className={`h-full ${isMobile ? "will-change-[opacity,transform]" : ""}`}
                          >
                            <PricingCard
                              title={plan.title}
                              price={
                                billingCycle === "annual"
                                  ? (plan.price?.annual ?? 0)
                                  : (plan.price?.quarterly ?? 0)
                              }
                              period={billingCycle === "annual" ? "año" : "trimestre"}
                              description={plan.description}
                              features={plan.features}
                              differences={plan.differences}
                              buttonText={plan.buttonText}
                              buttonLink={buildPlanLink(plan.id, billingCycle)}
                              cheap={plan.id === "asistente"}
                              popular={plan.id === "recepcionista"}
                              recommended={plan.id === "recepcionista"}
                              highQuality={plan.id === "a-medida" || plan.id === "soporte-tecnico"}
                              hidePrice={plan.hidePrice}
                            />
                          </motion.div>
                        )
                      })}
                    </div>

                    {/* Tarjeta Requerimientos Especiales / Enterprise */}
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                      className="mx-auto max-w-4xl rounded-2xl border border-slate-200/80 bg-slate-50 p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900/50"
                    >
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400">
                            Requerimientos Especiales
                          </span>
                          <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                            ¿Necesitas arquitectura personalizada, múltiples sucursales o integración a ERP dedicado?
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Diseñamos soluciones personalizadas con SLA corporativo y gerente de cuenta técnico.
                          </p>
                        </div>
                        <a
                          href="https://wa.me/521234567890?text=Hola%2C%20quiero%20cotizar%20un%20plan%20a%20medida"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto shrink-0"
                        >
                          <Button variant="outline" className="w-full sm:w-auto h-11 sm:h-10 border-indigo-600/40 hover:bg-indigo-50 dark:hover:bg-slate-800">
                            Cotizar por WhatsApp
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                        </a>
                      </div>
                    </motion.div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Comparison Section */}
        <section id="comparison" ref={comparisonRef} className="bg-[#080d18] py-14 sm:py-16 md:py-24">
          <div className="container">
            <div className="text-center mb-10 sm:mb-12" ref={comparisonHeaderRef}>
              <motion.h2
                variants={fadeInUpVariants}
                initial="hidden"
                animate={isComparisonHeaderInView ? "visible" : "hidden"}
                className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl"
              >
                Comparación de <span className="text-cyan-400">Niveles</span>
              </motion.h2>
              <motion.p
                variants={fadeInUpVariants}
                initial="hidden"
                animate={isComparisonHeaderInView ? "visible" : "hidden"}
                transition={{ delay: 0.12 }}
                className="mx-auto mt-3 sm:mt-4 max-w-[700px] text-sm sm:text-base text-slate-300"
              >
                Compara las capacidades de cada nivel para elegir la solución perfecta para tu negocio.
              </motion.p>
            </div>

            {/* Mobile Card Comparison View (md:hidden) — zero horizontal scroll */}
            <div className="space-y-6 md:hidden" ref={comparisonTableRef}>
              {comparisonRows.map((category) => (
                <div
                  key={category.category}
                  className="overflow-hidden rounded-2xl border border-slate-700/60 bg-[#11182b] shadow-lg"
                >
                  <div className="border-b border-slate-700/60 bg-slate-900/80 px-4 py-3 text-xs font-bold tracking-wider text-cyan-400 uppercase">
                    {category.category}
                  </div>
                  <div className="divide-y divide-slate-800/80">
                    {category.rows.map((row) => (
                      <div key={row.label} className="p-4 space-y-2.5">
                        <p className="text-sm font-semibold text-white">{row.label}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {row.values.map((value, idx) => (
                            <div
                              key={`${row.label}-${comparisonPlans[idx]}`}
                              className={`flex flex-col items-center justify-center rounded-xl border px-2 py-2 text-center ${
                                idx === 1
                                  ? "border-cyan-500/35 bg-cyan-500/10"
                                  : "border-slate-800 bg-slate-900/70"
                              }`}
                            >
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                {idx === 0 ? "Esencial" : idx === 1 ? "Omnicanal" : "Enterprise"}
                              </span>
                              <div className="text-xs">{renderComparisonCell(value)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Full Comparison Table (hidden md:block) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
              className="hidden md:block overflow-x-auto rounded-[22px] border border-slate-600/40 bg-[#11182b] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.22)]"
            >
              <table className="min-w-[760px] w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-500/30">
                    <th className="px-5 py-5 text-left text-[15px] font-semibold text-slate-100">
                      Característica
                    </th>
                    {comparisonPlans.map((plan) => (
                      <th key={plan} className="px-5 py-5 text-center text-[15px] font-semibold text-slate-100">
                        {plan}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.flatMap((category) => [
                    <tr key={category.category}>
                      <td
                        colSpan={4}
                        className="border-b border-slate-500/20 px-5 py-4 text-[13px] font-bold tracking-wider text-cyan-400 uppercase"
                      >
                        {category.category}
                      </td>
                    </tr>,
                    ...category.rows.map((row, rowIndex) => (
                      <tr
                        key={row.label}
                        className={rowIndex % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent"}
                      >
                        <td className="border-b border-slate-500/20 px-5 py-5 text-[15px] font-medium text-slate-100">
                          {row.label}
                        </td>
                        {row.values.map((value, valueIndex) => (
                          <td
                            key={`${row.label}-${comparisonPlans[valueIndex]}`}
                            className="border-b border-slate-500/20 px-5 py-5 text-center"
                          >
                            {renderComparisonCell(value)}
                          </td>
                        ))}
                      </tr>
                    )),
                  ])}
                </tbody>
              </table>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" ref={faqRef} className="py-14 sm:py-16 md:py-24 bg-slate-50 dark:bg-[#060c18]">
          <div className="container">
            <div className="text-center mb-10 sm:mb-12" ref={faqHeaderRef}>
              <motion.h2
                variants={fadeInUpVariants}
                initial="hidden"
                animate={isFaqHeaderInView ? "visible" : "hidden"}
                className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-slate-900 dark:text-white"
              >
                Preguntas <span className="text-indigo-600 dark:text-cyan-400">Frecuentes</span>
              </motion.h2>
              <motion.p
                variants={fadeInUpVariants}
                initial="hidden"
                animate={isFaqHeaderInView ? "visible" : "hidden"}
                transition={{ delay: 0.12 }}
                className="mx-auto mt-3 sm:mt-4 max-w-[700px] text-sm sm:text-base text-muted-foreground"
              >
                Dudas comunes de barberías, salones, spas, consultorios y consultoras antes de empezar.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isFaqHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.45, delay: 0.18, ease: EASE_OUT_EXPO }}
              className="mx-auto max-w-3xl"
            >
              <FaqAccordion
                items={[
                  {
                    question: "¿Qué diferencia existe entre el Plan Esencial y el Plan Omnicanal?",
                    answer:
                      "El Plan Esencial (Nivel 1) automatiza tu atención exclusivamente en WhatsApp e incluye el Sistema CRM completo. El Plan Omnicanal (Nivel 2) expande esa misma inteligencia a todas tus redes sociales (Instagram DMs, TikTok, Facebook Messenger) y añade un Chatbot Web integrable vía Webhook en tu sitio web existente, unificando todos los mensajes en una sola bandeja para tu equipo.",
                  },
                  {
                    question: "¿Cómo se integra el Chatbot Web en mi página web existente?",
                    answer:
                      "Es sumamente rápido: te proporcionamos un webhook o un snippet de código de una sola línea listo para incrustar en cualquier plataforma (WordPress, Webflow, Shopify, React, HTML). No necesitas cambiar de servidor ni rehacer tu sitio web actual.",
                  },
                  {
                    question: "¿El sistema CRM tiene algún costo adicional por usuario o empleado?",
                    answer:
                      "No. A diferencia de otros CRMs tradicionales que cobran una tarifa por cada usuario, en Kinexting el CRM viene 100% incluido en ambos niveles. Puedes dar de alta a todos los colaboradores de tu equipo, asignar turnos y gestionar citas sin pagar licencias adicionales.",
                  },
                  {
                    question: "¿Cómo funcionan las metas (semanales, mensuales, anuales o plazo indeterminado)?",
                    answer:
                      "Puedes definir objetivos estratégicos de facturación, citas concretadas o tiempos de respuesta para tu negocio, asignándoles horizontes semanales, mensuales, anuales o de plazo abierto. El CRM actualiza el progreso en vivo con cada interacción y venta cerrada.",
                  },
                  {
                    question: "¿Tengo que cambiar mi número de WhatsApp o mis cuentas de redes actuales?",
                    answer:
                      "No. Conectamos directamente tu número actual a través de la API Oficial de WhatsApp y vinculamos tus cuentas de Instagram, Facebook y TikTok. Conservas tus seguidores, tus chats históricos y tu identidad de marca intacta.",
                  },
                ]}
              />
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 md:py-24 dark:bg-[#060c18]">
          <div className="container">
            <motion.div
              ref={ctaRef}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={isCtaInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
              className="rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 p-6 sm:p-10 md:p-12 lg:p-16 relative overflow-hidden elev-3"
            >
              <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-600/30 blur-3xl" />
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-600/30 blur-3xl" />
              <div className="relative z-10 max-w-3xl mx-auto text-center">
                <motion.h2
                  initial={{ opacity: 0, y: 16 }}
                  animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                  transition={{ duration: 0.4, delay: 0.1, ease: EASE_OUT_EXPO }}
                  className="text-2xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl"
                >
                  Comienza hoy mismo con {COMPANY_NAME}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                  transition={{ duration: 0.4, delay: 0.18, ease: EASE_OUT_EXPO }}
                  className="mt-3 sm:mt-4 text-sm sm:text-base text-white/90 md:text-xl"
                >
                  Únete a los negocios y empresas que confían en nuestra tecnología para automatizar su atención, captar más clientes y potenciar sus resultados digitales.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={isCtaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                  transition={{ duration: 0.4, delay: 0.25, ease: EASE_OUT_EXPO }}
                  className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
                >
                  <Link
                    href="#pricing"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToSection(pricingRef)
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Button size="lg" className="w-full sm:w-auto h-12 sm:h-11 border border-white/20 bg-slate-950/80 text-white hover:bg-slate-900/90 dark:bg-slate-900/90 dark:text-white font-semibold active:scale-[0.98]">
                      Ver Planes
                    </Button>
                  </Link>
                  <Link
                    href="#contact"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToSection(contactRef)
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Button size="lg" className="w-full sm:w-auto h-12 sm:h-11 bg-sky-400 text-slate-950 hover:bg-sky-300 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 font-semibold active:scale-[0.98]">
                      Contactar con ventas
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" ref={contactRef} className="py-14 sm:py-16 md:py-24 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/70 dark:border-slate-800/80">
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                viewport={{ once: true, margin: "-60px" }}
              >
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-slate-900 dark:text-white">
                  Ponte en <span className="text-indigo-600 dark:text-cyan-400">Contacto</span>
                </h2>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground">
                  ¿Tienes alguna pregunta o necesitas ayuda? Nuestro equipo está aquí para ayudarte.
                </p>
                <div className="mt-6 sm:mt-8 space-y-5 sm:space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-indigo-100 dark:bg-cyan-500/15 p-2.5 text-indigo-600 dark:text-cyan-400 shrink-0">
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
                      <h3 className="font-bold text-slate-900 dark:text-white">Teléfono</h3>
                      <a href="tel:+529986860637" className="text-muted-foreground hover:text-foreground transition-colors">
                        +52 998 686 0637
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-indigo-100 dark:bg-cyan-500/15 p-2.5 text-indigo-600 dark:text-cyan-400 shrink-0">
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
                      <h3 className="font-bold text-slate-900 dark:text-white">Soporte</h3>
                      <a href="mailto:soporte@kinexting.com" className="text-muted-foreground hover:text-foreground transition-colors break-all">
                        soporte@kinexting.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-indigo-100 dark:bg-cyan-500/15 p-2.5 text-indigo-600 dark:text-cyan-400 shrink-0">
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
                      <h3 className="font-bold text-slate-900 dark:text-white">Contacto</h3>
                      <a href="mailto:contacto@kinexting.com" className="text-muted-foreground hover:text-foreground transition-colors break-all">
                        contacto@kinexting.com
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: EASE_OUT_EXPO }}
                viewport={{ once: true, margin: "-60px" }}
                className="rounded-2xl border bg-card p-5 sm:p-6 elev-2"
              >
                <h3 className="text-xl font-bold">Envíanos un mensaje</h3>
                <form className="mt-5 sm:mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="name"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Nombre
                      </label>
                      <input
                        id="name"
                        autoComplete="name"
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 elev-1"
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 elev-1"
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="subject"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Asunto
                    </label>
                    <input
                      id="subject"
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 elev-1"
                      placeholder="Asunto de tu mensaje"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="message"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Mensaje
                    </label>
                    <textarea
                      id="message"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 elev-1"
                      placeholder="Tu mensaje"
                    />
                  </div>
                  <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]">
                    Enviar mensaje
                  </Button>
                </form>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* Componente Footer */}
      <footer className="relative border-t border-slate-800 bg-slate-900 text-white dark:border-cyan-900/40 dark:bg-gradient-to-b dark:from-[#050b17] dark:via-[#071128] dark:to-[#030712] dark:text-white dark:shadow-[0_-20px_50px_rgba(2,6,23,0.7)] pb-safe">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/45 to-transparent dark:via-cyan-300/55" />
        <div className="container py-10 sm:py-12 md:py-16 overflow-hidden">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* BLOQUE IZQUIERDO: Descripción y Redes Sociales */}
            <motion.div
              initial={getFooterSideMotion("left", 0, isMobile).initial}
              whileInView={getFooterSideMotion("left", 0, isMobile).whileInView}
              transition={getFooterSideMotion("left", 0, isMobile).transition}
              viewport={getFooterSideMotion("left", 0, isMobile).viewport}
              className="sm:col-span-2"
            >
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/logos/minimalWhite.png"
                  alt={COMPANY_NAME}
                  width={28}
                  height={28}
                  className="h-7 w-auto"
                />
                <span className="text-xl font-bold">{COMPANY_NAME}</span>
              </div>
              <p className="text-sm text-slate-400 mb-5 max-w-sm">
                Soluciones digitales y automatización para negocios locales, profesionales y empresas. Optimiza tu operación, escala tus ventas y cuenta con soporte técnico especializado siempre que lo necesites.
              </p>
              <div className="flex gap-2">
                <a
                  href="#"
                  aria-label="Facebook de Kinexting"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-800/50 text-slate-400 hover:border-cyan-500/40 hover:text-white transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="X / Twitter de Kinexting"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-800/50 text-slate-400 hover:border-cyan-500/40 hover:text-white transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="Instagram de Kinexting"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-800/50 text-slate-400 hover:border-cyan-500/40 hover:text-white transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="LinkedIn de Kinexting"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-800/50 text-slate-400 hover:border-cyan-500/40 hover:text-white transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect width="4" height="12" x="2" y="9" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              </div>
            </motion.div>

            {/* BLOQUE DERECHO - COLUMNA 1: Servicios */}
            <motion.div
              initial={getFooterSideMotion("right", 0.1, isMobile).initial}
              whileInView={getFooterSideMotion("right", 0.1, isMobile).whileInView}
              transition={getFooterSideMotion("right", 0.1, isMobile).transition}
              viewport={getFooterSideMotion("right", 0.1, isMobile).viewport}
            >
              <h3 className="font-bold mb-3 sm:mb-4">Servicios</h3>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <a
                    href="#pricing"
                    onClick={(e) => handleServiceClick(e, "all")}
                    className="inline-block py-1 text-slate-400 hover:text-white transition-colors"
                  >
                    Todos nuestros servicios
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    onClick={(e) => handleServiceClick(e, "chatbot")}
                    className="inline-block py-1 text-slate-400 hover:text-white transition-colors"
                  >
                    Chatbots Inteligentes
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    onClick={(e) => handleServiceClick(e, "all", "quarterly")}
                    className="inline-block py-1 text-slate-400 hover:text-white transition-colors"
                  >
                    Plan Trimestral
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    onClick={(e) => handleServiceClick(e, "all", "annual")}
                    className="inline-block py-1 text-slate-400 hover:text-white transition-colors"
                  >
                    Plan Anual
                  </a>
                </li>
              </ul>
            </motion.div>

            {/* BLOQUE DERECHO - COLUMNA 2: Empresa */}
            <motion.div
              initial={getFooterSideMotion("right", 0.2, isMobile).initial}
              whileInView={getFooterSideMotion("right", 0.2, isMobile).whileInView}
              transition={getFooterSideMotion("right", 0.2, isMobile).transition}
              viewport={getFooterSideMotion("right", 0.2, isMobile).viewport}
            >
              <h3 className="font-bold mb-3 sm:mb-4">Empresa</h3>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <Link href="/sobre-nosotros" className="inline-block py-1 text-slate-400 hover:text-white transition-colors">
                    Sobre nosotros
                  </Link>
                </li>
                <li>
                  <Link href="/legal/terminos-de-servicio" className="inline-block py-1 text-slate-400 hover:text-white transition-colors">
                    Términos de servicio
                  </Link>
                </li>
                <li>
                  <Link href="/legal/privacidad" className="inline-block py-1 text-slate-400 hover:text-white transition-colors">
                    Política de privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/legal/cancelacion-y-facturacion" className="inline-block py-1 text-slate-400 hover:text-white transition-colors">
                    Política de cancelación y facturación
                  </Link>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </footer>
    </div>
  )
}
