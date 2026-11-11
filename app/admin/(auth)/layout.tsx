import { ReactNode } from "react"

export default function AdminAuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Ambient gradient glow following DESIGN.md */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-[400px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] opacity-50"></div>
      </div>
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  )
}
