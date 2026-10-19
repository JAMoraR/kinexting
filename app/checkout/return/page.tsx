"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Mail,
  Receipt,
  Headphones,
  ExternalLink,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import ThemeToggle from "@/components/theme-toggle"
import { buildWhatsAppLink, COMPANY_NAME } from "@/lib/plans"

type SessionDetails = {
  status: string
  payment_status: string
  customer_email: string
  customer_name: string
  amount_total: number
  currency: string
  metadata: {
    planId?: string
    billing?: string
    businessName?: string
    businessType?: string
    customerPhone?: string
    customerEmail?: string
    invoiceRequested?: string
    invoiceRfc?: string
    [key: string]: string | undefined
  }
  created: number
}

const PLAN_NAMES: Record<string, string> = {
  asistente: "Plan Asistente",
  recepcionista: "Plan Omnicanal",
  "soporte-tecnico": "Plan Web App",
  "a-medida": "Plan Chatbot + Web App",
}

const BILLING_LABELS: Record<string, string> = {
  quarterly: "Trimestral",
  annual: "Anual",
  monthly: "Trimestral",
}

const formatCurrency = (amount: number, currency = "mxn") => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100)
}

function CheckoutReturnContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<SessionDetails | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!sessionId) {
      setError("No se proporcionó una referencia válida de sesión.")
      setIsLoading(false)
      return
    }

    let isMounted = true

    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/checkout/session-status?session_id=${encodeURIComponent(sessionId)}`)
        const data = await response.json()

        if (!response.ok || data.error) {
          throw new Error(data.error || "No se pudo recuperar el estado de la sesión")
        }

        if (isMounted) {
          setSession(data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error al consultar la orden")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchSession()

    return () => {
      isMounted = false
    }
  }, [sessionId])

  const clientsPortalUrl =
    process.env.NODE_ENV === "production" ? "https://clientes.kinexting.com" : "http://localhost:3001"

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-500 dark:border-slate-800 dark:border-t-cyan-400" />
          <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-cyan-500 animate-pulse" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Confirmando activación de servicio...
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Verificando autorización bancaria con Stripe de forma segura.
        </p>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-red-200 bg-red-50/50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/20">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">No se pudo verificar la sesión</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {error || "La sesión de pago solicitada no existe o ha expirado."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/configurar-plan">Volver a configurar</Link>
          </Button>
          <Button asChild>
            <Link href="/">Ir al inicio</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isPaid = session.status === "complete" && session.payment_status === "paid"
  const isPending = session.status === "open" || session.payment_status === "unpaid"
  const planName = (session.metadata?.planId && PLAN_NAMES[session.metadata.planId]) || "Plan de Agentes IA"
  const billingCycle = (session.metadata?.billing && BILLING_LABELS[session.metadata.billing]) || "Facturación periódica"
  const businessName = session.metadata?.businessName || session.customer_name || "Tu Negocio"

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-3xl space-y-8"
    >
      {/* Tarjeta de estado principal */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-cyan-950/10 sm:p-10">
        <div className="flex flex-col items-center text-center">
          {isPaid ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
              className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 dark:shadow-cyan-400/20"
            >
              <CheckCircle2 className="h-10 w-10 text-white" />
            </motion.div>
          ) : (
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500">
              <Clock className="h-10 w-10" />
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            {isPaid ? "Activación B2B Confirmada" : "Pago en Procesamiento"}
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            {isPaid ? "¡Bienvenido a Kinexting!" : "Estamos procesando tu orden"}
          </h1>

          <p className="mt-3 max-w-lg text-base text-slate-600 dark:text-slate-300">
            {isPaid
              ? `Tu solución de automatización con Inteligencia Artificial para ${businessName} ha sido autorizada con éxito.`
              : "Hemos registrado los datos de tu empresa. En cuanto se confirme la recepción del pago, activaremos tu agente."}
          </p>
        </div>

        {/* Resumen ejecutivo de la orden */}
        <div className="mt-8 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-6 dark:border-slate-800 dark:bg-slate-950/60 sm:p-7">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Resumen de la Transacción
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Solución contratada</span>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{planName}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Ciclo de facturación</span>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{billingCycle}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Importe total</span>
              <p className="text-base font-bold text-cyan-600 dark:text-cyan-400">
                {formatCurrency(session.amount_total, session.currency)}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Correo de cuenta</span>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {session.customer_email || session.metadata?.customerEmail}
              </p>
            </div>

            {session.metadata?.invoiceRequested === "true" && (
              <div className="space-y-1 sm:col-span-2 border-t border-slate-200/60 pt-3 dark:border-slate-800/80">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Receipt className="h-3.5 w-3.5" /> Facturación fiscal solicitada
                </span>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  RFC: {session.metadata.invoiceRfc || "En proceso de emisión de CFDI"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Roadmap de Onboarding */}
        <div className="mt-8">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Próximos pasos para la puesta en marcha:
          </h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3.5 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Configuración del modelo de IA empresarial
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nuestro equipo de ingeniería ya está indexando los parámetros de tu negocio ({businessName}).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Asignación y credenciales en tu correo
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  En menos de 24 horas recibirás los accesos de tu panel administrativo y vinculación de WhatsApp API.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Acompañamiento y soporte dedicado
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tendrás comunicación directa con tu especialista asignado para afinar respuestas y flujos de conversión.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button asChild variant="outline" className="h-11">
            <Link href="/" className="inline-flex items-center gap-2">
              Volver a la landing
            </Link>
          </Button>

          <Button
            asChild
            className="h-11 bg-gradient-to-r from-cyan-500 to-indigo-600 font-semibold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500"
          >
            <a
              href={buildWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <Headphones className="h-4 w-4" />
              Contactar a mi especialista
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default function CheckoutReturnPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-slate-950 to-slate-950 py-10 px-4 text-slate-100 sm:py-16">
      <div className="container mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between border-b border-slate-800/80 pb-4">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-white">
            <span className="text-xl">{COMPANY_NAME}</span>
            <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
              B2B Solutions
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        <Suspense
          fallback={
            <div className="flex min-h-[50vh] items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
            </div>
          }
        >
          <CheckoutReturnContent />
        </Suspense>
      </div>
    </main>
  )
}
