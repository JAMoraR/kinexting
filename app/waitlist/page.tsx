import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CalendarCheck2, Check, CreditCard, Globe2, Lightbulb, MessageSquare, Sparkles, Users } from "lucide-react"
import ThemeToggle from "@/components/theme-toggle"
import { gestorFaqs } from "@/lib/seo"
import StructuredData from "@/components/structured-data"
import WaitlistForm from "@/components/waitlist-form"

const title = "Asistente de WhatsApp con IA y CRM | Plan gestor de Kinexting"
const description = "Plan gestor, próximamente: asistente de WhatsApp con IA, agenda automática, CRM, página web, cobros y validador de ideas. Únete a la lista de espera."
export const metadata: Metadata = {
  title, description,
  alternates: { canonical: "/waitlist" },
  robots: { index: true, follow: true },
  openGraph: { title, description, url: "/waitlist" },
  twitter: { title, description },
}

const features = [
  { icon: MessageSquare, label: "01 / CONVERSA", title: "Asistente de WhatsApp con la voz de tu marca", text: "Un asistente en WhatsApp que atiende al instante, a cualquier hora. Conoce tus precios, sigue tus reglas y responde objeciones con el tono y las palabras de tu marca." },
  { icon: CalendarCheck2, label: "02 / AGENDA", title: "Agenda automática de citas", text: "Consulta tus horarios disponibles y agenda directamente en tu calendario interno. Evita el ir y venir de mensajes y reduce cancelaciones y tiempos muertos." },
  { icon: Users, label: "03 / ORGANIZA", title: "CRM para prospectos y ventas", text: "Ve quién pidió informes, quién está por comprar y quién ya es cliente. Dale seguimiento a cada oportunidad desde un panel claro, sin perderte entre chats." },
  { icon: Globe2, label: "04 / PUBLICA", title: "Página web y catálogo con chat en vivo", text: "Crea una página profesional y un catálogo de servicios en minutos, conversando con la plataforma. Su chat en vivo comparte el mismo asistente de tu WhatsApp." },
  { icon: CreditCard, label: "05 / COBRA", title: "Cobros y suscripciones integrados", text: "Comparte tu catálogo de servicios o membresías y recibe pagos con cobros y suscripciones integrados. Todo directo, ordenado y en un mismo lugar." },
  { icon: Lightbulb, label: "06 / VALIDA", title: "Validador de ideas de negocio", text: "Explora el potencial de una idea a partir de los intereses actuales del mercado. Encuentra señales de demanda y toma decisiones con más información antes de invertir." },
]

