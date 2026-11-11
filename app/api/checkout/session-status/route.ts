import { NextResponse } from "next/server"
import type { Stripe } from "stripe"
import { getStripeSecretKey, getStripeServer } from "@/lib/stripe"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")?.trim()

    if (!sessionId) {
      return NextResponse.json({ error: "Falta el parámetro session_id" }, { status: 400 })
    }

    if (!sessionId.startsWith("cs_")) {
      return NextResponse.json({ error: "El formato de session_id es inválido" }, { status: 400 })
    }

    const secretKey = getStripeSecretKey()
    if (!secretKey) {
      return NextResponse.json({ error: "Falta STRIPE_SECRET_KEY en el servidor" }, { status: 500 })
    }

    const stripe = getStripeServer()

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer", "subscription"],
    })

    const customerObj =
      session.customer && typeof session.customer !== "string"
        ? (session.customer as Stripe.Customer)
        : null

    const subscriptionObj =
      session.subscription && typeof session.subscription !== "string"
        ? (session.subscription as Stripe.Subscription)
        : null

    return NextResponse.json({
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email || customerObj?.email || "",
      customer_name: session.customer_details?.name || customerObj?.name || "",
      customer_id: typeof session.customer === "string" ? session.customer : customerObj?.id,
      subscription_id: typeof session.subscription === "string" ? session.subscription : subscriptionObj?.id,
      amount_total: session.amount_total ?? 0,
      currency: session.currency || "mxn",
      metadata: session.metadata || {},
      created: session.created,
    })
  } catch (error) {
    console.error("Error al consultar sesión de Stripe:", error)

    const isStripeError = error && typeof error === "object" && "type" in error
    const statusCode = isStripeError && (error as { statusCode?: number }).statusCode === 404 ? 404 : 500

    const isDev = process.env.NODE_ENV !== "production"
    const message =
      isDev && error instanceof Error ? error.message : "No fue posible consultar la sesión de pago de Stripe."

    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
