import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getStripeServer } from "@/lib/stripe"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: client, error: clientErr } = await supabaseAdmin
      .from("clients")
      .select("*, plan:plans(*)")
      .eq("id", id)
      .single()

    if (clientErr || !client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    // Obtener suscripciones del cliente
    const { data: subscriptions } = await supabaseAdmin
      .from("subscriptions")
      .select("*, plan:plans(*)")
      .eq("client_id", id)
      .order("created_at", { ascending: false })

    // Obtener facturas del cliente
    const { data: invoices } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("client_id", id)
      .order("issued_at", { ascending: false })

    // Obtener logs de auditoría del cliente
    const { data: auditLogs } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false })

    return NextResponse.json({
      client,
      subscriptions: subscriptions || [],
      invoices: invoices || [],
      auditLogs: auditLogs || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error del servidor" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const updates = await request.json()

    delete updates.id
    delete updates.created_at
    updates.updated_at = new Date().toISOString()

    // 1. Obtener cliente actual para revisar stripe_customer_id
    const { data: currentClient } = await supabaseAdmin
      .from("clients")
      .select("*")
      .eq("id", id)
      .single()

    // 2. Actualizar en Supabase
    const { data: updatedClient, error } = await supabaseAdmin
      .from("clients")
      .update(updates)
      .eq("id", id)
      .select("*, plan:plans(*)")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // 3. Sincronizar en Stripe si tiene un Customer ID real (no mock)
    let stripeSynced = false
    if (
      currentClient?.stripe_customer_id &&
      currentClient.stripe_customer_id.startsWith("cus_") &&
      !currentClient.stripe_customer_id.startsWith("cus_test_mock_")
    ) {
      try {
        const stripe = getStripeServer()
        await stripe.customers.update(currentClient.stripe_customer_id, {
          name: updates.name || undefined,
          email: updates.email || undefined,
          phone: updates.phone || undefined,
          metadata: {
            rfc: updates.rfc || undefined,
            domain: updates.domain || undefined,
            plan_id: updates.current_plan_id || undefined,
            status: updates.status || undefined,
            updated_from: "kinexting_admin",
          },
        })
        stripeSynced = true
      } catch (stripeErr) {
        console.error("Error sincronizando actualización en Stripe:", stripeErr)
      }
    }

    // Registrar en auditoría
    await supabaseAdmin.from("audit_logs").insert({
      client_id: id,
      actor_email: "angelpordiez@gmail.com",
      action: "CLIENT_UPDATED",
      details: { updates, stripe_synced: stripeSynced },
    })

    return NextResponse.json({
      success: true,
      client: updatedClient,
      stripe_synced: stripeSynced,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al actualizar cliente" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("*")
      .eq("id", id)
      .single()

    // Cancelar en Supabase
    const { error } = await supabaseAdmin
      .from("clients")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Cancelar en Stripe si tiene suscripciones activas
    let stripeCancelled = false
    if (
      client?.stripe_customer_id &&
      client.stripe_customer_id.startsWith("cus_") &&
      !client.stripe_customer_id.startsWith("cus_test_mock_")
    ) {
      try {
        const stripe = getStripeServer()
        const subs = await stripe.subscriptions.list({
          customer: client.stripe_customer_id,
          status: "active",
        })
        for (const sub of subs.data) {
          await stripe.subscriptions.cancel(sub.id)
        }
        stripeCancelled = true
      } catch (stripeErr) {
        console.error("Error cancelando suscripciones en Stripe:", stripeErr)
      }
    }

    await supabaseAdmin.from("audit_logs").insert({
      client_id: id,
      actor_email: "angelpordiez@gmail.com",
      action: "CLIENT_CANCELLED",
      details: { timestamp: new Date().toISOString(), stripe_cancelled: stripeCancelled },
    })

    return NextResponse.json({ success: true, stripe_cancelled: stripeCancelled })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al cancelar cliente" }, { status: 500 })
  }
}
