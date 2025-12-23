# Global Design Standards

This document outlines the design system and coding standards for the application to ensure consistency, maintainability, and a unified look & feel.

## 1. Tech Stack & Core Philosophy

- **Framework**: Next.js 16 (App Router)
- **Styling Engine**: Tailwind CSS v4
- **Component Primitives**: Radix UI (Headless, accessible)
- **Icons**: Lucide React
- **Theming**: CSS Variables with `next-themes` (Dark/Light mode support)

**Core Philosophy**:
- **Accessibility First**: Use Radix UI primitives to ensure keyboard navigation and screen reader support.
- **Utility-First**: Leverage Tailwind CSS for styling. Avoid writing custom CSS files outside of `globals.css`.
- **Composition**: Build complex UIs by composing small, single-purpose components.

## 2. Color System

We use a semantic color system based on **OKLCH** color space for better perceptual uniformity. Colors are defined as CSS variables in `globals.css`.

### Semantic Tokens
Instead of hardcoding hex values (e.g., `#000000`), use semantic utility classes:

| Role | Class Prefix | Description |
|------|--------------|-------------|
| **Background** | `bg-background` | Page background color |
| **Foreground** | `text-foreground` | Base text color |
| **Primary** | `bg-primary`, `text-primary-foreground` | Main actions (e.g., "Submit" buttons) |
| **Secondary** | `bg-secondary`, `text-secondary-foreground` | Less prominent actions |
| **Muted** | `bg-muted`, `text-muted-foreground` | Subdued elements (backgrounds, helper text) |
| **Accent** | `bg-accent`, `text-accent-foreground` | Interactive highlights (hover states, selected items) |
| **Destructive** | `bg-destructive`, `text-destructive-foreground` | Destructive actions (e.g., "Delete") |
| **Border** | `border-border` | Default border color |
| **Input** | `border-input` | Border color for form inputs |
| **Ring** | `ring-ring` | Focus ring color |

### Charts & Visualization
Chart colors are defined as `--chart-1` through `--chart-5` to ensure consistent data visualization palettes across the app.

## 3. Typography

We use **Geist** font family via `next/font`.

- **Sans-serif**: `font-sans` (Geist Sans) - Used for UI text, headings, and body.
- **Monospace**: `font-mono` (Geist Mono) - Used for code blocks, IDs, and tabular data where alignment matters.

**Guidelines**:
- Use `text-sm` (14px) as the default font size for UI controls.
- Use `text-muted-foreground` for secondary information to establish visual hierarchy.
- Use `font-medium` or `font-semibold` for emphasis, avoiding `font-bold` unless necessary for large headings.

## 4. Spacing & Radii

### Spacing
Follow Tailwind's default spacing scale (multiples of 4px).
- **Small**: `gap-2` (8px), `p-2` (8px)
- **Medium**: `gap-4` (16px), `p-4` (16px)
- **Large**: `gap-6` (24px), `p-6` (24px)
- **Section**: `gap-8` (32px), `p-8` (32px)

### Border Radius
We use a variable-based radius system to allow global "roundness" adjustments.
- **Default**: `rounded-lg` (uses `var(--radius)`)
- **Small**: `rounded-md`
- **Large**: `rounded-xl`
- **Full**: `rounded-full` (for avatars, badges)

## 5. Component Architecture

### UI Components (`src/components/ui`)
These are low-level, reusable building blocks (Buttons, Inputs, Cards) powered by shadcn/ui.
- **HARD RULE**: All new UI elements MUST use these pre-built components whenever possible. Do not build custom UI primitives (like modals, dropdowns, or tabs) from scratch.
- **Do not modify logic**: These should remain purely presentational primitives mostly.
- **Variants**: Use `class-variance-authority` (cva) to define variants (e.g., `default`, `outline`, `ghost` buttons).

Example `cva` usage:
```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)
```

### Feature Components (`src/components/dashboard`, `src/components/listings`)
These contain business logic and compose UI components.
- Keep them specific to their domain.
- Extract generic patterns back to `src/components/ui` if used in multiple places.

### Class Merging
ALWAYS use the `cn()` utility when accepting a `className` prop to ensure Tailwind classes merge correctly (handling conflicts like `p-4` vs `p-2`).

```tsx
import { cn } from "@/lib/utils"

export function MyComponent({ className, ...props }) {
  return <div className={cn("bg-red-500", className)} {...props} />
}
```

## 6. Iconography

Use **Lucide React** for all icons.
- **Size**: Default to `size-4` (16px) for buttons/inputs, `size-5` or `size-6` for navigation/headers.
- **Stroke**: Default stroke width is usually sufficient.
- **Context**: Use `lucide-react` icons directly in components.

```tsx
import { Search } from "lucide-react"

<Search className="size-4 text-muted-foreground" />
```

## 7. Motion & Animation

- Use `tw-animate-css` for simple enter/exit animations (e.g., `animate-in fade-in`).
- Use `framer-motion` for complex gestures or layout transitions.
- Respect `prefers-reduced-motion`.

## 8. Dark Mode
- The app supports dark mode via `next-themes`.
- Ensure all custom colors have a dark mode equivalent in `globals.css`.
- Avoid hardcoding `bg-white` or `text-black`. Use `bg-background` and `text-foreground`.

