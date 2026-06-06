import type { Metadata } from "next"

import LegalAlert from "@/components/legal/legal-alert"
import LegalLayout from "@/components/legal/legal-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Política de cancelación y facturación | Kinexting",
  description: "Condiciones de cancelación, penalizaciones, renovación y ajuste de descuentos en Kinexting.",
  alternates: {
    canonical: "/legal/cancelacion-y-facturacion",
  },
}

const toc = [
  { id: "alcance", label: "Alcance" },
  { id: "resumen", label: "Resumen contractual" },
  { id: "cancelacion", label: "Ventana de cancelación" },
  { id: "penalizaciones", label: "Penalizaciones" },
  { id: "pagos-fisicos", label: "Pagos físicos" },
  { id: "descuento", label: "Plan anual con descuento" },
]

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
})

export default function CancellationPage() {
  return (
    <LegalLayout
      title="Política de cancelación y facturación"
      summary="Aquí se definen los plazos, penalizaciones y ajustes de cobro aplicables a la cancelación de servicios de Kinexting."
      updatedAt="6 de junio de 2026"
      toc={toc}
    >
      <Card id="alcance" className="scroll-mt-28 border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Alcance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>
            Esta política aplica a todos los planes contratados por periodos de 6 meses o 12 meses, expresados en la plataforma como mensual y anual.
          </p>
          <p>Todos los importes se entienden en moneda mexicana (MXN).</p>
        </CardContent>
      </Card>

      <Card id="resumen" className="scroll-mt-28 border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Resumen contractual</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-base leading-relaxed text-foreground">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 pr-4 font-semibold">Concepto</th>
                <th className="py-3 pr-4 font-semibold">Regla</th>
                <th className="py-3 font-semibold">Monto / plazo</th>
              </tr>
            </thead>
            <tbody className="align-top text-muted-foreground">
              <tr className="border-b border-border/60">
                <td className="py-3 pr-4">Plazo corto</td>
                <td className="py-3 pr-4">Contrato de referencia</td>
                <td className="py-3">6 meses</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-3 pr-4">Plazo anual</td>
                <td className="py-3 pr-4">Contrato de referencia</td>
                <td className="py-3">12 meses</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-3 pr-4">Aviso de cancelación</td>
                <td className="py-3 pr-4">Debe recibirse antes de la renovación</td>
                <td className="py-3">48 horas</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-3 pr-4">Penalización fija</td>
                <td className="py-3 pr-4">Cancelación tardía</td>
                <td className="py-3">{currency.format(350)}</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">Penalización variable</td>
                <td className="py-3 pr-4">Sobre meses restantes</td>
                <td className="py-3">30% de los meses restantes</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card id="cancelacion" className="scroll-mt-28 border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Ventana de cancelación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-base leading-relaxed text-muted-foreground">
          <LegalAlert tone="danger" title="Ventana crítica">
            La cancelación debe solicitarse como máximo 48 horas antes de la fecha de renovación del servicio.
          </LegalAlert>
          <p>
            Si la solicitud se recibe fuera de ese plazo, la renovación puede considerarse vigente y se activan los cargos de cancelación tardía.
          </p>
        </CardContent>
      </Card>

      <Card id="penalizaciones" className="scroll-mt-28 border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Penalizaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-base leading-relaxed text-muted-foreground">
          <LegalAlert tone="warning" title="Cargo por cancelación tardía">
            Además de la penalización fija de {currency.format(350)}, se cobrará una penalización variable equivalente al 30% de los meses restantes del contrato.
          </LegalAlert>
          <p>
            La penalización variable se calcula sobre el valor restante del contrato y se agrega al saldo final de la cuenta del cliente.
          </p>
        </CardContent>
      </Card>

      <Card id="pagos-fisicos" className="scroll-mt-28 border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Pagos físicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-base leading-relaxed text-muted-foreground">
          <LegalAlert tone="accent" title="Caducidad de comprobantes">
            Los pagos físicos o referencias de pago caducan al mes de emitirse. Si no se liquidan dentro de ese periodo, deberán reemitirse o actualizarse.
          </LegalAlert>
          <p>
            Cuando una referencia física venza, el saldo pendiente no se cancela: únicamente deja de ser válida esa referencia de cobro.
          </p>
        </CardContent>
      </Card>

      <Card id="descuento" className="scroll-mt-28 border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Plan anual con descuento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-base leading-relaxed text-muted-foreground">
          <p>
            Si el cliente contrató el plan anual con descuento y cancela antes de completar los 12 meses, además de la penalización fija perderá el descuento retroactivamente.
          </p>
          <p>
            En la liquidación final se cobrará la diferencia entre el precio normal y el precio con descuento por los meses efectivamente usados.
          </p>
        </CardContent>
      </Card>
    </LegalLayout>
  )
}