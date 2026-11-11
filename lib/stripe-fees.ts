/**
 * Motor de Cálculo de Comisiones Stripe México (SAT / CFDI 4.0 Compliant)
 * 
 * Regla oficial del negocio:
 * "Tanto el IVA como las comisiones de Stripe se deben aplicar sobre el importe total de la transacción".
 * 
 * Desglose sobre el Importe Total de la Transacción (T):
 * 1. Base Neta Kinexting (B): Costos Operativos Directos + Servicios Brindados (+ gestión).
 * 2. IVA al Cliente (16% SAT): Se calcula como el 16% sobre el Importe Total de la Transacción (T).
 * 3. Comisiones Stripe México: Se calculan sobre el Importe Total de la Transacción (T):
 *    • Procesamiento con tarjeta: 5.0% sobre T
 *    • Cuota fija transaccional: $3.00 MXN
 *    • Stripe Invoicing / Facturación recurrente: 0.4% sobre T
 *    • IVA 16% SAT sobre las comisiones de Stripe
 * 4. Ecuación de Gross-Up:
 *    T = B + IVA(T) + StripeFees(T)
 *    T * (1 - vatRate - variableStripeRateWithVat) = B + fixedWithVat
 *    T = (B + fixedWithVat) / (1 - (vatRate + variableStripeRateWithVat))
 * 
 * De este modo:
 * - IVA (16%) y Comisiones de Stripe se aplican rigurosamente sobre el Total de la Transacción (T).
 * - Al descontar IVA y comisiones de T, Kinexting recibe exactamente el 100% de su Precio Base Neto (B).
 */

export interface StripeFeeConfig {
  processingRate: number // ej. 0.05 (5.0%)
  fixedFeeMxn: number // $3.00 MXN
  invoicingRate: number // 0.004 (0.4%)
  vatRate: number // 0.16 (16%)
  exchangeRateUsd: number // ej. 20.00 MXN por USD
  exchangeRateEur?: number // ej. 21.40 MXN por EUR
  clientPaysFees?: boolean // default: true (el cliente paga comisiones e impuestos sobre el total)
  isGrossTotal?: boolean // si el monto ingresado ya es el importe total de la transacción
}

export const DEFAULT_STRIPE_FEE_CONFIG: StripeFeeConfig = {
  processingRate: 0.05, // 5.0% (tasa máxima conservadora)
  fixedFeeMxn: 3.0,
  invoicingRate: 0.004, // 0.4% facturación
  vatRate: 0.16, // 16% IVA SAT
  exchangeRateUsd: 20.00,
  exchangeRateEur: 21.40,
  clientPaysFees: true,
  isGrossTotal: false,
}

export interface StripeFeeBreakdown {
  basePriceMxn: number // Precio neto sin IVA ni comisiones (lo que cobra Kinexting)
  clientVatMxn: number // IVA 16% aplicado sobre el importe total de la transacción
  stripeFeeTotalMxn: number // Total comisiones Stripe aplicadas sobre el importe total
  grossTotalMxn: number // Importe total de la transacción (cobrado al cliente en pasarela)

  // Comisiones Stripe desglosadas (sobre el importe total de la transacción)
  processingFeeMxn: number // 5% de procesamiento sobre el total
  fixedFeeMxn: number // $3.00 MXN cuota fija
  invoicingFeeMxn: number // 0.4% facturación recurrente sobre el total
  stripeFeeSubtotalMxn: number // Subtotal comisiones antes de IVA
  stripeFeeVatMxn: number // 16% IVA sobre comisiones Stripe
  totalStripeDeductionMxn: number // Total retenido por Stripe

  // Liquidación y márgenes
  netPayoutMxn: number // Monto transferido por Stripe al banco (Total - Comisiones Stripe)
  effectiveCommissionRate: number // Porcentaje efectivo real de comisiones sobre el total

  // Valores equivalentes en USD y EUR
  basePriceUsd: number
  clientVatUsd: number
  stripeFeeTotalUsd: number
  grossTotalUsd: number
  totalStripeDeductionUsd: number
  netPayoutUsd: number

  basePriceEur?: number
  clientVatEur?: number
  stripeFeeTotalEur?: number
  grossTotalEur?: number
  totalStripeDeductionEur?: number
  netPayoutEur?: number

  // Conciliación SAT
  vatToPaySatMxn: number // IVA cobrado al cliente sobre el total de la transacción
}

