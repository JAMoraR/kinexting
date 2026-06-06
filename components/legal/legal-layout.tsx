"use client"

import type { ReactNode } from "react"
import Link from "next/link"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

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
  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth">
      <header className="border-b border-border/70 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="container py-10 md:py-12">
          <div className="max-w-4xl space-y-4">
            <Badge className="w-fit bg-primary/10 text-primary hover:bg-primary/10">{eyebrow}</Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{title}</h1>
              <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">{summary}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>Actualizado: {updatedAt}</span>
              <Separator orientation="vertical" className="hidden h-4 md:block" />
              <Link href="/" className="text-primary transition-colors hover:underline">
                Volver al inicio
              </Link>
              <Separator orientation="vertical" className="hidden h-4 md:block" />
              <Link href={supportHref} className="text-primary transition-colors hover:underline">
                {supportLabel}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <div className="hidden lg:block">
              <Card className="border-border/70 bg-card/90 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-foreground">Índice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 pt-0">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
                    >
                      {item.label}
                    </a>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="lg:hidden">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="toc" className="rounded-xl border border-border/70 bg-card/90 px-4 shadow-sm">
                  <AccordionTrigger className="py-4 text-left text-base font-semibold text-foreground">
                    Índice
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
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

            <Card className="border-border/70 bg-card/90 shadow-sm">
              <CardContent className="space-y-3 p-5">
                <p className="text-sm font-semibold text-foreground">Lectura institucional</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Este documento está estructurado para facilitar lectura larga, referencias internas y navegación rápida entre cláusulas.
                </p>
              </CardContent>
            </Card>
          </aside>

          <section className="min-w-0 space-y-6">{children}</section>
        </div>
      </main>
    </div>
  )
}