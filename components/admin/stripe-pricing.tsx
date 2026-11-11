"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Plus,
  MoreHorizontal,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Archive,
  Trash2,
  Edit2,
  DollarSign,
  Calendar,
  Layers,
  HelpCircle,
  X,
  Sparkles,
  Link2,
  Calculator,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plan } from "@/lib/types/admin"
import { CycleBudgetEditorModal } from "@/components/admin/plan-budget-breakdown"
import { toast } from "sonner"

export interface StripePriceItem {
  id: string
  unit_amount: number
  amount: number
  currency: string
  type: "recurring" | "one_time"
  interval: "day" | "week" | "month" | "year" | null
  interval_count: number
  nickname: string
  lookup_key: string
  active: boolean
  created: number
  is_default: boolean
  tax_behavior: string
  subscriptions_count: number
}

interface StripeTarifasProps {
  plan: Plan
  onPriceChange?: () => void
}

export function StripeTarifasTable({ plan, onPriceChange }: StripeTarifasProps) {
  const [prices, setPrices] = useState<StripePriceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedPrice, setSelectedPrice] = useState<StripePriceItem | null>(null)

  // Desglose de presupuesto interactivo para una tarifa
  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [budgetCycle, setBudgetCycle] = useState<"quarterly" | "annual">("quarterly")

  const handleOpenPriceBudget = (price: StripePriceItem) => {
    const isAnnual = price.interval === "year"
    setBudgetCycle(isAnnual ? "annual" : "quarterly")
    setBudgetModalOpen(true)
  }

  const fetchPrices = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/plans/prices?plan_id=${plan.id}`)
      const data = await res.json()
      if (data.prices) {
        setPrices(data.prices)
      }
    } catch (err) {
      console.error("Error loading prices:", err)
      toast.error("Error al cargar tarifas de Stripe")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (plan.id) {
      fetchPrices()
    }
  }, [plan.id])

  const handleCopyPriceId = (priceId: string) => {
    navigator.clipboard.writeText(priceId)
    toast.success(`ID ${priceId} copiado al portapapeles`)
  }

  const handleSetDefault = async (priceId: string) => {
    try {
      const res = await fetch("/api/admin/plans/prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_default",
          price_id: priceId,
          plan_id: plan.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Fallo al establecer precio predeterminado")
      toast.success("Precio establecido como predeterminado en Stripe y Supabase")
      fetchPrices()
      onPriceChange?.()
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar precio predeterminado")
    }
  }

  const handleArchive = async (priceId: string) => {
    try {
      const res = await fetch("/api/admin/plans/prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "archive",
          price_id: priceId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Fallo al archivar")
      toast.success("Precio archivado en Stripe")
      fetchPrices()
      onPriceChange?.()
    } catch (err: any) {
      toast.error(err.message || "Error al archivar precio")
    }
  }

  const handleCreatePaymentLink = async (priceId: string) => {
    try {
      const res = await fetch("/api/admin/plans/prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_payment_link",
          price_id: priceId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Fallo al crear enlace")
      if (data.url) {
        navigator.clipboard.writeText(data.url)
        toast.success("Enlace de pago generado y copiado al portapapeles")
      }
    } catch (err: any) {
      toast.error(err.message || "Error al crear enlace de pago")
    }
  }

  const handleOpenCreate = () => {
    setSelectedPrice(null)
    setModalMode("create")
    setModalOpen(true)
  }

  const handleOpenEdit = (price: StripePriceItem) => {
    setSelectedPrice(price)
    setModalMode("edit")
    setModalOpen(true)
  }

  // Formato de recurrencia amigable tipo Stripe
  const formatRecurrence = (p: StripePriceItem) => {
    if (p.type === "one_time") return "Pago único"
    if (p.interval === "month" && p.interval_count === 3) return "Cada 3 meses"
    if (p.interval === "month" && p.interval_count === 6) return "Cada 6 meses"
    if (p.interval === "month" && p.interval_count === 1) return "Mensual"
    if (p.interval === "year" && p.interval_count === 1) return "Por año"
    if (p.interval === "week") return p.interval_count === 1 ? "Semanal" : `Cada ${p.interval_count} semanas`
    if (p.interval === "day") return p.interval_count === 1 ? "Diario" : `Cada ${p.interval_count} días`
    return `Cada ${p.interval_count} ${p.interval}`
  }

  const formatCreatedDate = (timestamp: number) => {
    const d = new Date(timestamp * 1000)
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/70 overflow-hidden shadow-sm">
      {/* Header Tarifas con botón + */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50 bg-muted/20">
        <div>
          <h4 className="text-base font-bold text-foreground tracking-tight">Tarifas</h4>
          <p className="text-[11px] text-muted-foreground">
            Opciones de precio activas en Stripe Gateway para {plan.name} (Precios netos sin IVA).
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleOpenCreate}
          className="h-8 w-8 p-0 rounded-md bg-transparent hover:bg-muted text-foreground border border-border/60"
          title="Crear tarifa"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabla de Tarifas */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/40 text-muted-foreground font-semibold text-[11px]">
              <th className="py-3 px-5">Precio</th>
              <th className="py-3 px-4">Descripción</th>
              <th className="py-3 px-4">Suscripciones</th>
              <th className="py-3 px-4">Fecha de creación</th>
              <th className="py-3 px-5 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                    <span>Cargando tarifas de Stripe...</span>
                  </div>
                </td>
              </tr>
            ) : prices.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  No hay tarifas registradas en Stripe para este producto. Haz clic en "+" para crear la primera.
                </td>
              </tr>
            ) : (
              prices.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-muted/30 transition-colors ${!p.active ? "opacity-50" : ""}`}
                >
                  {/* Columna Precio */}
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-foreground text-sm">
                        {p.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {p.currency}
                      </span>
                      {p.is_default && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                          Predeterminado
                        </span>
                      )}
                      {!p.active && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Archivado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mt-0.5">
                      <RefreshCw className="w-3 h-3 text-cyan-500" />
                      <span>{formatRecurrence(p)}</span>
                    </div>
                  </td>

                  {/* Columna Descripción */}
                  <td className="py-3 px-4 text-muted-foreground max-w-xs">
                    <span className="line-clamp-2">
                      {p.nickname || "Cuota recurrente de acceso a plataforma CRM y asistente IA"}
                    </span>
                    {p.lookup_key && (
                      <span className="block font-mono text-[10px] text-muted-foreground/70 mt-0.5">
                        Clave: {p.lookup_key}
                      </span>
                    )}
                  </td>

                  {/* Columna Suscripciones */}
                  <td className="py-3 px-4 text-muted-foreground font-mono">
                    {p.subscriptions_count} activas
                  </td>

                  {/* Columna Fecha */}
                  <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                    {formatCreatedDate(p.created)}
                  </td>

                  {/* Columna Acciones Menú ... */}
                  <td className="py-3 px-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-md"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64 bg-card border-border/60 text-xs">
                        <DropdownMenuItem
                          onClick={() => handleCopyPriceId(p.id)}
                          className="cursor-pointer gap-2"
                        >
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Copiar ID del precio</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-border/40" />
                        <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-2 py-1">
                          Tarifas
                        </DropdownMenuLabel>

                        <DropdownMenuItem
                          onClick={() => handleSetDefault(p.id)}
                          disabled={p.is_default || !p.active}
                          className="cursor-pointer gap-2 disabled:opacity-40"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                          <span>Establecer como precio predeterminado</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleOpenPriceBudget(p)}
                          className="cursor-pointer gap-2"
                        >
                          <Calculator className="w-3.5 h-3.5 text-primary" />
                          <span>Configurar desglose de presupuesto</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleOpenEdit(p)}
                          className="cursor-pointer gap-2"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Editar precio</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleArchive(p.id)}
                          disabled={!p.active}
                          className="cursor-pointer gap-2 disabled:opacity-40"
                        >
                          <Archive className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Archivar precio</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleArchive(p.id)}
                          className="cursor-pointer gap-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Eliminar precio</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-border/40" />
                        <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-2 py-1">
                          Aceptar pagos
                        </DropdownMenuLabel>

                        <DropdownMenuItem
                          onClick={() => handleCreatePaymentLink(p.id)}
                          className="cursor-pointer gap-2"
                        >
                          <Link2 className="w-3.5 h-3.5 text-primary" />
                          <span>Crear enlace de pago</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => {
                            window.open("https://dashboard.stripe.com/test/prices", "_blank")
                          }}
                          className="cursor-pointer gap-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Crear una nueva tabla de tarifas</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Stripe-Style Crear / Actualizar Precio */}
      <StripePriceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        plan={plan}
        initialPrice={selectedPrice}
        mode={modalMode}
        onSuccess={() => {
          fetchPrices()
          onPriceChange?.()
        }}
      />

      {/* Instancia interactiva del Desglose de Presupuestos para tarifas */}
      <CycleBudgetEditorModal
        open={budgetModalOpen}
        onOpenChange={setBudgetModalOpen}
        plan={plan}
        cycle={budgetCycle}
        onPriceApplied={() => {
          fetchPrices()
          onPriceChange?.()
        }}
      />
    </div>
  )
}

