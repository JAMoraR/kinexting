"use client"

import { CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
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
  const formattedPrice = typeof price === "number"
    ? new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price)
    : "0.00"

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }} className="h-full">
      <Card className={`flex flex-col elev-interactive
        h-full
        ${popular ? "border-red-600 shadow-[0_10px_28px_rgba(220,38,38,0.25)] dark:shadow-[0_12px_32px_rgba(220,38,38,0.22)]" : ""}
        ${cheap ? "border-yellow-600 shadow-[0_10px_28px_rgba(202,138,4,0.24)] dark:shadow-[0_12px_32px_rgba(202,138,4,0.2)]" : ""}
        ${recommended ? "border-indigo-600 shadow-[0_12px_32px_rgba(79,70,229,0.28)] dark:shadow-[0_14px_36px_rgba(56,189,248,0.22)]" : ""}
        ${highQuality ? "border-green-600 shadow-[0_10px_28px_rgba(22,163,74,0.24)] dark:shadow-[0_12px_32px_rgba(22,163,74,0.2)]" : ""}`}>
        <CardHeader className="space-y-3">
          {popular && <Badge className="w-fit mb-2 bg-red-600">Más vendido</Badge>}
          {cheap && <Badge className="w-fit mb-2 bg-yellow-600">Mejor precio</Badge>}
          {recommended && <Badge className="w-fit mb-2 bg-indigo-600">Recomendado</Badge>}
          {highQuality && <Badge className="w-fit mb-2 bg-green-600">Más ventajas</Badge>}
          <CardTitle>{title}</CardTitle>
          {!hidePrice && (
            <div className="flex items-baseline gap-1">
              <motion.span initial={{ scale: 1 }} whileHover={{ scale: 1.1 }} className="text-3xl font-bold">
                ${formattedPrice}
              </motion.span>
              <span className="text-muted-foreground">/{period}</span>
            </div>
          )}
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <motion.li
                key={index}
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CheckIcon className="h-5 w-5 text-indigo-600" />
                <span>{feature}</span>
              </motion.li>
            ))}
            {differences.map((differences, index) => (
              <motion.li
                key={index}
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="text-gray-400">- {differences}</span>
              </motion.li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="mt-auto">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full">
            <Link href={buttonLink} className="w-full">
              <Button
                className={`w-full 
                  ${recommended ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                  ${popular ? "bg-red-600 hover:bg-red-700" : ""}`}
                variant={recommended || popular ? "default" : "outline"}
              >
                {buttonText}
              </Button>
            </Link>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

