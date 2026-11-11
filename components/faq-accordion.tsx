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
          initial={{ opacity: 0, y: isMobile ? 8 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: isMobile ? 0.1 : 0.35 }}
          transition={{ duration: isMobile ? 0.28 : 0.4, ease: [0.23, 1, 0.32, 1], delay: index * 0.05 }}
        >
          <AccordionItem value={`item-${index}`} className="mb-3 rounded-xl border border-slate-200 bg-white/95 px-4 elev-1 dark:border-slate-700 dark:bg-slate-900/80">
            <AccordionTrigger className="py-3.5 sm:py-4 text-left text-sm sm:text-base font-semibold leading-snug min-h-[48px]">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        </motion.div>
      ))}
    </Accordion>
  )
}

