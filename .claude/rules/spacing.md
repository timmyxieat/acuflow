# Spacing System

Standardized spacing and padding rules for consistent layout across Acuflow.

## Panel Padding Standard

All panels use **8px (px-2)** horizontal padding for a compact, efficient layout.

### Global Elements

| Element | Padding | Classes |
|---------|---------|---------|
| Topbar | 8px horizontal | `px-2` |

### Panel Headers

| Element | Padding | Classes |
|---------|---------|---------|
| Panel headers (patient info, appointment info) | 8px horizontal | `px-2` |
| Section labels (e.g., "VISIT HISTORY") | 8px horizontal | `px-2` |

### Scrollable Areas

Scrollable areas use **left-only padding** because the scrollbar sits at the right edge.

| Element | Padding | Classes |
|---------|---------|---------|
| ScrollableArea content | 8px left, 0 right | `pl-2 pr-0` |
| Vertical padding | 16px (4 units) | `py-4` |

**Why left-only?** The ScrollableArea component has a built-in scrollbar at the right edge. Using `px-*` would add unnecessary padding between content and the scrollbar.

### Example Usage

```tsx
// Panel header
<div className="flex h-[72px] items-center px-2 border-b border-border">
  {/* header content */}
</div>

// Section label inside scrollable area
<h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
  Visit History
</h3>

// Scrollable content area
<ScrollableArea className="flex-1 py-4 pl-2 pr-0" deps={[data]}>
  {/* content */}
</ScrollableArea>
```

## General Spacing Scale

Based on Tailwind's 4px grid system:

| Name | Pixels | Tailwind | Common Use |
|------|--------|----------|------------|
| 1 | 4px | `gap-1`, `p-1` | Tight spacing, icon gaps |
| 2 | 8px | `gap-2`, `p-2` | Panel padding, small gaps |
| 3 | 12px | `gap-3`, `p-3` | Card padding, section gaps |
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
- Applies to buttons, clickable cards, interactive elements
- Small icons can have small visual size but larger clickable area

## Best Practices

1. **Use `gap-*` over margins** for consistent spacing in flex/grid layouts
2. **Left-only padding** for scrollable areas (`pl-*` not `px-*`)
3. **Consistent panel padding** - all detail panels use `px-2` for headers
4. **Vertical rhythm** - use `py-4` for scrollable areas, `gap-6` between major sections
