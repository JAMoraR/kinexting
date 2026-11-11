"use client"

import { CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { useIsMobile } from "@/hooks/use-mobile"
import Link from "next/link"

interface PricingCardProps {
  title: string
  price?: number
  period?: string
  description: string
  features: string[]
  differences: string[]
  buttonText: string
  buttonLink: string
  popular?: boolean
  cheap?: boolean
  recommended?: boolean
  highQuality?: boolean
  hidePrice?: boolean
}

export default function PricingCard({
  title,
  price,
  period,
  description,
  features,
  differences,
  buttonText,
  buttonLink,
  popular = false,
  cheap = false,
  recommended = false,
  highQuality = false,
  hidePrice = false,
}: PricingCardProps) {
  const isMobile = useIsMobile()
  const formattedPrice = typeof price === "number"
    ? new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price)
    : "0.00"

  return (
    <motion.div
      whileHover={isMobile ? undefined : { y: -4 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="h-full"
    >
      <Card className={`flex flex-col elev-interactive
        h-full
        ${popular ? "border-red-600 shadow-[0_10px_28px_rgba(220,38,38,0.25)] dark:shadow-[0_12px_32px_rgba(220,38,38,0.22)]" : ""}
        ${cheap ? "border-yellow-600 shadow-[0_10px_28px_rgba(202,138,4,0.24)] dark:shadow-[0_12px_32px_rgba(202,138,4,0.2)]" : ""}
        ${recommended ? "border-indigo-600 shadow-[0_12px_32px_rgba(79,70,229,0.28)] dark:shadow-[0_14px_36px_rgba(56,189,248,0.22)]" : ""}
        ${highQuality ? "border-green-600 shadow-[0_10px_28px_rgba(22,163,74,0.24)] dark:shadow-[0_12px_32px_rgba(22,163,74,0.2)]" : ""}`}>
        <CardHeader className="space-y-2.5 p-5 sm:p-6">
          <div className="flex flex-wrap gap-1.5">
            {popular && <Badge className="w-fit bg-red-600">Más vendido</Badge>}
            {cheap && <Badge className="w-fit bg-yellow-600">Mejor precio</Badge>}
            {recommended && <Badge className="w-fit bg-indigo-600">Recomendado</Badge>}
            {highQuality && <Badge className="w-fit bg-green-600">Más ventajas</Badge>}
          </div>
          <CardTitle className="text-xl sm:text-2xl">{title}</CardTitle>
          {!hidePrice && (
            <div className="flex flex-col gap-0.5">
              <div className="flex flex-wrap items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-bold shrink-0 tabular-nums">
                  ${formattedPrice}
                </span>
                <span className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">MXN/{period}</span>
              </div>
              <span className="text-[11px] font-mono font-medium text-cyan-600 dark:text-cyan-400">
                + IVA (16%)
              </span>
            </div>
          )}
          <CardDescription className="text-xs sm:text-sm leading-relaxed">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 px-5 pb-5 sm:px-6 sm:pb-6">
          <ul className="space-y-2.5 text-xs sm:text-sm">
            {features.map((feature, index) => (
              <li
                key={index}
                className="flex items-start gap-2.5"
              >
                <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="leading-snug">{feature}</span>
              </li>
            ))}
            {differences.map((difference, index) => (
              <li
                key={index}
                className="flex items-start gap-2.5"
              >
                <span className="text-muted-foreground leading-snug">- {difference}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="mt-auto p-5 pt-0 sm:p-6 sm:pt-0">
          <div className="w-full">
            <Link href={buttonLink} className="w-full block">
              <Button
                className={`w-full h-11 sm:h-10 font-semibold active:scale-[0.98] transition-transform duration-150
                  ${recommended ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                  ${popular ? "bg-red-600 hover:bg-red-700" : ""}
                  ${cheap ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                  ${highQuality ? "bg-green-600 hover:bg-green-700" : ""}`}
                variant={recommended || popular || cheap || highQuality ? "default" : "outline"}
              >
                {buttonText}
              </Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

