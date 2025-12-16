# Component Usage Patterns

Standard patterns for custom components in Acuflow.

## ScrollableArea

Use `ScrollableArea` for scrollable containers with native scrolling and fade indicators.

```typescript
import { ScrollableArea, ScrollableAreaRef, ScrollPosition } from '@/components/custom'

// Basic usage - symmetric padding
<ScrollableArea className="px-3 py-4" deps={[dataToWatch]}>
  {/* content */}
</ScrollableArea>

// With narrow scrollbar (for touch-first areas like PatientCards)
<ScrollableArea hideScrollbar deps={[data]}>
  {/* content */}
</ScrollableArea>

// With ref and scroll tracking
const scrollableRef = useRef<ScrollableAreaRef>(null)

<ScrollableArea
  ref={scrollableRef}
  onScroll={(pos: ScrollPosition) => setScrollPosition(pos)}
  deps={[data]}
>
  {children}
</ScrollableArea>

// Scroll programmatically
scrollableRef.current?.scrollTo({ top: 100, behavior: 'smooth' })
```

**Props:**
- `hideScrollbar`: When true, uses narrow 4px scrollbar (default: false, uses native width)
- `deps`: Array that triggers re-check when data changes (like useEffect deps)
- `onScroll`: Callback provides `{ scrollTop, scrollHeight, clientHeight }`
- `ref`: Exposes `scrollTo()` and `getScrollPosition()` methods

**Key rules:**
- Use **symmetric padding** (`px-3` = 12px) for consistent spacing
- Uses native scrolling for cross-platform compatibility
- Shows top/bottom gradient fade when content is scrollable

---

## PatientCards

Two display modes for patient appointment cards.

```typescript
// Full mode (Today screen) - shows name, time, status
<PatientCards
  onAppointmentClick={handleClick}
  selectedAppointmentId={selectedId}
/>

// Compact mode (Appointment detail) - avatar + time only
<PatientCards
  onAppointmentClick={handleClick}
  selectedAppointmentId={selectedId}
  compact
/>
```

**Compact time format:** `10:30A` or `2:45P` (no space, single letter AM/PM)

---

## HeaderContext (Route-Aware Header)

Use `useHeader` to customize the global header from any page.

```typescript
import { useHeader } from '@/contexts/HeaderContext'

const { setHeader, resetHeader, previousTitle } = useHeader()

useEffect(() => {
  setHeader({
    showBackButton: true,
  })

  return () => resetHeader()
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [pageId]) // Use specific ID to avoid infinite loops
```

**Header modes:**
- Default: `{ title: 'Today', subtitle: 'Friday, December 12' }`
- Detail view: `{ showBackButton: true }` - shows "Back to {previousTitle}" button

**How `previousTitle` works:**
- When `setHeader` is called, context stores current page's `title`
- Detail pages access `previousTitle` for contextual back button text
- Tracked via ref to avoid unnecessary re-renders

**Important:** Dependency array should only include page/item ID, not `setHeader`/`resetHeader` functions.

---

## TransitionContext (Page Transitions)

Coordinate animations across route changes.

```typescript
import { useTransition } from '@/contexts/TransitionContext'

// In source page (e.g., TodayScreen)
const { startTransition } = useTransition()

const handleClick = (item, rect?: DOMRect) => {
  if (rect) startTransition(rect, 'today') // 'today' | 'appointment'
  router.push(`/destination/${item.id}`)
}

// In destination page
const { transitionSource, slideDirection, setSlideDirection } = useTransition()

// Use transitionSource to determine animation type
const shouldAnimateSidebar = transitionSource === 'today'

// For vertical slides between items
setSlideDirection(newIndex > currIndex ? 'down' : 'up')
```

**Transition types:**
- `transitionSource: 'today'` - horizontal slide (sidebar collapses, content slides from right)
- `transitionSource: 'appointment'` - vertical slide (content slides up/down based on direction)

---

## Appointment Type Icons

Consistent icon mapping for appointment types.

```typescript
import { ClipboardCheck, RefreshCw, Sparkles, Calendar } from 'lucide-react'

const APPOINTMENT_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'appt_type_001': ClipboardCheck, // Initial Consultation
  'appt_type_002': RefreshCw,      // Follow-up Treatment
  'appt_type_003': Sparkles,       // Brief Follow-up
}

const IconComponent = appointmentType?.id
  ? APPOINTMENT_TYPE_ICONS[appointmentType.id] || Calendar
  : Calendar

<IconComponent className="h-4 w-4 text-muted-foreground/60" />
```

---

## Status Colors

Use centralized status colors from `src/lib/constants.ts`:

```typescript
import { getStatusColor } from '@/lib/constants'

const color = getStatusColor(appointment.status, appointment.isSigned)
```

| Status | Color | Hex |
|--------|-------|-----|
| In Progress | Blue | `#3b82f6` |
| Checked In | Green | `#22c55e` |
| Scheduled | Yellow | `#eab308` |
| Unsigned | Amber | `#f59e0b` |
| Completed | Slate | `#94a3b8` |

---

## Bottom Tab Bar (Appointment Detail)

The appointment detail page has a bottom tab bar with Medical/Billing/Comms tabs.

```typescript
type TabType = 'medical' | 'billing' | 'comms'
const [activeTab, setActiveTab] = useState<TabType>('medical')
```

**Tab bar specs:**
- Height: 64px (fits icon + label + status preview)
- Spans SOAP + Patient Context width (not Visit History panel)
- Each tab shows: Icon (20px) → Label (12px) → Status preview (10px)

**Tab content:**
- **Medical**: SOAP Editor + Patient Context side-by-side, FAB visible
- **Billing**: Full-width BillingTab component, FAB hidden
- **Comms**: Full-width CommsTab component, FAB hidden

**Status preview helpers:**
```typescript
import { getBillingStatusPreview, getCommsStatusPreview } from '@/components/custom'

// Returns { text: string, color: string }
const billingPreview = getBillingStatusPreview(billingData)
const commsPreview = getCommsStatusPreview(commsData)
```

**Header behavior:**
- Medical tab: Shows patient context header (Visits count) on right
- Billing/Comms tabs: Full-width header (no right section)

---

## BillingTab & CommsTab

Tab components for appointment detail page.

```typescript
import { BillingTab, CommsTab, type BillingData, type CommsData } from '@/components/custom'

<BillingTab appointmentId={id} billingData={billingData} />
<CommsTab appointmentId={id} commsData={commsData} patientName={name} />
```

**BillingData structure:**
- `charges[]`: Line items with CPT codes
- `subtotal`, `tax`, `totalCharges`
- `status`: 'draft' | 'pending' | 'partial' | 'paid' | 'no_charges'
- `invoiceStatus`: 'draft' | 'sent' | 'paid'
- `paymentMethod?`: Card on file info
- `insurance?`: Insurance company info

**CommsData structure:**
- `messages[]`: Message thread
- `notes[]`: Practitioner notes
- `confirmationStatus`: 'pending' | 'confirmed' | 'no_response' | 'cancelled'
- `schedule`: Current appointment, follow-up info, recent visits
