"use client"

import { useState, useMemo } from "react"
import {
  Calculator,
  HelpCircle,
  TrendingUp,
  CreditCard,
  Percent,
  Receipt,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Coins,
  Building,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plan } from "@/lib/types/admin"
import { calculateStripeFees } from "@/lib/stripe-fees"

interface StripeCommissionCalculatorProps {
  plans?: Plan[]
  initialAmount?: number
  onApplyPrice?: (amount: number) => void
}

export function StripeCommissionCalculator({
  plans = [],
  initialAmount = 651,
  onApplyPrice,
}: StripeCommissionCalculatorProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    plans.length > 0 ? plans[0].id : "custom"
  )
  const [selectedCycle, setSelectedCycle] = useState<"quarterly" | "annual">("quarterly")
  const [customAmount, setCustomAmount] = useState<string>(String(initialAmount))
  const [processingRatePercent, setProcessingRatePercent] = useState<number>(5.0) // 5.0% más alta por defecto
  const [fixedFee, setFixedFee] = useState<number>(3.0)
  const [invoicingRatePercent, setInvoicingRatePercent] = useState<number>(0.4) // 0.4% por facturación
  const [vatRatePercent] = useState<number>(16)
  const [exchangeRateUsd, setExchangeRateUsd] = useState<number>(20.0)

  // Cargar tasa de cambio oficial desde la base de datos
  useMemo(() => {
    if (typeof window !== "undefined") {
      fetch("/api/admin/currency")
        .then((res) => res.json())
        .then((data) => {
          if (data.exchange_rate_usd) {
            setExchangeRateUsd(Number(data.exchange_rate_usd) || 20.0)
          }
        })
        .catch(() => {})
    }
  }, [])

  // Determinar monto base según selección
  const baseAmount = useMemo(() => {
    if (selectedPlanId === "custom") {
      return Math.max(0, parseFloat(customAmount) || 0)
    }
    const found = plans.find((p) => p.id === selectedPlanId)
    if (!found) return Math.max(0, parseFloat(customAmount) || 0)
    return selectedCycle === "annual"
      ? Number(found.price_annual_mxn) || 0
      : Number(found.price_quarterly_mxn) || 0
  }, [selectedPlanId, selectedCycle, customAmount, plans])

  // Desglose de comisiones de Stripe en México
  const breakdown = useMemo(() => {
    return calculateStripeFees(baseAmount, {
      processingRate: processingRatePercent / 100,
      fixedFeeMxn: fixedFee,
      invoicingRate: invoicingRatePercent / 100,
      vatRate: vatRatePercent / 100,
      exchangeRateUsd: exchangeRateUsd,
    })
  }, [baseAmount, processingRatePercent, fixedFee, invoicingRatePercent, vatRatePercent, exchangeRateUsd])

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
              Calculadora Oficial de Comisiones Stripe México
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                SAT / IVA 16%
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Simula el desglose en el orden estricto de Stripe: Tanto el IVA (16% SAT) como las comisiones de Stripe (5% + $3 MXN + 0.4% facturación + IVA) se aplican sobre el importe total de la transacción.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Tasa Máxima Conservadora (5.0%)
          </span>
        </div>
      </div>

      {/* Controles y Parámetros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Selector de Plan o Monto Personalizado */}
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs font-semibold text-foreground">Seleccionar Plan o Modo</Label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground cursor-pointer font-medium"
            >
              <option value="custom">-- Monto Libre Manual --</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {selectedPlanId !== "custom" ? (
              <div className="flex rounded-lg border border-border/60 overflow-hidden bg-background">
                <button
                  type="button"
                  onClick={() => setSelectedCycle("quarterly")}
                  className={`flex-1 py-1.5 text-xs font-medium transition-all ${
                    selectedCycle === "quarterly"
                      ? "bg-primary/15 text-primary font-bold"
                      : "text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  Trimestral (3m)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCycle("annual")}
                  className={`flex-1 py-1.5 text-xs font-medium transition-all border-l border-border/40 ${
                    selectedCycle === "annual"
                      ? "bg-primary/15 text-primary font-bold"
                      : "text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  Anual (12m)
                </button>
              </div>
            ) : (
              <div className="flex rounded-lg border border-border/60 overflow-hidden bg-background">
                <span className="px-2.5 py-2 bg-muted/30 text-muted-foreground text-xs font-mono font-medium border-r border-border/40">
                  MXN
                </span>
                <Input
                  type="number"
                  step="1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="border-0 rounded-none h-9 text-xs font-mono focus-visible:ring-0 shadow-none"
                  placeholder="ej. 651"
                />
              </div>
            )}
          </div>
        </div>

        {/* Tasa Stripe (5% vs 3.6%) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-foreground">Comisión Stripe</Label>
            <span className="text-[10px] text-muted-foreground font-mono">+ $3.00 MXN</span>
          </div>
          <select
            value={processingRatePercent}
            onChange={(e) => setProcessingRatePercent(parseFloat(e.target.value))}
            className="w-full h-9 px-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground cursor-pointer"
          >
            <option value={5.0}>5.0% (Tasa Máxima / Amex / Int.)</option>
            <option value={3.6}>3.6% (Tarjeta Nacional Estándar)</option>
            <option value={4.0}>4.0% (Tarjeta Corporativa)</option>
          </select>
        </div>

        {/* Invoicing & Tipo de Cambio */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-foreground">Invoicing + USD</Label>
            <span className="text-[10px] text-muted-foreground font-mono">0.4% fact.</span>
          </div>
          <div className="flex rounded-lg border border-border/60 overflow-hidden bg-background">
            <span className="px-2 py-2 bg-muted/30 text-muted-foreground text-[11px] font-mono border-r border-border/40">
              $USD:
            </span>
            <Input
              type="number"
              step="0.5"
              value={exchangeRateUsd}
              onChange={(e) => setExchangeRateUsd(parseFloat(e.target.value) || 20)}
              className="border-0 rounded-none h-9 text-xs font-mono focus-visible:ring-0 shadow-none"
              title="Tipo de cambio MXN por USD"
            />
          </div>
        </div>
      </div>

      {/* Resultados de Cálculo Paso a Paso */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tarjeta 1: Cobro al Cliente */}
        <div className="p-4 rounded-xl bg-card border border-border/50 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-primary" />
              1. Cobro en Pasarela (Cliente)
            </span>
            <span className="text-[10px] font-mono text-cyan-400">Sobre Importe Total</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal Base Neto Kinexting:</span>
              <span className="font-mono font-semibold text-foreground">
                ${breakdown.basePriceMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>IVA Trasladado (16% SAT sobre importe total):</span>
              <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                +${breakdown.clientVatMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Comisiones Stripe (sobre importe total):</span>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
                +${breakdown.stripeFeeTotalMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-border/40 text-foreground">
              <div>
                <span className="font-bold block">Importe Total de la Transacción:</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  ~${breakdown.grossTotalUsd.toFixed(2)} USD
                </span>
              </div>
              <span className="text-lg font-bold font-mono text-foreground">
                ${breakdown.grossTotalMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta 2: Retención Stripe */}
        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-rose-400" />
              2. Comisiones Deducidas Stripe
            </span>
            <span className="text-[10px] font-mono text-rose-400 font-bold">
              {breakdown.effectiveCommissionRate.toFixed(2)}% real
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Procesamiento ({processingRatePercent}% sobre total):</span>
              <span className="font-mono text-foreground">
                ${breakdown.processingFeeMxn.toFixed(2)} MXN
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Cuota Fija por Transacción:</span>
              <span className="font-mono text-foreground">
                ${breakdown.fixedFeeMxn.toFixed(2)} MXN
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Stripe Invoicing / Billing ({invoicingRatePercent}% sobre total):</span>
              <span className="font-mono text-foreground">
                ${breakdown.invoicingFeeMxn.toFixed(2)} MXN
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground pt-1 border-t border-border/30">
              <span>Subtotal Comisiones Stripe:</span>
              <span className="font-mono font-medium text-foreground">
                ${breakdown.stripeFeeSubtotalMxn.toFixed(2)} MXN
              </span>
            </div>
            <div className="flex justify-between text-rose-400">
              <span>IVA 16% sobre Comisiones Stripe (SAT):</span>
              <span className="font-mono font-medium">
                +${breakdown.stripeFeeVatMxn.toFixed(2)} MXN
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-rose-500/20 text-rose-400">
              <span className="font-bold">Total Deducido por Stripe:</span>
              <span className="text-base font-bold font-mono">
                -${breakdown.totalStripeDeductionMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta 3: Depósito Bancario Neto */}
        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/25 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-400" />
                3. Depósito Líquido en Banco
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">100% Neto Kinexting</span>
            </div>

            <div className="space-y-2 text-xs mt-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Ingreso Bruto Transferido por Stripe:</span>
                <span className="font-mono text-foreground">
                  ${breakdown.netPayoutMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>- IVA trasladado al SAT (16% sobre total):</span>
                <span className="font-mono text-muted-foreground font-semibold">
                  -${breakdown.vatToPaySatMxn.toFixed(2)} MXN
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground pt-1 border-t border-border/30">
                <span className="font-semibold text-foreground">Depósito Neto Líquido Kinexting:</span>
                <span className="font-mono text-emerald-400 font-extrabold text-sm">
                  ${breakdown.basePriceMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Equivalente en USD:</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  ~${breakdown.basePriceUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-emerald-500/20 flex items-baseline justify-between">
            <div>
              <span className="text-[11px] font-bold text-foreground block">Monto Neto para Kinexting:</span>
              <span className="text-[10px] text-muted-foreground">Tarifa neta 100% íntegra</span>
            </div>
            <span className="text-xl font-black font-mono text-emerald-400">
              ${breakdown.basePriceMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
