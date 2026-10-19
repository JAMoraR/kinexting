import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ThemeToggle from "@/components/theme-toggle"

export const metadata: Metadata = {
  title: "Sobre nosotros | Kinexting - Automatización con IA y CRM Todo-en-Uno",
  description:
    "Conoce la visión, tecnología y valores de Kinexting. Ayudamos a negocios de servicios a automatizar su atención en WhatsApp y redes sociales y centralizar su operación con un CRM integral.",
  alternates: {
    canonical: "/sobre-nosotros",
  },
}

const pillars = [
  {
    title: "Atención Conversacional con IA",
    subtitle: "WhatsApp y Redes Sociales",
    description:
      "Desarrollamos agentes inteligentes capaces de comprender preguntas frecuentes, calificar prospectos y agendar citas de forma 100% autónoma en segundos, las 24 horas del día.",
    icon: Bot,
    badge: "Canales con IA",
    gradient: "from-blue-500/10 via-indigo-500/10 to-transparent",
    border: "border-indigo-500/20",
  },
  {
    title: "Sistema CRM Todo-en-Uno",
    subtitle: "Gestión Operativa Centralizada",
    description:
      "Una plataforma intuitiva para consolidar citas, catálogo de servicios y productos, promociones, control de colaboradores, analíticas de rendimiento y seguimiento de metas semanales o anuales.",
    icon: Layers,
    badge: "Plataforma Integral",
    gradient: "from-cyan-500/10 via-teal-500/10 to-transparent",
    border: "border-cyan-500/20",
  },
  {
    title: "Implementación & Soporte Humano",
    subtitle: "Acompañamiento Continuo",
    description:
      "No dejamos el software a la deriva: configuramos tus flujos de conversación iniciales, cargamos tu catálogo y capacitamos a tu equipo para garantizar una transición fluida y medible.",
    icon: Zap,
    badge: "Servicio B2B",
    gradient: "from-purple-500/10 via-pink-500/10 to-transparent",
    border: "border-purple-500/20",
  },
  {
    title: "Transparencia & Seguridad",
    subtitle: "Infraestructura Confiable",
    description:
      "Contratación transparente con periodos trimestrales y anuales en MXN, políticas claras de cancelación y resguardo riguroso de los datos de tus clientes e historial de chat.",
    icon: ShieldCheck,
    badge: "Confianza Jurídica",
    gradient: "from-emerald-500/10 via-green-500/10 to-transparent",
    border: "border-emerald-500/20",
  },
]

const stats = [
  {
    value: "< 10s",
    label: "Tiempo de respuesta",
    subtext: "IA autónoma respondiendo dudas y agendando al instante",
    icon: Clock,
  },
  {
    value: "24 / 7",
    label: "Disponibilidad total",
    subtext: "Cero prospectos perdidos en noches, fines de semana o festivos",
    icon: Sparkles,
  },
  {
    value: "100%",
    label: "Operación centralizada",
    subtext: "Citas, catálogo, colaboradores, analíticas y chats unificados",
    icon: Target,
  },
  {
    value: "3 y 12",
    label: "Meses de contratación",
    subtext: "Planes trimestrales y anuales diseñados para resultados reales",
    icon: Calendar,
  },
]

