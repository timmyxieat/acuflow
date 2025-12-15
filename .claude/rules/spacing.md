# Spacing System

Standardized spacing and padding rules for consistent layout across Acuflow.

## Panel Padding Standard

All panels use **12px (px-3)** horizontal padding for consistent spacing.

### Global Elements

| Element | Padding | Classes |
|---------|---------|---------|
| Topbar | 12px horizontal | `px-3` |

### Panel Headers

| Element | Padding | Classes |
|---------|---------|---------|
| Panel headers (patient info, appointment info) | 12px horizontal | `px-3` |
| Section labels (e.g., "VISIT HISTORY") | 12px left | `pl-3` |

### Scrollable Areas

Scrollable areas use **symmetric padding** (same left and right).

| Element | Padding | Classes |
|---------|---------|---------|
| ScrollableArea content | 12px horizontal | `px-3` |
| Vertical padding | 16px (4 units) | `py-4` |

### Example Usage

```tsx
// Panel header
<div className="flex h-[72px] items-center px-3 border-b border-border">
  {/* header content */}
</div>

// Section label inside scrollable area
<h3 className="pl-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
  Visit History
</h3>

// Scrollable content area
<ScrollableArea className="flex-1 py-4 px-3" deps={[data]}>
  {/* content */}
</ScrollableArea>
```

## Timeline Spacing

The Timeline uses pixel-based positioning for appointment blocks:

| Element | Padding | Location |
|---------|---------|----------|
| Hour labels column | Fixed 48px width | `w-12` |
| Appointment blocks | 12px from edges | `getAppointmentStyle()` |

## General Spacing Scale

Based on Tailwind's 4px grid system:

| Name | Pixels | Tailwind | Common Use |
|------|--------|----------|------------|
| 1 | 4px | `gap-1`, `p-1` | Tight spacing, icon gaps |
| 2 | 8px | `gap-2`, `p-2` | Small gaps |
| 3 | 12px | `gap-3`, `p-3` | Panel padding, card padding |
| 4 | 16px | `gap-4`, `p-4` | Standard content spacing |
| 6 | 24px | `gap-6`, `p-6` | Large section spacing |
| 8 | 32px | `gap-8`, `p-8` | Major section dividers |

## Component Gaps

| Context | Gap | Classes |
|---------|-----|---------|
| Between SOAP sections | 24px | `gap-6` |
| Between items in a list | 8px | `gap-2` |
| Between label and content | 8px | `gap-2` |
| Between icon and text | 8px | `gap-2` |

## Touch Targets

- Minimum touch target: **44px** (`h-11`, `min-h-[44px]`)
- Preferred touch target: **48px** (`h-12`, `w-12`)
- Applies to buttons, clickable cards, interactive elements
- Small icons can have small visual size but larger clickable area

## Best Practices

1. **Use `gap-*` over margins** for consistent spacing in flex/grid layouts
2. **Symmetric padding** for scrollable areas (`px-3`)
3. **Consistent panel padding** - all detail panels use `px-3` for headers
4. **Vertical rhythm** - use `py-4` for scrollable areas, `gap-6` between major sections
