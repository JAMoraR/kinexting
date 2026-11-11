# Animation Audit & Motion Roadmap — Kinexting (`hosting-landing-page`)

> **Baseline Commit**: `2666d89` (`feat: Reestructuración flaghship de planes de agentes IA (Esencial y Omnicanal) y CRM todo-en-uno`)
> **Skill**: `/improve-animations` (Senior Motion Advisor Audit & Self-Contained Plans)

---

## 1. Executive Summary

We surveyed every Framer Motion (`framer-motion@^12.6.2`), Tailwind CSS (`tailwindcss-animate`), and custom CSS transition across the Kinexting B2B SaaS application (`app/globals.css`, `app/page.tsx`, `components/pricing-card.tsx`, `components/faq-accordion.tsx`, `app/checkout/page.tsx`, `app/configurar-plan/page.tsx`, and `components/theme-toggle.tsx`).

### High-Impact Findings Addressed & Documented

1. **Global `.dark *` Transition Bomb (`app/globals.css`)**:
   - A universal selector `.dark * { transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease; }` forced style recalculations on every DOM node during scroll and theme switching on mobile GPUs.
2. **Sticky Hover Transforms on Touch Devices (`app/globals.css`, `app/page.tsx`, `components/pricing-card.tsx`)**:
   - `.elev-interactive:hover { transform: translateY(-2px); }` lacked `@media (hover: hover) and (pointer: fine)` and had no `:active` press feedback (`scale(0.985)`) for touchscreens.
3. **Decorative Infinite Loops & Per-Item Mount Waterfall (`app/page.tsx`, `components/pricing-card.tsx`, `app/configurar-plan/page.tsx`)**:
   - Infinite background blob animations in the CTA section, an infinite color-pulsing `h1` in `/configurar-plan`, and per-`<li>` mount animations inside `PricingCard` degraded mobile frame rates without adding user comprehension.
4. **Built-in `easeOut` / `easeIn` & Bouncy Springs (`app/page.tsx`, `app/checkout/page.tsx`, `components/faq-accordion.tsx`)**:
   - Replaced generic `easeOut`/`easeIn` and bouncy `stiffness: 300` springs on B2B UI elements with a cohesive custom exponential ease-out (`cubic-bezier(0.23, 1, 0.32, 1)`) and Apple-sheet drawer curve (`cubic-bezier(0.32, 0.72, 0, 1)`).

---

## 2. Prioritized Implementation Plans

| Plan | Title | Priority | Target Files | Status |
| :--- | :--- | :--- | :--- | :--- |
| [001](./001-css-easing-tokens-and-touch-hover-guards.md) | CSS Easing Tokens, `.dark *` Removal & Touch Hover Guards | **P0 — Critical Performance & Touch Polish** | `app/globals.css`, `components/theme-toggle.tsx` | Applied & Verified |
| [002](./002-landing-page-motion-and-mobile-choreography.md) | Landing Page Motion Audit, Mobile Drawer & Comparison Choreography | **P1 — Mobile UX & Choreography** | `app/page.tsx`, `components/pricing-card.tsx`, `components/faq-accordion.tsx` | Applied & Verified |
| [003](./003-pricing-checkout-and-configurator-motion.md) | Checkout Step Transitions & Plan Configurator Motion | **P1 — Conversion Flow Motion** | `app/checkout/page.tsx`, `app/checkout/return/page.tsx`, `app/configurar-plan/page.tsx` | Applied & Verified |