export default function WaitlistPage() {
  return <div className="min-h-screen bg-background text-foreground">
    <a href="#registro" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-background focus:p-4">Ir al registro</a>
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Kinexting, inicio"><Image src="/logos/fullBlack.png" alt="Kinexting" width={130} height={32} priority className="h-8 w-auto dark:hidden" /><Image src="/logos/fullWhite.png" alt="Kinexting" width={130} height={32} priority className="hidden h-8 w-auto dark:block" /></Link>
        <div className="flex items-center gap-3 sm:gap-6"><a href="#beneficios" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block">Conoce el plan</a><ThemeToggle /><a href="#registro" className="rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300">Reservar mi lugar</a></div>
      </div>
    </header>
    <StructuredData data={{ "@context": "https://schema.org", "@type": "WebPage", "@id": "https://www.kinexting.com/waitlist#page", url: "https://www.kinexting.com/waitlist", name: title, description, inLanguage: "es-MX", about: { "@type": "Service", name: "Plan gestor", description, provider: { "@id": "https://www.kinexting.com/#organization" } } }} />
    <main>
      <section className="relative isolate overflow-hidden border-b">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.12),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(34,211,238,0.10),transparent_60%)]" />
        <div className="container grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300"><Sparkles className="h-3.5 w-3.5" />EN CAMINO · PLAN GESTOR</span>
            <h1 className="mt-7 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">Asistente de WhatsApp con IA.<br /><span className="text-indigo-600 dark:text-cyan-400">Tu negocio, conectado.</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">Imagina que tu WhatsApp atiende, tu agenda se llena y tus ventas se ordenan. Todo con un asistente que habla como tú.</p>
            <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">Estamos creando el <strong className="font-semibold text-foreground">Plan gestor</strong>: una plataforma en preparación para negocios de servicios que reunirá un asistente de WhatsApp con inteligencia artificial, agenda automática, CRM para prospectos y ventas, página web con catálogo, cobros y suscripciones, y un validador de ideas.</p>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium">{["Atención 24/7", "Con la voz de tu marca", "Todo conectado"].map(item => <span key={item} className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-indigo-600 dark:text-cyan-400" />{item}</span>)}</div>
            <div className="mt-10 rounded-xl border border-indigo-200/80 bg-indigo-50/70 p-5 dark:border-cyan-400/20 dark:bg-cyan-400/5"><p className="text-sm font-semibold text-indigo-700 dark:text-cyan-300">LLEGAR ANTES TIENE SUS BENEFICIOS</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Únete hoy y recibe un precio especial de lanzamiento: <strong className="text-foreground">1 mes gratis en la suscripción trimestral</strong> o <strong className="text-foreground">3 meses gratis en la anual.</strong></p></div>
          </div>
          <div id="registro" className="scroll-mt-24 rounded-2xl border bg-card p-6 elev-2 sm:p-8">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-cyan-400">Tu siguiente paso</span><h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Haz espacio para lo que viene.</h2><p className="mb-7 mt-3 leading-relaxed text-muted-foreground">Reserva tu lugar. Te avisaremos cuando lancemos el Plan gestor y podrás aprovechar tu beneficio.</p>
            <WaitlistForm />
          </div>
        </div>
      </section>
      <section id="beneficios" className="container scroll-mt-16 py-16 sm:py-24">
        <div className="mb-12 max-w-2xl"><p className="text-sm font-semibold text-indigo-600 dark:text-cyan-400">MENOS PENDIENTES. MÁS NEGOCIO.</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Del primer “hola” a tu próxima gran idea.</h2><p className="mt-4 text-lg leading-relaxed text-muted-foreground">Seis herramientas que trabajan juntas para que puedas dedicarte a lo que mejor haces.</p></div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{features.map(({ icon: Icon, label, title, text }) => <article key={label} className="rounded-xl border bg-card p-6 elev-1 sm:p-7"><div className="mb-7 flex items-center justify-between gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-cyan-400/10 dark:text-cyan-400"><Icon className="h-5 w-5" aria-hidden="true" /></span><span className="text-[10px] font-semibold tracking-widest text-muted-foreground">{label}</span></div><h3 className="text-xl font-semibold tracking-tight">{title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p></article>)}</div>
      </section>
      <section className="border-y bg-muted/40">
        <div className="container py-16 sm:py-20"><div className="grid items-center gap-10 lg:grid-cols-2"><div><span className="text-sm font-semibold text-indigo-600 dark:text-cyan-400">UN BENEFICIO POR SER DE LOS PRIMEROS</span><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Tu lugar hoy.<br />Meses gratis al comenzar.</h2><p className="mt-4 max-w-md leading-relaxed text-muted-foreground">Elige tu suscripción cuando lancemos. Registrarte ahora es gratis y no te obliga a contratar.</p></div><div className="grid gap-4 sm:grid-cols-2">{[{ period: "Suscripción trimestral", months: "1 mes", detail: "gratis en tu suscripción trimestral" }, { period: "Suscripción anual", months: "3 meses", detail: "gratis en tu suscripción anual" }].map(offer => <div key={offer.period} className="rounded-xl border bg-card p-6"><p className="text-sm font-medium text-muted-foreground">{offer.period}</p><p className="mt-5 text-4xl font-extrabold tracking-tight text-indigo-600 dark:text-cyan-400">{offer.months}</p><p className="mt-2 text-sm text-muted-foreground">{offer.detail}</p></div>)}</div></div><p className="mt-8 text-sm text-muted-foreground">Beneficio exclusivo para personas registradas en esta lista antes del lanzamiento. Los precios y la fecha de disponibilidad se comunicarán al abrir el plan. Plan gestor es un nombre provisional.</p></div>
      </section>
      <section aria-labelledby="preguntas-plan" className="container py-16 sm:py-20">
        <h2 id="preguntas-plan" className="text-3xl font-bold tracking-tight">Preguntas sobre el Plan gestor</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">{gestorFaqs.map(({ question, answer }) => <article key={question} className="rounded-xl border bg-card p-6"><h3 className="text-lg font-semibold">{question}</h3><p className="mt-3 leading-relaxed text-muted-foreground">{answer}</p></article>)}</div>
        <p className="mt-8 text-muted-foreground">¿Buscas otras soluciones para tu negocio? <Link href="/#pricing" className="underline underline-offset-4">Consulta los planes de WhatsApp, CRM y servicios web de Kinexting.</Link></p>
      </section>
      <section className="container py-16 text-center sm:py-20"><h2 className="text-3xl font-bold tracking-tight">Que tu próximo pendiente sea crecer.</h2><p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">Deja tus datos y conoce el Plan gestor en cuanto esté disponible.</p><a href="#registro" className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-md bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300">Reservar mi lugar<ArrowRight className="h-4 w-4" /></a></section>
    </main>
    <footer className="border-t"><div className="container flex flex-col items-center justify-between gap-4 py-7 text-sm text-muted-foreground sm:flex-row"><p>© {new Date().getFullYear()} Kinexting</p><div className="flex gap-6"><Link href="/legal/privacidad" className="hover:text-foreground">Privacidad</Link><Link href="/legal/terminos-de-servicio" className="hover:text-foreground">Términos de servicio</Link></div></div></footer>
  </div>
}
