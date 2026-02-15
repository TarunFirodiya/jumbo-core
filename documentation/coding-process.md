# Coding Agent Process — Operator

**Purpose:** Prevent runtime errors, ensure quality, and maintain consistency.

---

## Phase 1: Before Writing Code

### 1. Understand the Context
- [ ] Read the ticket/requirements
- [ ] Check existing similar components for patterns
- [ ] Verify API endpoints exist and understand their shape
- [ ] Check what hooks/utilities are available (don't assume)

### 2. Verify Dependencies
- [ ] Check if imports exist before using them
- [ ] For hooks: `ls src/hooks/` or grep existing usage
- [ ] For utilities: Check `src/lib/utils.ts` or similar
- [ ] For components: Check `src/components/ui/`
- [ ] For icons: Verify the icon library is installed

---

## Phase 2: While Writing Code

### 3. Follow Design Standards
- [ ] Icons: @hugeicons/react (filled + stroke), 1.2px stroke, 16px base
- [ ] Typography: 2 weights only (regular body, medium headings)
- [ ] Colors: TailwindCSS Neutral palette
- [ ] Radius: 8-12px only
- [ ] Use existing UI components from `src/components/ui/`

### 4. Type Safety
- [ ] Use TypeScript for all new code
- [ ] Define interfaces for props
- [ ] Use zod for form validation
- [ ] Handle error states explicitly

---

## Phase 3: Testing (CRITICAL)

### 5. Static Checks (Before Running)
```bash
# Type check
cd jumbo-web && npx tsc --noEmit

# Lint check
npx next lint

# Check for common issues
# - Missing imports
# - Unused variables
# - Type errors
```

### 6. Build Test (Before Committing)
```bash
# Build the application
cd jumbo-web && npm run build

# Or with Turbopack (dev mode)
npm run dev
```

**Common build errors to watch for:**
- Module not found (missing imports)
- Type errors
- Missing dependencies
- Syntax errors

### 7. Runtime Testing (When Possible)
- [ ] Start dev server and verify component renders
- [ ] Test happy path (normal operation)
- [ ] Test error states (API failures, empty states)
- [ ] Test edge cases (empty input, very long text)

### 8. API Integration Testing
- [ ] Verify API endpoints are called correctly
- [ ] Check request/response shapes match expectations
- [ ] Test error handling (404, 500, network errors)

---

## Phase 4: Documentation & Handoff

### 9. Update Documentation
- [ ] Update sprint-plan.md with completion status
- [ ] Add usage examples if complex
- [ ] Document any new dependencies

### 10. Commit Standards
```bash
# Commit message format:
<type>(<scope>): <description>

# Types:
# - feat: New feature
# - fix: Bug fix
# - refactor: Code restructuring
# - docs: Documentation only
# - chore: Build/deps/tooling

# Example:
git commit -m "feat(S1-021): Add reusable notes component

- Polymorphic component for leads, listings, visits
- Full CRUD with real-time updates
- Uses Huge Icons and Tailwind Neutral palette

Closes S1-021"
```

---

## Common Mistakes to Avoid

### Import Errors
❌ **Don't assume hooks exist:**
```tsx
import { useToast } from "@/hooks/use-toast"  // Might not exist!
```

✅ **Do check first:**
```bash
ls src/hooks/  # Verify the hook exists
# Or check existing usage in other files
```

✅ **Use what's available:**
```tsx
import { toast } from "sonner"  // If that's what's used
```

### Design Inconsistencies
❌ **Don't mix icon libraries:**
```tsx
import { Search } from "lucide-react"  // Wrong!
```

✅ **Use the standard:**
```tsx
import { Search01Icon } from "@hugeicons/react"
```

### Missing Edge Cases
❌ **Don't forget loading/error states:**
```tsx
const [data, setData] = useState([])
// No loading state!
```

✅ **Handle all states:**
```tsx
const [data, setData] = useState([])
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState(null)
```

---

## Pre-Commit Checklist

Before every commit, verify:

- [ ] Code compiles without TypeScript errors
- [ ] No missing imports
- [ ] Design standards followed (icons, colors, radius)
- [ ] Error states handled
- [ ] Loading states handled
- [ ] Tested in browser (if possible)
- [ ] Sprint plan updated
- [ ] Commit message follows format

---

## Emergency Fixes

If build/runtime errors occur after push:

1. **Stop** — Don't panic
2. **Diagnose** — Read the error message carefully
3. **Fix locally** — Make the fix in your working directory
4. **Test** — Run `npm run build` to verify
5. **Commit** — `git add . && git commit -m "fix: ..."`
6. **Push** — `git push`

---

## Tools for Testing

### Quick Type Check
```bash
cd jumbo-web && npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```

### Check Imports
```bash
grep -r "from '@/hooks'" src/ --include="*.tsx" | head -10
```

### Find Existing Patterns
```bash
# How are toasts used elsewhere?
grep -r "toast" src/components/ --include="*.tsx" -l
```

---

**Remember:** Better to slow down and verify than to push broken code.
