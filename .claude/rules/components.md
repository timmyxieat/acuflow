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

## SearchContext (Global Patient Search)

Use `useSearch` to open/close the command palette from anywhere.

```typescript
import { useSearch } from '@/contexts/SearchContext'

const { openSearch, closeSearch, isOpen } = useSearch()

// Open search programmatically
<button onClick={openSearch}>Search patients...</button>

// Check if search is open (for keyboard conflict avoidance)
const handleKeyDown = useCallback((event: KeyboardEvent) => {
  if (isSearchOpen) return
  if ((event.target as HTMLElement).closest('[role="dialog"]')) return
  // ... handle keys
}, [isSearchOpen])
```

**Global shortcut:** `⌘K` / `Ctrl+K` - handled in AppShell

**Keyboard conflict avoidance:** When adding keyboard handlers to pages, always check:
1. `isSearchOpen` from SearchContext
2. `target.closest('[role="dialog"]')` for any open dialog

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

## Visit History Panel Behavior

The Visit History panel (left of SOAP) behaves differently based on current appointment status:

**Signed Completed Appointments:**
- Clicking a past visit **navigates** to that appointment
- No preview auto-selected
- No SOAP preview text shown

**All Other Appointments** (Unsigned, In Progress, Checked In, Scheduled):
- Clicking a past visit **toggles preview selection**
- Most recent past visit auto-selected on load
- Selected visit's SOAP content shown as preview under textareas
- "Use past treatment" button appears when a visit is selected

```typescript
// Check for signed completed (no preview, navigation mode)
const isSignedCompleted = appointment?.status === 'COMPLETED' && appointment?.isSigned === true

// Click handler uses this to decide behavior
if (isSignedCompleted) {
  // Navigate to clicked appointment
  router.push(`/appointments/${targetApptId}`)
} else {
  // Toggle preview selection
  setSelectedVisitId(visitId)
}
```

**Visual Indicators:**
- **Blue**: Current appointment being viewed (`isEditing=true`)
- **Slate**: Preview-selected visit (non-signed-completed mode)

**Animation on Navigation:**
When navigating between appointments of the same patient (signed completed), content slides vertically:
- Clicking older appointment → slides up
- Clicking newer appointment → slides down

What animates: Header center/right sections, SOAP panel, PatientContext panel
What stays static: Header left section (patient avatar/name), Visit History panel

---

## Bottom Tab Bar (Appointment Detail)

The appointment detail page has a bottom tab bar with 4 tabs.

```typescript
type TabType = 'medical' | 'billing' | 'schedule' | 'comms'
const [activeTab, setActiveTab] = useState<TabType>('medical')
```

**Tab bar specs:**
- Height: 64px (fits icon + label + status preview)
- Spans SOAP + Patient Context width (not Visit History panel)
- Each tab shows: Icon (20px) → Label (12px) → Status preview (10px)

**Tab layout:**
| Tab | Icon | Purpose |
|-----|------|---------|
| Medical | ClipboardCheck | SOAP notes, treatment documentation |
| Billing | CreditCard | Invoice, payment, insurance |
| Schedule | Calendar | Appointment details, follow-up, visit history |
| Comms | MessageSquare | Messages with patient, practitioner notes |

**Tab content:**
- **Medical**: SOAP Editor + Patient Context side-by-side, FAB visible
- **Billing**: Full-width BillingTab component, FAB hidden
- **Schedule**: Full-width ScheduleTab component, FAB hidden
- **Comms**: Full-width CommsTab component, FAB hidden

**Status preview helpers:**
```typescript
import { getBillingStatusPreview, getCommsStatusPreview, getScheduleStatusPreview } from '@/components/custom'

// Each returns { text: string, color: string, icon?: string }
const billingPreview = getBillingStatusPreview(billingData)    // "$120 · Paid", "$95 · Due"
const schedulePreview = getScheduleStatusPreview(scheduleData) // "✓ Confirmed", "Book follow-up"
const commsPreview = getCommsStatusPreview(commsData)          // "✓ Confirmed", "Pending"
```

**Header behavior:**
- Medical tab: Shows patient context header (Visits count) on right
- Billing/Schedule/Comms tabs: Full-width header (no right section)

---

## Tab Components

### BillingTab

```typescript
import { BillingTab, type BillingData } from '@/components/custom'
import { getBillingDataForAppointment } from '@/data/mock-billing'

const billingData = getBillingDataForAppointment(appointmentId, patientId, isCompleted, usedEstim)
<BillingTab appointmentId={id} billingData={billingData} />
```

**BillingData structure:**
- `charges[]`: Line items with CPT codes
- `subtotal`, `tax`, `totalCharges`, `amountPaid`, `balanceDue`
- `status`: 'no_charges' | 'pending' | 'partial' | 'paid' | 'failed'
- `invoiceStatus`: 'draft' | 'sent' | 'paid' | 'partial' | 'void'
- `transactions[]`: Payment history with success/failure status
- `paymentMethod?`: Card on file with brand, last4, expiry
- `autoPay?`: Whether auto-pay is enabled
- `insurance?`: Insurance company info

### ScheduleTab

```typescript
import { ScheduleTab, type ScheduleData } from '@/components/custom'

<ScheduleTab appointmentId={id} scheduleData={scheduleData} patientName={name} />
```

**ScheduleData structure:**
- `currentAppointment`: Date, time, type, duration, confirmedAt
- `followUp?`: Recommended interval, next available slot
- `recentVisits[]`: Past visit history
- `upcomingAppointments[]`: Future appointments

### CommsTab

```typescript
import { CommsTab, type CommsData } from '@/components/custom'

<CommsTab appointmentId={id} commsData={commsData} patientName={name} />
```

**CommsData structure:**
- `messages[]`: Message thread (reminders, patient responses)
- `notes[]`: Practitioner notes (pinned first)
- `confirmationStatus`: 'pending' | 'confirmed' | 'no_response' | 'cancelled'
- `reminderSentAt?`, `confirmedAt?`: Timestamps
- `unreadCount`: Number of unread messages
