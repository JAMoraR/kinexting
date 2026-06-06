import type { Metadata } from "next"

import LegalLayout from "@/components/legal/legal-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Política de privacidad | Kinexting",
  description: "Cómo Kinexting recopila, usa, protege y comparte información personal.",
  alternates: {
    canonical: "/legal/privacidad",
  },
}

const toc = [
  { id: "datos", label: "Datos que recopilamos" },
  { id: "uso", label: "Uso de la información" },
  { id: "comparticion", label: "Compartición" },
  { id: "seguridad", label: "Seguridad y conservación" },
  { id: "derechos", label: "Derechos del cliente" },
]

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Política de privacidad"
      summary="Explicamos qué datos recopilamos, para qué los usamos y bajo qué condiciones los protegemos dentro de Kinexting."
      updatedAt="6 de junio de 2026"
      toc={toc}
    >
      <Card id="datos" className="scroll-mt-28 border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Datos que recopilamos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>Recolectamos únicamente la información necesaria para cotizar, contratar, facturar y operar el servicio.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Datos de contacto: nombre, correo electrónico, teléfono y empresa.</li>
            <li>Datos de facturación: RFC, razón social y domicilio fiscal cuando sean requeridos.</li>
            <li>Datos técnicos y de uso: actividad dentro de la plataforma, registros de acceso y soporte.</li>
          </ul>
        </CardContent>
      </Card>

      <Card id="uso" className="scroll-mt-28 border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Uso de la información</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>Usamos la información para operar el servicio y cumplir obligaciones contractuales y legales.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Crear y administrar tu cuenta o proceso de contratación.</li>
            <li>Procesar pagos, renovaciones y facturación en moneda mexicana.</li>
            <li>Brindar soporte, resolver incidencias y mejorar la experiencia del servicio.</li>
            <li>Enviar avisos operativos sobre renovación, seguridad o cambios del servicio.</li>
          </ul>
        </CardContent>
      </Card>

      <Card id="comparticion" className="scroll-mt-28 border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Compartición</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>Solo compartimos datos cuando es necesario para prestar el servicio o cumplir la ley.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Proveedores de pago, alojamiento, mensajería o infraestructura que actúan como encargados del tratamiento.</li>
            <li>Autoridades competentes cuando exista una obligación legal válida.</li>
            <li>Equipo interno autorizado para soporte, operación y facturación.</li>
          </ul>
        </CardContent>
      </Card>

      <Card id="seguridad" className="scroll-mt-28 border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Seguridad y conservación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>
            Aplicamos medidas administrativas, técnicas y organizativas razonables para proteger la información y conservarla solo durante el tiempo necesario.
          </p>
          <p>
            Cuando los datos ya no sean necesarios, los eliminamos o anonimizamos conforme a nuestros procesos internos.
          </p>
        </CardContent>
      </Card>

      <Card id="derechos" className="scroll-mt-28 border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Derechos del cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>Puedes solicitar acceso, rectificación, cancelación u oposición cuando proceda.</p>
          <p>También puedes pedir la actualización de datos de contacto o facturación cuando cambien.</p>
        </CardContent>
      </Card>
    </LegalLayout>
  )
}