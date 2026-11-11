"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  Calculator,
  Layers,
  Sparkles,
  TrendingUp,
  Receipt,
  Building,
  RefreshCw,
  Plus,
} from "lucide-react"
import { AdminHeader } from "@/components/admin/admin-nav"
import { Button } from "@/components/ui/button"
import { Plan } from "@/lib/types/admin"
import { PlanBudgetBreakdownManager } from "@/components/admin/plan-budget-breakdown"
import { StripeCommissionCalculator } from "@/components/admin/stripe-commission-calculator"
import { toast } from "sonner"

function PresupuestoContent() {
  const searchParams = useSearchParams()
  const initialPlanParam = searchParams.get("plan") || undefined

  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"budget" | "calculator">("budget")

  const loadPlans = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/plans")
      const data = await res.json()
      if (data.plans) {
        setPlans(data.plans)
      }
    } catch {
      toast.error("Error al cargar planes de Supabase")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [])

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Desglose de Presupuesto & Simulador Financiero"
        subtitle="Auditoría de costos directos, servicios brindados por Kinexting, comisiones de Stripe México (5% + $3 MXN + 0.4% facturación + IVA) y proyecciones dinámicas."
        breadcrumbs={[
          { label: "Planes", href: "/admin/planes" },
          { label: "Presupuesto & Simulador" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === "budget" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("budget")}
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              <Layers className="w-4 h-4" />
              <span>Desglose de Presupuesto</span>
            </Button>
            <Button
              variant={activeTab === "calculator" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("calculator")}
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              <Calculator className="w-4 h-4" />
              <span>Calculadora Comisiones Stripe</span>
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground text-xs">
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Cargando arquitectura presupuestaria desde Supabase & Stripe...</span>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "budget" && (
              <PlanBudgetBreakdownManager
                plans={plans}
                initialPlanId={initialPlanParam}
                onPlansUpdated={loadPlans}
              />
            )}

            {activeTab === "calculator" && (
              <StripeCommissionCalculator plans={plans} />
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default function AdminPresupuestoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center py-20 text-xs text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          <span>Cargando interfaz de presupuestos...</span>
        </div>
      }
    >
      <PresupuestoContent />
    </Suspense>
  )
}
