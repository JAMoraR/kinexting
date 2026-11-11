# Plan 001: CSS Easing Tokens, `.dark *` Removal & Touch Hover Guards

- **Baseline Commit**: `2666d89`
- **Priority**: P0 (Critical Performance & Touch Polish)
- **Target Files**:
  - `app/globals.css`
  - `components/theme-toggle.tsx`

---

## Why

1. **Universal `.dark *` Transition Selector**: `app/globals.css` previously declared `.dark * { transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease; }`. Applying transitions to `*` forces the browser to track and interpolate style changes across thousands of DOM nodes simultaneously, causing scroll jank on mobile devices.
2. **Unscoped `:hover` on Touch Screens**: `.elev-interactive:hover` applied `transform: translateY(-2px)` unconditionally. On iOS/Android touchscreens, tapping an interactive card latches the `:hover` state until the user taps elsewhere, leaving cards floating mid-air.
3. **Missing Custom Easing Tokens & Reduced Motion Fallbacks**: Animations used browser-default `ease` / `ease-in-out` instead of custom `cubic-bezier` curves, and lacked a global `@media (prefers-reduced-motion: reduce)` safeguard.

---

## What Changes

### 1. `app/globals.css`
- Define CSS custom properties in `:root`:
  - `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`
  - `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`
  - `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`
- Remove `.dark * { transition: ... }`.
- Scope `.elev-interactive:hover` inside `@media (hover: hover) and (pointer: fine)` and add `.elev-interactive:active { transform: scale(0.985); }` for tactile mobile press feedback.
- Add `@media (prefers-reduced-motion: reduce)` to collapse animation/transition durations for users who request reduced motion.

### 2. `components/theme-toggle.tsx`
- Increase mobile touch target from `h-9 w-9` (`36px`) to `h-10 w-10 sm:h-9 sm:w-9 shrink-0` (`40px` on mobile) with `active:scale-95` tactile feedback.

---

## Verification
- Run `npx tsc --noEmit` to verify zero TypeScript issues.
- Confirm `.dark *` is absent from `app/globals.css` and `.elev-interactive:hover` is wrapped in `@media (hover: hover) and (pointer: fine)`.
