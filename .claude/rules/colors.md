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

## Current Implementation

| Location | What's colored | Colors used |
|----------|----------------|-------------|
| Timeline blocks | Appointment Type | Indigo, Emerald, Amber |
| Patient Cards sections | Status | Blue, Green, Slate, Amber |
| Preview dot | Appointment Type | Indigo, Emerald, Amber |
| Preview badge | Status | Blue, Green, Slate, Amber |

**Note:** Amber is used for both "Brief Follow-up" type and "Unsigned" status. See Open Question section below.

---

## Current Color Assignments

### Appointment Type Colors (from mock-data.ts)
```
Initial Consultation: #6366f1 (Indigo)
Follow-up Treatment:  #10b981 (Emerald)
Brief Follow-up:      #f59e0b (Amber)
```

### Status Colors (from constants.ts and mock-data.ts)
```
Scheduled:    bg-slate-100    text-slate-600    #94a3b8 (Slate) ← No action needed
Checked In:   bg-green-100    text-green-700    #22c55e (Green)
In Progress:  bg-blue-100     text-blue-700     #3b82f6 (Blue)
Unsigned:     bg-amber-100    text-amber-700    #f59e0b (Amber) - needs signature
Completed:    bg-slate-100    text-slate-600    #94a3b8 (Slate) ← No action needed
Cancelled:    bg-red-100      text-red-700      #ef4444 (Red)
No Show:      bg-red-100      text-red-700      #ef4444 (Red)
```

**Design decision:** Scheduled and Completed share the same slate color because both are "no action needed" states. Colors are reserved for states requiring attention.

---

## Open Question: Appointment Type Colors

Appointment types currently use these colors on the Timeline:
```
Initial Consultation: #6366f1 (Indigo)
Follow-up Treatment:  #10b981 (Emerald)
Brief Follow-up:      #f59e0b (Amber)
```

**Note:** Brief Follow-up uses Amber, which also used for Unsigned status. This may cause confusion if both are visible together. Consider changing Brief Follow-up to Violet (`#8b5cf6`) if this becomes an issue.
