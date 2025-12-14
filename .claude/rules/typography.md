# Typography System

Standardized text sizes, weights, colors, and icon sizes for consistent UI across Acuflow.

## Quick Reference Table

Copy-paste ready Tailwind classes for common use cases.

| Use Case | Classes | Example |
|----------|---------|---------|
| **Page title** | `text-xl font-semibold` | "Today", "Appointment Today" |
| **Panel header (name)** | `text-lg font-semibold` | Patient name in left panel |
| **Panel header (info)** | `text-base font-semibold` | Time range "10:00 AM - 11:00 AM" |
| **Section label** | `text-xs font-semibold text-muted-foreground uppercase tracking-wider` | "VISIT HISTORY" |
| **Section header** | `text-sm font-semibold` | "Subjective", "Patient Intake" |
| **Body text** | `text-sm` | SOAP note content, descriptions |
| **Secondary text** | `text-sm text-muted-foreground` | Contextual info, helper text |
| **Metadata** | `text-xs text-muted-foreground` | Timestamps, ages, status counts |
| **Tiny metadata** | `text-[10px] text-muted-foreground` | Wait time "54m ago", timers |
| **Status badge** | `text-xs font-medium` | "Unsigned", "In Progress" |
| **Button (primary)** | `text-sm font-medium` | "Sign Note", "Open Full Record" |
| **Button (text)** | `text-xs text-muted-foreground hover:text-foreground` | "Expand", "See all" |
| **Nav item** | `text-sm font-medium` | Sidebar navigation |
| **Brand name** | `text-lg font-semibold` | "Acuflow" in sidebar |

## Icon Sizes

| Context | Size | Classes | Examples |
|---------|------|---------|----------|
| **Standalone action** | 20px | `h-5 w-5` | Close button (X), sidebar nav icons |
| **With text label** | 16px | `h-4 w-4` | Back arrow, search icon |
| **Inline with text** | 14px | `h-3.5 w-3.5` | Phone/email icons, appointment type |
| **Small inline** | 12px | `h-3 w-3` | Gender icons, chevrons, timer icon |
| **Status dot** | 10px | `h-2.5 w-2.5` | Colored status indicators |
| **Status indicator** | 16px container | `h-4 w-4 rounded-full` + `h-2.5 w-2.5` icon | Signed/unsigned badges |

**Status indicator pattern:** Use a 16px rounded container (`h-4 w-4 rounded-full bg-{color}-100`) with a 10px icon inside (`h-2.5 w-2.5 text-{color}-600`). Examples: green checkmark for signed, amber minus for unsigned.

**Touch target rule:** Icons can be small, but their clickable area should be at least 44px (`h-11`).

## Text Scale

| Name | Pixels | Tailwind | Primary Use |
|------|--------|----------|-------------|
| 2xl | 24px | `text-2xl` | Reserved (major headings, rarely used) |
| xl | 20px | `text-xl` | Page titles |
| lg | 18px | `text-lg` | Panel headers, patient names |
| base | 16px | `text-base` | Important info text, time ranges |
| sm | 14px | `text-sm` | Body text, buttons, nav items |
| xs | 12px | `text-xs` | Labels, badges, timestamps |
| 11px | 11px | `text-[11px]` | Timeline card times |
| 10px | 10px | `text-[10px]` | Tiny metadata (timers, wait time) |

## Font Weights

| Weight | Tailwind | Use Case |
|--------|----------|----------|
| Bold (700) | `font-bold` | Logo letter only |
| Semibold (600) | `font-semibold` | Headings, panel headers, section labels |
| Medium (500) | `font-medium` | Patient names, buttons, status text |
| Normal (400) | (default) | Body text, descriptions |

## Text Colors

| Role | Class | Use Case |
|------|-------|----------|
| Primary | `text-foreground` | Headings, names, primary content |
| Secondary | `text-muted-foreground` | Descriptions, labels, timestamps |
| On primary | `text-primary-foreground` | Text on primary-colored buttons |
| Accent | `text-primary` | Links, interactive text |
| Status | `getStatusColor()` | Status-specific colors (see colors.md) |

## Component Patterns

### Global Header (Topbar)

```tsx
// Default (Today screen)
<h1 className="text-xl font-semibold">Today</h1>
<span className="text-sm text-muted-foreground">Friday, December 12</span>

// Detail page
<ArrowLeft className="h-4 w-4" />
<h1 className="text-xl font-semibold">Appointment Today</h1>
```

### Left Panel (Patient Context)

```tsx
// Patient header
<h2 className="text-lg font-semibold">{patientName}</h2>
<p className="text-sm text-muted-foreground">F, 50y</p>

// Section label
<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
  Visit History
</h3>
```

### Right Panel (Appointment Context)

```tsx
// Header row
<span className="text-base font-semibold">{timeRange}</span>
<span className="text-sm text-muted-foreground">· {countdown}</span>
<span className="text-xs font-medium">{statusLabel}</span>
<button className="text-sm font-medium">Sign Note</button>

// Section header
<h3 className="text-sm font-semibold">Subjective</h3>
```

### Patient Cards

```tsx
// Card content
<span className="text-xs text-muted-foreground">{formatTime(time)}</span>
<div className="text-sm font-medium">{patientName}</div>
<span className="text-xs text-muted-foreground">{chiefComplaint}</span>

// Section header
<div className="text-sm font-medium text-foreground">
  <span>In Progress</span>
  <span>({count})</span>
</div>
```

### Timeline

```tsx
// Hour labels
<span className="text-xs text-muted-foreground">9 AM</span>

// Appointment card
<div className="text-[11px] text-muted-foreground">{time}</div>
<span className="text-xs font-medium">{patientName}</span>
```

### Sidebar

```tsx
// Brand
<span className="text-sm font-bold">A</span>  // Logo
<span className="text-lg font-semibold">Acuflow</span>

// Nav item
<span className="text-sm font-medium">{label}</span>
<Icon className="h-5 w-5" />

// User info
<p className="text-sm font-medium">{name}</p>
<p className="text-xs text-sidebar-foreground/60">{credentials}</p>
```

## Guidelines

1. **Don't skip sizes** in hierarchy: xl → lg → base → sm → xs
2. **Pair heading + description:** If heading is `text-lg font-semibold`, description is `text-sm text-muted-foreground`
3. **Uppercase only for tiny labels:** `text-xs uppercase tracking-wider`
4. **Touch targets:** Interactive text minimum 14px (`text-sm`), button areas 44px
5. **Custom sizes sparingly:** Use `text-[11px]` or `text-[10px]` only for very constrained spaces
