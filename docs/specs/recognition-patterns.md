# Text Recognition Patterns

This document defines how Acuflow recognizes and extracts structured data from free-form text entry.

---

## Overview

Practitioners type naturally in SOAP note sections. The system recognizes patterns and auto-populates structured data:

1. **Subjective** → Conditions, VAS scores → VisitChiefComplaint, ConditionMeasurement
2. **Plan** → Acupuncture points, protocols → TreatmentPoint

The raw text is always preserved. Recognition enhances but never replaces the original.

---

## Subjective Section Recognition

### Condition Matching

Match text against patient's existing `PatientCondition.name` values.

**Exact matches:**
- "Low back pain" → matches "Low back pain"
- "LBP" → matches "Low back pain" (common abbreviation)
- "Headache" → matches "Headache"
- "HA" → matches "Headache"

**Common abbreviations to expand:**
| Abbreviation | Full Term |
|--------------|-----------|
| LBP | Low back pain |
| HA | Headache |
| N/V | Nausea/vomiting |
| SOB | Shortness of breath |
| HTN | Hypertension |
| DM | Diabetes mellitus |

**Fuzzy matching:**
- "low back" → matches "Low back pain"
- "back pain" → matches "Low back pain"
- Case-insensitive

### VAS Score Patterns

Extract numeric pain/severity scores associated with conditions.

**Patterns to match:**
```regex
(\d+)\s*/\s*10           # "7/10"
(\d+)\s+out\s+of\s+10    # "7 out of 10"
pain\s+(\d+)             # "pain 7"
VAS\s*:?\s*(\d+)         # "VAS: 7" or "VAS 7"
(\d+)/10\s+pain          # "7/10 pain"
```

**Association logic:**
1. Find condition mention in text
2. Find VAS pattern within ~50 characters after condition mention
3. Associate score with that condition

**Example:**
```
Input: "Low back pain 7/10, worse after lifting. Neck tension 4/10."

Extracted:
- Low back pain → VAS 7
- Neck tension → VAS 4
```

### New Condition Detection

When text mentions a complaint not in patient's problem list:

```
Input: "Also reports mild neck tension 4/10"
Patient conditions: ["Low back pain", "Tinnitus"]

Result:
- "Neck tension" not found in conditions
- Prompt: "Add 'Neck tension' as new condition?"
```

---

## Plan Section Recognition

### Point Entry Format

**Overall treatment side** (optional, at start):
```
Bilateral treatment
Left side treatment
Right side treatment
```

If specified, all points default to this side unless overridden.

**Point syntax:**
```
[POINT_CODE] [SIDE]? [TECHNIQUE]?
```

**Components:**
- `POINT_CODE`: Meridian + number (e.g., LI4, ST36, GB34)
- `SIDE`: B (bilateral), L (left), R (right), C (center)
- `TECHNIQUE`: T (tonifying), R (reducing), E (even)

**Defaults:**
- Side: Use overall treatment side, or BILATERAL if not specified
- Technique: null (no manipulation)

**Examples:**
```
Input: "Bilateral treatment
LI4, GB34 T, ST36 L R, BL40"

Parsed:
- LI4 → BILATERAL, null
- GB34 → BILATERAL, TONIFYING
- ST36 → LEFT, REDUCING
- BL40 → BILATERAL, null
```

### Point Code Recognition

**Standard meridians:**
| Code | Meridian |
|------|----------|
| LU | Lung |
| LI | Large Intestine |
| ST | Stomach |
| SP | Spleen |
| HT | Heart |
| SI | Small Intestine |
| BL | Bladder |
| KD | Kidney |
| PC | Pericardium |
| SJ | San Jiao (Triple Burner) |
| GB | Gallbladder |
| LV | Liver |
| RN | Ren (Conception Vessel) |
| DU | Du (Governing Vessel) |

**Pattern:**
```regex
(LU|LI|ST|SP|HT|SI|BL|KD|PC|SJ|GB|LV|RN|DU)(\d{1,2})
```

**Point ranges:**
```
Huatuojiaji L3-L5 B    →  Expand to HJJ-L3, HJJ-L4, HJJ-L5
BL23-25 L              →  Expand to BL23, BL24, BL25
```

### Protocol Triggers

**Syntax:**
```
/[protocol-name] [SIDE]?
```

**Examples:**
```
/four-gates B          → Apply "Four Gates" protocol, bilateral
/shoulder-pain R       → Apply "Shoulder Pain Protocol", right affected
/lbp-basic L           → Apply "LBP Basic" protocol, left affected
```

**Side resolution for dynamic points:**
When protocol is applied with a side (e.g., R for right):
- CONTRALATERAL → resolves to LEFT
- IPSILATERAL → resolves to RIGHT
- Fixed sides (LEFT, RIGHT, CENTER, BILATERAL) → unchanged

