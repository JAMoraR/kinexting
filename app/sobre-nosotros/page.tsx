import type { Metadata } from "next"
import { CheckCircle2, Shield, Sparkles, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Sobre nosotros | Kinexting",
  description: "Conoce la misión, visión y valores de Kinexting.",
  alternates: {
    canonical: "/sobre-nosotros",
  },
}

const values = [
  {
    title: "Claridad",
    description: "Proceso directo, expectativas visibles y comunicación sin ambigüedades.",
    icon: CheckCircle2,
  },
  {
    title: "Confianza",
    description: "Una experiencia B2B seria, consistente y orientada a largo plazo.",
    icon: Shield,
  },
  {
    title: "Eficiencia",
    description: "Diseño y automatización para convertir consultas en resultados medibles.",
    icon: Sparkles,
  },
  {
    title: "Acompañamiento",
    description: "Soporte cercano para equipos que necesitan avanzar sin fricción.",
    icon: Users,
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/70 bg-gradient-to-b from-primary/8 via-background to-background">
        <div className="container py-16 md:py-24">
          <div className="max-w-4xl space-y-6">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Empresa</Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Diseñamos presencia digital para negocios que necesitan operar con orden</h1>
            <p className="max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Kinexting combina estrategia, automatización y diseño para ayudar a negocios de servicios a vender mejor, responder más rápido y construir confianza.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-12 md:py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-xl border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Misión</CardTitle>
            </CardHeader>
            <CardContent className="text-base leading-relaxed text-muted-foreground">
              Ayudar a negocios de servicios a tener una operación digital más clara, más rápida y más rentable.
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Visión</CardTitle>
            </CardHeader>
            <CardContent className="text-base leading-relaxed text-muted-foreground">
              Convertirnos en una plataforma B2B confiable para digitalizar procesos comerciales, atención y reservas.
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container pb-16 md:pb-24">
        <div className="mb-6 max-w-3xl space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Valores</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Las decisiones de producto y servicio se apoyan en estos principios de marca.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {values.map((value) => {
            const Icon = value.icon

            return (
              <Card key={value.title} className="rounded-xl border-border/70 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="space-y-3 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold">{value.title}</h3>
                  <p className="text-base leading-relaxed text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </main>
  )
}