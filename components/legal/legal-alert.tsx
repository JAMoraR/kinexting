import type { ReactNode } from "react"
import { AlertTriangle, Info, ShieldAlert, Sparkles } from "lucide-react"

type LegalAlertTone = "info" | "warning" | "danger" | "accent"

type LegalAlertProps = {
  tone?: LegalAlertTone
  title?: string
  children: ReactNode
}

const toneStyles: Record<LegalAlertTone, { wrapper: string; icon: ReactNode }> = {
  info: {
    wrapper: "border-l-primary bg-primary/5 text-foreground dark:bg-primary/10",
    icon: <Info className="h-4 w-4 text-primary" />,
  },
  warning: {
    wrapper: "border-l-amber-500 bg-amber-500/10 text-foreground dark:bg-amber-500/15",
    icon: <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-300" />,
  },
  danger: {
    wrapper: "border-l-destructive bg-destructive/5 text-foreground dark:bg-destructive/10",
    icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
  },
  accent: {
    wrapper: "border-l-cyan-500 bg-cyan-500/10 text-foreground dark:bg-cyan-500/15",
    icon: <Sparkles className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />,
  },
}

export default function LegalAlert({ tone = "info", title, children }: LegalAlertProps) {
  const styles = toneStyles[tone]

  return (
    <div className={`rounded-xl border border-slate-200 border-l-4 px-4 py-4 shadow-sm dark:border-slate-800 ${styles.wrapper}`}>
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background/80 ring-1 ring-border dark:bg-background/10">
          {styles.icon}
        </div>
        <div className="space-y-1">
          {title ? <p className="font-semibold text-foreground">{title}</p> : null}
          <div className="text-base leading-relaxed text-foreground/90">{children}</div>
        </div>
      </div>
    </div>
  )
}