### Autocomplete Behavior

When typing in the acupuncture subsection:

1. **Point autocomplete:**
   - Typing "GB3" → dropdown shows: GB3, GB30, GB31, GB32, GB33, GB34...
   - Show point name for confirmation: "GB34 (Yanglingquan)"
   - Select to insert

2. **Protocol autocomplete:**
   - Typing "/" → show recent protocols
   - Typing "/shou" → filter to protocols containing "shou"

3. **Recently used:**
   - Show recently used points for this patient's conditions
   - Show practitioner's frequently used protocols

---

## Objective Section Recognition

### Known Subsections

**Keywords that start subsections:**
| Keyword | Subsection Key |
|---------|---------------|
| Tongue: | tongue |
| Pulse: | pulse |
| BP: | bp |
| HR: | hr |
| Temp: | temp |
| Weight: | weight |
| Height: | height |
| Channel Palpation: | channelPalpation |
| Physical Exam: | physicalExam |

**Pattern:**
```regex
^(Tongue|Pulse|BP|HR|Temp|Weight|Height|Channel Palpation|Physical Exam)\s*:\s*(.+?)(?=\n[A-Z]|$)
```

**Example:**
```
Input:
"Tongue: red body, thin white coating
Pulse: wiry, rapid, 84 bpm
BP: 128/82
Patient appears anxious but cooperative."

Stored:
{
  "raw": "[full text]",
  "recognized": {
    "tongue": "red body, thin white coating",
    "pulse": "wiry, rapid, 84 bpm",
    "bp": "128/82"
  },
  "unstructured": "Patient appears anxious but cooperative."
}
```

---

## Assessment Section Recognition

### TCM Pattern Keywords

Look for TCM diagnostic patterns:
- "Liver Qi Stagnation"
- "Blood Stasis"
- "Kidney Yang Deficiency"
- etc.

### ICD-10 Code Detection

**Pattern:**
```regex
[A-Z]\d{2}(\.\d{1,4})?
```

**Examples:**
- M54.5 (Low back pain)
- G43.909 (Migraine, unspecified)

---

## Template Expansion

### Trigger Syntax

Templates are triggered by typing `/trigger-name`:

```
/hemorrhoids → expands to template content
```

### Cursor Markers

Templates use `|` to mark cursor positions:

```
Template content:
"Protruding? |
Does it retract? |
Is it bleeding? |
Pain score (0-10)? |"
```

### Navigation

- **Down arrow (↓):** Jump to next `|` marker (or end of next answer line if filled)
- **Up arrow (↑):** Jump to end of previous answer line
- When typing, `|` is replaced with cursor position
- Going back up places cursor at end of text, allowing continuation

---

## Data Flow Summary

### Subjective → Structured Data

```
Text input
    ↓
┌─────────────────────┐
│ Visit.subjective    │ ← Store raw + recognized
│ { raw, recognized } │
└─────────┬───────────┘
          │
          ├─── Condition found in patient's list?
          │         ↓ Yes
          │    ┌─────────────────────┐
          │    │ VisitChiefComplaint │ ← Auto-create link
          │    │ isPrimary: first    │
          │    └─────────────────────┘
          │
          └─── VAS score found near condition?
                    ↓ Yes
               ┌─────────────────────┐
               │ ConditionMeasurement│ ← Auto-record
               │ value: extracted    │
               └─────────────────────┘
```

### Plan → Treatment Points

```
Text input
    ↓
┌─────────────────────┐
│ Visit.plan          │ ← Store raw + recognized
│ { raw, recognized } │
└─────────┬───────────┘
          │
          ├─── Protocol trigger found?
          │         ↓ Yes
          │    Expand protocol points
          │    Apply side resolution
          │
          └─── Point codes found?
                    ↓ Yes
               Parse side + technique
               ┌─────────────────────┐
               │ TreatmentPoint[]    │ ← Auto-create
               │ for each point      │
               └─────────────────────┘
```

---

## Implementation Notes

### When to Run Recognition

1. **On blur** (user leaves field): Full recognition pass
2. **On pause** (debounced ~500ms): Light recognition for UI hints
3. **On save**: Final recognition before storing

### Confidence Handling

For uncertain matches, show inline suggestion rather than auto-applying:

```
"Patient reports headache 6/10"
           ^^^^^^^^
           [Did you mean "Headache" condition? Click to link]
```

### Preserving Raw Text

Always store the original text. Recognition is additive:

```json
{
  "raw": "LBP 7/10, worse after lifting",
  "recognized": {
    "conditions": [
      { "name": "Low back pain", "vas": 7, "matched": true }
    ]
  },
  "unstructured": ""
}
```

If user edits text, re-run recognition.
