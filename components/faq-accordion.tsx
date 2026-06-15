"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion } from "framer-motion"
import { useIsMobile } from "@/hooks/use-mobile"

interface FaqItem {
  question: string
  answer: string
}

interface FaqAccordionProps {
  items: FaqItem[]
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const isMobile = useIsMobile()
  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: isMobile ? 8 : 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: isMobile ? 0.1 : 0.45 }}
          transition={{ duration: isMobile ? 0.3 : 0.45, ease: "easeOut", delay: index * (isMobile ? 0.05 : 0.1) }}
        >
          <AccordionItem value={`item-${index}`} className="mb-3 rounded-xl border border-slate-200 bg-white/95 px-4 elev-1 dark:border-slate-700 dark:bg-slate-900/80">
            <AccordionTrigger className="text-left font-medium">{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        </motion.div>
      ))}
    </Accordion>
  )
}

