"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, ArrowUpRight, BookOpen, CheckCircle2, ChevronRight, FileText, HelpCircle, Shield, Sparkles } from "lucide-react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import ThemeToggle from "@/components/theme-toggle"

export type LegalTocItem = {
  id: string
  label: string
}

type LegalLayoutProps = {
  title: string
  summary: string
  updatedAt: string
  toc: LegalTocItem[]
  children: ReactNode
  eyebrow?: string
  supportHref?: string
  supportLabel?: string
}

const legalNavLinks = [
  { href: "/sobre-nosotros", label: "Sobre nosotros" },
  { href: "/legal/terminos-de-servicio", label: "Términos de servicio" },
  { href: "/legal/privacidad", label: "Privacidad" },
  { href: "/legal/cancelacion-y-facturacion", label: "Cancelación y facturación" },
]

export default function LegalLayout({
  title,
  summary,
  updatedAt,
  toc,
  children,
  eyebrow = "Documentos legales",
  supportHref = "mailto:hola@kinexting.com",
  supportLabel = "Contacto legal",
}: LegalLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth flex flex-col">
      {/* Top Navbar */}
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

            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              {legalNavLinks.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-md px-3 py-1.5 transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver al inicio
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

      {/* Subheader / Breadcrumbs & Document Hero */}
      <section className="border-b border-border/60 bg-gradient-to-b from-primary/[0.04] via-background to-background py-8 md:py-12">
        <div className="container">
          <div className="max-w-4xl space-y-4">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                Inicio
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span>Legal</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium truncate">{title}</span>
            </div>

            <div className="space-y-3">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-none font-medium">
                {eyebrow}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
                {title}
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
                {summary}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                <span>Última actualización: <strong className="text-foreground font-medium">{updatedAt}</strong></span>
              </div>
              <Separator orientation="vertical" className="hidden h-4 md:block" />
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span>Válido para operaciones en moneda nacional (MXN)</span>
              </div>
              <Separator orientation="vertical" className="hidden h-4 md:block" />
              <Link
                href={supportHref}
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium transition-colors"
              >
                <span>{supportLabel}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Sidebar */}
      <main className="container flex-1 py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Aside Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <div className="hidden lg:block">
              <Card className="border-border/70 bg-card/90 shadow-sm backdrop-blur">
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wider">
                      Índice del documento
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 pt-3">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary hover:translate-x-0.5"
                    >
                      {item.label}
                    </a>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Mobile Accordion TOC */}
            <div className="lg:hidden">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="toc" className="rounded-xl border border-border/70 bg-card/90 px-4 shadow-sm">
                  <AccordionTrigger className="py-3 text-left text-sm font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span>Ver índice del documento ({toc.length} secciones)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 pt-1">
                    <div className="space-y-1">
                      {toc.map((item) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
                        >
                          {item.label}
                        </a>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* B2B Transparency Box */}
            <Card className="border-border/70 bg-gradient-to-br from-card to-card/50 shadow-sm">
              <CardContent className="space-y-3 p-5 text-xs md:text-sm">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Transparencia B2B</span>
                </div>
                <p className="leading-relaxed text-muted-foreground">
                  Documentación redactada con claridad para garantizar seguridad jurídica tanto a clientes como a nuestra infraestructura operativa.
                </p>
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    ¿Tienes dudas contractuales? Escríbenos a{" "}
                    <a href="mailto:hola@kinexting.com" className="text-primary hover:underline font-medium">
                      hola@kinexting.com
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links to other legal pages on mobile / aside */}
            <Card className="border-border/70 bg-card/90 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Otros documentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 pt-0 text-xs">
                {legalNavLinks
                  .filter((link) => link.href !== pathname)
                  .map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center justify-between py-1.5 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <span>{link.label}</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  ))}
              </CardContent>
            </Card>
          </aside>

          {/* Document Content */}
          <section className="min-w-0 space-y-6">{children}</section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/70 bg-card/40 py-8 text-center text-xs text-muted-foreground">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Kinexting. Todos los derechos reservados.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/sobre-nosotros" className="hover:text-foreground transition-colors">
              Sobre nosotros
            </Link>
            <Link href="/legal/terminos-de-servicio" className="hover:text-foreground transition-colors">
              Términos de servicio
            </Link>
            <Link href="/legal/privacidad" className="hover:text-foreground transition-colors">
              Política de privacidad
            </Link>
            <Link href="/legal/cancelacion-y-facturacion" className="hover:text-foreground transition-colors">
              Política de cancelación y facturación
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}