"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Receipt,
  Sparkles,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Copy,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Cpu,
  Building,
  ArrowRight,
  Calculator,
  Server,
  KeyRound,
  ExternalLink,
  Save,
  Flame,
  Percent,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  Info,
  Check,
  X,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Plan,
  PlanBudgetBreakdown,
  CycleBudgetBreakdown,
  BudgetItem,
  BudgetItemKind,
} from "@/lib/types/admin"
import { calculateStripeFees } from "@/lib/stripe-fees"
import { toast } from "sonner"

interface PlanBudgetBreakdownProps {
  plans: Plan[]
  initialPlanId?: string
  onPlansUpdated?: () => void
}

export function PlanBudgetBreakdownManager({
  plans,
  initialPlanId,
  onPlansUpdated,
}: PlanBudgetBreakdownProps) {
  // Estado de vista: si viene initialPlanId se abre directo en plan_detail
  const [activeView, setActiveView] = useState<"dashboard" | "plan_detail" | "simulator">(
    initialPlanId ? "plan_detail" : "dashboard"
  )
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    initialPlanId || plans[0]?.id || "asistente"
  )
  const [selectedCycle, setSelectedCycle] = useState<"quarterly" | "annual">("quarterly")
  const [filterKind, setFilterKind] = useState<"all" | "costo" | "servicio">("all")

  // Tipos de cambio configurables con 2 decimales (persistentes en BD)
  const [exchangeRateUsd, setExchangeRateUsd] = useState<number>(20.00)
  const [exchangeRateEur, setExchangeRateEur] = useState<number>(21.40)
  const [tempRateUsd, setTempRateUsd] = useState<string>("20.00")
  const [tempRateEur, setTempRateEur] = useState<string>("21.40")
  const [currencyPopoverOpen, setCurrencyPopoverOpen] = useState(false)
  const [isSavingCurrency, setIsSavingCurrency] = useState(false)

  // Cargar configuración de divisas persistente desde la base de datos al montar
  useEffect(() => {
    fetch("/api/admin/currency")
      .then((res) => res.json())
      .then((data) => {
        if (data.exchange_rate_usd) {
          const usd = Number(data.exchange_rate_usd) || 20.00
          setExchangeRateUsd(usd)
          setTempRateUsd(String(usd))
        }
        if (data.exchange_rate_eur) {
          const eur = Number(data.exchange_rate_eur) || 21.40
          setExchangeRateEur(eur)
          setTempRateEur(String(eur))
        }
      })
      .catch((err) => console.error("Error al cargar divisas de BD:", err))
  }, [])

  // Plan actualmente seleccionado
  const currentPlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId) || plans[0]
  }, [plans, selectedPlanId])

  // Presupuesto local del ciclo activo
  const [currentCycleBudget, setCurrentCycleBudget] = useState<CycleBudgetBreakdown>({
    target_price_mxn: 651,
    markup_percentage: 25,
    exchange_rate_usd: 19.85,
    exchange_rate_eur: 21.40,
    items: [],
  })

  // Estado del Simulador (no persistente)
  const [isSimulator, setIsSimulator] = useState(false)
  const [simulatorName, setSimulatorName] = useState("Simulación Proyección 2027")

  // Modal Agregar / Editar Concepto (SIN categorías de conceptos)
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [itemFormData, setItemFormData] = useState<BudgetItem>({
    id: "",
    name: "",
    description: "",
    provider: "",
    kind: "costo",
    amount_mxn: 100,
    amount_usd: 5.04,
    amount_eur: 4.67,
    currency: "MXN",
    markup_percent: 0,
  })

  // Modal de confirmaciones dobles para Stripe
  const [firstConfirmOpen, setFirstConfirmOpen] = useState(false)
  const [secondConfirmOpen, setSecondConfirmOpen] = useState(false)
  const [savingToStripe, setSavingToStripe] = useState(false)

  // Sincronizar si cambia initialPlanId desde la URL
  useEffect(() => {
    if (initialPlanId) {
      setSelectedPlanId(initialPlanId)
      setActiveView("plan_detail")
      setIsSimulator(false)
    }
  }, [initialPlanId])

  // Cargar presupuesto cuando cambia el plan o el ciclo
  useEffect(() => {
    if (isSimulator) return

    if (currentPlan && currentPlan.budget_breakdown) {
      const cycleData = currentPlan.budget_breakdown[selectedCycle]
      if (cycleData && Array.isArray(cycleData.items) && cycleData.items.length > 0) {
        // Normalizar items existentes para que kind sea 'costo' o 'servicio', filtrando comisiones obsoletas
        const normalizedItems: BudgetItem[] = cycleData.items
          .filter((it: any) => {
            if (it.id === "stripe_fee" || it.id === "stripe" || it.id === "stripe_yr" || it.category === "comision") {
              return false
            }
            return true
          })
          .map((it) => {
            let kind: BudgetItemKind = it.kind
            if (!kind) {
              kind = (it as any).category === "licencia" || (it as any).category === "margen" || (it as any).category === "soporte"
                ? "servicio"
                : "costo"
            }
            return {
              id: it.id,
              name: it.name,
              description: it.description || "",
              provider: it.provider || (kind === "costo" ? "Proveedor Cloud/IA" : "Kinexting Core"),
              kind,
              amount_mxn: Number(it.amount_mxn) || 0,
              amount_usd: Number(it.amount_usd) || Math.round((Number(it.amount_mxn) / exchangeRateUsd) * 100) / 100,
              amount_eur: it.amount_eur || Math.round((Number(it.amount_mxn) / exchangeRateEur) * 100) / 100,
              markup_percent: it.markup_percent || 0,
            }
          })

        setCurrentCycleBudget({
          ...cycleData,
          exchange_rate_usd: cycleData.exchange_rate_usd || exchangeRateUsd,
          exchange_rate_eur: (cycleData as any).exchange_rate_eur || exchangeRateEur,
          items: normalizedItems,
        })
        if (cycleData.exchange_rate_usd) setExchangeRateUsd(cycleData.exchange_rate_usd)
        if ((cycleData as any).exchange_rate_eur) setExchangeRateEur((cycleData as any).exchange_rate_eur)
        return
      }
    }

    // Fallback de inicialización
    const fallbackTarget =
      selectedCycle === "annual"
        ? Number(currentPlan?.price_annual_mxn) || 2464
        : Number(currentPlan?.price_quarterly_mxn) || 651

    const defaultItems: BudgetItem[] = [
      {
        id: "cost_ia",
        name: "Consumo de Tokens IA WhatsApp",
        description: "Inferencia LLM y respuestas automáticas de agentes 24/7",
        provider: "OpenAI / Claude API",
        kind: "costo",
        amount_mxn: Math.round(fallbackTarget * 0.25),
        amount_usd: Math.round((fallbackTarget * 0.25 / exchangeRateUsd) * 100) / 100,
        amount_eur: Math.round((fallbackTarget * 0.25 / exchangeRateEur) * 100) / 100,
        markup_percent: 20, // 20% comisión de gestión
      },
      {
        id: "cost_infra",
        name: "Infraestructura Cloud & Base de Datos",
        description: "Servidores Postgres, almacenamiento y túneles webhooks",
        provider: "Supabase / AWS",
        kind: "costo",
        amount_mxn: Math.round(fallbackTarget * 0.15),
        amount_usd: Math.round((fallbackTarget * 0.15 / exchangeRateUsd) * 100) / 100,
        amount_eur: Math.round((fallbackTarget * 0.15 / exchangeRateEur) * 100) / 100,
        markup_percent: 15, // 15% comisión de gestión
      },
      {
        id: "srv_crm",
        name: "Licencia de Plataforma CRM Kinexting",
        description: "Acceso ilimitado multiusuario a sistema CRM y agenda",
        provider: "Kinexting Core",
        kind: "servicio",
        amount_mxn: Math.round(fallbackTarget * 0.40),
        amount_usd: Math.round((fallbackTarget * 0.40 / exchangeRateUsd) * 100) / 100,
        amount_eur: Math.round((fallbackTarget * 0.40 / exchangeRateEur) * 100) / 100,
        markup_percent: 0,
      },
      {
        id: "srv_soporte",
        name: "Soporte Técnico Especializado & Monitoreo",
        description: "Supervisión proactiva y mantenimiento continuo para agentes",
        provider: "Kinexting Soporte",
        kind: "servicio",
        amount_mxn: Math.round(fallbackTarget * 0.20),
        amount_usd: Math.round((fallbackTarget * 0.20 / exchangeRateUsd) * 100) / 100,
        amount_eur: Math.round((fallbackTarget * 0.20 / exchangeRateEur) * 100) / 100,
        markup_percent: 0,
      },
    ]

    setCurrentCycleBudget({
      target_price_mxn: fallbackTarget,
      markup_percentage: 25,
      exchange_rate_usd: exchangeRateUsd,
      exchange_rate_eur: exchangeRateEur,
      items: defaultItems,
    })
  }, [currentPlan, selectedCycle, isSimulator])

  // Guardar configuración de divisas en base de datos para el presupuesto actual y los futuros
  const handleSaveCurrency = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const validUsd = Math.round(Math.max(0.01, parseFloat(tempRateUsd) || 20.00) * 100) / 100
    const validEur = Math.round(Math.max(0.01, parseFloat(tempRateEur) || 21.40) * 100) / 100

    setIsSavingCurrency(true)
    try {
      const planIdToUpdate = isSimulator ? null : selectedPlanId

      const res = await fetch("/api/admin/currency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchange_rate_usd: validUsd,
          exchange_rate_eur: validEur,
          plan_id: planIdToUpdate,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Error al guardar configuración de divisas")
      }

      setExchangeRateUsd(validUsd)
      setExchangeRateEur(validEur)

      // Actualizar ítems locales con las nuevas equivalencias en USD y EUR
      const updatedItems = currentCycleBudget.items.map((it) => ({
        ...it,
        amount_usd: Math.round((Number(it.amount_mxn || 0) / validUsd) * 100) / 100,
        amount_eur: Math.round((Number(it.amount_mxn || 0) / validEur) * 100) / 100,
      }))

      setCurrentCycleBudget((prev) => ({
        ...prev,
        exchange_rate_usd: validUsd,
        exchange_rate_eur: validEur,
        items: updatedItems,
      }))

      toast.success(
        `Tipos de cambio guardados en BD ($1 USD = $${validUsd.toFixed(2)} MXN, €1 EUR = $${validEur.toFixed(2)} MXN) para el presupuesto actual y futuros`
      )
      setCurrencyPopoverOpen(false)
      onPlansUpdated?.()
    } catch (err: any) {
      toast.error(err.message || "Error al guardar divisas en base de datos")
    } finally {
      setIsSavingCurrency(false)
    }
  }

  // CÁLCULOS MATEMÁTICOS DE COSTOS Y SERVICIOS BRINDADOS
  // 1. Costos Operativos Directos
  const totalCostosMxn = useMemo(() => {
    return currentCycleBudget.items
      .filter((it) => it.kind === "costo")
      .reduce((sum, it) => sum + Number(it.amount_mxn || 0), 0)
  }, [currentCycleBudget.items])

  const totalCostosUsd = useMemo(() => {
    return Math.round((totalCostosMxn / (exchangeRateUsd || 19.85)) * 100) / 100
  }, [totalCostosMxn, exchangeRateUsd])

  // 2. Comisiones opcionales de gestión sobre costos (se suman a Servicios Brindados)
  const totalComisionesGestionMxn = useMemo(() => {
    return currentCycleBudget.items
      .filter((it) => it.kind === "costo" && Number(it.markup_percent || 0) > 0)
      .reduce((sum, it) => {
        const cost = Number(it.amount_mxn || 0)
        const pct = Number(it.markup_percent || 0)
        return sum + (cost * pct) / 100
      }, 0)
  }, [currentCycleBudget.items])

  // 3. Servicios Directos Brindados por Kinexting
  const totalServiciosDirectosMxn = useMemo(() => {
    return currentCycleBudget.items
      .filter((it) => it.kind === "servicio")
      .reduce((sum, it) => sum + Number(it.amount_mxn || 0), 0)
  }, [currentCycleBudget.items])

  const totalServiciosDirectosUsd = useMemo(() => {
    return Math.round((totalServiciosDirectosMxn / (exchangeRateUsd || 19.85)) * 100) / 100
  }, [totalServiciosDirectosMxn, exchangeRateUsd])

  const totalComisionesGestionUsd = useMemo(() => {
    return Math.round((totalComisionesGestionMxn / (exchangeRateUsd || 19.85)) * 100) / 100
  }, [totalComisionesGestionMxn, exchangeRateUsd])

  // Total Servicios Brindados = Servicios directos + Comisiones de gestión
  const totalServiciosBrindadosMxn = useMemo(() => {
    return totalServiciosDirectosMxn + totalComisionesGestionMxn
  }, [totalServiciosDirectosMxn, totalComisionesGestionMxn])

  const totalServiciosBrindadosUsd = useMemo(() => {
    return Math.round((totalServiciosBrindadosMxn / (exchangeRateUsd || 19.85)) * 100) / 100
  }, [totalServiciosBrindadosMxn, exchangeRateUsd])

  // 4. Subtotal Neto Líquido Kinexting (sin IVA ni comisiones de Stripe) = Costos + Servicios Directos + Comisiones de Gestión
  const precioBaseNetoKinextingMxn = useMemo(() => {
    const rawTotal = totalCostosMxn + totalServiciosDirectosMxn + totalComisionesGestionMxn
    return Math.round(rawTotal * 100) / 100
  }, [totalCostosMxn, totalServiciosDirectosMxn, totalComisionesGestionMxn])

  // Alias para retrocompatibilidad
  const precioSugeridoStripeNetoMxn = precioBaseNetoKinextingMxn

  // 5. Motor Oficial de Comisiones Stripe México (El cliente paga las comisiones: 5% + $3 MXN + 0.4% + IVA)
  const stripeFees = useMemo(() => {
    return calculateStripeFees(precioBaseNetoKinextingMxn, {
      processingRate: 0.05,
      fixedFeeMxn: 3.0,
      invoicingRate: 0.004,
      exchangeRateUsd,
      exchangeRateEur,
      clientPaysFees: true,
    })
  }, [precioBaseNetoKinextingMxn, exchangeRateUsd, exchangeRateEur])

  // 6. PRECIO QUE SE PONE EN STRIPE Y CATÁLOGO = NETO LÍQUIDO + COMISIONES DE STRIPE CALCULADAS DEL PRESUPUESTO
  const precioOficialStripeNetoMxn = useMemo(() => {
    return Math.round((precioBaseNetoKinextingMxn + stripeFees.stripeFeeTotalMxn) * 100) / 100
  }, [precioBaseNetoKinextingMxn, stripeFees.stripeFeeTotalMxn])

  // 7. IVA al Cliente (16% SAT sobre precio oficial de Stripe / Subtotal)
  const ivaClienteOficialMxn = useMemo(() => {
    return Math.round(precioOficialStripeNetoMxn * 0.16 * 100) / 100
  }, [precioOficialStripeNetoMxn])

  // 8. Importe Total de la Transacción (Subtotal + IVA 16% SAT cobrado al cliente en pasarela)
  const importeTotalTransaccionOficialMxn = useMemo(() => {
    return Math.round((precioOficialStripeNetoMxn + ivaClienteOficialMxn) * 100) / 100
  }, [precioOficialStripeNetoMxn, ivaClienteOficialMxn])

  // 9. Comisiones reales retenidas por Stripe México sobre el Importe Total cobrado ($778.45 MXN)
  const stripeFeesSobreTotalCobrado = useMemo(() => {
    return {
      proc: stripeFees.processingFeeMxn,
      fixed: stripeFees.fixedFeeMxn,
      inv: stripeFees.invoicingFeeMxn,
      sub: stripeFees.stripeFeeSubtotalMxn,
      vat: stripeFees.stripeFeeVatMxn,
      totalFee: stripeFees.stripeFeeTotalMxn,
    }
  }, [stripeFees])

  // 10. Depósito Neto Líquido Kinexting en Banco (Total - Comisiones Stripe - IVA SAT)
  const depositoNetoBancoMxn = useMemo(() => {
    return Math.round((importeTotalTransaccionOficialMxn - stripeFees.stripeFeeTotalMxn - ivaClienteOficialMxn) * 100) / 100
  }, [importeTotalTransaccionOficialMxn, stripeFees.stripeFeeTotalMxn, ivaClienteOficialMxn])

  // 11. Beneficio Neto Real de Kinexting (Depósito neto - Costos operativos directos)
  const beneficioNetoRealMxn = useMemo(() => {
    return Math.round((depositoNetoBancoMxn - totalCostosMxn) * 100) / 100
  }, [depositoNetoBancoMxn, totalCostosMxn])

  // Iniciar Simulador Libre (Nuevo o Clonado)
  const handleStartSimulator = (sourcePlan?: Plan) => {
    setIsSimulator(true)
    setActiveView("simulator")

    if (sourcePlan && sourcePlan.budget_breakdown) {
      const cycleData = sourcePlan.budget_breakdown[selectedCycle]
      if (cycleData) {
        const cloned: CycleBudgetBreakdown = JSON.parse(JSON.stringify(cycleData))
        setCurrentCycleBudget(cloned)
        setSimulatorName(`Simulación (Copia de ${sourcePlan.name})`)
        toast.info(`Simulador cargado con la estructura de "${sourcePlan.name}". Los cambios no afectarán el plan en vivo.`)
        return
      }
    }

    setSimulatorName("Simulador Personalizado de Costos")
    setCurrentCycleBudget({
      target_price_mxn: 850,
      markup_percentage: 30,
      exchange_rate_usd: exchangeRateUsd,
      exchange_rate_eur: exchangeRateEur,
      items: [
        {
          id: "sim_ia",
          name: "Tokens GPT-4o / Claude 3.5",
          description: "Inferencia y automatización",
          provider: "OpenAI",
          kind: "costo",
          amount_mxn: 200,
          amount_usd: Math.round((200 / exchangeRateUsd) * 100) / 100,
          amount_eur: Math.round((200 / exchangeRateEur) * 100) / 100,
          markup_percent: 20,
        },
        {
          id: "sim_crm",
          name: "Licencia de Plataforma CRM Base",
          description: "Licencia y gestión de CRM",
          provider: "Kinexting Core",
          kind: "servicio",
          amount_mxn: 350,
          amount_usd: Math.round((350 / exchangeRateUsd) * 100) / 100,
          amount_eur: Math.round((350 / exchangeRateEur) * 100) / 100,
          markup_percent: 0,
        },
        {
          id: "sim_soporte",
          name: "Soporte y Configuración Continua",
          description: "Atención técnica especializada",
          provider: "Kinexting Soporte",
          kind: "servicio",
          amount_mxn: 200,
          amount_usd: Math.round((200 / exchangeRateUsd) * 100) / 100,
          amount_eur: Math.round((200 / exchangeRateEur) * 100) / 100,
          markup_percent: 0,
        },
      ],
    })
    toast.info("Simulador en blanco creado. Experimenta sin riesgo.")
  }

  const handleExitSimulator = () => {
    setIsSimulator(false)
    setActiveView("dashboard")
  }

  // Modal Agregar / Editar Concepto (SIN categoría)
  const handleOpenAddItem = (defaultKind: BudgetItemKind = "costo") => {
    setEditingItemIndex(null)
    setItemFormData({
      id: `item_${Date.now()}`,
      name: "",
      description: "",
      provider: defaultKind === "costo" ? "OpenAI" : "Kinexting Core",
      kind: defaultKind,
      amount_mxn: 150,
      amount_usd: Math.round((150 / exchangeRateUsd) * 100) / 100,
      amount_eur: Math.round((150 / exchangeRateEur) * 100) / 100,
      currency: "MXN",
      markup_percent: 0,
    })
    setItemModalOpen(true)
  }

  const handleOpenEditItem = (item: BudgetItem, index: number) => {
    setEditingItemIndex(index)
    setItemFormData({ ...item })
    setItemModalOpen(true)
  }

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemFormData.name.trim()) {
      toast.error("El nombre del concepto es obligatorio")
      return
    }

    const updatedItems = [...currentCycleBudget.items]
    const mxn = Number(itemFormData.amount_mxn) || 0
    const usd = Math.round((mxn / exchangeRateUsd) * 100) / 100
    const eur = Math.round((mxn / exchangeRateEur) * 100) / 100

    const itemToSave: BudgetItem = {
      ...itemFormData,
      amount_mxn: mxn,
      amount_usd: usd,
      amount_eur: eur,
      markup_percent: itemFormData.kind === "costo" ? Math.max(0, Number(itemFormData.markup_percent) || 0) : 0,
    }

    if (editingItemIndex !== null) {
      updatedItems[editingItemIndex] = itemToSave
    } else {
      updatedItems.push(itemToSave)
    }

    setCurrentCycleBudget({
      ...currentCycleBudget,
      items: updatedItems,
    })

    setItemModalOpen(false)
    toast.success(editingItemIndex !== null ? "Concepto actualizado" : "Concepto agregado al desglose")
  }

  const handleDeleteItem = (index: number) => {
    const updated = currentCycleBudget.items.filter((_, i) => i !== index)
    setCurrentCycleBudget({
      ...currentCycleBudget,
      items: updated,
    })
    toast.success("Concepto eliminado del presupuesto")
  }

  // Flujo de Guardado con Doble Confirmación hacia Stripe
  const handleRequestSave = () => {
    if (isSimulator) {
      toast.info("El simulador es solo para pruebas en memoria y no se guarda en Stripe ni Supabase.")
      return
    }
    setFirstConfirmOpen(true)
  }

  const handleProceedToSecondConfirm = () => {
    setFirstConfirmOpen(false)
    setSecondConfirmOpen(true)
  }

  const handleFinalSaveToStripe = async () => {
    setSavingToStripe(true)
    try {
      // Regla de negocio oficial: El precio que se publica en Stripe debe ser el Neto Líquido + las comisiones de Stripe calculadas del presupuesto
      const targetMxn = precioOficialStripeNetoMxn

      const payload = {
        plan_id: currentPlan.id,
        cycle: selectedCycle,
        budget_breakdown: {
          [selectedCycle]: {
            ...currentCycleBudget,
            target_price_mxn: targetMxn,
            base_net_price_mxn: precioBaseNetoKinextingMxn,
            stripe_fees_mxn: stripeFees.stripeFeeTotalMxn,
            exchange_rate_usd: exchangeRateUsd,
            exchange_rate_eur: exchangeRateEur,
          },
        },
        sync_stripe_price: true,
        confirmed: true,
      }

      const res = await fetch("/api/admin/plans/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al actualizar presupuesto")

      toast.success(data.message || `Presupuesto guardado y precio publicado en Stripe a $${targetMxn} MXN (Neto $${precioBaseNetoKinextingMxn} + Comisiones $${stripeFees.stripeFeeTotalMxn})`)
      setSecondConfirmOpen(false)
      onPlansUpdated?.()
    } catch (err: any) {
      toast.error(err.message || "Error al sincronizar con Stripe")
    } finally {
      setSavingToStripe(false)
    }
  }

  // Filtrado de conceptos en la tabla detallada (SOLO por tipo: costo o servicio)
  const filteredDetailedItems = useMemo(() => {
    if (filterKind === "all") return currentCycleBudget.items
    return currentCycleBudget.items.filter((it) => it.kind === filterKind)
  }, [currentCycleBudget.items, filterKind])

  return (
    <div className="space-y-6">
      {/* 1. BANNER DE MODO SIMULADOR (ALTO CONTRASTE WCAG) */}
      {isSimulator && (
        <div className="p-4 rounded-xl border border-amber-600/40 bg-amber-50 dark:bg-amber-950/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-amber-950 dark:text-amber-100 block">
                MODO SIMULADOR ACTIVO ({simulatorName})
              </span>
              <p className="text-[11px] text-amber-900/90 dark:text-amber-200/90 font-medium">
                Entorno volátil en memoria. Los cálculos no se guardan en Supabase ni sobreescriben precios en Stripe Gateway.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExitSimulator}
              className="h-8 text-xs font-semibold border-amber-700/30 text-amber-950 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/40"
            >
              Salir del Simulador
            </Button>
          </div>
        </div>
      )}

      {/* 2. NAVEGACIÓN Y SELECTORES DE PLAN, CICLO Y TIPOS DE CAMBIO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        {/* Pestañas de Vistas */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={activeView === "dashboard" && !isSimulator ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsSimulator(false)
              setActiveView("dashboard")
            }}
            className="h-8 text-xs gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dashboard de Planes</span>
          </Button>

          <Button
            variant={activeView === "plan_detail" && !isSimulator ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsSimulator(false)
              setActiveView("plan_detail")
            }}
            className="h-8 text-xs gap-1.5"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Desglose de: {currentPlan?.name}</span>
          </Button>

          <Button
            variant={isSimulator ? "default" : "outline"}
            size="sm"
            onClick={() => handleStartSimulator()}
            className={`h-8 text-xs gap-1.5 ${
              isSimulator
                ? "bg-amber-600 hover:bg-amber-700 text-white font-bold"
                : "border-amber-600/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nuevo Simulador Libre</span>
          </Button>
        </div>

        {/* Controles de Configuración: Tipos de Cambio + Ciclos */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Menú Contextual de Divisas (Persistente en BD) */}
          <Popover
            open={currencyPopoverOpen}
            onOpenChange={(isOpen) => {
              setCurrencyPopoverOpen(isOpen)
              if (isOpen) {
                setTempRateUsd(String(exchangeRateUsd))
                setTempRateEur(String(exchangeRateEur))
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 text-xs border-border/70 hover:bg-muted/40 font-mono shadow-sm bg-card"
                title="Configuración contextual de tipos de cambio (guardado en BD)"
              >
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-semibold text-foreground">$1 USD = ${exchangeRateUsd.toFixed(2)} MXN</span>
                <span className="text-muted-foreground/50">•</span>
                <span className="font-semibold text-foreground">€1 EUR = ${exchangeRateEur.toFixed(2)} MXN</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
              </Button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-84 p-4 space-y-4 bg-card border-border/70 shadow-2xl">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <Coins className="w-4 h-4 text-amber-500" />
                    Configuración de Divisas
                  </h5>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                    Base de Datos
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Ajusta los tipos de cambio para el cálculo de equivalencias. Se guardarán en la base de datos para el presupuesto actual y todos los futuros.
                </p>
              </div>

              <form onSubmit={handleSaveCurrency} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Tipo de cambio USD a MXN</span>
                    <span className="text-[10px] text-muted-foreground font-mono">2 decimales</span>
                  </Label>
                  <div className="flex items-center rounded-lg border border-border/70 overflow-hidden bg-background">
                    <span className="px-2.5 py-1.5 bg-muted/40 text-muted-foreground font-mono text-xs border-r border-border/60">
                      $1 USD =
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={tempRateUsd}
                      onChange={(e) => setTempRateUsd(e.target.value)}
                      className="border-0 rounded-none h-8 text-xs font-mono focus-visible:ring-0 shadow-none"
                      placeholder="20.00"
                      required
                    />
                    <span className="px-2.5 text-xs font-mono text-muted-foreground font-semibold">MXN</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Tipo de cambio EUR a MXN</span>
                    <span className="text-[10px] text-muted-foreground font-mono">2 decimales</span>
                  </Label>
                  <div className="flex items-center rounded-lg border border-border/70 overflow-hidden bg-background">
                    <span className="px-2.5 py-1.5 bg-muted/40 text-muted-foreground font-mono text-xs border-r border-border/60">
                      €1 EUR =
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={tempRateEur}
                      onChange={(e) => setTempRateEur(e.target.value)}
                      className="border-0 rounded-none h-8 text-xs font-mono focus-visible:ring-0 shadow-none"
                      placeholder="21.40"
                      required
                    />
                    <span className="px-2.5 text-xs font-mono text-muted-foreground font-semibold">MXN</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 text-[11px] text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Alcance del guardado:</span>
                  </div>
                  <p className="text-[10px] leading-relaxed">
                    Actualiza inmediatamente el presupuesto abierto en Supabase ({isSimulator ? "Simulador" : currentPlan?.name || "activo"}) y establece la tasa predeterminada para todos los presupuestos futuros.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/40">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrencyPopoverOpen(false)}
                    className="h-7 text-xs text-muted-foreground"
                    disabled={isSavingCurrency}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-7 text-xs font-bold gap-1.5"
                    disabled={isSavingCurrency}
                  >
                    {isSavingCurrency ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar en BD</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </PopoverContent>
          </Popover>

          {/* Selector de Plan (si no es simulador) */}
          {!isSimulator && (
            <select
              value={selectedPlanId}
              onChange={(e) => {
                setSelectedPlanId(e.target.value)
                setActiveView("plan_detail")
              }}
              className="h-8 px-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground cursor-pointer font-medium"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.is_active ? "✓ (Activo)" : "(Inactivo)"}
                </option>
              ))}
            </select>
          )}

          {/* Selector de Ciclo (Trimestral vs Anual) */}
          <div className="flex rounded-lg border border-border/60 overflow-hidden bg-background">
            <button
              type="button"
              onClick={() => setSelectedCycle("quarterly")}
              className={`px-3 py-1 text-xs font-semibold transition-all ${
                selectedCycle === "quarterly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/40"
              }`}
            >
              Trimestral
            </button>
            <button
              type="button"
              onClick={() => setSelectedCycle("annual")}
              className={`px-3 py-1 text-xs font-semibold transition-all border-l border-border/40 ${
                selectedCycle === "annual"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/40"
              }`}
            >
              Anual
            </button>
          </div>
        </div>
      </div>

      {/* VISTA 1: DASHBOARD GENERAL DE PLANES CREADOS */}
      {activeView === "dashboard" && !isSimulator && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Arquitectura Presupuestaria de Planes ({plans.length})
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              Ciclo visualizado: {selectedCycle === "annual" ? "Anual (12m)" : "Trimestral (3m)"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((p) => {
              const qPrice = Number(p.price_quarterly_mxn) || 0
              const aPrice = Number(p.price_annual_mxn) || 0
              const cyclePrice = selectedCycle === "annual" ? aPrice : qPrice
              const feeBreakdown = calculateStripeFees(cyclePrice, {
                processingRate: 0.05,
                exchangeRateUsd,
                exchangeRateEur,
              })

              return (
                <div
                  key={p.id}
                  className={`rounded-xl bg-card border p-5 flex flex-col justify-between shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${
                    p.id === selectedPlanId
                      ? "border-primary ring-1 ring-primary/40 shadow-[0_0_20px_rgba(79,70,229,0.15)]"
                      : "border-border/60 hover:border-border"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/40">
                        {p.category === "both" ? "CRM + Chatbot" : "Chatbot IA"}
                      </span>
                      {p.is_active ? (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Activo
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Inactivo</span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-foreground tracking-tight">{p.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[32px]">
                      {p.description || "Sin descripción"}
                    </p>

                    <div className="mt-4 pt-3 border-t border-border/40 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Precio Base Stripe:</span>
                        <span className="font-mono font-bold text-foreground">
                          ${cyclePrice.toLocaleString("es-MX")} MXN
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">IVA Cliente (16% SAT sobre subtotal):</span>
                        <span className="font-mono text-foreground font-semibold">
                          +${(cyclePrice * 0.16).toFixed(2)} MXN
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Comisión Stripe (sobre total):</span>
                        <span className="font-mono text-amber-700 dark:text-amber-400 font-medium">
                          +${(((cyclePrice * 1.16) * 0.054 + 3.0) * 1.16).toFixed(2)} MXN
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] pt-1 border-t border-border/40 font-bold">
                        <span className="text-foreground">Importe Total Transacción:</span>
                        <span className="font-mono text-foreground font-bold">
                          ${(cyclePrice * 1.16).toFixed(2)} MXN
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] pt-0.5 text-emerald-700 dark:text-emerald-400 font-medium">
                        <span>Depósito Neto Kinexting:</span>
                        <span className="font-mono font-bold">
                          ${(cyclePrice * 1.16 - ((cyclePrice * 1.16) * 0.054 + 3.0) * 1.16 - cyclePrice * 0.16).toFixed(2)} MXN
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border/40 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPlanId(p.id)
                        setActiveView("plan_detail")
                      }}
                      className="flex-1 text-xs h-8 gap-1"
                    >
                      <span>Abrir Desglose</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartSimulator(p)}
                      className="h-8 px-2 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                      title="Clonar estructura a simulador"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* VISTA 2 Y 3: DESGLOSE BÁSICO & DETALLADO / SIMULADOR */}
      {(activeView === "plan_detail" || activeView === "simulator") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* PANEL IZQUIERDO: DESGLOSE BÁSICO (CONCEPTOS GENERALES & ORDEN STRIPE) (5 cols) */}
          <div className="lg:col-span-5 rounded-xl bg-card border border-border/60 p-5 space-y-5 shadow-sm">
            {/* Header del Desglose Básico */}
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
                  {isSimulator ? "SIMULADOR EN MEMORIA" : currentPlan?.name} • Ciclo {selectedCycle === "annual" ? "Anual" : "Trimestral"}
                </span>
                <h4 className="text-lg font-bold text-foreground tracking-tight">Desglose Básico</h4>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFilterKind("all")}
                className="h-7 text-[11px] gap-1"
                title="Mostrar todos los conceptos"
              >
                <span>Ver Todos ({currentCycleBudget.items.length})</span>
              </Button>
            </div>

            {/* CONCEPTOS GENERALES: 1. COSTOS Y 2. SERVICIOS BRINDADOS */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Conceptos Generales (haz clic para filtrar el detalle):
              </span>

              {/* CONCEPTO GENERAL 1: COSTOS */}
              <div
                onClick={() => setFilterKind(filterKind === "costo" ? "all" : "costo")}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  filterKind === "costo"
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border/60 bg-muted/20 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground font-bold">
                      <Server className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-foreground block">1. Costos Operativos Directos</span>
                      <span className="text-[11px] text-muted-foreground">
                        {currentCycleBudget.items.filter((it) => it.kind === "costo").length} conceptos de proveedores (APIs, Cloud, Infra)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-foreground block">
                      ${totalCostosMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      ~${totalCostosUsd.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              </div>

              {/* CONCEPTO GENERAL 2: SERVICIOS BRINDADOS */}
              <div
                onClick={() => setFilterKind(filterKind === "servicio" ? "all" : "servicio")}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  filterKind === "servicio"
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border/60 bg-muted/20 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-foreground block">2. Servicios Brindados (+ Comisiones de Gestión)</span>
                      <span className="text-[11px] text-muted-foreground">
                        Servicios directos (${totalServiciosDirectosMxn.toFixed(2)}) + comisiones de gestión (${totalComisionesGestionMxn.toFixed(2)})
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-foreground block">
                      ${totalServiciosBrindadosMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      ~${totalServiciosBrindadosUsd.toFixed(2)} USD
                    </span>
                  </div>
                </div>

                {/* Subdetalle explícito de composición de Servicios */}
                <div className="mt-2.5 pt-2 border-t border-border/40 space-y-1 text-[11px]">
                  <div className="flex justify-between text-muted-foreground">
                    <span>• Servicios directos (CRM, Soporte):</span>
                    <span className="font-mono font-medium text-foreground">${totalServiciosDirectosMxn.toFixed(2)} MXN</span>
                  </div>
                  <div className="flex justify-between text-cyan-700 dark:text-cyan-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                      • Comisiones opcionales de gestión sobre costos:
                    </span>
                    <span className="font-mono font-bold">+${totalComisionesGestionMxn.toFixed(2)} MXN</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RESUMEN FINANCIERO Y COMISIONES: SECUENCIA OFICIAL STRIPE MÉXICO */}
            <div className="pt-2 border-t border-border/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-primary" />
                  Estructura Financiera (Secuencia Stripe México)
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">CFDI 4.0</span>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/50 space-y-2.5 text-xs">
                {/* 1. Costo Operativo Directo */}
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>1. Costos Operativos Directos (Proveedores):</span>
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    ${totalCostosMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>

                {/* 2. Servicios Brindados Directos */}
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>2. Servicios Brindados Directos (CRM, Soporte):</span>
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    +${totalServiciosDirectosMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>

                {/* 3. Comisiones Opcionales de Gestión sobre Costos */}
                <div className="flex justify-between items-center text-cyan-700 dark:text-cyan-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>3. Comisiones de Gestión sobre Costos (Entra a Servicios):</span>
                  </span>
                  <span className="font-mono font-bold">
                    +${totalComisionesGestionMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>

                {/* Subtotal Servicios Brindados (+ gestión) */}
                <div className="flex justify-between items-center text-[11px] text-muted-foreground pl-4 border-l-2 border-primary/40">
                  <span>Subtotal Servicios Brindados Kinexting (+ gestión):</span>
                  <span className="font-mono font-semibold text-foreground">
                    =${totalServiciosBrindadosMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>

                {/* Subtotal Neto Líquido Kinexting */}
                <div className="flex justify-between items-center pt-2 border-t border-border/40 font-bold">
                  <div>
                    <span className="text-foreground block">Subtotal Neto Líquido Kinexting:</span>
                    <span className="text-[10px] text-muted-foreground font-normal font-mono">
                      (1. Costos: ${totalCostosMxn.toFixed(2)} + 2. Servicios: ${totalServiciosDirectosMxn.toFixed(2)} + 3. Gestión: ${totalComisionesGestionMxn.toFixed(2)})
                    </span>
                  </div>
                  <span className="font-mono text-primary text-base font-extrabold">
                    ${precioBaseNetoKinextingMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>

                {/* Comisiones Stripe México (calculadas del presupuesto) */}
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 space-y-1.5 mt-2">
                  <div className="flex justify-between items-center font-bold text-amber-800 dark:text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>+ Comisiones Stripe México (calculadas del presupuesto):</span>
                    </span>
                    <span className="font-mono font-bold">
                      +${stripeFees.stripeFeeTotalMxn.toFixed(2)} MXN
                    </span>
                  </div>

                  <div className="pl-2 space-y-0.5 text-[10px] text-muted-foreground font-mono">
                    <div className="flex justify-between">
                      <span>• Procesamiento con tarjeta (5.0% sobre total):</span>
                      <span>+${stripeFees.processingFeeMxn.toFixed(2)} MXN</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Cuota fija transaccional:</span>
                      <span>+${stripeFees.fixedFeeMxn.toFixed(2)} MXN</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Facturación recurrente / Invoicing (0.4% sobre total):</span>
                      <span>+${stripeFees.invoicingFeeMxn.toFixed(2)} MXN</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• IVA 16% sobre comisiones Stripe (SAT):</span>
                      <span>+${stripeFees.stripeFeeVatMxn.toFixed(2)} MXN</span>
                    </div>
                  </div>
                </div>

                {/* PRECIO OFICIAL QUE SE PUBLICA EN STRIPE (NETO + COMISIONES STRIPE) */}
                <div className="p-3.5 rounded-xl bg-primary/10 border-2 border-primary/40 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Precio Oficial en Stripe (Neto + Comisiones Stripe):
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      Tarifa sin IVA que se publica en Stripe Gateway y catálogo comercial
                    </span>
                  </div>
                  <span className="font-mono text-lg font-black text-primary">
                    ${precioOficialStripeNetoMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>

                {/* IVA al Cliente (16% SAT sobre el precio oficial de Stripe) */}
                <div className="flex justify-between items-center text-muted-foreground text-xs pt-1">
                  <span className="flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-primary" />
                    <span>+ IVA al Cliente (16% SAT trasladado sobre tarifa):</span>
                    <span className="text-[10px] text-muted-foreground font-mono">(exclusive)</span>
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    +${ivaClienteOficialMxn.toFixed(2)} MXN
                  </span>
                </div>

                {/* Total Cobrado en Pasarela (al Cliente) */}
                <div className="flex justify-between items-center pt-2.5 border-t border-border/50 font-bold">
                  <span className="text-foreground text-xs">Importe Total de la Transacción (al Cliente):</span>
                  <span className="font-mono text-foreground text-sm font-extrabold">
                    ${importeTotalTransaccionOficialMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>

                {/* Liquidación Bancaria */}
                <div className="pt-2 border-t border-border/40 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-muted-foreground">
                    <span>- Retención de Stripe (Comisiones sobre total):</span>
                    <span className="font-mono text-muted-foreground">-${stripeFeesSobreTotalCobrado.totalFee.toFixed(2)} MXN</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>- IVA trasladado al SAT (16% sobre tarifa):</span>
                    <span className="font-mono text-muted-foreground">-${ivaClienteOficialMxn.toFixed(2)} MXN</span>
                  </div>

                  <div className="flex justify-between items-center pt-1.5 border-t border-border/40 font-bold text-xs text-emerald-800 dark:text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Depósito Neto Líquido Kinexting (en Banco):
                    </span>
                    <span className="font-mono text-sm">
                      ${depositoNetoBancoMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold text-primary pt-1">
                    <span>Beneficio Neto Real de Kinexting (100% servicios):</span>
                    <span className="font-mono text-sm font-extrabold">
                      ${beneficioNetoRealMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                    </span>
                  </div>

                  <span className="text-[10px] text-muted-foreground block pt-1 italic">
                    Al poner en Stripe el Neto + Comisiones (${precioOficialStripeNetoMxn.toFixed(2)} MXN), el cliente cubre la pasarela y Kinexting recibe su neto líquido completo (${precioBaseNetoKinextingMxn.toFixed(2)} MXN).
                  </span>
                </div>
              </div>

              {/* Botón Guardar Cambios (Solo en planes reales) */}
              {!isSimulator && (
                <Button
                  onClick={handleRequestSave}
                  className="w-full text-xs font-semibold gap-2 shadow-md h-10"
                >
                  <Save className="w-4 h-4" />
                  <span>Publicar Precio (${precioOficialStripeNetoMxn.toFixed(2)} MXN) en Stripe & Guardar</span>
                </Button>
              )}
            </div>
          </div>

          {/* PANEL DERECHO: DESGLOSE DETALLADO & CONCEPTOS LÍNEA POR LÍNEA (SIN CATEGORÍAS) (7 cols) */}
          <div className="lg:col-span-7 rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
            {/* Header de la Tabla Detallada */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 border-b border-border/50 bg-muted/20 gap-3">
              <div>
                <h4 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                  <span>Desglose Detallado</span>
                  {filterKind !== "all" && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      Filtro: {filterKind === "costo" ? "Solo Costos" : "Solo Servicios"}
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Costos directos de proveedores, comisiones de gestión y servicios brindados en MXN y USD.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenAddItem("costo")}
                  className="h-8 gap-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Costo</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleOpenAddItem("servicio")}
                  className="h-8 gap-1 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Servicio</span>
                </Button>
              </div>
            </div>

            {/* Tabla Detallada (SIN COLUMNA DE CATEGORÍA) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground font-semibold text-[11px] bg-muted/10">
                    <th className="py-3 px-4">Concepto & Descripción</th>
                    <th className="py-3 px-3">Proveedor</th>
                    <th className="py-3 px-3">Tipo</th>
                    <th className="py-3 px-3 text-right">Comisión %</th>
                    <th className="py-3 px-3 text-right">Monto MXN</th>
                    <th className="py-3 px-3 text-right">Monto USD</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredDetailedItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-muted-foreground">
                        No hay conceptos registrados con este filtro. Haz clic en "+ Costo" o "+ Servicio".
                      </td>
                    </tr>
                  ) : (
                    filteredDetailedItems.map((item, idx) => {
                      const hasMarkup = item.kind === "costo" && Number(item.markup_percent || 0) > 0
                      const markupValueMxn = hasMarkup ? (Number(item.amount_mxn) * Number(item.markup_percent)) / 100 : 0

                      return (
                        <tr key={item.id || idx} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <span className="font-semibold text-foreground text-xs block">{item.name}</span>
                              <span className="text-[11px] text-muted-foreground block line-clamp-1">
                                <strong className="font-medium text-foreground/70">{item.kind === "costo" ? "Costo directo" : "Servicio brindado"}</strong>: {item.description || "Sin descripción"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-muted-foreground font-medium whitespace-nowrap text-xs">
                            {item.provider}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {item.kind === "costo" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-600/30">
                                <Server className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                                <span>COSTO PROVEEDOR</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/30">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>SERVICIO KINEXTING</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                            {hasMarkup ? (
                              <div>
                                <span className="font-bold text-cyan-700 dark:text-cyan-400">
                                  +{item.markup_percent}%
                                </span>
                                <span className="block text-[10px] text-muted-foreground">
                                  (+${markupValueMxn.toFixed(2)})
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-foreground whitespace-nowrap">
                            ${Number(item.amount_mxn).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-muted-foreground whitespace-nowrap">
                            ${Number(item.amount_usd).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditItem(item, idx)}
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                title="Editar concepto"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteItem(idx)}
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                title="Eliminar concepto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer de la Tabla con Tipos de Cambio */}
            <div className="px-5 py-3 border-t border-border/40 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground gap-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTempRateUsd(String(exchangeRateUsd))
                    setTempRateEur(String(exchangeRateEur))
                    setCurrencyPopoverOpen(true)
                  }}
                  className="hover:text-primary transition-colors flex items-center gap-1.5 text-xs text-foreground font-medium cursor-pointer"
                  title="Hacer clic para abrir la configuración contextual de divisas en BD"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    Tipos de cambio: <strong className="text-foreground font-mono">$1 USD = ${exchangeRateUsd.toFixed(2)} MXN</strong> • <strong className="text-foreground font-mono">€1 EUR = ${exchangeRateEur.toFixed(2)} MXN</strong>
                  </span>
                  <span className="text-[10px] text-primary font-bold ml-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">Configurar</span>
                </button>
              </div>
              <span>Total de Conceptos: {currentCycleBudget.items.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGREGAR / EDITAR CONCEPTO (SIN CATEGORÍA) */}
      <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              {editingItemIndex !== null ? "Editar Concepto del Presupuesto" : "Agregar Concepto al Presupuesto"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define si corresponde a un costo directo de proveedor o a un servicio brindado por Kinexting.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveItem} className="space-y-3">
            {/* Tipo: Costo vs Servicio */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setItemFormData({ ...itemFormData, kind: "costo", provider: itemFormData.provider === "Kinexting Core" ? "OpenAI" : itemFormData.provider })}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  itemFormData.kind === "costo"
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border/60 hover:bg-muted/30"
                }`}
              >
                <span className="block font-semibold text-xs text-foreground">Costo de Proveedor</span>
                <span className="block text-[10px] text-muted-foreground">Tokens IA, Servidores, BD</span>
              </button>

              <button
                type="button"
                onClick={() => setItemFormData({ ...itemFormData, kind: "servicio", markup_percent: 0, provider: itemFormData.provider === "OpenAI" ? "Kinexting Core" : itemFormData.provider })}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  itemFormData.kind === "servicio"
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border/60 hover:bg-muted/30"
                }`}
              >
                <span className="block font-semibold text-xs text-foreground">Servicio Brindado</span>
                <span className="block text-[10px] text-muted-foreground">Licencia CRM, Soporte, Gestión</span>
              </button>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nombre del Concepto *</Label>
              <Input
                placeholder="ej. Licencia CRM Kinexting Core o Tokens OpenAI"
                value={itemFormData.name}
                onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Descripción</Label>
              <Input
                placeholder="ej. Inferencia y respuestas automatizadas en WhatsApp"
                value={itemFormData.description}
                onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            {/* Proveedor a ancho completo (sin dropdown de categoría) */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Proveedor *</Label>
              <Input
                placeholder="ej. OpenAI, Meta, Supabase, Kinexting"
                value={itemFormData.provider}
                onChange={(e) => setItemFormData({ ...itemFormData, provider: e.target.value })}
                className="h-9 text-xs"
                required
              />
            </div>

            {/* Monto e importe */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Monto en MXN *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={itemFormData.amount_mxn}
                  onChange={(e) => {
                    const mxn = parseFloat(e.target.value) || 0
                    setItemFormData({
                      ...itemFormData,
                      amount_mxn: mxn,
                      amount_usd: Math.round((mxn / exchangeRateUsd) * 100) / 100,
                      amount_eur: Math.round((mxn / exchangeRateEur) * 100) / 100,
                    })
                  }}
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Equivalente USD (~{exchangeRateUsd.toFixed(2)})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={itemFormData.amount_usd}
                  onChange={(e) => {
                    const usd = parseFloat(e.target.value) || 0
                    const mxn = Math.round(usd * exchangeRateUsd * 100) / 100
                    setItemFormData({
                      ...itemFormData,
                      amount_usd: usd,
                      amount_mxn: mxn,
                      amount_eur: Math.round((mxn / exchangeRateEur) * 100) / 100,
                    })
                  }}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            {/* Comisión de Gestión Porcentual Opcional (Solo para Costos) */}
            {itemFormData.kind === "costo" && (
              <div className="p-3 rounded-lg bg-muted/40 border border-border/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    Comisión por Gestión / Administración (Opcional)
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono">Entra a Servicios Brindados</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="ej. 20"
                    value={itemFormData.markup_percent || ""}
                    onChange={(e) =>
                      setItemFormData({
                        ...itemFormData,
                        markup_percent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 h-8 text-xs font-mono"
                  />
                  <span className="text-xs font-mono text-muted-foreground">%</span>
                  <span className="text-xs text-muted-foreground ml-auto font-mono">
                    = +${(((Number(itemFormData.amount_mxn) || 0) * (Number(itemFormData.markup_percent) || 0)) / 100).toFixed(2)} MXN
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Este porcentaje de comisión compensa la configuración, mantenimiento y gestión de este costo.
                </p>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setItemModalOpen(false)} className="text-xs">
                Cancelar
              </Button>
              <Button type="submit" className="text-xs font-semibold">
                Guardar Concepto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PRIMERA CONFIRMACIÓN: RESUMEN DE CAMBIOS */}
      <Dialog open={firstConfirmOpen} onOpenChange={setFirstConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              Paso 1 de 2: Confirmar Recálculo de Presupuesto
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Estás a punto de actualizar la arquitectura de costos para el plan{" "}
              <strong>{currentPlan?.name}</strong> (Ciclo {selectedCycle === "annual" ? "Anual" : "Trimestral"}).
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-xl bg-muted/40 border border-border/40 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">1. Costos Operativos Directos:</span>
              <span className="font-mono font-bold text-foreground">${totalCostosMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">2. Servicios Brindados Directos:</span>
              <span className="font-mono font-bold text-foreground">+${totalServiciosDirectosMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
            </div>
            <div className="flex justify-between text-cyan-700 dark:text-cyan-400 font-medium">
              <span>3. Comisiones de Gestión sobre Costos:</span>
              <span className="font-mono font-bold">+${totalComisionesGestionMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-border/30">
              <span className="text-muted-foreground">Subtotal Neto Líquido Kinexting:</span>
              <span className="font-mono font-bold text-foreground">${precioBaseNetoKinextingMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
            </div>
            <div className="flex justify-between text-amber-700 dark:text-amber-400 font-medium">
              <span>+ Comisiones Stripe México (del presupuesto):</span>
              <span className="font-mono font-bold">+${stripeFees.stripeFeeTotalMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-border/40 font-bold bg-primary/10 p-2 rounded-lg">
              <div>
                <span className="text-foreground block">Precio Oficial a Publicar en Stripe (sin IVA):</span>
                <span className="text-[10px] text-muted-foreground font-normal">Neto Líquido + Comisiones Stripe</span>
              </div>
              <span className="font-mono font-bold text-primary text-sm">${precioOficialStripeNetoMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px] pt-1">
              <span>Importe Total Cobrado al Cliente (con IVA):</span>
              <span className="font-mono font-semibold text-foreground">${stripeFees.grossTotalMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setFirstConfirmOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button onClick={handleProceedToSecondConfirm} className="text-xs font-semibold">
              Continuar a Confirmación Final
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SEGUNDA CONFIRMACIÓN CRÍTICA: ACTUALIZACIÓN EN STRIPE GATEWAY */}
      <Dialog open={secondConfirmOpen} onOpenChange={setSecondConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-card border-rose-500/40">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              Segunda Confirmación Requerida (Stripe Gateway)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Esta acción modificará el precio comercial oficial en Stripe Gateway (entorno '2027') y en la base de datos de Supabase.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-950 dark:text-rose-200 space-y-2">
            <p className="font-semibold">
              ¿Confirmas que deseas publicar en Stripe Gateway el precio oficial de{" "}
              <span className="font-mono font-bold underline">
                ${precioOficialStripeNetoMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN + IVA
              </span>{" "}
              (Neto Líquido ${precioBaseNetoKinextingMxn.toFixed(2)} + Comisiones Stripe ${stripeFees.stripeFeeTotalMxn.toFixed(2)}) para el ciclo {selectedCycle === "annual" ? "Anual" : "Trimestral"} de "{currentPlan?.name}"?
            </p>
            <p className="text-[11px] text-rose-900/90 dark:text-rose-300/80">
              Stripe creará una nueva tarifa inmutable con este importe exacto (${precioOficialStripeNetoMxn.toFixed(2)} MXN) y la establecerá como predeterminada del catálogo.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              disabled={savingToStripe}
              onClick={() => setSecondConfirmOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              disabled={savingToStripe}
              onClick={handleFinalSaveToStripe}
              className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
            >
              {savingToStripe ? "Actualizando en Stripe..." : "Sí, Confirmar y Publicar en Stripe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * MODAL REUTILIZABLE DE CONFIGURACIÓN DE DESGLOSE DE PRESUPUESTO
 * Permite abrir una instancia completa e interactiva del desglose desde cualquier modal de tarifa o creación
 */
interface CycleBudgetEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: Plan
  cycle: "quarterly" | "annual" | string
  onPriceApplied?: (calculatedPriceMxn: number) => void
}

export function CycleBudgetEditorModal({
  open,
  onOpenChange,
  plan,
  cycle,
  onPriceApplied,
}: CycleBudgetEditorModalProps) {
  const [exchangeRateUsd, setExchangeRateUsd] = useState(19.85)
  const [exchangeRateEur, setExchangeRateEur] = useState(21.40)

  const normalizedCycleKey = cycle === "annual" || cycle === "year" ? "annual" : "quarterly"

  const [budgetData, setBudgetData] = useState<CycleBudgetBreakdown>({
    target_price_mxn: 651,
    markup_percentage: 25,
    exchange_rate_usd: 19.85,
    exchange_rate_eur: 21.40,
    items: [],
  })

  // Modal para agregar o editar un concepto individual
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [formData, setFormData] = useState<BudgetItem>({
    id: "",
    name: "",
    description: "",
    provider: "",
    kind: "costo",
    amount_mxn: 100,
    amount_usd: 5.04,
    amount_eur: 4.67,
    markup_percent: 0,
  })

  // Cargar datos del presupuesto cuando abre
  useEffect(() => {
    if (!open) return

    if (plan.budget_breakdown && plan.budget_breakdown[normalizedCycleKey]) {
      const existing = plan.budget_breakdown[normalizedCycleKey]!
      if (Array.isArray(existing.items) && existing.items.length > 0) {
        const normalizedItems: BudgetItem[] = existing.items
          .filter((it: any) => {
            if (it.id === "stripe_fee" || it.id === "stripe" || it.id === "stripe_yr" || it.category === "comision") {
              return false
            }
            return true
          })
          .map((it) => {
            let kind: BudgetItemKind = it.kind
            if (!kind) {
              kind = (it as any).category === "licencia" || (it as any).category === "margen" || (it as any).category === "soporte"
                ? "servicio"
                : "costo"
            }
            return {
              id: it.id,
              name: it.name,
              description: it.description || "",
              provider: it.provider || (kind === "costo" ? "Proveedor Cloud/IA" : "Kinexting Core"),
              kind,
              amount_mxn: Number(it.amount_mxn) || 0,
              amount_usd: Number(it.amount_usd) || Math.round((Number(it.amount_mxn) / (existing.exchange_rate_usd || exchangeRateUsd)) * 100) / 100,
              amount_eur: it.amount_eur || Math.round((Number(it.amount_mxn) / (existing.exchange_rate_eur || exchangeRateEur)) * 100) / 100,
              markup_percent: it.markup_percent || 0,
            }
          })

        setBudgetData({
          ...existing,
          items: normalizedItems,
        })
        if (existing.exchange_rate_usd) setExchangeRateUsd(existing.exchange_rate_usd)
        if (existing.exchange_rate_eur) setExchangeRateEur(existing.exchange_rate_eur)
        return
      }
    }

    // Default items
    const baseTarget = normalizedCycleKey === "annual" ? Number(plan.price_annual_mxn) || 2464 : Number(plan.price_quarterly_mxn) || 651
    setBudgetData({
      target_price_mxn: baseTarget,
      markup_percentage: 20,
      exchange_rate_usd: exchangeRateUsd,
      exchange_rate_eur: exchangeRateEur,
      items: [
        {
          id: "cost_ia",
          name: "Tokens IA Conversacional",
          description: "Inferencia y automatización de respuestas 24/7",
          provider: "OpenAI / Claude API",
          kind: "costo",
          amount_mxn: Math.round(baseTarget * 0.25),
          amount_usd: Math.round((baseTarget * 0.25 / exchangeRateUsd) * 100) / 100,
          amount_eur: Math.round((baseTarget * 0.25 / exchangeRateEur) * 100) / 100,
          markup_percent: 20,
        },
        {
          id: "cost_infra",
          name: "Infraestructura & Servidores Cloud",
          description: "Base de datos y túneles webhooks",
          provider: "Supabase / AWS",
          kind: "costo",
          amount_mxn: Math.round(baseTarget * 0.15),
          amount_usd: Math.round((baseTarget * 0.15 / exchangeRateUsd) * 100) / 100,
          amount_eur: Math.round((baseTarget * 0.15 / exchangeRateEur) * 100) / 100,
          markup_percent: 15,
        },
        {
          id: "srv_crm",
          name: "Licencia Plataforma CRM Kinexting",
          description: "Acceso multiusuario a sistema de citas y CRM",
          provider: "Kinexting Core",
          kind: "servicio",
          amount_mxn: Math.round(baseTarget * 0.40),
          amount_usd: Math.round((baseTarget * 0.40 / exchangeRateUsd) * 100) / 100,
          amount_eur: Math.round((baseTarget * 0.40 / exchangeRateEur) * 100) / 100,
          markup_percent: 0,
        },
        {
          id: "srv_soporte",
          name: "Soporte Técnico Especializado",
          description: "Mantenimiento y supervisión técnica",
          provider: "Kinexting Soporte",
          kind: "servicio",
          amount_mxn: Math.round(baseTarget * 0.20),
          amount_usd: Math.round((baseTarget * 0.20 / exchangeRateUsd) * 100) / 100,
          amount_eur: Math.round((baseTarget * 0.20 / exchangeRateEur) * 100) / 100,
          markup_percent: 0,
        },
      ],
    })
  }, [open, plan, normalizedCycleKey])

  // Cálculos matemáticos
  const totalCostosMxn = useMemo(() => {
    return budgetData.items
      .filter((it) => it.kind === "costo")
      .reduce((sum, it) => sum + Number(it.amount_mxn || 0), 0)
  }, [budgetData.items])

  const totalComisionesGestionMxn = useMemo(() => {
    return budgetData.items
      .filter((it) => it.kind === "costo" && Number(it.markup_percent || 0) > 0)
      .reduce((sum, it) => sum + ((Number(it.amount_mxn || 0) * Number(it.markup_percent || 0)) / 100), 0)
  }, [budgetData.items])

  const totalServiciosDirectosMxn = useMemo(() => {
    return budgetData.items
      .filter((it) => it.kind === "servicio")
      .reduce((sum, it) => sum + Number(it.amount_mxn || 0), 0)
  }, [budgetData.items])

  const totalServiciosBrindadosMxn = useMemo(() => {
    return totalServiciosDirectosMxn + totalComisionesGestionMxn
  }, [totalServiciosDirectosMxn, totalComisionesGestionMxn])

  const precioBaseNetoMxn = useMemo(() => {
    return Math.round((totalCostosMxn + totalServiciosDirectosMxn + totalComisionesGestionMxn) * 100) / 100
  }, [totalCostosMxn, totalServiciosDirectosMxn, totalComisionesGestionMxn])

  const stripeFees = useMemo(() => {
    return calculateStripeFees(precioBaseNetoMxn, {
      processingRate: 0.05,
      fixedFeeMxn: 3.0,
      invoicingRate: 0.004,
      exchangeRateUsd,
      exchangeRateEur,
      clientPaysFees: true,
    })
  }, [precioBaseNetoMxn, exchangeRateUsd, exchangeRateEur])

  const precioOficialStripeMxn = useMemo(() => {
    return Math.round((precioBaseNetoMxn + stripeFees.stripeFeeTotalMxn) * 100) / 100
  }, [precioBaseNetoMxn, stripeFees.stripeFeeTotalMxn])

  const ivaClienteModalMxn = useMemo(() => {
    return Math.round(precioOficialStripeMxn * 0.16 * 100) / 100
  }, [precioOficialStripeMxn])

  const importeTotalModalMxn = useMemo(() => {
    return Math.round((precioOficialStripeMxn + ivaClienteModalMxn) * 100) / 100
  }, [precioOficialStripeMxn, ivaClienteModalMxn])

  const stripeFeesOnTotalModal = useMemo(() => {
    return stripeFees.stripeFeeTotalMxn
  }, [stripeFees.stripeFeeTotalMxn])

  const depositoNetoModalMxn = useMemo(() => {
    return Math.round((importeTotalModalMxn - stripeFees.stripeFeeTotalMxn - ivaClienteModalMxn) * 100) / 100
  }, [importeTotalModalMxn, stripeFees.stripeFeeTotalMxn, ivaClienteModalMxn])

  // Guardar y aplicar
  const handleApply = () => {
    onPriceApplied?.(precioOficialStripeMxn)
    toast.success(`Precio oficial de Stripe ($${precioOficialStripeMxn.toLocaleString("es-MX")} MXN = Neto $${precioBaseNetoMxn} + Comisiones $${stripeFees.stripeFeeTotalMxn}) aplicado`)
    onOpenChange(false)
  }

  const handleOpenAdd = (kind: BudgetItemKind = "costo") => {
    setEditingIdx(null)
    setFormData({
      id: `it_${Date.now()}`,
      name: "",
      description: "",
      provider: kind === "costo" ? "OpenAI" : "Kinexting Core",
      kind,
      amount_mxn: 120,
      amount_usd: Math.round((120 / exchangeRateUsd) * 100) / 100,
      amount_eur: Math.round((120 / exchangeRateEur) * 100) / 100,
      markup_percent: 0,
    })
    setItemModalOpen(true)
  }

  const handleOpenEdit = (it: BudgetItem, idx: number) => {
    setEditingIdx(idx)
    setFormData({ ...it })
    setItemModalOpen(true)
  }

  const handleSaveConcept = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    const updated = [...budgetData.items]
    const mxn = Number(formData.amount_mxn) || 0
    const toSave: BudgetItem = {
      ...formData,
      amount_mxn: mxn,
      amount_usd: Math.round((mxn / exchangeRateUsd) * 100) / 100,
      amount_eur: Math.round((mxn / exchangeRateEur) * 100) / 100,
      markup_percent: formData.kind === "costo" ? Math.max(0, Number(formData.markup_percent) || 0) : 0,
    }

    if (editingIdx !== null) {
      updated[editingIdx] = toSave
    } else {
      updated.push(toSave)
    }

    setBudgetData({ ...budgetData, items: updated })
    setItemModalOpen(false)
    toast.success(editingIdx !== null ? "Concepto actualizado" : "Concepto agregado")
  }

  const handleDeleteConcept = (idx: number) => {
    setBudgetData({
      ...budgetData,
      items: budgetData.items.filter((_, i) => i !== idx),
    })
    toast.success("Concepto eliminado")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-card border-border/60 max-h-[88vh] overflow-y-auto p-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 sticky top-0 bg-card z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {plan.name}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                Ciclo {normalizedCycleKey === "annual" ? "Anual" : "Trimestral"}
              </span>
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Desglose de Presupuesto & Unit Economics
            </DialogTitle>
          </div>
          <Button onClick={handleApply} className="text-xs h-8 gap-1.5 font-bold">
            <Check className="w-4 h-4" />
            <span>Aplicar Precio (${precioOficialStripeMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN)</span>
          </Button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Resumen Financiero Stripe (5 cols) */}
          <div className="lg:col-span-5 rounded-xl bg-card border border-border/60 p-4 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-primary" />
                Resumen Financiero (Secuencia Stripe)
              </h5>
              <span className="text-[10px] font-mono text-muted-foreground">CFDI 4.0</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Server className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>1. Costos Operativos Directos:</span>
                </span>
                <span className="font-mono font-bold text-foreground">${totalCostosMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span>2. Servicios Brindados Directos:</span>
                </span>
                <span className="font-mono font-bold text-foreground">+${totalServiciosDirectosMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
              </div>
              <div className="flex justify-between items-center text-cyan-700 dark:text-cyan-400 font-medium">
                <span className="flex items-center gap-1">
                  <Percent className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                  <span>3. Comisiones de Gestión sobre Costos:</span>
                </span>
                <span className="font-mono font-bold">+${totalComisionesGestionMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                <span>Subtotal Neto Líquido Kinexting:</span>
                <span className="font-mono font-bold text-foreground">${precioBaseNetoMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
              </div>
              <div className="flex justify-between text-amber-700 dark:text-amber-400 font-medium">
                <span>+ Comisiones Stripe México (del presupuesto):</span>
                <span className="font-mono font-bold">+${stripeFees.stripeFeeTotalMxn.toFixed(2)} MXN</span>
              </div>

              {/* PRECIO OFICIAL EN STRIPE */}
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-foreground block">Precio Oficial en Stripe (sin IVA):</span>
                  <span className="text-[10px] text-muted-foreground block font-mono">Neto $${precioBaseNetoMxn.toFixed(2)} + Stripe $${stripeFees.stripeFeeTotalMxn.toFixed(2)}</span>
                </div>
                <span className="font-mono font-black text-primary text-sm">${precioOficialStripeMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
              </div>

              {/* SECCIÓN CARGOS AL CLIENTE (EL CLIENTE PAGA IVA Y COMISIONES STRIPE SOBRE IMPORTE TOTAL) */}
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-1.5 mt-1">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-primary">
                  <span className="flex items-center gap-1">
                    <Receipt className="w-3 h-3" />
                    Cargos al Cliente (Pasarela e IVA)
                  </span>
                  <span className="text-muted-foreground font-normal">Sobre el importe total</span>
                </div>

                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>+ IVA al Cliente (16% SAT trasladado sobre tarifa):</span>
                  <span className="font-mono font-semibold text-foreground">+${ivaClienteModalMxn.toFixed(2)} MXN</span>
                </div>

                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>+ Comisiones Stripe (calculadas del presupuesto):</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">+${stripeFees.stripeFeeTotalMxn.toFixed(2)} MXN</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1.5 border-t border-border/40 font-bold">
                <span className="text-foreground">Importe Total de la Transacción (al Cliente):</span>
                <span className="font-mono text-sm font-extrabold text-foreground">${importeTotalModalMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
              </div>

              <div className="pt-2 border-t border-border/30 space-y-1.5 text-[11px] text-muted-foreground">
                <div className="flex justify-between text-muted-foreground">
                  <span>- Retención de Stripe (Comisiones sobre total):</span>
                  <span className="font-mono text-muted-foreground">-${stripeFeesOnTotalModal.toFixed(2)} MXN</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>- IVA trasladado al SAT (16% sobre tarifa):</span>
                  <span className="font-mono text-muted-foreground">-${ivaClienteModalMxn.toFixed(2)} MXN</span>
                </div>
                <div className="flex justify-between items-center font-bold text-emerald-800 dark:text-emerald-400 pt-1 border-t border-border/30">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Depósito Neto en Banco (Kinexting):
                  </span>
                  <span className="font-mono font-extrabold text-xs">${depositoNetoModalMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
                </div>
                <div className="flex justify-between items-center font-bold text-primary text-[11px]">
                  <span>Beneficio Neto Real de Kinexting:</span>
                  <span className="font-mono font-extrabold">${(depositoNetoModalMxn - totalCostosMxn).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Tipos de cambio oficiales:</span>
              <span className="font-mono font-semibold text-foreground">
                $1 USD = ${exchangeRateUsd.toFixed(2)} MXN • €1 EUR = ${exchangeRateEur.toFixed(2)} MXN
              </span>
            </div>
          </div>

          {/* Columna Derecha: Conceptos detallados (7 cols) */}
          <div className="lg:col-span-7 rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
              <span className="text-xs font-bold text-foreground">Conceptos Registrados ({budgetData.items.length})</span>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={() => handleOpenAdd("costo")} className="h-7 text-xs gap-1">
                  <Plus className="w-3 h-3" />
                  <span>+ Costo</span>
                </Button>
                <Button size="sm" onClick={() => handleOpenAdd("servicio")} className="h-7 text-xs gap-1 font-semibold">
                  <Plus className="w-3 h-3" />
                  <span>+ Servicio</span>
                </Button>
              </div>
            </div>

            <div className="divide-y divide-border/30 max-h-[380px] overflow-y-auto">
              {budgetData.items.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No hay conceptos en este ciclo. Haz clic en "+ Costo" o "+ Servicio" para agregar.
                </div>
              ) : (
                budgetData.items.map((it, idx) => (
                  <div key={it.id || idx} className="p-3 flex items-center justify-between hover:bg-muted/30 text-xs transition-colors">
                    <div className="space-y-1 max-w-[270px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-xs">{it.name}</span>
                        {it.kind === "costo" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-600/30">
                            <Server className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                            Costo Proveedor
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/30">
                            <Sparkles className="w-3 h-3" />
                            Servicio Kinexting
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground block line-clamp-1">
                        <strong className="font-medium text-foreground/70">{it.provider}</strong> • {it.description || "Sin descripción"}
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span className="font-bold text-foreground block text-xs">${Number(it.amount_mxn).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
                      <span className="text-[10px] text-muted-foreground block">~${(Number(it.amount_mxn) / exchangeRateUsd).toFixed(2)} USD</span>
                      {it.kind === "costo" && Number(it.markup_percent || 0) > 0 && (
                        <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-semibold block">
                          +{it.markup_percent}% com. gestión
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(it, idx)} className="h-7 w-7 text-muted-foreground hover:text-foreground">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteConcept(idx)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal interno para agregar/editar concepto */}
        <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border/60">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                {editingIdx !== null ? "Editar Concepto" : "Agregar Concepto"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveConcept} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, kind: "costo" })}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    formData.kind === "costo"
                      ? "border-amber-600/60 bg-amber-500/10 ring-1 ring-amber-500"
                      : "border-border/60 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Server className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="font-bold text-xs text-foreground">Costo de Proveedor</span>
                  </div>
                  <span className="block text-[10px] text-muted-foreground">Tokens IA, Servidores, BD</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, kind: "servicio", markup_percent: 0 })}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    formData.kind === "servicio"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border/60 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="font-bold text-xs text-foreground">Servicio Brindado</span>
                  </div>
                  <span className="block text-[10px] text-muted-foreground">Licencia CRM, Soporte, Gestión</span>
                </button>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Nombre *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-8 text-xs" required />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Proveedor *</Label>
                <Input value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} className="h-8 text-xs" required />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Descripción</Label>
                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="h-8 text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Monto en MXN *</Label>
                  <Input type="number" step="0.01" value={formData.amount_mxn} onChange={(e) => setFormData({ ...formData, amount_mxn: parseFloat(e.target.value) || 0 })} className="h-8 text-xs font-mono" required />
                </div>
                {formData.kind === "costo" && (
                  <div className="space-y-1">
                    <Label className="text-xs">Comisión Gestión (%)</Label>
                    <Input type="number" step="1" value={formData.markup_percent || ""} onChange={(e) => setFormData({ ...formData, markup_percent: parseFloat(e.target.value) || 0 })} className="h-8 text-xs font-mono" placeholder="0" />
                  </div>
                )}
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setItemModalOpen(false)} className="text-xs">Cancelar</Button>
                <Button type="submit" className="text-xs font-semibold">Guardar Concepto</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
