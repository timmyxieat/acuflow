# Time Formatting & Timer Display Spec

This document defines how times and timers are formatted throughout the application.

---

## Time Formatting Standards

All times in the application should follow these formatting rules:

| Context | Format | Example |
|---------|--------|---------|
| Timeline hour labels | `H AM` or `H PM` | `8 AM`, `12 PM`, `6 PM` |
| Timeline appointment cards | `H:MM AM` or `H:MM PM` | `9:00 AM`, `2:30 PM` |
| Patient card times | `H:MM AM` or `H:MM PM` | `11:00 AM`, `3:45 PM` |
| Appointment preview | `H:MM AM` or `H:MM PM` | `10:30 AM`, `4:00 PM` |

**Rules:**
- **AM/PM should always be uppercase** (not lowercase `am/pm`)
- No leading zeros on hours (use `9 AM` not `09 AM`)
- Always include minutes with colon for appointment times (`:00`, `:30`, etc.)
- Timeline hour labels omit minutes for cleaner display
- Use `toLocaleTimeString()` with manual uppercase conversion for consistency

**Implementation:**
```typescript
// For times with minutes (appointment cards, patient cards)
date.toLocaleTimeString('en-US', {
  hour: 'numeric',
  minute: '2-digit'
}).toUpperCase()
// Output: "9:00 AM", "2:30 PM"

// For hour-only labels (timeline)
`${hour12} ${hour >= 12 ? 'PM' : 'AM'}`
// Output: "8 AM", "12 PM"
```

---

## Appointment States & Time Display

### 1. Scheduled
**No timer shown** - just the appointment start time.

| Field | Display |
|-------|---------|
| Time | `3:00 PM` (scheduled start) |

---

### 2. Checked In (Waiting)
Shows how long the patient has been waiting since check-in.

| Field | Display |
|-------|---------|
| Time | `12:00 PM` (scheduled start) |
| Wait | `Xm wait` |

**Examples:**
- Checked in 5 minutes ago → `5m wait`
- Checked in 15 minutes ago → `15m wait`
- Just checked in → `0m wait`

**Styling:**
- Normal (≤10m): muted text
- Long wait (>10m): amber/warning color

---

### 3. In Progress - Started (Consultation Phase)
Treatment has started but needles not yet inserted. Shows elapsed time since treatment started.

| Field | Display |
|-------|---------|
| Time | `12:00 PM` (scheduled end) |
| Timer | `Xm` (elapsed) |
| Icon | 💬 MessageCircleMore |

**Examples:**
- Started 5 minutes ago → `5m`
- Started 20 minutes ago → `20m`

**Styling:** Blue text (neutral, informational)

---

### 4. In Progress - Needling (Retention Phase)
Needles are in, patient is resting. Countdown to target needle removal time (default: 20 minutes from insertion).

| Field | Display |
|-------|---------|
| Time | `12:00 PM` (scheduled end) |
| Timer | `out in Xm` or `Xm over` |
| Icon | 💉 Syringe |

**Examples:**
- 15 minutes until removal → `out in 15m`
- 5 minutes until removal → `out in 5m`
- 3 minutes past target → `3m over`
- 10 minutes past target → `10m over`

**Styling:**
- Time remaining: Blue text
- Over target: Red/warning text

**Note:** "over" here means past the needle retention target time (e.g., 20 min), NOT past the appointment end time.

---

### 5. In Progress - Needles Out (Wrap-up Phase)
Needles removed, finishing up the appointment. Shows time until/past scheduled appointment end.

| Field | Display |
|-------|---------|
| Time | `12:00 PM` (scheduled end) |
| Timer | `Xm left` or `Xm over` |
| Icon | ⏰ AlarmClockCheck |

**Examples:**
- 10 minutes until appointment ends → `10m left`
- 5 minutes until appointment ends → `5m left`
- 3 minutes past scheduled end → `3m over`
- 15 minutes past scheduled end → `15m over`

**Styling:**
- Time remaining: Blue text
- Over scheduled end: Red/warning text

**Note:** "over" here means past the scheduled appointment end time.

---

### 6. Completed (Unsigned)
No active timer. Shows the original scheduled start time.

| Field | Display |
|-------|---------|
| Time | `10:00 AM` (scheduled start) |

---

### 7. Completed (Signed)
No active timer. Shows the original scheduled start time.

| Field | Display |
|-------|---------|
| Time | `9:00 AM` (scheduled start) |

---

## Summary Table

| State | Icon | Timer Format | "Over" Meaning |
|-------|------|--------------|----------------|
| Scheduled | - | - | - |
| Checked In | 🪑 Armchair | `Xm wait` | - |
| Started | 💬 MessageCircleMore | `Xm` | - |
| Needling | 💉 Syringe | `out in Xm` / `Xm over` | Past needle retention target |
| Needles Out | ⏰ AlarmClockCheck | `Xm left` / `Xm over` | Past appointment end |
| Unsigned | ✏️ PenLine | - | - |
| Completed | ✅ CircleCheckBig | - | - |

---

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Needle retention time | 20 minutes | Target time for needles to stay in |
| Long wait threshold | 10 minutes | When to show wait time in warning color |

---

## Future Considerations

- Per-appointment needle retention targets (some treatments may need longer)
- Audio/visual alerts when needle timer expires
- Configurable retention time per appointment type
