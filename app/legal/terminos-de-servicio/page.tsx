import type { Metadata } from "next"

import LegalLayout from "@/components/legal/legal-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Términos de servicio | Kinexting",
  description: "Condiciones de contratación, uso del servicio, renovaciones y responsabilidades de Kinexting.",
  alternates: {
    canonical: "/legal/terminos-de-servicio",
  },
}

const toc = [
  { id: "aceptacion", label: "Aceptación" },
  { id: "plazos", label: "Plazos de contratación" },
  { id: "pagos", label: "Pagos y renovaciones" },
  { id: "uso", label: "Uso permitido" },
  { id: "propiedad", label: "Propiedad intelectual" },
  { id: "cancellation", label: "Remisión a cancelación" },
]

export default function TermsPage() {
  return (
    <LegalLayout
      title="Términos de servicio"
      summary="Estas condiciones regulan la contratación, renovación, uso y cobro de los servicios de Kinexting."
      updatedAt="6 de junio de 2026"
      toc={toc}
    >
      <Card id="aceptacion" className="scroll-mt-28 border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Aceptación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>Al contratar, navegar o usar el servicio, aceptas estas condiciones y la documentación vinculada.</p>
          <p>Si no estás de acuerdo con estos términos, debes abstenerte de contratar o usar el servicio.</p>
        </CardContent>
      </Card>

      <Card id="plazos" className="scroll-mt-28 border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Plazos de contratación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>Para efectos contractuales, los plazos mostrados como mensual y anual corresponden a 6 meses y 12 meses.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>El plazo corto equivale a 6 meses de servicio.</li>
            <li>El plazo anual equivale a 12 meses de servicio y puede incluir descuento promocional.</li>
            <li>La renovación opera conforme al plazo contratado y a la notificación previa aplicable.</li>
          </ul>
        </CardContent>
      </Card>

      <Card id="pagos" className="scroll-mt-28 border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Pagos y renovaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>Todos los importes se manejan en MXN y pueden estar sujetos a renovaciones automáticas.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>El cliente acepta pagar el importe pactado por el periodo contratado y los cargos autorizados.</li>
            <li>La falta de pago puede suspender el servicio hasta regularizar la cuenta.</li>
          </ul>
        </CardContent>
      </Card>

      <Card id="uso" className="scroll-mt-28 border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Uso permitido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base leading-relaxed text-muted-foreground">
          <ul className="list-disc space-y-2 pl-5">
            <li>No se permite usar el servicio para actividades ilícitas, engañosas o que vulneren derechos de terceros.</li>
            <li>El cliente es responsable del contenido que aporta y de la información que publica o envía.</li>
            <li>Kinexting podrá limitar funciones si detecta abuso, fraude o uso que afecte la estabilidad del servicio.</li>
          </ul>
        </CardContent>
      </Card>

      <Card id="propiedad" className="scroll-mt-28 border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Propiedad intelectual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>El cliente conserva la titularidad de sus contenidos. Kinexting conserva la propiedad de su plataforma, metodologías y marca, salvo pacto en contrario.</p>
        </CardContent>
      </Card>

      <Card id="cancellation" className="scroll-mt-28 border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Remisión a cancelación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>Toda solicitud de cancelación, cargos por aviso tardío, recuperación de descuentos y liquidación de cuenta se resolverá conforme a la Política de cancelación y facturación.</p>
        </CardContent>
      </Card>
    </LegalLayout>
  )
}