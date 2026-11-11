"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Users,
  CreditCard,
  Receipt,
  Building2,
  Percent,
  Database,
  Zap,
  LogOut,
  ChevronRight,
  ShieldCheck,
  RotateCw,
  Calculator,
  Menu,
} from "lucide-react"
import ThemeToggle from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { toast } from "sonner"

const NAV_ITEMS = [
  {
    title: "Clientes & Cuentas",
    href: "/admin/clientes",
    icon: Users,
    badge: "Fleet 360",
  },
  {
    title: "Planes & Suscripciones",
    href: "/admin/planes",
    icon: CreditCard,
    badge: "Stripe Sync",
  },
  {
    title: "Presupuesto & Simulador",
    href: "/admin/presupuesto",
    icon: Calculator,
    badge: "Costos IA",
  },
  {
    title: "Facturación & CFDI 4.0",
    href: "/admin/facturacion",
    icon: Receipt,
    badge: "SAT",
  },
  {
    title: "Configuración Fiscal CSD",
    href: "/admin/configuracion-fiscal",
    icon: Building2,
    badge: "Finkok",
  },
  {
    title: "Retenciones e Impuestos",
    href: "/admin/impuestos",
    icon: Percent,
    badge: "LIVA / ISR",
  },
]

export function AdminSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      localStorage.removeItem("kinexting_admin_session")
      toast.success("Sesión cerrada correctamente")
      window.location.href = "/admin/login"
    } catch {
      window.location.href = "/admin/login"
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex flex-col justify-between flex-1 h-full">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-border/40 flex items-center justify-between">
          <Link href="/admin/clientes" onClick={onNavigate} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-primary group-hover:border-primary transition-colors">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                Kinexting
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  Command
                </span>
              </span>
              <span className="text-[11px] text-muted-foreground">Panel de Control</span>
            </div>
          </Link>
          <ThemeToggle />
        </div>

        {/* Navigation Section */}
        <div className="p-3">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Gestión Operativa
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/admin/clientes" && (pathname === "/admin" || pathname.startsWith("/admin/clientes/")))

              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex min-h-[44px] items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium border border-primary/20 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    />
                    <span className="truncate">{item.title}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                        isActive
                          ? "bg-primary/20 text-primary"
                          : "bg-muted/60 text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Telemetry Status Box */}
        <div className="px-4 py-3 mx-3 mt-4 rounded-xl bg-muted/30 border border-border/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              Supabase Status
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Replicación PostgreSQL activa en us-east-1 con cifrado AES-256.
          </p>
          <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>Latencia</span>
            <span className="text-emerald-500 font-medium">32ms</span>
          </div>
        </div>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-border/40 space-y-2">
        <div className="p-2.5 rounded-lg bg-card border border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
              AP
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">Ángel Portero</div>
              <div className="text-[11px] text-muted-foreground truncate font-mono">angelpordiez@gmail.com</div>
            </div>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full min-h-[40px] flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent hover:border-destructive/20"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>
        </button>
      </div>
    </div>
  )
}

export function AdminSidebar() {
  return (
    <aside className="hidden lg:flex w-64 border-r border-border/60 bg-card/60 backdrop-blur-md flex-col justify-between shrink-0 min-h-screen">
      <AdminSidebarContent />
    </aside>
  )
}

export function AdminHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
}: {
  title: string
  subtitle?: string
  breadcrumbs?: { label: string; href?: string }[]
  actions?: React.ReactNode
}) {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    router.refresh()
    setTimeout(() => {
      setRefreshing(false)
      toast.success("Telemetría sincronizada")
    }, 600)
  }

  return (
    <header className="border-b border-border/40 bg-card/40 backdrop-blur-md sticky top-0 z-30 px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Abrir navegación de administración"
                className="lg:hidden mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card text-foreground hover:bg-muted/50 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(85vw,280px)] p-0 flex flex-col">
              <SheetTitle className="sr-only">Menú de Administración</SheetTitle>
              <AdminSidebarContent onNavigate={() => setMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mb-1 font-mono">
                <span>Kinexting</span>
                {breadcrumbs.map((bc, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 min-w-0">
                    <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground/60" />
                    {bc.href ? (
                      <Link href={bc.href} className="hover:text-foreground transition-colors truncate">
                        {bc.label}
                      </Link>
                    ) : (
                      <span className="text-foreground font-medium truncate">{bc.label}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{subtitle}</p>}
          </div>
        </div>

        {/* Live Badges & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-card border border-border/60 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-[11px] text-muted-foreground">
              Supabase: <strong className="text-foreground">Conectado</strong>
            </span>
          </div>

          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-card border border-border/60 text-xs">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono text-[11px] text-muted-foreground">
              Stripe: <strong className="text-foreground">99.98%</strong>
            </span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refrescar telemetría"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? "animate-spin text-primary" : ""}`} />
          </button>

          {actions}
        </div>
      </div>
    </header>
  )
}
