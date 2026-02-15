# Global Design Standards (Updated)

## 1. Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Component Primitives**: Radix UI
- **Theming**: CSS Variables with `next-themes`

## 2. Icons (@hugeicons/react)

**Package**: `@hugeicons/react` (Huge Icons Pro)

**Usage**:
- Use **Filled** variants for primary actions and active states
- Use **Stroke** variants for secondary/inactive states
- **Stroke width**: 1.2px
- **Base size**: 16px (`size-4`)

```tsx
import { Home01Icon, User01Icon } from "@hugeicons/react"

// Filled for emphasis
<Home01Icon variant="filled" className="size-4" />

// Stroke for default
<User01Icon variant="stroke" className="size-4" />
```

## 3. Typography (2 Weights Only)

**Font**: Geist (keep existing)

**Rules**:
- **Regular (400)**: All body text, paragraphs, descriptions
- **Medium (500)**: Headings, buttons, labels, emphasis

**No bold, no semibold, no light.**

```tsx
// Body text
<p className="text-sm font-normal text-foreground">

// Headings
<h2 className="text-lg font-medium text-foreground">

// Buttons
<Button className="font-medium">
```

## 4. Colors (Tailwind Neutral Palette)

**Background**: `bg-neutral-50` (light) / `bg-neutral-950` (dark)
**Surface**: `bg-white` (light) / `bg-neutral-900` (dark)
**Border**: `border-neutral-200` (light) / `border-neutral-800` (dark)
**Text Primary**: `text-neutral-900` (light) / `text-neutral-100` (dark)
**Text Secondary**: `text-neutral-500`
**Text Muted**: `text-neutral-400`

**Accent** (keep minimal):
- Primary action: `bg-neutral-900 text-white` (light) / `bg-white text-neutral-900` (dark)
- Destructive: `bg-red-600 text-white`

## 5. Border Radius (8-12px Only)

- **Small**: `rounded-lg` (8px)
- **Default**: `rounded-xl` (12px)
- **Large**: `rounded-2xl` (16px) - use sparingly
- **Never**: `rounded-md` (6px), `rounded-3xl`, `rounded-full` (except avatars)

## 6. Spacing

Follow Tailwind's 4px scale:
- `gap-3` (12px) for tight groupings
- `gap-4` (16px) for standard spacing
- `p-4` (16px) for card padding
- `p-6` (24px) for section padding

## 7. Component Patterns

**Cards**:
```tsx
<div className="bg-white rounded-xl border border-neutral-200 p-4">
```

**Buttons**:
```tsx
// Primary
<Button className="bg-neutral-900 text-white rounded-lg font-medium">

// Secondary
<Button variant="outline" className="border-neutral-200 rounded-lg font-medium">

// Ghost
<Button variant="ghost" className="text-neutral-500 hover:text-neutral-900 font-normal">
```

**Inputs**:
```tsx
<Input className="rounded-lg border-neutral-200 focus:border-neutral-400" />
```

## 8. Migration Notes

- Replace all `lucide-react` imports with `@hugeicons/react`
- Replace `font-semibold` with `font-medium`
- Replace `font-bold` with `font-medium`
- Replace `rounded-md` with `rounded-lg`
- Replace semantic colors (`bg-primary`) with neutral palette
