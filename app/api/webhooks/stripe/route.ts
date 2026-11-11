import { NextResponse } from "next/server"
import type { Stripe } from "stripe"
import { getStripeServer, getStripeWebhookSecret } from "@/lib/stripe"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")
    const webhookSecret = getStripeWebhookSecret()

    const stripe = getStripeServer()
    let event: Stripe.Event

    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      } catch (err) {
        console.error("Firma de Stripe Webhook inválida:", err)
        return NextResponse.json(
          { error: "Webhook signature verification failed" },
          { status: 400 }
        )
      }
    } else {
      // Si no se ha configurado STRIPE_WEBHOOK_SECRET en desarrollo, parsear con advertencia
      if (process.env.NODE_ENV === "production") {
        console.error("ALERTA DE SEGURIDAD: Falta STRIPE_WEBHOOK_SECRET en producción.")
        return NextResponse.json(
          { error: "Webhook secret not configured in production environment" },
          { status: 500 }
        )
      }

      console.warn(
        "[Stripe Webhook Dev Warning]: Procesando evento sin verificar firma porque STRIPE_WEBHOOK_SECRET no está configurada. En producción esto debe estar configurado."
      )
      event = JSON.parse(body) as Stripe.Event
    }

    // Registro estructurado de eventos relevantes
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`[Stripe Webhook] Checkout completado exitosamente:`, {
          sessionId: session.id,
          customerId: session.customer,
          subscriptionId: session.subscription,
          amountTotal: session.amount_total,
          currency: session.currency,
          planId: session.metadata?.planId,
          billing: session.metadata?.billing,
          businessName: session.metadata?.businessName,
          customerEmail: session.customer_details?.email || session.metadata?.customerEmail,
          customerPhone: session.metadata?.customerPhone,
          invoiceRequested: session.metadata?.invoiceRequested,
          invoiceRfc: session.metadata?.invoiceRfc,
        })
        break
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`[Stripe Webhook] Suscripción creada:`, {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          planId: subscription.metadata?.planId,
        })
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`[Stripe Webhook] Suscripción actualizada:`, {
          subscriptionId: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        })
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`[Stripe Webhook] Suscripción cancelada / finalizada:`, {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          endedAt: subscription.ended_at,
        })
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId =
          invoice.parent?.subscription_details?.subscription ||
          (invoice as unknown as { subscription?: string }).subscription
        console.log(`[Stripe Webhook] Pago de factura exitoso:`, {
          invoiceId: invoice.id,
          subscriptionId,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency,
          billingReason: invoice.billing_reason,
        })
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId =
          invoice.parent?.subscription_details?.subscription ||
          (invoice as unknown as { subscription?: string }).subscription
        console.warn(`[Stripe Webhook] Pago de factura fallido:`, {
          invoiceId: invoice.id,
          subscriptionId,
          attemptCount: invoice.attempt_count,
          nextPaymentAttempt: invoice.next_payment_attempt,
        })
        break
      }

      default:
        // Otros eventos informativos de Stripe
        break
    }

    return NextResponse.json({ received: true, eventType: event.type })
  } catch (error) {
    console.error("Error al procesar Stripe Webhook:", error)
    return NextResponse.json({ error: "Error interno al procesar webhook" }, { status: 500 })
  }
}
