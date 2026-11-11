import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const { data: invoices, error } = await supabaseAdmin
      .from("invoices")
      .select("*, client:clients(name, email, rfc)")
      .order("issued_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ invoices })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al obtener facturas" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { client_id, amount, uso_cfdi = "G03" } = body

    if (!client_id || !amount) {
      return NextResponse.json({ error: "Cliente y monto son requeridos" }, { status: 400 })
    }

    const nextInvoiceNum = `FAC-2026-${Math.floor(1000 + Math.random() * 9000)}`
    const satUuid = crypto.randomUUID().toUpperCase()

    const { data: newInvoice, error } = await supabaseAdmin
      .from("invoices")
      .insert({
        client_id,
        invoice_number: nextInvoiceNum,
        stripe_invoice_id: `in_timbrado_${Date.now()}`,
        sat_uuid: satUuid,
        amount: Number(amount),
        currency: "MXN",
        status: "paid",
        cfdi_status: "timbrado",
        uso_cfdi,
        pdf_url: `/invoices/${nextInvoiceNum}.pdf`,
        xml_url: `/invoices/${nextInvoiceNum}.xml`,
      })
      .select("*, client:clients(name, email, rfc)")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await supabaseAdmin.from("audit_logs").insert({
      client_id,
      actor_email: "angelpordiez@gmail.com",
      action: "CFDI_ISSUED",
      details: { invoice_number: nextInvoiceNum, sat_uuid: satUuid, amount },
    })

    return NextResponse.json({ success: true, invoice: newInvoice })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al timbrar factura" }, { status: 500 })
  }
}
