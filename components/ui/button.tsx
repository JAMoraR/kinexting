import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-[color,background-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none shadow-[0_1px_2px_rgba(15,23,42,0.08),0_6px_16px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgba(15,23,42,0.12),0_12px_28px_rgba(15,23,42,0.14)] active:translate-y-0 active:shadow-[0_1px_3px_rgba(15,23,42,0.18)] dark:shadow-[0_1px_2px_rgba(2,6,23,0.6),0_10px_24px_rgba(2,6,23,0.45)] dark:hover:shadow-[0_6px_16px_rgba(2,6,23,0.6),0_18px_38px_rgba(14,165,233,0.18)] dark:active:shadow-[0_1px_4px_rgba(2,6,23,0.7)] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:hover:shadow-[0_4px_14px_rgba(2,6,23,0.45)]",
        link: "bg-transparent shadow-none text-primary underline-offset-4 hover:underline dark:text-cyan-300 dark:hover:text-cyan-200",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
