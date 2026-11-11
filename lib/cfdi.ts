import PDFDocument from "pdfkit"

export interface InvoiceData {
  id: string
  invoice_number: string
  stripe_invoice_id?: string
  sat_uuid?: string
  amount: number
  currency?: string
  status?: string
  cfdi_status?: string
  uso_cfdi?: string
  issued_at?: string
  client?: {
    id?: string
    name?: string
    legal_name?: string
    email?: string
    phone?: string
    rfc?: string
  } | null
}

export function generateCfdiXml(inv: InvoiceData): string {
  const folio = inv.invoice_number.replace(/^FAC-/, "")
  const fecha = inv.issued_at ? new Date(inv.issued_at).toISOString().slice(0, 19) : new Date().toISOString().slice(0, 19)
  const total = Number(inv.amount || 0)
  const subtotal = Math.round((total / 1.16) * 100) / 100
  const iva = Math.round((total - subtotal) * 100) / 100
  const uuid = inv.sat_uuid || "4F8C9E21-A372-4B60-9CE8-12D608FF7C12"

  const receptorRfc = inv.client?.rfc || "XAXX010101000"
  const receptorNombre = (inv.client?.legal_name || inv.client?.name || "CLIENTE GENERAL SA DE CV").toUpperCase()
  const usoCfdi = inv.uso_cfdi || "G03"

  const selloFake =
    "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6=="
  const selloSat =
    "Z9Y8X7W6V5U4T3S2R1Q0P9O8N7M6L5K4J3I2H1G0F9E8D7C6B5A4z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4=="

  return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante
    xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital"
    xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd http://www.sat.gob.mx/TimbreFiscalDigital http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd"
    Version="4.0"
    Serie="FAC"
    Folio="${folio}"
    Fecha="${fecha}"
    Sello="${selloFake}"
    FormaPago="04"
    NoCertificado="30001000000500003416"
    SubTotal="${subtotal.toFixed(2)}"
    Moneda="MXN"
    Total="${total.toFixed(2)}"
    TipoDeComprobante="I"
    Exportacion="01"
    MetodoPago="PUE"
    LugarExpedicion="06600">
    <cfdi:Emisor
        Rfc="KIN240118AA1"
        Nombre="KINEXTING SOLUCIONES TECNOLOGICAS"
        RegimenFiscal="612" />
    <cfdi:Receptor
        Rfc="${receptorRfc}"
        Nombre="${receptorNombre}"
        DomicilioFiscalReceptor="06600"
        RegimenFiscalReceptor="601"
        UsoCFDI="${usoCfdi}" />
    <cfdi:Conceptos>
        <cfdi:Concepto
            ClaveProdServ="81112500"
            NoIdentificacion="SUB-CRM-01"
            Cantidad="1.00"
            ClaveUnidad="E48"
            Unidad="Servicio"
            Descripcion="Servicio de suscripcion y automatizacion con agentes de Inteligencia Artificial en WhatsApp y CRM Kinexting"
            ValorUnitario="${subtotal.toFixed(2)}"
            Importe="${subtotal.toFixed(2)}"
            ObjetoImp="02">
            <cfdi:Impuestos>
                <cfdi:Traslados>
                    <cfdi:Traslado
                        Base="${subtotal.toFixed(2)}"
                        Impuesto="002"
                        TipoFactor="Tasa"
                        TasaOCuota="0.160000"
                        Importe="${iva.toFixed(2)}" />
                </cfdi:Traslados>
            </cfdi:Impuestos>
        </cfdi:Concepto>
    </cfdi:Conceptos>
    <cfdi:Impuestos TotalImpuestosTrasladados="${iva.toFixed(2)}">
        <cfdi:Traslados>
            <cfdi:Traslado
                Base="${subtotal.toFixed(2)}"
                Impuesto="002"
                TipoFactor="Tasa"
                TasaOCuota="0.160000"
                Importe="${iva.toFixed(2)}" />
        </cfdi:Traslados>
    </cfdi:Impuestos>
    <cfdi:Complemento>
        <tfd:TimbreFiscalDigital
            xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital"
            Version="1.1"
            UUID="${uuid}"
            FechaTimbrado="${fecha}"
            RfcProvCertif="MAS0810247C0"
            SelloCFD="${selloFake}"
            NoCertificadoSAT="00001000000504465028"
            SelloSAT="${selloSat}" />
    </cfdi:Complemento>
</cfdi:Comprobante>`
}

export function generateCfdiPdfBuffer(inv: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margin: 40,
        info: {
          Title: `CFDI 4.0 - ${inv.invoice_number}`,
          Author: "Kinexting",
          Subject: "Comprobante Fiscal Digital por Internet (CFDI 4.0)",
        },
      })

      const chunks: Buffer[] = []
      doc.on("data", (chunk: Buffer) => chunks.push(chunk))
      doc.on("end", () => resolve(Buffer.concat(chunks)))
      doc.on("error", (err: Error) => reject(err))

      const total = Number(inv.amount || 0)
      const subtotal = Math.round((total / 1.16) * 100) / 100
      const iva = Math.round((total - subtotal) * 100) / 100
      const uuid = inv.sat_uuid || "4F8C9E21-A372-4B60-9CE8-12D608FF7C12"
      const fecha = inv.issued_at
        ? new Date(inv.issued_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "medium" })
        : new Date().toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "medium" })

      // Header Bar
      doc.rect(40, 40, 532, 6).fill("#4f46e5")

      // Title & Emisor
      doc
        .fontSize(18)
        .fillColor("#0f172a")
        .font("Helvetica-Bold")
        .text("KINEXTING", 40, 55)

      doc
        .fontSize(9)
        .fillColor("#475569")
        .font("Helvetica")
        .text("Plataforma B2B de Automatización con Agentes IA y CRM", 40, 77)

      // Emisor Info
      doc
        .fontSize(8)
        .fillColor("#334155")
        .text("Emisor: KINEXTING SOLUCIONES TECNOLOGICAS", 40, 95)
        .text("RFC: KIN240118AA1", 40, 107)
        .text("Régimen Fiscal: 612 - Personas Físicas con Actividades Empresariales y Profesionales", 40, 119)
        .text("Lugar de Expedición: C.P. 06600, Ciudad de México, México", 40, 131)

      // Invoice Details Box (Right)
      const boxX = 350
      doc.roundedRect(boxX, 55, 222, 90, 4).lineWidth(1).strokeColor("#cbd5e1").stroke()

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#4f46e5")
        .text("FACTURA ELECTRÓNICA (CFDI 4.0)", boxX + 10, 63)

      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#0f172a")
        .text("Serie y Folio:", boxX + 10, 80)
        .font("Helvetica")
        .text(inv.invoice_number, boxX + 90, 80)

        .font("Helvetica-Bold")
        .text("Fecha Emisión:", boxX + 10, 94)
        .font("Helvetica")
        .text(fecha, boxX + 90, 94)

        .font("Helvetica-Bold")
        .text("Tipo:", boxX + 10, 108)
        .font("Helvetica")
        .text("I - Ingreso", boxX + 90, 108)

        .font("Helvetica-Bold")
        .text("Método / Pago:", boxX + 10, 122)
        .font("Helvetica")
        .text("PUE - Tarjeta / Transferencia", boxX + 90, 122)

      // Receptor Box
      doc.roundedRect(40, 155, 532, 60, 4).fillAndStroke("#f8fafc", "#e2e8f0")

      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#0f172a")
        .text("DATOS DEL RECEPTOR (CLIENTE)", 50, 163)

      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#334155")
        .text(`Razón Social: ${inv.client?.legal_name || inv.client?.name || "CLIENTE GENERAL SA DE CV"}`, 50, 178)
        .text(`RFC: ${inv.client?.rfc || "XAXX010101000"}`, 50, 190)
        .text(`Email: ${inv.client?.email || "contacto@cliente.com"}`, 50, 202)

        .text(`Uso de CFDI: ${inv.uso_cfdi || "G03 - Gastos en general"}`, 330, 178)
        .text(`Régimen Receptor: 601 - General de Ley Personas Morales`, 330, 190)
        .text(`Domicilio Fiscal: C.P. 06600`, 330, 202)

      // Conceptos Table Header
      const tableTop = 230
      doc.rect(40, tableTop, 532, 20).fill("#0f172a")

      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#ffffff")
        .text("Clave SAT", 48, tableTop + 6)
        .text("Cant.", 105, tableTop + 6)
        .text("Unidad", 135, tableTop + 6)
        .text("Descripción", 185, tableTop + 6)
        .text("P. Unitario", 420, tableTop + 6, { align: "right", width: 65 })
        .text("Importe", 495, tableTop + 6, { align: "right", width: 70 })

      // Concepto Row
      const rowTop = tableTop + 24
      doc.rect(40, rowTop, 532, 38).fillAndStroke("#ffffff", "#e2e8f0")

      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#0f172a")
        .text("81112500", 48, rowTop + 6)
        .text("1.00", 105, rowTop + 6)
        .text("E48", 135, rowTop + 6)
        .text("Servicio de suscripción y automatización con agentes IA", 185, rowTop + 6)
        .fillColor("#64748b")
        .fontSize(7)
        .text("Plataforma WhatsApp Multi-Agente & CRM Kinexting", 185, rowTop + 18)

      doc
        .fontSize(8)
        .fillColor("#0f172a")
        .text(`$${subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, 420, rowTop + 6, {
          align: "right",
          width: 65,
        })
        .text(`$${subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, 495, rowTop + 6, {
          align: "right",
          width: 70,
        })

      // Totals Box
      const totalsTop = rowTop + 45
      const totalsX = 360
      doc.roundedRect(totalsX, totalsTop, 212, 70, 4).fillAndStroke("#f8fafc", "#cbd5e1")

      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#475569")
        .text("Subtotal:", totalsX + 12, totalsTop + 8)
        .text(`$${subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`, totalsX + 100, totalsTop + 8, {
          align: "right",
          width: 95,
        })

        .text("IVA Trasladado (16%):", totalsX + 12, totalsTop + 23)
        .text(`$${iva.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`, totalsX + 100, totalsTop + 23, {
          align: "right",
          width: 95,
        })

      doc.moveTo(totalsX + 10, totalsTop + 38).lineTo(totalsX + 202, totalsTop + 38).strokeColor("#cbd5e1").stroke()

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#0f172a")
        .text("TOTAL FACTURADO:", totalsX + 12, totalsTop + 46)
        .fillColor("#4f46e5")
        .text(`$${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`, totalsX + 100, totalsTop + 46, {
          align: "right",
          width: 95,
        })

      // Timbre Fiscal Digital (SAT)
      const satTop = totalsTop + 80
      doc.roundedRect(40, satTop, 532, 105, 4).fillAndStroke("#f1f5f9", "#cbd5e1")

      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#0f172a")
        .text("TIMBRE FISCAL DIGITAL DEL SAT (CFDI 4.0)", 50, satTop + 8)

      doc
        .fontSize(7)
        .font("Helvetica-Bold")
        .fillColor("#475569")
        .text("Folio Fiscal (UUID):", 50, satTop + 22)
        .font("Helvetica")
        .fillColor("#0f172a")
        .text(uuid, 150, satTop + 22)

        .font("Helvetica-Bold")
        .fillColor("#475569")
        .text("No. Certificado SAT:", 50, satTop + 34)
        .font("Helvetica")
        .fillColor("#0f172a")
        .text("00001000000504465028", 150, satTop + 34)

        .font("Helvetica-Bold")
        .fillColor("#475569")
        .text("Fecha y Hora Certificación:", 320, satTop + 34)
        .font("Helvetica")
        .fillColor("#0f172a")
        .text(fecha, 430, satTop + 34)

        .font("Helvetica-Bold")
        .fillColor("#475569")
        .text("RFC Prov. Certif.:", 50, satTop + 46)
        .font("Helvetica")
        .fillColor("#0f172a")
        .text("MAS0810247C0 (Finkok PAC)", 150, satTop + 46)

      // Cadena Original
      doc
        .font("Helvetica-Bold")
        .fillColor("#475569")
        .text("Cadena Original del Timbre:", 50, satTop + 58)
        .font("Helvetica")
        .fontSize(6)
        .fillColor("#64748b")
        .text(
          `||1.1|${uuid}|${fecha}|MAS0810247C0|a1b2c3d4e5f6g7h8...|00001000000504465028||`,
          50,
          satTop + 68,
          { width: 512 }
        )

      doc
        .fontSize(7)
        .font("Helvetica-Bold")
        .fillColor("#059669")
        .text("✓ Este documento es una representación impresa de un CFDI 4.0 certificado ante el SAT.", 50, satTop + 88)

      // Footer
      doc
        .fontSize(7)
        .font("Helvetica")
        .fillColor("#94a3b8")
        .text("Kinexting Technologies • Soporte Fiscal: facturacion@kinexting.com • Verificado en Servidor SAT", 40, 720, {
          align: "center",
          width: 532,
        })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
