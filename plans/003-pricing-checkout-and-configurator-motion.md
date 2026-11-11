# Plan 003: Checkout Step Transitions & Plan Configurator Motion

- **Baseline Commit**: `2666d89`
- **Priority**: P1 (Conversion Flow Motion)
- **Target Files**:
  - `app/checkout/page.tsx`
  - `app/checkout/return/page.tsx`
  - `app/configurar-plan/page.tsx`

---

## Why

1. **Built-in `easeIn` / `easeOut` in Checkout Stepper (`app/checkout/page.tsx`)**:
   - `stepTransitionVariants` used `ease: "easeOut"` on enter and `ease: "easeIn"` on exit. Using custom `cubic-bezier(0.23, 1, 0.32, 1)` creates a crisper, more responsive transition between Step 1 (Solución), Step 2 (Perfil del Negocio), and Step 3 (Activación).
2. **Infinite Color-Pulsing Heading in `/configurar-plan` (`app/configurar-plan/page.tsx`)**:
   - The `<h1>` span wrapping `activePlanData.name` ran `animate={{ color: "#6366f1" }} transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}`, continuously repainting text color with zero informational value.
3. **Bouncy Spring Hover on Optional Extras (`app/configurar-plan/page.tsx`)**:
   - Each optional extra card used `whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 300 }}` and per-feature `<motion.li>` staggered animations in the order summary.

---

## What Changes

1. **`app/checkout/page.tsx` & `app/checkout/return/page.tsx`**:
   - Update `stepTransitionVariants` and CFDI invoice accordion transitions to use `ease: [0.23, 1, 0.32, 1]`.
   - Add `active:scale-[0.98]` press feedback on primary step progression buttons.
2. **`app/configurar-plan/page.tsx`**:
   - Replace the infinite color-pulsing `<motion.span>` in `<h1>` with a static `<span className="text-indigo-600 dark:text-cyan-400">`.
   - Replace `type: "spring", stiffness: 300` on plan selector cards with `transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}` and `whileTap={{ scale: 0.985 }}`.
   - Replace per-feature `<motion.li>` staggered animations in the order summary with a single container transition (`duration: 0.25, ease: [0.23, 1, 0.32, 1]`).

---

## Verification
- Confirm `repeat: Number.POSITIVE_INFINITY` is completely removed from `app/configurar-plan/page.tsx`.
- Run `npx tsc --noEmit` to verify type safety across `/checkout`, `/checkout/return`, and `/configurar-plan`.
