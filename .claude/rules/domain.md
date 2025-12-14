# Domain Models

Detailed documentation of Acuflow's domain models and their relationships.

## Patient Health Model (Three Layers)

```
Layer 1: MEDICAL PROFILE (Background - JSON on Patient)
├── pastMedicalHistory, familyHistory, socialHistory
├── medications, allergies
├── emotionalStatus, tcmReviewOfSystems (10Qs)
└── Updated occasionally, not tracked per visit

Layer 2: ACTIVE CONDITIONS (PatientCondition table - tracked)
├── The patient's "problem list"
├── Examples: Low back pain, Tinnitus, Sleep issues
├── Status: ACTIVE | IMPROVING | STABLE | RESOLVED
├── trackedMetrics: ["pain_score", "frequency"]
├── ConditionMeasurement: values over time
└── Lives on Patient, persists across visits

Layer 3: VISIT CHIEF COMPLAINTS (VisitChiefComplaint junction)
├── Which conditions are addressed TODAY
├── Subset of active conditions
├── isPrimary: main focus vs secondary
└── Links Visit to PatientCondition
```

## Active Conditions (PatientCondition)

The patient's "problem list" - conditions being actively tracked:

- Created when practitioner identifies an issue
- Status tracking: ACTIVE → IMPROVING → WORSENING → STABLE → RESOLVED
- **trackedMetrics:** Array of metrics to track (e.g., `["pain_score", "frequency"]`)
- **ConditionMeasurement:** Records values over time (linked to visits)
- **Automatic status updates:** Based on VAS trend (practitioner only marks RESOLVED)

## Medical Profile History

Tracks changes to Layer 1 medical profile fields:

- **MedicalProfileHistory** table records all changes
- Links to visitId when changes happen during a visit
- Tracks section, changeType, changeDescription
- Source: INITIAL_INTAKE, REEVALUATION_FORM, VISIT_UPDATE, PATIENT_PORTAL

## Patient Notes (CRM)

Rapport-building notes that persist across visits:

- **PatientNote** table for relationship notes
- Examples: "Visiting daughter in Arizona", "Prefers afternoon appointments"
- **isPinned:** Always show at top (e.g., "needle-sensitive")
- **isPrivate:** Only author sees it
- UX: Highlight text in SOAP note → mark as quick note

## Templates

Quick data entry with `/trigger` syntax:

```
User types: /hemorrhoids

Template expands:
Protruding? |
Does it retract?
Is it bleeding?
Pain score (0-10)?
```

**Template ownership:**
- `clinicId` (required) - all templates belong to a clinic
- `practitionerId` (NULL = clinic-wide, set = practitioner-specific)
- `trackedFields`: ["pain_score"] - auto-creates ConditionMeasurement

## SOAP Subsections (Auto-Recognition)

Free-form text with recognized subsections:

```
Input:
Tongue: red body, thin white coating
Pulse: wiry, rapid, 84 bpm
BP: 128/82
Patient appears anxious but cooperative.

Stored JSON:
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

## Appointments

States for main lifecycle: scheduled → checked_in → in_progress → completed

Other states: cancelled, no_show
- no_show auto-assigned after 1 hour past start if not checked_in

**Home screen card ordering:**
1. in_progress
2. checked_in
3. scheduled
4. unsigned (completed, is_signed=false)
5. completed (is_signed=true)
6. cancelled and no_show grouped

## Point Protocols

Named collections of acupuncture points:

- Each point has: side, technique (nullable = no manipulation)
- **Fixed sides:** BILATERAL, LEFT, RIGHT, CENTER
- **Dynamic sides:** CONTRALATERAL, IPSILATERAL (resolved when applied)
- Technique: null, TONIFYING, REDUCING, EVEN

## Treatment Packages

Pre-paid bundles (e.g., "10 treatments for $800"):

- **TreatmentPackage:** Clinic-wide or practitioner-specific
- **PatientPackage:** Patient's purchased package
- Auto-deduct credits on each visit
- Optional expiration dates

## Payment Model

- **Payment:** One per appointment (like an invoice), tracks amountDue and status
- **PaymentTransaction:** Individual payment events (multiple per Payment possible)

**Payment methods:** CARD, HSA, FSA, CASH, CHECK, INSURANCE_PAYOUT, PACKAGE_CREDIT, OTHER

**Payment statuses:** PENDING, PARTIAL, PAID, REFUNDED, WRITTEN_OFF

## Superbills

Generated per visit for insurance reimbursement:

- Provider info (name, NPI, license, tax ID, address)
- Patient info (name, DOB, insurance details)
- ICD-10 diagnosis codes (from Assessment)
- CPT procedure codes with units (auto-calculated from treatment duration + e-stim flag)
- PDF export for patient self-submission (basic tier)
- Electronic submission via clearinghouse (premium tier)