export function calculateStripeFees(
  amountMxn: number,
  config: Partial<StripeFeeConfig> = {}
): StripeFeeBreakdown {
  const mergedConfig: StripeFeeConfig = {
    ...DEFAULT_STRIPE_FEE_CONFIG,
    ...config,
  }

  const safeInput = Math.max(0, Number(amountMxn) || 0)

  let grossTotalMxn = 0
  let basePriceMxn = 0
  let clientVatMxn = 0
  let processingFeeMxn = 0
  let fixedFeeMxn = 0
  let invoicingFeeMxn = 0
  let stripeFeeSubtotalMxn = 0
  let stripeFeeVatMxn = 0
  let totalStripeDeductionMxn = 0
  let netPayoutMxn = 0

  if (safeInput > 0) {
    const variableStripeRateWithVat =
      (mergedConfig.processingRate + mergedConfig.invoicingRate) * (1 + mergedConfig.vatRate)
    const fixedWithVat = mergedConfig.fixedFeeMxn * (1 + mergedConfig.vatRate)

    if (mergedConfig.isGrossTotal) {
      // safeInput YA ES el importe total de la transacción (T)
      grossTotalMxn = safeInput
      clientVatMxn = (grossTotalMxn * mergedConfig.vatRate) / (1 + mergedConfig.vatRate)
      const subtotalMxn = grossTotalMxn - clientVatMxn

      processingFeeMxn = grossTotalMxn * mergedConfig.processingRate
      fixedFeeMxn = mergedConfig.fixedFeeMxn
      invoicingFeeMxn = grossTotalMxn * mergedConfig.invoicingRate
      stripeFeeSubtotalMxn = processingFeeMxn + fixedFeeMxn + invoicingFeeMxn
      stripeFeeVatMxn = stripeFeeSubtotalMxn * mergedConfig.vatRate
      totalStripeDeductionMxn = stripeFeeSubtotalMxn + stripeFeeVatMxn

      basePriceMxn = Math.max(0, subtotalMxn - totalStripeDeductionMxn)
      netPayoutMxn = Math.max(0, grossTotalMxn - totalStripeDeductionMxn)
    } else {
      // safeInput es el Precio Base Neto de Kinexting (B)
      // Regla oficial del negocio:
      // "Tanto el IVA como las comisiones de Stripe se deben aplicar sobre el importe total de la transacción"
      // Ecuación de Gross-Up:
      // T = B + IVA(T) + StripeFees(T)
      // T = B + (T * vatRate) + (T * (procRate + invRate) + fixed) * (1 + vatRate)
      // T * (1 - vatRate - (procRate + invRate)*(1 + vatRate)) = B + fixed * (1 + vatRate)
      // T = (B + fixedWithVat) / (1 - vatRate - variableStripeRateWithVat)
      basePriceMxn = safeInput

      const variableFeeRate = (mergedConfig.processingRate + mergedConfig.invoicingRate) * (1 + mergedConfig.vatRate)
      const fixedFeeWithVat = mergedConfig.fixedFeeMxn * (1 + mergedConfig.vatRate)
      const denom = 1 - mergedConfig.vatRate - variableFeeRate

      if (denom > 0) {
        grossTotalMxn = (basePriceMxn + fixedFeeWithVat) / denom
      } else {
        grossTotalMxn = basePriceMxn * 1.30
      }

      // Comisiones de Stripe México calculadas rigurosamente sobre el importe total cobrado en pasarela (T)
      processingFeeMxn = grossTotalMxn * mergedConfig.processingRate
      fixedFeeMxn = mergedConfig.fixedFeeMxn
      invoicingFeeMxn = grossTotalMxn * mergedConfig.invoicingRate
      stripeFeeSubtotalMxn = processingFeeMxn + fixedFeeMxn + invoicingFeeMxn
      stripeFeeVatMxn = stripeFeeSubtotalMxn * mergedConfig.vatRate
      totalStripeDeductionMxn = stripeFeeSubtotalMxn + stripeFeeVatMxn

      // IVA trasladado al cliente
      clientVatMxn = grossTotalMxn * mergedConfig.vatRate

      // Liquidación bancaria: Stripe deposita el Total menos sus comisiones
      netPayoutMxn = grossTotalMxn - totalStripeDeductionMxn
    }
  }

  const effectiveCommissionRate =
    grossTotalMxn > 0 ? (totalStripeDeductionMxn / grossTotalMxn) * 100 : 0

  const xrUsd = mergedConfig.exchangeRateUsd || 20.00
  const xrEur = mergedConfig.exchangeRateEur || 21.40

  return {
    basePriceMxn: Math.round(basePriceMxn * 100) / 100,
    clientVatMxn: Math.round(clientVatMxn * 100) / 100,
    stripeFeeTotalMxn: Math.round(totalStripeDeductionMxn * 100) / 100,
    grossTotalMxn: Math.round(grossTotalMxn * 100) / 100,

    processingFeeMxn: Math.round(processingFeeMxn * 100) / 100,
    fixedFeeMxn: Math.round(fixedFeeMxn * 100) / 100,
    invoicingFeeMxn: Math.round(invoicingFeeMxn * 100) / 100,
    stripeFeeSubtotalMxn: Math.round(stripeFeeSubtotalMxn * 100) / 100,
    stripeFeeVatMxn: Math.round(stripeFeeVatMxn * 100) / 100,
    totalStripeDeductionMxn: Math.round(totalStripeDeductionMxn * 100) / 100,

    netPayoutMxn: Math.round(netPayoutMxn * 100) / 100,
    effectiveCommissionRate: Math.round(effectiveCommissionRate * 100) / 100,

    basePriceUsd: Math.round((basePriceMxn / xrUsd) * 100) / 100,
    clientVatUsd: Math.round((clientVatMxn / xrUsd) * 100) / 100,
    stripeFeeTotalUsd: Math.round((totalStripeDeductionMxn / xrUsd) * 100) / 100,
    grossTotalUsd: Math.round((grossTotalMxn / xrUsd) * 100) / 100,
    totalStripeDeductionUsd: Math.round((totalStripeDeductionMxn / xrUsd) * 100) / 100,
    netPayoutUsd: Math.round((netPayoutMxn / xrUsd) * 100) / 100,

    basePriceEur: Math.round((basePriceMxn / xrEur) * 100) / 100,
    clientVatEur: Math.round((clientVatMxn / xrEur) * 100) / 100,
    stripeFeeTotalEur: Math.round((totalStripeDeductionMxn / xrEur) * 100) / 100,
    grossTotalEur: Math.round((grossTotalMxn / xrEur) * 100) / 100,
    totalStripeDeductionEur: Math.round((totalStripeDeductionMxn / xrEur) * 100) / 100,
    netPayoutEur: Math.round((netPayoutMxn / xrEur) * 100) / 100,

    vatToPaySatMxn: Math.round(clientVatMxn * 100) / 100,
  }
}
