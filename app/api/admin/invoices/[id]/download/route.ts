import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { generateCfdiXml, generateCfdiPdfBuffer, InvoiceData } from "@/lib/cfdi"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "pdf" // "pdf" | "xml"

    // Obtener factura y cliente
    const { data: invoice, error } = await supabaseAdmin
      .from("invoices")
      .select("*, client:clients(id, name, legal_name, email, phone, rfc)")
      .eq("id", id)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    const invData: InvoiceData = invoice

    if (format === "xml") {
      const xmlContent = generateCfdiXml(invData)
      return new NextResponse(xmlContent, {
        status: 200,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Content-Disposition": `attachment; filename="${invoice.invoice_number}.xml"`,
        },
      })
    }

    // Default: PDF
    const pdfBuffer = await generateCfdiPdfBuffer(invData)
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
      },
    })
  } catch (err: any) {
    console.error("Error generating invoice download:", err)
    return NextResponse.json({ error: err.message || "Error al generar comprobante fiscal" }, { status: 500 })
  }
}