interface StripePriceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: Plan
  initialPrice: StripePriceItem | null
  mode: "create" | "edit"
  onSuccess: () => void
}

export function StripePriceModal({
  open,
  onOpenChange,
  plan,
  initialPrice,
  mode,
  onSuccess,
}: StripePriceModalProps) {
  const [submitting, setSubmitting] = useState(false)

  // Tipo de tarifa: Recurrente vs Puntual
  const [feeType, setFeeType] = useState<"recurring" | "one_time">("recurring")

  // Modelo de tarifas (Tarifa plana por defecto)
  const [pricingModel] = useState("flat_fee")

  // Importe
  const [amount, setAmount] = useState("651.00")
  const [currency, setCurrency] = useState("MXN")

  // Impuestos incluidos: No
  const [taxInclusive] = useState("No")

  // Modal para abrir instancia del Desglose de Presupuestos
  const [budgetEditorOpen, setBudgetEditorOpen] = useState(false)

  // Periodo de facturación
  // Opciones: "daily" | "weekly" | "monthly" | "yearly" | "quarterly" | "semiannual" | "custom"
  const [billingPeriodChoice, setBillingPeriodChoice] = useState("quarterly")
  const [customIntervalCount, setCustomIntervalCount] = useState("3")
  const [customIntervalUnit, setCustomIntervalUnit] = useState<"day" | "week" | "month" | "year">("month")

  // Avanzado
  const [description, setDescription] = useState(
    "Cuota recurrente trimestral de acceso a plataforma CRM y asistente IA"
  )
  const [lookupKey, setLookupKey] = useState("kinexting_crm_quarter_tier1")

  // Vista previa interactiva
  const [previewUnits, setPreviewUnits] = useState(1)
  const [previewCountry] = useState("Mexico")

  // Cargar datos iniciales si es edición
  useEffect(() => {
    if (initialPrice && mode === "edit") {
      setFeeType(initialPrice.type)
      setAmount(initialPrice.amount.toFixed(2))
      setCurrency(initialPrice.currency)
      setDescription(initialPrice.nickname || "")
      setLookupKey(initialPrice.lookup_key || "")

      if (initialPrice.type === "recurring") {
        if (initialPrice.interval === "month" && initialPrice.interval_count === 3) {
          setBillingPeriodChoice("quarterly")
        } else if (initialPrice.interval === "year" && initialPrice.interval_count === 1) {
          setBillingPeriodChoice("yearly")
        } else if (initialPrice.interval === "month" && initialPrice.interval_count === 1) {
          setBillingPeriodChoice("monthly")
        } else if (initialPrice.interval === "month" && initialPrice.interval_count === 6) {
          setBillingPeriodChoice("semiannual")
        } else if (initialPrice.interval === "day") {
          setBillingPeriodChoice("daily")
        } else if (initialPrice.interval === "week") {
          setBillingPeriodChoice("weekly")
        } else {
          setBillingPeriodChoice("custom")
          setCustomIntervalCount(String(initialPrice.interval_count || 1))
          setCustomIntervalUnit(initialPrice.interval || "month")
        }
      }
    } else {
      // Valores por defecto
      setFeeType("recurring")
      setAmount("651.00")
      setCurrency("MXN")
      setBillingPeriodChoice("quarterly")
      setCustomIntervalCount("3")
      setCustomIntervalUnit("month")
      setDescription("Cuota recurrente trimestral de acceso a plataforma CRM y asistente IA")
      setLookupKey("kinexting_crm_quarter_tier1")
    }
  }, [initialPrice, mode, open])

  // Desglose de impuestos de la vista previa:
  // "Los precios no incluyen IVA" -> El subtotal es el importe base, se le suma 16% de IVA
  const numericAmount = Math.max(0, Number(amount) || 0)
  const previewSubtotal = numericAmount * previewUnits
  const previewIva = previewSubtotal * 0.16
  const previewTotal = previewSubtotal + previewIva

  const periodLabel = useMemo(() => {
    if (feeType === "one_time") return "pago único"
    if (billingPeriodChoice === "quarterly") return "3 meses"
    if (billingPeriodChoice === "yearly") return "año"
    if (billingPeriodChoice === "monthly") return "mes"
    if (billingPeriodChoice === "semiannual") return "6 meses"
    if (billingPeriodChoice === "weekly") return "semana"
    if (billingPeriodChoice === "daily") return "día"
    return `${customIntervalCount} ${customIntervalUnit}s`
  }, [feeType, billingPeriodChoice, customIntervalCount, customIntervalUnit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Resolver intervalo y conteo según el selector
      let interval: "day" | "week" | "month" | "year" = "month"
      let intervalCount = 1

      if (feeType === "recurring") {
        if (billingPeriodChoice === "daily") {
          interval = "day"
          intervalCount = 1
        } else if (billingPeriodChoice === "weekly") {
          interval = "week"
          intervalCount = 1
        } else if (billingPeriodChoice === "monthly") {
          interval = "month"
          intervalCount = 1
        } else if (billingPeriodChoice === "yearly") {
          interval = "year"
          intervalCount = 1
        } else if (billingPeriodChoice === "quarterly") {
          interval = "month"
          intervalCount = 3
        } else if (billingPeriodChoice === "semiannual") {
          interval = "month"
          intervalCount = 6
        } else if (billingPeriodChoice === "custom") {
          interval = customIntervalUnit
          intervalCount = Number(customIntervalCount) || 1
        }
      }

      if (mode === "edit" && initialPrice) {
        // En Stripe, el monto de un precio no es mutable: actualizamos metadatos o creamos reemplazo
        const res = await fetch("/api/admin/plans/prices", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "edit_meta",
            price_id: initialPrice.id,
            description,
            lookup_key: lookupKey,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Error al actualizar precio")
        toast.success("Precio actualizado exitosamente en Stripe")
      } else {
        // Crear nuevo precio en Stripe
        const res = await fetch("/api/admin/plans/prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_id: plan.id,
            amount: numericAmount,
            currency,
            type: feeType,
            recurring_interval: interval,
            recurring_interval_count: intervalCount,
            tax_behavior: "exclusive",
            description,
            lookup_key: lookupKey,
            set_as_default: false,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Error al crear precio")
        toast.success(data.message || "Tarifa creada exitosamente en Stripe")
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "Error al procesar tarifa")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border-border/60">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <DialogTitle className="text-lg font-bold text-foreground">
            {mode === "edit" ? `Actualizar precio en ${plan.name}` : `Crear precio en ${plan.name}`}
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <span>Cierra la vista previa</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-12 max-h-[75vh] overflow-y-auto">
            {/* Columna Izquierda: Configuración del precio (7 cols) */}
            <div className="md:col-span-7 p-6 space-y-5 border-r border-border/40">
              {/* Selector Recurrente vs Puntual */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFeeType("recurring")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    feeType === "recurring"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border/60 hover:bg-muted/30"
                  }`}
                >
                  <span className="block font-semibold text-xs text-foreground">Recurrente</span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    Cobrar una comisión en curso
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeeType("one_time")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    feeType === "one_time"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border/60 hover:bg-muted/30"
                  }`}
                >
                  <span className="block font-semibold text-xs text-foreground">Puntual</span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    Cobrar una comisión única
                  </span>
                </button>
              </div>

              {/* Modelo de tarifas */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Elige tu modelo de tarifas</Label>
                <select
                  value={pricingModel}
                  disabled
                  className="w-full h-9 px-3 rounded-md bg-muted/40 border border-border/60 text-xs text-foreground cursor-not-allowed"
                >
                  <option value="flat_fee">Tarifa plana</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Un precio único y fijo. <span className="text-cyan-500 hover:underline cursor-pointer">Consulta la documentación</span>
                </p>
              </div>

              {/* Sección Precio */}
              <div className="space-y-3 pt-2 border-t border-border/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Precio</h4>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">Importe (obligatorio)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBudgetEditorOpen(true)}
                      className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1.5 font-semibold"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Configurar Desglose de Presupuesto</span>
                    </Button>
                  </div>
                  <div className="flex rounded-md border border-border/60 overflow-hidden bg-background focus-within:ring-2 focus-within:ring-primary">
                    <span className="px-3 py-2 bg-muted/30 text-muted-foreground text-xs font-mono font-medium border-r border-border/40">
                      {currency}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="border-0 rounded-none h-9 text-xs font-mono focus-visible:ring-0 shadow-none"
                      required
                    />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="px-2.5 py-1 bg-muted/30 text-xs font-mono text-foreground border-l border-border/40 cursor-pointer"
                    >
                      <option value="MXN">MXN</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Los precios no incluyen IVA. Haz clic en "Configurar Desglose" para editar conceptos, servicios y comisiones de gestión.
                  </p>
                </div>

                {/* Incluir impuestos en el precio: No */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Incluir impuestos en el precio
                    </Label>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <select
                    value={taxInclusive}
                    disabled
                    className="w-full h-9 px-3 rounded-md bg-muted/30 border border-border/60 text-xs text-foreground"
                  >
                    <option value="No">No</option>
                  </select>
                  <p className="text-[10px] text-cyan-500 font-mono">
                    Los precios de los planes no incluyen IVA. Se desglosa 16% adicional de IVA en el comprobante fiscal.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toast.info("Divisa multimoneda activada para MXN y USD")}
                  className="text-xs font-medium text-primary hover:underline block pt-1"
                >
                  + Añadir un precio por divisa
                </button>
              </div>

              {/* Periodo de facturación */}
              {feeType === "recurring" && (
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <Label className="text-xs font-semibold text-foreground">Periodo de facturación</Label>
                  <select
                    value={billingPeriodChoice}
                    onChange={(e) => setBillingPeriodChoice(e.target.value)}
                    className="w-full h-9 px-3 rounded-md bg-background border border-border/60 text-xs text-foreground cursor-pointer"
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                    <option value="yearly">Anual</option>
                    <option value="quarterly">Cada 3 meses</option>
                    <option value="semiannual">Cada 6 meses</option>
                    <option value="custom">Personalizado</option>
                  </select>

                  {billingPeriodChoice === "custom" && (
                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-xs text-muted-foreground">cada</span>
                      <Input
                        type="number"
                        min="1"
                        value={customIntervalCount}
                        onChange={(e) => setCustomIntervalCount(e.target.value)}
                        className="w-20 h-9 text-xs font-mono"
                      />
                      <select
                        value={customIntervalUnit}
                        onChange={(e) => setCustomIntervalUnit(e.target.value as any)}
                        className="flex-1 h-9 px-3 rounded-md bg-background border border-border/60 text-xs text-foreground cursor-pointer"
                      >
                        <option value="day">días</option>
                        <option value="week">semanas</option>
                        <option value="month">meses</option>
                        <option value="year">años</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Sección Avanzado */}
              <div className="space-y-3 pt-2 border-t border-border/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Avanzado</h4>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Descripción del precio</Label>
                  <p className="text-[10px] text-muted-foreground">
                    Se utiliza para organizar los precios. No se muestra a los clientes.
                  </p>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Cuota recurrente trimestral de acceso a plataforma CRM y asistente IA"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Clave de búsqueda</Label>
                  <p className="text-[10px] text-muted-foreground">
                    Las claves de búsqueda permiten gestionar y hacer cambios en los precios en el futuro más fácilmente con una clave única (por ejemplo, standard_monthly) por cada precio.
                  </p>
                  <Input
                    value={lookupKey}
                    onChange={(e) => setLookupKey(e.target.value)}
                    placeholder="kinexting_crm_quarter_tier1"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha: Vista previa tipo Stripe (5 cols) */}
            <div className="md:col-span-5 p-6 bg-muted/20 flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div>
                  <h4 className="text-base font-bold text-foreground tracking-tight">Vista previa</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Calcula los importes totales de acuerdo con el modelo de precios, la cantidad unitaria y los impuestos.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Cantidad por unidad</Label>
                  <Input
                    type="number"
                    min="1"
                    value={previewUnits}
                    onChange={(e) => setPreviewUnits(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Ubicación</Label>
                  <select
                    value={previewCountry}
                    disabled
                    className="w-full h-9 px-3 rounded-md bg-background border border-border/60 text-xs text-foreground cursor-default"
                  >
                    <option value="Mexico">🇲🇽 Mexico</option>
                  </select>
                </div>

                {/* Math breakdown */}
                <div className="pt-4 border-t border-border/40 space-y-3">
                  <div className="text-xs text-muted-foreground font-mono">
                    {previewUnits} × {numericAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {currency} ={" "}
                    <strong className="text-foreground">
                      {previewSubtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {currency}
                    </strong>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-mono font-medium text-foreground">
                        {previewSubtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {currency}
                      </span>
                    </div>

                    <div className="flex justify-between text-muted-foreground">
                      <span>IVA 16 %</span>
                      <span className="font-mono font-medium text-cyan-500">
                        {previewIva.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {currency}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline pt-2 border-t border-border/40">
                      <div>
                        <span className="font-bold text-foreground block">
                          Total por {periodLabel}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Facturado al inicio del período
                        </span>
                      </div>
                      <span className="text-base font-extrabold font-mono text-foreground">
                        {previewTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="h-9 px-4 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-5 text-xs font-semibold shadow-sm"
                >
                  {submitting
                    ? "Guardando..."
                    : mode === "edit"
                    ? "Actualizar"
                    : "Crear precio"}
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Instancia interactiva completa del Desglose de Presupuestos para esta tarifa */}
        <CycleBudgetEditorModal
          open={budgetEditorOpen}
          onOpenChange={setBudgetEditorOpen}
          plan={plan}
          cycle={billingPeriodChoice === "yearly" ? "annual" : "quarterly"}
          onPriceApplied={(calcPrice) => {
            setAmount(calcPrice.toFixed(2))
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
