export type ClientStatus = "active" | "trial" | "paused" | "suspended" | "cancelled"
export type BillingCycle = "quarterly" | "annual"

export interface Client {
  id: string
  name: string
  legal_name?: string | null
  email: string
  phone?: string | null
  rfc?: string | null
  country: string
  domain?: string | null
  status: ClientStatus
  stripe_customer_id?: string | null
  current_plan_id?: string | null
  monthly_amount: number
  billing_cycle: BillingCycle
  notes?: string | null
  metadata?: Record<string, any>
  created_at: string
  updated_at?: string
  plan?: Plan | null
}

export type BudgetItemKind = "costo" | "servicio"

export interface BudgetItem {
  id: string
  name: string
  description?: string
  provider: string
  kind: BudgetItemKind // "costo" = costo directo de proveedor, "servicio" = servicio brindado por Kinexting
  amount_mxn: number
  amount_usd: number
  amount_eur?: number
  currency?: "MXN" | "USD" | "EUR"
  markup_percent?: number // Comisión porcentual opcional sobre el costo (el importe resultante entra a Servicios Brindados)
  category?: string // Obsoleto - eliminado de la UI según requerimiento
  is_percentage?: boolean
  percentage_value?: number
}

export interface CycleBudgetBreakdown {
  target_price_mxn: number
  markup_percentage: number
  exchange_rate_usd: number // e.g. 19.85
  exchange_rate_eur?: number // e.g. 21.40
  items: BudgetItem[]
}

export interface PlanBudgetBreakdown {
  quarterly?: CycleBudgetBreakdown
  annual?: CycleBudgetBreakdown
  [cycle: string]: CycleBudgetBreakdown | undefined
}

export interface Plan {
  id: string
  name: string
  category?: "chatbot" | "both"
  description?: string | null
  stripe_product_id?: string | null
  stripe_quarterly_price_id?: string | null
  stripe_annual_price_id?: string | null
  price_quarterly_mxn: number
  price_annual_mxn: number
  currency: string
  features: string[]
  is_active: boolean
  budget_breakdown?: PlanBudgetBreakdown | null
  created_at?: string
  updated_at?: string
}

export interface Subscription {
  id: string
  client_id: string
  plan_id?: string | null
  stripe_subscription_id?: string | null
  stripe_price_id?: string | null
  status: "active" | "trialing" | "past_due" | "canceled" | "paused"
  billing_cycle: BillingCycle
  amount: number
  currency: string
  current_period_start?: string | null
  current_period_end?: string | null
  cancel_at_period_end: boolean
  created_at: string
  plan?: Plan | null
}

export interface Invoice {
  id: string
  client_id: string
  invoice_number: string
  stripe_invoice_id?: string | null
  sat_uuid?: string | null
  amount: number
  currency: string
  status: "paid" | "pending" | "timbrado" | "failed" | "cancelled"
  cfdi_status: "timbrado" | "pendiente" | "error" | "cancelado"
  uso_cfdi: string
  pdf_url?: string | null
  xml_url?: string | null
  issued_at: string
  created_at?: string
  client?: Client | null
}

export interface FiscalSettings {
  id: string
  rfc: string
  business_name: string
  regimen_fiscal: string
  postal_code: string
  pac_provider: string
  pac_environment: "sandbox" | "production"
  csd_status: "valid" | "warning" | "expired" | "not_configured"
  csd_expires_at?: string | null
  csd_serial?: string | null
  stripe_tax_enabled: boolean
  auto_timbrado: boolean
  updated_at?: string
}

export interface TaxRule {
  id: string
  rule_name: string
  rule_type: string
  rate: number
  description?: string | null
  is_active: boolean
  created_at?: string
}

export interface AuditLog {
  id: string
  client_id?: string | null
  actor_email: string
  action: string
  details: Record<string, any>
  created_at: string
}
