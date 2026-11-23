# DESIGN.md — NutriMentor Design System Specification

> Standardized design specification following the 9-section `awesome-design-md` protocol, calibrated with Apple HIG (`apple-design`), anti-slop guidelines (`taste-skill`), and award-winning frontend craft (`impeccable`).

---

## 1. Visual Theme & Atmosphere
- **Philosophy:** Apple Fluid Interface + Linear Minimalist Precision. Clean, calm, trustworthy health & nutrition companion.
- **Visual Dials:**
  - `DESIGN_VARIANCE: 7` (Intentional hierarchy, organic bento structures)
  - `MOTION_INTENSITY: 6` (Physical spring physics, instant `:active` tactile presses, interruptible bottom sheets)
  - `VISUAL_DENSITY: 3` (Airy, phone-first, thumb-zone optimized)
- **Lighting Mode:** System-adaptive with explicit theme tokens for light (clean alabaster `#f8fafc`) and dark (deep slate `#0b1120`).

---

## 2. Color Palette & Semantic Roles (60/30/10 Rule)
Derived from the user-specified Nordic Oceanic & Liquid Glass palette images:
- **Image 1 Palette (Deep Midnight & Slate Teal):**
  - Midnight Navy: `#131b2b`
  - Slate Teal: `#2f4a63`
  - Ocean Mist: `#5b91a3`
  - Mint Ice: `#cfeae0`
- **Image 2 Palette (Deep Cyan & Nordic Ice):**
  - Abyss Black-Navy: `#071b2b`
  - Deep Cyan-Teal: `#167d8d` (Brand Accent & Primary CTA)
  - Arctic Cyan Glow: `#b9e4e8` (Glows & Highlights)
  - Pure Specular Glare: `#eeeeee` / `#ffffff`

### Systematic Roles
- **Canvas Neutral (60%):**
  - Light Canvas: `#f4f8fa` | Surface Card: `#ffffff`
  - Dark Canvas: `#071b2b` (Deep Abyssal Navy) | Surface Card: `#131b2b` (Midnight)
- **Structural Text (30%):**
  - Primary Headings: `#071b2b` (Light) / `#f4f8fa` (Dark)
  - Secondary Text: `#4e6a7d` (Light) / `#8ba5b5` (Dark)
  - Hairline Borders: `rgba(47, 74, 99, 0.18)` (Light) / `rgba(91, 145, 163, 0.22)` (Dark)
- **Brand Accent (10%):**
  - Primary Accent: `#167d8d` (Deep Cyan-Teal)
  - Hover Accent: `#11626f`
  - Dark Accent: `#1995a8` / `#b9e4e8`
  - Accent Tint: `rgba(22, 125, 141, 0.12)` for secondary badges and subtle card glows
  - Mint Ice Accent: `#cfeae0`
- **Nutritional Semantic Chips:**
  - Calories: Amber `#f59e0b` (`bg-amber-500/10 text-amber-700`)
  - Protein: Deep Teal `#167d8d` (`bg-[#167d8d]/15 text-[#167d8d] dark:text-[#b9e4e8]`)
  - Carbs: Ocean Slate `#2f4a63` / `#5b91a3` (`bg-[#5b91a3]/15 text-[#2f4a63] dark:text-[#b9e4e8]`)
  - Fat: Warm Amber `#ea580c` (`bg-orange-500/10 text-orange-700`)
  - Fibre: Mint Ice `#cfeae0` (`bg-[#cfeae0]/60 text-[#071b2b] dark:bg-[#cfeae0]/20 dark:text-[#cfeae0]`)

---

## 3. Typography Hierarchy (Apple SF Pro & Geist)
- **Font Stack:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", var(--font-sans), sans-serif`
- **Headings:** Tight tracking (`tracking-tight` / `tracking-tighter`), balanced text wrap (`text-wrap: balance`), line-height 1.1-1.2.
- **Metrics & Numbers:** Always use `tabular-nums` for macro gram counts and calorie totals.
- **Scale:**
  - Hero Display: `text-2xl sm:text-3xl font-bold`
  - Section Title: `text-lg font-semibold`
  - Body: `text-sm leading-relaxed max-w-[65ch]`
  - Eyebrow / Chips: `text-xs font-semibold uppercase tracking-wider`

---

## 4. Component Stylings
- **Buttons:**
  - 44px minimum touch target on mobile (`min-h-[44px]`).
  - Tactile press feedback on `:active`: `active:scale-[0.96] transition-transform duration-150`.
  - Primary CTA: Solid emerald gradient with soft colored shadow (`shadow-md shadow-emerald-600/25`).
- **Cards:**
  - `rounded-2xl`, multi-layer diffuse shadow (`shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_20px_rgba(0,0,0,0.02)]`).
  - Specular hairline border (`border-slate-200/80 dark:border-slate-800/80`).
- **Sheets & Modals:**
  - Phone-first: Slide-up bottom sheets with pull pill handles (`h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-4`).
  - Translucent backdrop blur (`backdrop-blur-xl bg-black/50`).

---

## 5. Layout Principles
- **Phone-First Thumb Zone:** Primary navigation and scan triggers anchored to the bottom third of the viewport.
- **8-Point Spatial Grid:** Spacing values: 8px (`gap-2`), 12px (`gap-3`), 16px (`gap-4`), 24px (`gap-6`), 32px (`gap-8`).
- **Safe Area Insets:** All mobile fixed headers and bottom navigation bars respect `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.

---

## 6. Depth & Elevation (Liquid Glass)
- **Glass Panel:**
  ```css
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(226, 232, 240, 0.7);
  ```
- **Dark Glass:**
  ```css
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(20px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  ```

---

## 7. Do's and Don'ts (Craft Floor)
- **DO:** Ensure all tap targets are >= 44×44px on touch devices.
- **DO:** Automatically estimate protein, calories, and macros with AI so the user never does math.
- **DO:** Use `text-wrap: balance` to eliminate awkward single-word wrapping on headlines.
- **DON'T:** Use harsh pure-black shadows or generic neon AI purple blobs.
- **DON'T:** Force desktop center dialogs on mobile — use bottom sheets with pull handles.

---

## 8. Responsive Rules
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`.
- Mobile navigation: 5-item bottom bar with elevated primary scan hero in the thumb zone.
- Desktop navigation: Clean sticky sidebar with active pill indicators.

---

## 9. Agent Prompt Guide
When generating or modifying UI components, anchor all design choices to the tokens, spacing, and principles defined in this `DESIGN.md`.
