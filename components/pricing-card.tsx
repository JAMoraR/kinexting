"use client"

import { CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import Link from "next/link"

interface PricingCardProps {
  title: string
  price: number
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
}: PricingCardProps) {
  const formattedPrice = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
      <Card className={`flex flex-col 
        ${popular ? "border-red-600 shadow-lg" : ""}
        ${cheap ? "border-yellow-600 shadow-lg" : ""}
        ${recommended ? "border-indigo-600 shadow-lg" : ""}
        ${highQuality ? "border-green-600 shadow-lg" : ""}`}>
        <CardHeader>
          {popular && <Badge className="w-fit mb-2 bg-red-600">Más vendido</Badge>}
          {cheap && <Badge className="w-fit mb-2 bg-yellow-600">Mejor precio</Badge>}
          {recommended && <Badge className="w-fit mb-2 bg-indigo-600">Recomendado</Badge>}
          {highQuality && <Badge className="w-fit mb-2 bg-green-600">Más ventajas</Badge>}
          <CardTitle>{title}</CardTitle>
          <div className="flex items-baseline gap-1">
            <motion.span initial={{ scale: 1 }} whileHover={{ scale: 1.1 }} className="text-3xl font-bold">
              ${formattedPrice}
            </motion.span>
            <span className="text-muted-foreground">/{period}</span>
          </div>
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
        <CardFooter>
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

