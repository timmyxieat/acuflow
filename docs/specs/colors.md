# Color System Spec

This document clarifies the different color concepts in Acuflow and how they should be used.

---

## Two Different Concepts

There are **two separate things** that could have colors:

### 1. Appointment Type (What kind of visit)
- Initial Consultation
- Follow-up Treatment
- Brief Follow-up

### 2. Appointment Status (Where in the workflow)
- Scheduled
- Checked In
- In Progress
- Completed (unsigned)
- Completed (signed)
- Cancelled
- No Show

These are **independent**. A "Follow-up Treatment" can be "Scheduled", "In Progress", or "Completed".

---

## Current Implementation (Confusing)

| Location | What's colored | Colors used |
|----------|----------------|-------------|
| Timeline blocks | Appointment Type | Indigo, Emerald, Amber |
| Patient Cards sections | Status | Blue, Green, Gray, Amber, Slate |
| Preview dot | Appointment Type | Indigo, Emerald, Amber |
| Preview badge | Status | Blue, Green, Gray, Amber, Slate |

**Problem**: Amber is used for BOTH "Brief Follow-up" type AND "Unsigned" status. This is confusing.

---

## Current Color Assignments

### Appointment Type Colors (from mock-data.ts)
```
Initial Consultation: #6366f1 (Indigo)
Follow-up Treatment:  #10b981 (Emerald)
Brief Follow-up:      #f59e0b (Amber)
```

### Status Colors (from mock-data.ts getStatusDisplay)
```
Scheduled:    bg-slate-100    text-slate-700    (Gray)
Checked In:   bg-green-100    text-green-700    (Green)
In Progress:  bg-blue-100     text-blue-700     (Blue)
Unsigned:     bg-amber-100    text-amber-700    (Amber) ← CONFLICTS with Brief Follow-up
Completed:    bg-slate-100    text-slate-600    (Gray)
Cancelled:    bg-red-100      text-red-700      (Red)
No Show:      bg-orange-100   text-orange-700   (Orange)
```

---

## Questions to Resolve

1. **Do we even need appointment type colors?**
   - Most EHRs don't color-code by type
   - Type is shown as text anyway

2. **What matters more on the timeline?**
   - Knowing it's a "Follow-up" vs "Initial"? (type)
   - Knowing it's "In Progress" vs "Scheduled"? (status)

3. **Should timeline blocks be colored at all?**
   - Could be neutral/white with just text
   - Status could be shown as a small badge instead

---

## Proposed Options

### Option A: Type on Timeline, Status on Cards (Current but fix conflicts)
- Timeline: Appointment type colors (but pick non-conflicting colors)
- Patient Cards: Status colors
- Preview: Both (type dot + status badge)

**New Type Colors (avoid amber):**
```
Initial Consultation: #6366f1 (Indigo)
Follow-up Treatment:  #10b981 (Emerald)
Brief Follow-up:      #8b5cf6 (Violet) ← Changed from Amber
```

### Option B: Status Everywhere
- Timeline: Status colors
- Patient Cards: Status colors
- Preview: Status only

**Pros**: Consistent, always know workflow state
**Cons**: Lose visual distinction of appointment types

### Option C: Neutral Timeline, Status on Cards
- Timeline: Light gray/neutral backgrounds
- Patient Cards: Status colors
- Preview: Status badge only

**Pros**: Clean, no color confusion
**Cons**: Timeline less visually interesting

### Option D: Type Colors with Status Indicators
- Timeline: Type colors for background
- Timeline: Small status icon/badge overlay
- Patient Cards: Status colors
- Preview: Both

**Pros**: Shows both pieces of info
**Cons**: More visual complexity

---

## Recommendation

**Option C (Neutral Timeline)** is cleanest:
- Users scan the patient cards by status anyway
- Timeline is for seeing time blocks, not status
- Removes all color confusion

Or **Option A with fixed colors** if type distinction on timeline is important.

---

## Decision Needed

Which option should we implement?

- [ ] Option A: Keep type colors on timeline, fix conflicts
- [ ] Option B: Status colors everywhere
- [ ] Option C: Neutral timeline, status on cards only
- [ ] Option D: Type background + status indicator overlay
