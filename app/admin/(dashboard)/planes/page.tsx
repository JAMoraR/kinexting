"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  CreditCard,
  Zap,
  CheckCircle2,
  Copy,
  Edit2,
  Database,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Layers,
  Sparkles,
  Plus,
  ShieldCheck,
  Power,
  EyeOff,
  Eye,
  AlertTriangle,
  Archive,
  Trash2,
  DollarSign,
  Tag,
  Clock,
  Calculator,
  Receipt,
  Building,
  Check,
  X,
} from "lucide-react"
import { AdminHeader } from "@/components/admin/admin-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plan } from "@/lib/types/admin"
import { StripeTarifasTable } from "@/components/admin/stripe-pricing"
import { calculateStripeFees } from "@/lib/stripe-fees"
import { toast } from "sonner"

export default function AdminPlanesPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Edit Plan State (Abre la vista completa de edición del plan y tarifas Stripe)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editActiveTab, setEditActiveTab] = useState<"general" | "tarifas" | "features">("general")
  const [saving, setSaving] = useState(false)
  const [editName, setEditName] = useState("")
  const [editCategory, setEditCategory] = useState<"chatbot" | "both">("chatbot")
  const [editPriceQ, setEditPriceQ] = useState("0")
  const [editPriceA, setEditPriceA] = useState("0")
  const [editDesc, setEditDesc] = useState("")
  const [editFeatures, setEditFeatures] = useState<string[]>([])
  const [newFeatureText, setNewFeatureText] = useState("")

  // New Plan State (Tarifas derivadas a través del desglose presupuestario)
  const [newPlanOpen, setNewPlanOpen] = useState(false)
  const [creatingPlan, setCreatingPlan] = useState(false)
  const [newPlanData, setNewPlanData] = useState({
    id: "",
    name: "",
    category: "chatbot" as "chatbot" | "both",
    description: "",
    features: [
      "Agente conversacional de IA 24/7 en WhatsApp",
      "Sistema CRM Todo-en-Uno sin límite de usuarios",
      "Sincronización con Google Calendar y citas en vivo",
    ],
    // Desglose para tarifa Trimestral
    quarterly: {
      cost_ia: 160,
      cost_infra: 90,
      cost_crm: 250,
      cost_support: 120,
      markup_percent: 15, // Comisión de gestión sobre costos
    },
    // Desglose para tarifa Anual
    annual: {
      cost_ia: 580,
      cost_infra: 320,
      cost_crm: 950,
      cost_support: 480,
      markup_percent: 15,
    },
  })
  const [newPlanFeatureText, setNewPlanFeatureText] = useState("")

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

  // Sincronizar catálogo directamente desde Stripe
  const handleSyncStripeCatalog = async () => {
    setSyncing(true)
    try {
      const res = await fetch("/api/admin/plans/sync", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Fallo en sincronización")
      toast.success(data.message || "Catálogo de Stripe sincronizado")
      loadPlans()
    } catch (err: any) {
      toast.error(err.message || "Error al sincronizar catálogo con Stripe")
    } finally {
      setSyncing(false)
    }
  }

  // Activar o Inhabilitar plan en Stripe y Supabase
  const handleTogglePlanStatus = async (plan: Plan) => {
    setTogglingId(plan.id)
    const newStatus = !plan.is_active
    try {
      const res = await fetch("/api/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: plan.id, is_active: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al actualizar estado")
      toast.success(
        `Plan "${plan.name}" ${newStatus ? "activado" : "inhabilitado"} en Stripe y Supabase`
      )
      loadPlans()
    } catch (err: any) {
      toast.error(err.message || "Error al cambiar estado del plan")
    } finally {
      setTogglingId(null)
    }
  }

  // Abrir modal de edición completo (donde se visualiza y edita todo)
  const handleOpenEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setEditName(plan.name)
    setEditCategory(plan.category || "chatbot")
    setEditPriceQ(String(plan.price_quarterly_mxn))
    setEditPriceA(String(plan.price_annual_mxn))
    setEditDesc(plan.description || "")
    setEditFeatures(Array.isArray(plan.features) ? [...plan.features] : [])
    setNewFeatureText("")
    setEditActiveTab("general")
    setEditOpen(true)
  }

  // Manejo de características en edición
  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return
    setEditFeatures([...editFeatures, newFeatureText.trim()])
    setNewFeatureText("")
  }

  const handleRemoveFeature = (index: number) => {
    setEditFeatures(editFeatures.filter((_, i) => i !== index))
  }

  const handleUpdateFeature = (index: number, text: string) => {
    const updated = [...editFeatures]
    updated[index] = text
    setEditFeatures(updated)
  }

  // Guardar edición del plan
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPlan) return
    setSaving(true)

    try {
      const res = await fetch("/api/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPlan.id,
          name: editName,
          category: editCategory,
          price_quarterly_mxn: Number(editPriceQ),
          price_annual_mxn: Number(editPriceA),
          description: editDesc,
          features: editFeatures,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al actualizar")

      toast.success(`Plan "${editName}" actualizado en Supabase y sincronizado con Stripe`)
      setEditOpen(false)
      loadPlans()
    } catch (err: any) {
      toast.error(err.message || "Error al guardar cambios")
    } finally {
      setSaving(false)
    }
  }

  // Manejo de características en nuevo plan
  const handleAddNewPlanFeature = () => {
    if (!newPlanFeatureText.trim()) return
    setNewPlanData({
      ...newPlanData,
      features: [...newPlanData.features, newPlanFeatureText.trim()],
    })
    setNewPlanFeatureText("")
  }

  const handleRemoveNewPlanFeature = (idx: number) => {
    setNewPlanData({
      ...newPlanData,
      features: newPlanData.features.filter((_, i) => i !== idx),
    })
  }

  // Precios calculados derivados del desglose para nuevo plan:
  // Regla oficial del negocio: Precio Oficial en Stripe = Neto Líquido + Comisiones de Stripe calculadas del presupuesto
  const netBaseQ =
    newPlanData.quarterly.cost_ia +
    newPlanData.quarterly.cost_infra +
    newPlanData.quarterly.cost_crm +
    newPlanData.quarterly.cost_support +
    ((newPlanData.quarterly.cost_ia + newPlanData.quarterly.cost_infra) *
      newPlanData.quarterly.markup_percent) /
      100

  const stripeFeesQ = calculateStripeFees(netBaseQ)
  const priceOfficialQ = Math.round((netBaseQ + stripeFeesQ.stripeFeeTotalMxn) * 100) / 100

  const netBaseA =
    newPlanData.annual.cost_ia +
    newPlanData.annual.cost_infra +
    newPlanData.annual.cost_crm +
    newPlanData.annual.cost_support +
    ((newPlanData.annual.cost_ia + newPlanData.annual.cost_infra) *
      newPlanData.annual.markup_percent) /
      100

  const stripeFeesA = calculateStripeFees(netBaseA)
  const priceOfficialA = Math.round((netBaseA + stripeFeesA.stripeFeeTotalMxn) * 100) / 100

  const calculatedNewPlanPrices = {
    quarterlyNet: netBaseQ,
    quarterly: priceOfficialQ,
    annualNet: netBaseA,
    annual: priceOfficialA,
  }

  // Crear nuevo plan configurando tarifas mediante su desglose
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingPlan(true)

    const qPrice = priceOfficialQ
    const aPrice = priceOfficialA

    const initialBudget = {
      quarterly: {
        target_price_mxn: qPrice,
        base_net_price_mxn: Math.round(netBaseQ * 100) / 100,
        stripe_fees_mxn: stripeFeesQ.stripeFeeTotalMxn,
        markup_percentage: newPlanData.quarterly.markup_percent,
        exchange_rate_usd: 20.0,
        exchange_rate_eur: 21.4,
        items: [
          {
            id: "ia_tokens_q",
            name: "Consumo de Tokens IA",
            description: "Inferencia LLM y automatización de respuestas",
            provider: "OpenAI / Claude API",
            kind: "costo" as const,
            amount_mxn: newPlanData.quarterly.cost_ia,
            amount_usd: Math.round((newPlanData.quarterly.cost_ia / 19.85) * 100) / 100,
            amount_eur: Math.round((newPlanData.quarterly.cost_ia / 21.40) * 100) / 100,
            markup_percent: newPlanData.quarterly.markup_percent,
          },
          {
            id: "infra_cloud_q",
            name: "Infraestructura Cloud & BD",
            description: "Servidores Postgres dedicados y túneles seguros",
            provider: "Supabase / AWS",
            kind: "costo" as const,
            amount_mxn: newPlanData.quarterly.cost_infra,
            amount_usd: Math.round((newPlanData.quarterly.cost_infra / 19.85) * 100) / 100,
            amount_eur: Math.round((newPlanData.quarterly.cost_infra / 21.40) * 100) / 100,
            markup_percent: newPlanData.quarterly.markup_percent,
          },
          {
            id: "crm_core_q",
            name: "Licencia Plataforma CRM Kinexting",
            description: "Acceso multiusuario ilimitado al CRM",
            provider: "Kinexting Core",
            kind: "servicio" as const,
            amount_mxn: newPlanData.quarterly.cost_crm,
            amount_usd: Math.round((newPlanData.quarterly.cost_crm / 19.85) * 100) / 100,
            amount_eur: Math.round((newPlanData.quarterly.cost_crm / 21.40) * 100) / 100,
            markup_percent: 0,
          },
          {
            id: "support_q",
            name: "Soporte Técnico Especializado",
            description: "Atención prioritaria y mantenimiento continuo",
            provider: "Kinexting Soporte",
            kind: "servicio" as const,
            amount_mxn: newPlanData.quarterly.cost_support,
            amount_usd: Math.round((newPlanData.quarterly.cost_support / 19.85) * 100) / 100,
            amount_eur: Math.round((newPlanData.quarterly.cost_support / 21.40) * 100) / 100,
            markup_percent: 0,
          },
        ],
      },
      annual: {
        target_price_mxn: aPrice,
        base_net_price_mxn: Math.round(netBaseA * 100) / 100,
        stripe_fees_mxn: stripeFeesA.stripeFeeTotalMxn,
        markup_percentage: newPlanData.annual.markup_percent,
        exchange_rate_usd: 20.0,
        exchange_rate_eur: 21.4,
        items: [
          {
            id: "ia_tokens_a",
            name: "Bolsa Anual de Tokens IA",
            description: "Consumo anual garantizado multicanal",
            provider: "OpenAI / Claude API",
            kind: "costo" as const,
            amount_mxn: newPlanData.annual.cost_ia,
            amount_usd: Math.round((newPlanData.annual.cost_ia / 19.85) * 100) / 100,
            amount_eur: Math.round((newPlanData.annual.cost_ia / 21.40) * 100) / 100,
            markup_percent: newPlanData.annual.markup_percent,
          },
          {
            id: "infra_cloud_a",
            name: "Infraestructura Cloud Anual",
            description: "Alojamiento dedicado de base de datos y backups",
            provider: "Supabase / AWS",
            kind: "costo" as const,
            amount_mxn: newPlanData.annual.cost_infra,
            amount_usd: Math.round((newPlanData.annual.cost_infra / 19.85) * 100) / 100,
            amount_eur: Math.round((newPlanData.annual.cost_infra / 21.40) * 100) / 100,
            markup_percent: newPlanData.annual.markup_percent,
          },
          {
            id: "crm_core_a",
            name: "Licencia Anual Plataforma CRM",
            description: "Licencia corporativa anual CRM Todo-en-Uno",
            provider: "Kinexting Core",
            kind: "servicio" as const,
            amount_mxn: newPlanData.annual.cost_crm,
            amount_usd: Math.round((newPlanData.annual.cost_crm / 19.85) * 100) / 100,
            amount_eur: Math.round((newPlanData.annual.cost_crm / 21.40) * 100) / 100,
            markup_percent: 0,
          },
          {
            id: "support_a",
            name: "Soporte Técnico Anual Prioritario",
            description: "SLA garantizado y soporte proactivo",
            provider: "Kinexting Soporte",
            kind: "servicio" as const,
            amount_mxn: newPlanData.annual.cost_support,
            amount_usd: Math.round((newPlanData.annual.cost_support / 19.85) * 100) / 100,
            amount_eur: Math.round((newPlanData.annual.cost_support / 21.40) * 100) / 100,
            markup_percent: 0,
          },
        ],
      },
    }

    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newPlanData.id.trim().toLowerCase(),
          name: newPlanData.name.trim(),
          category: newPlanData.category,
          description: newPlanData.description.trim(),
          price_quarterly_mxn: qPrice,
          price_annual_mxn: aPrice,
          features: newPlanData.features,
          budget_breakdown: initialBudget,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al crear plan")

      toast.success(`Plan "${newPlanData.name}" creado con éxito en Stripe y Supabase`)
      setNewPlanOpen(false)
      loadPlans()
    } catch (err: any) {
      toast.error(err.message || "Error al crear plan")
    } finally {
      setCreatingPlan(false)
    }
  }

  const activePlans = plans.filter((p) => p.is_active)
  const inactivePlans = plans.filter((p) => !p.is_active)

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Planes & Suscripciones"
        subtitle="Catálogo de productos, tarifas activas en Stripe Gateway '2027', presupuestos unitarios y sincronización oficial."
        breadcrumbs={[{ label: "Planes & Suscripciones" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/presupuesto">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs border-border/60 hover:text-cyan-500"
              >
                <Calculator className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Presupuesto & Simulador</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncStripeCatalog}
              disabled={syncing}
              className="h-9 gap-1.5 text-xs border-border/60 hover:text-cyan-500 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-cyan-500" : ""}`} />
              <span>{syncing ? "Sincronizando..." : "Sincronizar Catálogo Stripe"}</span>
            </Button>

            <Button
              onClick={() => setNewPlanOpen(true)}
              className="h-9 gap-1.5 text-xs font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Plan en Stripe</span>
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Banner de Estado Stripe */}
        <div className="p-4 rounded-xl bg-card border border-border/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                <span>Stripe Gateway Conectado: Entorno "2027" Activo</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                Stripe Context: acct_1URjSAFoo1r3CHSy • Precios Netos sin IVA (tax_behavior: exclusive) • {activePlans.length} Activo(s)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              100% Sincronizado
            </span>
          </div>
        </div>

        {/* SECCIÓN 1: PLANES ACTIVOS (RESUMEN EN TARJETAS COMPACTAS) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <h2 className="text-sm font-bold text-foreground tracking-tight uppercase">
                Planes Activos para Comercialización ({activePlans.length})
              </h2>
            </div>
            <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 font-semibold">
              Oferta Pública Vigente • Precios Netos + IVA (16%)
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                <span>Cargando catálogo desde Supabase & Stripe...</span>
              </div>
            </div>
          ) : activePlans.length === 0 ? (
            <div className="p-8 rounded-xl bg-card border border-border/40 text-center text-xs text-muted-foreground">
              No hay planes activos actualmente.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activePlans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-xl bg-card border border-border/60 hover:border-cyan-500/40 p-5 flex flex-col justify-between shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(56,189,248,0.08)]"
                >
                  <div>
                    {/* Header de la tarjeta */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-muted text-foreground border border-border/40">
                        {plan.id}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Activo
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground tracking-tight">
                      {plan.name}
                    </h3>
                    <span className="text-[11px] font-semibold text-primary block mt-0.5">
                      {plan.category === "both" ? "CRM Todo-en-Uno + Chatbot" : "Chatbot WhatsApp IA"}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 min-h-[32px]">
                      {plan.description || "Sin descripción registrada"}
                    </p>

                    {/* Resumen de Tarifas Oficiales */}
                    <div className="mt-4 pt-3 border-t border-border/40 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Trimestral (3 meses):</span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-foreground">
                            ${Number(plan.price_quarterly_mxn).toLocaleString("es-MX")} MXN
                          </span>
                          <span className="text-[10px] text-muted-foreground block font-mono">
                            + IVA (${(Number(plan.price_quarterly_mxn) * 0.16).toFixed(2)})
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-border/30">
                        <span className="text-muted-foreground">Anual (12 meses):</span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-primary">
                            ${Number(plan.price_annual_mxn).toLocaleString("es-MX")} MXN
                          </span>
                          <span className="text-[10px] text-muted-foreground block font-mono">
                            + IVA (${(Number(plan.price_annual_mxn) * 0.16).toFixed(2)})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de la tarjeta */}
                  <div className="mt-5 pt-3 border-t border-border/40 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(plan)}
                      className="flex-1 text-xs h-8 gap-1 border-border/60 hover:text-cyan-500"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar Plan</span>
                    </Button>

                    <Link href={`/admin/presupuesto?plan=${plan.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8 gap-1 border-border/60 hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Presupuesto</span>
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePlanStatus(plan)}
                      disabled={togglingId === plan.id}
                      className="text-xs h-8 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 px-2"
                      title="Inhabilitar plan"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECCIÓN 2: PLANES INHABILITADOS (RESUMEN EN TARJETAS COMPACTAS) */}
        <div className="space-y-3 pt-4 border-t border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-bold text-foreground tracking-tight uppercase">
                Planes Inhabilitados ({inactivePlans.length})
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Deshabilitados en Stripe. No visibles en landing page ni checkout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactivePlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-xl bg-card/60 border border-border/50 p-5 flex flex-col justify-between shadow-sm opacity-90 hover:opacity-100 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-muted text-muted-foreground">
                      {plan.id}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Inhabilitado
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-foreground">{plan.name}</h4>
                  <span className="text-[11px] font-medium text-muted-foreground block mt-0.5">
                    {plan.category === "both" ? "CRM Todo-en-Uno + Chatbot" : "Chatbot WhatsApp IA"}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 min-h-[32px]">
                    {plan.description || "Sin descripción"}
                  </p>

                  <div className="mt-4 pt-3 border-t border-border/30 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trimestral:</span>
                      <span className="font-mono font-medium">${Number(plan.price_quarterly_mxn).toLocaleString("es-MX")} MXN</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Anual:</span>
                      <span className="font-mono font-medium">${Number(plan.price_annual_mxn).toLocaleString("es-MX")} MXN</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border/30 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePlanStatus(plan)}
                    disabled={togglingId === plan.id}
                    className="flex-1 text-xs h-8 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/30"
                  >
                    <Power className="w-3.5 h-3.5 mr-1" />
                    Habilitar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(plan)}
                    className="text-xs h-8 text-muted-foreground hover:text-foreground"
                  >
                    Editar
                  </Button>
                  <Link href={`/admin/presupuesto?plan=${plan.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 text-muted-foreground hover:text-foreground"
                      title="Ver presupuesto"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* MODAL EDITAR PLAN COMPLETO (VISUALIZA Y EDITA TODO: DATOS, TARIFAS STRIPE, Y CARACTERÍSTICAS) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl bg-card border-border/60 max-h-[90vh] overflow-y-auto p-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 sticky top-0 bg-card z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  {editingPlan?.id}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${editingPlan?.is_active ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                  {editingPlan?.is_active ? "Activo en Stripe" : "Inactivo"}
                </span>
              </div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Configuración & Edición: {editingPlan?.name}
              </DialogTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (editingPlan) {
                  window.location.href = `/admin/presupuesto?plan=${editingPlan.id}`
                }
              }}
              className="text-xs h-8 gap-1.5"
            >
              <Calculator className="w-3.5 h-3.5 text-primary" />
              <span>Abrir Presupuesto Unitario</span>
            </Button>
          </div>

          {/* Navegación por pestañas dentro de la edición */}
          <div className="flex items-center gap-2 px-6 pt-3 border-b border-border/40">
            <button
              type="button"
              onClick={() => setEditActiveTab("general")}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
                editActiveTab === "general"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Información General & Características
            </button>
            <button
              type="button"
              onClick={() => setEditActiveTab("tarifas")}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
                editActiveTab === "tarifas"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Tarifas & Precios Stripe
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* PESTAÑA 1: INFORMACIÓN GENERAL & CARACTERÍSTICAS (SIN PRECIOS, CON CATEGORÍAS) */}
            {editActiveTab === "general" && (
              <form onSubmit={handleSavePlan} className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Nombre Comercial del Plan</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Descripción del Servicio</Label>
                  <Input
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="h-9 text-xs"
                    placeholder="Descripción comercial visible para clientes"
                  />
                </div>

                {/* Lista de Categorías de la Solución */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <Label className="text-xs font-semibold block">Lista de Categorías de la Solución</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditCategory("chatbot")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        editCategory === "chatbot"
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border/60 hover:bg-muted/30"
                      }`}
                    >
                      <span className="block font-bold text-xs text-foreground">Chatbot WhatsApp IA</span>
                      <span className="block text-[11px] text-muted-foreground mt-0.5">
                        Agentes conversacionales 24/7 de atención y calificación
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditCategory("both")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        editCategory === "both"
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border/60 hover:bg-muted/30"
                      }`}
                    >
                      <span className="block font-bold text-xs text-foreground">CRM Todo-en-Uno + Chatbot</span>
                      <span className="block text-[11px] text-muted-foreground mt-0.5">
                        Solución híbrida integral con gestión operativa y agenda
                      </span>
                    </button>
                  </div>
                </div>

                {/* Lista de Características en esta misma sección */}
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">
                      Lista de Características ({editFeatures.length})
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Visibles en checkout y landing page
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Ej. Agente conversacional 24/7 en WhatsApp..."
                      value={newFeatureText}
                      onChange={(e) => setNewFeatureText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddFeature()
                        }
                      }}
                      className="h-8 text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddFeature}
                      className="h-8 text-xs shrink-0 gap-1 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir</span>
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {editFeatures.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/30 border border-border/40">
                        <Input
                          value={feat}
                          onChange={(e) => handleUpdateFeature(idx, e.target.value)}
                          className="h-7 text-xs border-0 bg-transparent shadow-none"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFeature(idx)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="text-xs">
                    Cerrar
                  </Button>
                  <Button type="submit" disabled={saving} className="text-xs font-semibold">
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </form>
            )}

            {/* PESTAÑA 2: TARIFAS & PRECIOS OFICIALES STRIPE */}
            {editActiveTab === "tarifas" && editingPlan && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Tarifas sincronizadas directamente con Stripe Gateway para este plan. Cada tarifa cuenta con su propio desglose de presupuesto unitario.
                  </p>
                </div>
                <StripeTarifasTable plan={editingPlan} onPriceChange={loadPlans} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL CREAR NUEVO PLAN (CONFIGURANDO TARIFAS MEDIANTE SU DESGLOSE DE PRESUPUESTO) */}
      <Dialog open={newPlanOpen} onOpenChange={setNewPlanOpen}>
        <DialogContent className="max-w-2xl bg-card border-border/60 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Crear Nuevo Plan en Stripe Gateway
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configura el producto, sus características y deriva las tarifas a través de su desglose de costos y servicios.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePlan} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Identificador Único (slug) *</Label>
                <Input
                  placeholder="ej. plan_enterprise_ai"
                  value={newPlanData.id}
                  onChange={(e) =>
                    setNewPlanData({
                      ...newPlanData,
                      id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                    })
                  }
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nombre Comercial *</Label>
                <Input
                  placeholder="ej. Plan Growth Omnicanal"
                  value={newPlanData.name}
                  onChange={(e) => setNewPlanData({ ...newPlanData, name: e.target.value })}
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Categoría *</Label>
                <select
                  value={newPlanData.category}
                  onChange={(e) => setNewPlanData({ ...newPlanData, category: e.target.value as any })}
                  className="w-full h-9 px-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground cursor-pointer font-medium"
                >
                  <option value="chatbot">Chatbot WhatsApp IA (Conversacional)</option>
                  <option value="both">CRM Todo-en-Uno + Chatbot (Híbrido)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Descripción Corta</Label>
                <Input
                  placeholder="ej. Automatización de ventas y soporte 24/7"
                  value={newPlanData.description}
                  onChange={(e) => setNewPlanData({ ...newPlanData, description: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* SECCIÓN TARIFAS DERIVADAS MEDIANTE DESGLOSE DE PRESUPUESTO */}
            <div className="space-y-3 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-primary" />
                  Tarifas Calculadas mediante Desglose Presupuestario
                </Label>
                <span className="text-[10px] text-muted-foreground font-mono">Sin inputs ciegos</span>
              </div>

              {/* Tarifa 1: Trimestral */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold text-foreground">1. Tarifa Trimestral (Cada 3 meses)</span>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-primary block">
                      Precio Oficial en Stripe: ${calculatedNewPlanPrices.quarterly.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN + IVA
                    </span>
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      (Neto Líquido: ${netBaseQ.toFixed(2)} + Comisiones Stripe: ${stripeFeesQ.stripeFeeTotalMxn.toFixed(2)})
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Tokens IA (Costo)</Label>
                    <Input
                      type="number"
                      value={newPlanData.quarterly.cost_ia}
                      onChange={(e) =>
                        setNewPlanData({
                          ...newPlanData,
                          quarterly: { ...newPlanData.quarterly, cost_ia: Number(e.target.value) || 0 },
                        })
                      }
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Servidores (Costo)</Label>
                    <Input
                      type="number"
                      value={newPlanData.quarterly.cost_infra}
                      onChange={(e) =>
                        setNewPlanData({
                          ...newPlanData,
                          quarterly: { ...newPlanData.quarterly, cost_infra: Number(e.target.value) || 0 },
                        })
                      }
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Licencia CRM (Servicio)</Label>
                    <Input
                      type="number"
                      value={newPlanData.quarterly.cost_crm}
                      onChange={(e) =>
                        setNewPlanData({
                          ...newPlanData,
                          quarterly: { ...newPlanData.quarterly, cost_crm: Number(e.target.value) || 0 },
                        })
                      }
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Soporte (Servicio)</Label>
                    <Input
                      type="number"
                      value={newPlanData.quarterly.cost_support}
                      onChange={(e) =>
                        setNewPlanData({
                          ...newPlanData,
                          quarterly: { ...newPlanData.quarterly, cost_support: Number(e.target.value) || 0 },
                        })
                      }
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Tarifa 2: Anual */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold text-foreground">2. Tarifa Anual (Por año)</span>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-primary block">
                      Precio Oficial en Stripe: ${calculatedNewPlanPrices.annual.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN + IVA
                    </span>
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      (Neto Líquido: ${netBaseA.toFixed(2)} + Comisiones Stripe: ${stripeFeesA.stripeFeeTotalMxn.toFixed(2)})
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Tokens IA (Costo)</Label>
                    <Input
                      type="number"
                      value={newPlanData.annual.cost_ia}
                      onChange={(e) =>
                        setNewPlanData({
                          ...newPlanData,
                          annual: { ...newPlanData.annual, cost_ia: Number(e.target.value) || 0 },
                        })
                      }
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Servidores (Costo)</Label>
                    <Input
                      type="number"
                      value={newPlanData.annual.cost_infra}
                      onChange={(e) =>
                        setNewPlanData({
                          ...newPlanData,
                          annual: { ...newPlanData.annual, cost_infra: Number(e.target.value) || 0 },
                        })
                      }
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Licencia CRM (Servicio)</Label>
                    <Input
                      type="number"
                      value={newPlanData.annual.cost_crm}
                      onChange={(e) =>
                        setNewPlanData({
                          ...newPlanData,
                          annual: { ...newPlanData.annual, cost_crm: Number(e.target.value) || 0 },
                        })
                      }
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Soporte (Servicio)</Label>
                    <Input
                      type="number"
                      value={newPlanData.annual.cost_support}
                      onChange={(e) =>
                        setNewPlanData({
                          ...newPlanData,
                          annual: { ...newPlanData.annual, cost_support: Number(e.target.value) || 0 },
                        })
                      }
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Características */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <Label className="text-xs font-semibold">Características ({newPlanData.features.length})</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="ej. Agente IA 24/7 en WhatsApp..."
                  value={newPlanFeatureText}
                  onChange={(e) => setNewPlanFeatureText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddNewPlanFeature()
                    }
                  }}
                  className="h-8 text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddNewPlanFeature}
                  className="h-8 text-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Añadir
                </Button>
              </div>

              <div className="space-y-1 max-h-24 overflow-y-auto">
                {newPlanData.features.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/30">
                    <span className="truncate">{f}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveNewPlanFeature(i)}
                      className="text-muted-foreground hover:text-destructive text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setNewPlanOpen(false)} className="text-xs">
                Cancelar
              </Button>
              <Button type="submit" disabled={creatingPlan} className="text-xs font-semibold">
                {creatingPlan ? "Creando en Stripe & Supabase..." : "Crear Plan en Stripe & Supabase"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