const values = [
  {
    title: "Claridad sin rodeos",
    description:
      "Explicamos la tecnología sin tecnicismos innecesarios. Precios transparentes, alcances definidos y comunicación directa.",
    icon: CheckCircle2,
  },
  {
    title: "Precisión tecnológica",
    description:
      "Modelos de IA afinados para negocios reales: respuestas exactas, tono profesional y traspaso inmediato a un agente humano cuando es necesario.",
    icon: Cpu,
  },
  {
    title: "Orientación a resultados",
    description:
      "La meta no es tener un bot; es aumentar citas efectivas, optimizar tiempos del equipo y multiplicar la retención de clientes.",
    icon: TrendingUp,
  },
  {
    title: "Acompañamiento genuino",
    description:
      "Trabajamos como aliados tecnológicos de tu empresa, garantizando que el sistema evolucione a la par del crecimiento de tu catálogo.",
    icon: Users,
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/logos/fullBlack.png"
                alt="Kinexting"
                width={120}
                height={30}
                className="h-7 w-auto block dark:hidden transition-opacity group-hover:opacity-85"
                priority
              />
              <Image
                src="/logos/fullWhite.png"
                alt="Kinexting"
                width={120}
                height={30}
                className="h-7 w-auto hidden dark:block transition-opacity group-hover:opacity-85"
                priority
              />
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
              <Link href="/#services" className="text-muted-foreground hover:text-foreground transition-colors">
                Beneficios
              </Link>
              <Link href="/#crm" className="text-muted-foreground hover:text-foreground transition-colors">
                CRM Todo-en-Uno
              </Link>
              <Link href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Planes
              </Link>
              <Link href="/#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </Link>
              <span className="text-primary font-semibold">Sobre nosotros</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" />
                Inicio
              </Button>
            </Link>
            <Link href="/checkout">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 font-semibold text-xs">
                Comenzar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/[0.05] via-background to-background py-16 md:py-24">
        <div className="container relative z-10">
          <div className="max-w-4xl space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-none font-semibold">
                Nuestra Empresa
              </Badge>
              <span className="text-xs text-muted-foreground">· Tecnología B2B para Servicios y Clínicas</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl text-foreground">
              Construimos la tecnología que transforma la atención y la gestión de tu negocio
            </h1>

            <p className="max-w-3xl text-base leading-relaxed text-muted-foreground md:text-xl">
              En Kinexting desarrollamos soluciones de inteligencia artificial aplicada y software de gestión diseñado específicamente para negocios de servicios. Resolvemos el caos de los mensajes dispersos y agendas descoordinadas, brindando una experiencia ágil para tus clientes y control total para tu equipo.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/#pricing">
                <Button className="bg-indigo-600 hover:bg-indigo-700 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 font-semibold gap-2">
                  Ver nuestros planes
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/checkout">
                <Button variant="outline" className="font-medium">
                  Solicitar contratación
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Subtle Decorative Background Element */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl" />
      </section>

      {/* Metrics / Key Highlights */}
      <section className="border-b border-border/60 bg-card/40 py-10 md:py-14">
        <div className="container">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="border-border/70 bg-card/80 backdrop-blur shadow-sm">
                  <CardContent className="space-y-3 p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                        {stat.value}
                      </span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{stat.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{stat.subtext}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Story & Narrative Section */}
      <section className="container py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="space-y-6">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-none font-semibold">
              El problema que resolvemos
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl text-foreground">
              De chats sin responder y agendas desbordadas al control total de tu operación
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                Los negocios de servicios —desde clínicas, centros de salud y estética, hasta despachos y empresas comerciales— pierden diariamente hasta un 40% de sus potenciales clientes porque tardan horas en responder un mensaje en WhatsApp o redes sociales.
              </p>
              <p>
                Al mismo tiempo, la gestión interna suele ser un rompecabezas: citas en libretas o calendarios personales, falta de visibilidad en el rendimiento de los colaboradores y desconexión total entre las promociones que se lanzan y las ventas reales.
              </p>
              <p className="font-medium text-foreground">
                Kinexting nació para unificar ambos mundos: atención automatizada con inteligencia artificial que conversa con naturalidad en el canal favorito del cliente, vinculada en tiempo real a un CRM completo que centraliza tu operación diaria.
              </p>
            </div>
          </div>

          {/* Interactive Feature Snapshot Card */}
          <div className="relative">
            <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-background p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Ecosistema Kinexting</h4>
                    <p className="text-xs text-muted-foreground">Flujo comercial autónomo e integrado</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-xs">
                  Activo 24/7
                </Badge>
              </div>

              <div className="space-y-3 text-xs md:text-sm">
                <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/60 p-3.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 font-bold text-xs">1</span>
                  <div>
                    <strong className="text-foreground">Captación Instantánea:</strong>
                    <p className="text-muted-foreground">El cliente escribe a WhatsApp o redes. La IA responde en menos de 10 segundos, resuelve dudas con base en el catálogo y propone horarios disponibles.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/60 p-3.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500 font-bold text-xs">2</span>
                  <div>
                    <strong className="text-foreground">Sincronización Inmediata con el CRM:</strong>
                    <p className="text-muted-foreground">La cita queda reservada automáticamente en la agenda del colaborador correspondiente, evitando traslapes y enviando confirmación.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/60 p-3.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-xs">3</span>
                  <div>
                    <strong className="text-foreground">Analíticas y Metas Claras:</strong>
                    <p className="text-muted-foreground">El dueño y los administradores visualizan métricas de ventas, ocupación, efectividad de promociones y progreso hacia metas fijadas.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="border-t border-border/60 bg-muted/20 py-16 md:py-20">
        <div className="container space-y-12">
          <div className="max-w-3xl space-y-3">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-none font-semibold">
              Pilares de la Solución
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl text-foreground">
              Diseñado desde cero para la realidad operativa de tu negocio
            </h2>
            <p className="text-base text-muted-foreground">
              Cuatro cimientos tecnológicos y de servicio que aseguran continuidad, escalabilidad y rentabilidad en cada implementación.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {pillars.map((pillar) => {
              const Icon = pillar.icon
              return (
                <Card
                  key={pillar.title}
                  className={`rounded-2xl border ${pillar.border} bg-card/90 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5`}
                >
                  <CardHeader className="space-y-3 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className="text-xs font-medium">
                        {pillar.badge}
                      </Badge>
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-foreground">{pillar.title}</CardTitle>
                      <p className="text-xs font-semibold text-primary/80 mt-0.5">{pillar.subtitle}</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base leading-relaxed text-muted-foreground">{pillar.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Mission & Vision Bento */}
      <section className="container py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-2xl border-border/70 bg-gradient-to-br from-card via-card to-primary/[0.03] p-8 shadow-sm">
            <div className="space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Nuestra Misión</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Democratizar el acceso a inteligencia artificial de nivel empresarial y sistemas de gestión avanzados para negocios de servicios, eliminando fricciones operativas y permitiendo a emprendedores y directores enfocarse en entregar valor y expandir su negocio.
              </p>
            </div>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-gradient-to-br from-card via-card to-cyan-500/[0.03] p-8 shadow-sm">
            <div className="space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Nuestra Visión</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Convertirnos en el estándar tecnológico de referencia en el mundo hispanohablante para la automatización comercial omnicanal y gestión operativa B2B, reconocidos por la calidad de nuestros agentes de IA, la estabilidad de la plataforma y la cercanía de nuestro soporte.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Company Values */}
      <section className="border-t border-border/60 bg-muted/20 py-16 md:py-20">
        <div className="container space-y-12">
          <div className="max-w-3xl space-y-3">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-none font-semibold">
              Principios de Marca
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl text-foreground">
              Valores que guían cada línea de código y cada interacción
            </h2>
            <p className="text-base text-muted-foreground">
              La confianza en soluciones tecnológicas se construye con consistencia, cumplimiento riguroso y soporte transparente.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((val) => {
              const Icon = val.icon
              return (
                <Card key={val.title} className="rounded-2xl border-border/70 bg-card/90 shadow-sm transition-transform hover:-translate-y-1">
                  <CardContent className="space-y-3 p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{val.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{val.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contractual and Billing Commitment */}
      <section className="container py-16 md:py-20">
        <div className="rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card/90 to-background p-8 md:p-12 shadow-sm">
          <div className="grid gap-8 md:grid-cols-3 items-center">
            <div className="md:col-span-2 space-y-4">
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-semibold">
                Compromiso y Transparencia Contractual
              </Badge>
              <h3 className="text-2xl font-bold text-foreground md:text-3xl">
                Contratos estructurados por 3 y 12 meses, sin sorpresas
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Ofrecemos planes trimestrales y anuales en pesos mexicanos (MXN) para dar certidumbre a tu presupuesto. Cada condición de cancelación, soporte y renovación está documentada en nuestras políticas oficiales para darte absoluta tranquilidad jurídica y operativa.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground pt-2">
                <Link href="/legal/terminos-de-servicio" className="text-primary hover:underline flex items-center gap-1">
                  Términos de servicio <ArrowRight className="h-3 w-3" />
                </Link>
                <span>·</span>
                <Link href="/legal/cancelacion-y-facturacion" className="text-primary hover:underline flex items-center gap-1">
                  Política de cancelación <ArrowRight className="h-3 w-3" />
                </Link>
                <span>·</span>
                <Link href="/legal/privacidad" className="text-primary hover:underline flex items-center gap-1">
                  Privacidad de datos <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-3 justify-center">
              <Link href="/#pricing">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 font-semibold">
                  Explorar planes
                </Button>
              </Link>
              <Link href="mailto:hola@kinexting.com">
                <Button variant="outline" className="w-full">
                  Contactar al equipo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border/70 bg-gradient-to-b from-card to-background py-16 md:py-20 text-center">
        <div className="container max-w-3xl space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            ¿Listo para llevar la atención y gestión de tu empresa al siguiente nivel?
          </h2>
          <p className="text-base text-muted-foreground md:text-lg">
            Comienza hoy mismo con nuestra pasarela guiada o agenda una demostración con nuestro equipo técnico.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/checkout">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 font-semibold px-8">
                Comenzar ahora
              </Button>
            </Link>
            <Link href="/#faq">
              <Button size="lg" variant="outline">
                Preguntas frecuentes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/70 bg-card/60 py-10 text-xs text-muted-foreground">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logos/fullBlack.png"
              alt="Kinexting"
              width={100}
              height={26}
              className="h-6 w-auto block dark:hidden"
            />
            <Image
              src="/logos/fullWhite.png"
              alt="Kinexting"
              width={100}
              height={26}
              className="h-6 w-auto hidden dark:block"
            />
            <span className="text-muted-foreground/60">|</span>
            <p>© {new Date().getFullYear()} Kinexting. Todos los derechos reservados.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href="/" className="hover:text-foreground transition-colors">
              Inicio
            </Link>
            <Link href="/#pricing" className="hover:text-foreground transition-colors">
              Planes
            </Link>
            <Link href="/legal/terminos-de-servicio" className="hover:text-foreground transition-colors">
              Términos de servicio
            </Link>
            <Link href="/legal/privacidad" className="hover:text-foreground transition-colors">
              Política de privacidad
            </Link>
            <Link href="/legal/cancelacion-y-facturacion" className="hover:text-foreground transition-colors">
              Cancelación y facturación
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}