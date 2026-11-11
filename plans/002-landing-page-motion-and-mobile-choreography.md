# Plan 002: Landing Page Motion Audit, Mobile Drawer & Comparison Choreography

- **Baseline Commit**: `2666d89`
- **Priority**: P1 (Mobile UX & Choreography)
- **Target Files**:
  - `app/page.tsx`
  - `components/pricing-card.tsx`
  - `components/faq-accordion.tsx`

---

## Why

1. **Per-Item Mount Animations in `PricingCard` (`components/pricing-card.tsx`)**:
   - Every feature `<li>` and difference `<li>` inside `PricingCard` previously had its own `<motion.li initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>`. With 7+ items per card, switching billing tabs triggered dozens of staggered child animations simultaneously.
2. **Spring Physics on B2B Cards & Footer Links**:
   - `PricingCard` used `transition={{ type: "spring", stiffness: 300 }}` and footer links used `whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}`, producing playful bounce out of character for Kinexting's "Cybernetic Kinetic Command" B2B aesthetic.
3. **Per-Row Table Mount Animations on Mobile (`app/page.tsx`)**:
   - The comparison table animated every `<tr>` individually (`delay: (rowIndex + 1) * 0.05`) inside a `min-w-[760px]` horizontal scroll container.
4. **Decorative Infinite Loops in CTA (`app/page.tsx`)**:
   - Two `blur-3xl` background blobs ran infinite `scale`/`opacity` loops (`repeat: Number.POSITIVE_INFINITY`), consuming GPU compositing time continuously when scrolled into view.

---

## What Changes

1. **Shared Exponential Ease-Out (`EASE_OUT_EXPO = [0.23, 1, 0.32, 1]`)**:
   - Standardize section entrances, card reveals, and FAQ accordion transitions on `[0.23, 1, 0.32, 1]` with durations capped at `0.25s–0.45s`.
2. **Simplify `PricingCard` (`components/pricing-card.tsx`)**:
   - Keep the card-level hover elevation (`whileHover={{ y: -5 }}`) and price change crossfade, and replace per-`<li>` `<motion.li>` wrappers with static `<li>` elements and `shrink-0 mt-0.5` icons.
3. **Transform Mobile Comparison Table (`app/page.tsx`)**:
   - Render scannable mobile comparison cards (`md:hidden`) with a 3-column mini-grid (`Esencial`, `Omnicanal`, `Enterprise`) per feature row and static `<tr>` rows on desktop (`hidden md:block`).
4. **Remove Infinite CTA Blob Loops (`app/page.tsx`)**:
   - Convert the CTA ambient blurs to static `pointer-events-none` gradients.

---

## Verification
- Verify `PricingCard` renders static `<li>` items without mount delay waterfalls.
- Verify `#comparison` renders `md:hidden` mobile cards on `< 768px` and `hidden md:block` table on `>= 768px`.
