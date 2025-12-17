# File Organization & Size Limits

Keep source files manageable for both humans and AI tooling.

## Size Guidelines

| Metric | Guideline | Reason |
|--------|-----------|--------|
| Max lines | ~700-800 | Keeps files under Claude's ~25,000 token read limit |
| Max tokens | ~25,000 | Hard limit for Claude Code file reading |
| Target lines | 200-400 | Ideal for focused, single-responsibility files |

**Rule of thumb:** If a file approaches 700 lines, consider splitting it.

## When to Split

Split a file when:
- It exceeds ~700 lines
- It contains multiple distinct components
- It has helper functions that could be reused
- It mixes UI, state management, and utility logic

## Splitting Pattern for Page Components

For complex Next.js pages, use co-located modules:

```
src/app/[route]/
├── page.tsx                    # Main page component (imports from below)
├── components/
│   ├── index.ts               # Barrel exports
│   ├── ComponentA.tsx         # UI components specific to this page
│   └── ComponentB.tsx
├── hooks/
│   └── useCustomHook.ts       # Page-specific hooks
└── lib/
    └── helpers.ts             # Constants, utilities, types
```

### Barrel Exports

Use `index.ts` for clean imports:

```typescript
// components/index.ts
export { ComponentA, type ComponentAProps } from './ComponentA'
export { ComponentB, type ComponentBProps } from './ComponentB'

// page.tsx
import { ComponentA, ComponentB } from './components'
```

## What Goes Where

| Content | Location |
|---------|----------|
| Page layout & orchestration | `page.tsx` |
| Reusable UI pieces | `components/` |
| State management hooks | `hooks/` |
| Constants, helpers, types | `lib/` |
| Shared across app | `src/components/`, `src/hooks/`, `src/lib/` |

## Example: Appointment Detail Page

The appointment detail page was split from 2,263 lines into:

| File | Lines | Purpose |
|------|-------|---------|
| `page.tsx` | 770 | Main layout, routing, state orchestration |
| `components/VisitTimeline.tsx` | 557 | Visit history panel |
| `components/FABPanel.tsx` | 292 | Floating action button + timer UI |
| `components/SOAPSections.tsx` | 179 | SOAP note editor |
| `components/TabBar.tsx` | 132 | Bottom tab navigation |
| `components/AppointmentHeader.tsx` | 91 | Header bar |
| `hooks/useTimer.ts` | 93 | Timer state logic |
| `lib/helpers.ts` | 172 | Date helpers, constants |

## Signs a File Needs Splitting

- Claude Code shows "exceeds maximum tokens" error
- Multiple `// =====` section dividers in one file
- Scrolling through 1000+ lines to find code
- Functions/components that could be tested independently
- Duplicate logic that could be shared
