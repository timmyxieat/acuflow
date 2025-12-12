# Typography System

Standardized text sizes and styles for consistent UI across the application.

## Scale (Tailwind Classes)

| Name | Size | Tailwind | Use Case |
|------|------|----------|----------|
| **xs** | 12px | `text-xs` | Labels, metadata, timestamps, badges |
| **sm** | 14px | `text-sm` | Secondary text, descriptions, helper text |
| **base** | 16px | `text-base` | Body text, primary content |
| **lg** | 18px | `text-lg` | Subheadings, emphasized content |
| **xl** | 20px | `text-xl` | Page titles, section headers |
| **2xl** | 24px | `text-2xl` | Major headings (rarely used) |

## Icon Sizes

| Context | Size | Tailwind | Notes |
|---------|------|----------|-------|
| **Inline with text** | 14px | `h-3.5 w-3.5` | Icons next to labels |
| **Navigation/Actions** | 16px | `h-4 w-4` | Sidebar, small buttons |
| **Prominent actions** | 20px | `h-5 w-5` | Main action buttons |
| **Feature icons** | 24px | `h-6 w-6` | Section headers, empty states |

## Component-Specific Sizes

### Global Header (Topbar)
- **Back button icon:** 14px (`h-3.5 w-3.5`)
- **Page title:** 20px (`text-xl font-semibold`)
- **Subtitle/date:** 14px (`text-sm text-muted-foreground`)

### Appointment Detail - Right Panel Header
- **Time range:** 16px (`text-base font-semibold`)
- **Contextual countdown:** 14px (`text-sm text-muted-foreground`)
- **Status badge:** 12px (`text-xs`)
- **Action button:** 14px (`text-sm`)

### Appointment Detail - Left Panel
- **Patient name:** 18px (`text-lg font-semibold`)
- **Patient metadata:** 14px (`text-sm text-muted-foreground`)
- **Section headers (VISIT HISTORY):** 12px (`text-xs font-semibold uppercase tracking-wider`)

### Patient Cards
- **Patient name:** 14px (`text-sm font-medium`)
- **Chief complaint:** 14px (`text-sm text-muted-foreground`)
- **Time:** 12px (`text-xs`)
- **Section headers:** 12px (`text-xs font-semibold`)

### SOAP Sections
- **Section label:** 14px (`text-sm font-semibold`)
- **Textarea content:** 14px (`text-sm`)
- **Preview text:** 14px (`text-sm text-muted-foreground`)

## Font Weights

| Weight | Tailwind | Use Case |
|--------|----------|----------|
| **Normal (400)** | `font-normal` | Body text, descriptions |
| **Medium (500)** | `font-medium` | Emphasized text, names |
| **Semibold (600)** | `font-semibold` | Headings, labels, buttons |
| **Bold (700)** | `font-bold` | Rarely used - only for extreme emphasis |

## Color Usage

| Role | Class | Use Case |
|------|-------|----------|
| **Primary** | `text-foreground` | Main content, headings |
| **Secondary** | `text-muted-foreground` | Descriptions, metadata, timestamps |
| **Accent** | `text-primary` | Links, interactive elements |
| **Error** | `text-red-600` | Error messages, destructive actions |
| **Success** | `text-green-600` | Success states, positive feedback |

## Guidelines

1. **Hierarchy matters:** Use size + weight combinations to create clear visual hierarchy
2. **Don't skip sizes:** Go from xl → lg → base → sm, not xl → sm
3. **Consistent pairing:** If a heading is `text-lg font-semibold`, its description should be `text-sm text-muted-foreground`
4. **Touch targets:** Interactive text should be at least 14px (`text-sm`) for readability
5. **Uppercase sparingly:** Only for small section labels (`text-xs uppercase tracking-wider`)
