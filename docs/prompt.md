I'm building "Acuflow" - a modern acupuncture EHR SaaS application for iPad (landscape mode). This will revolutionize how acupuncturists manage their practice and document patient care.

THE BIG PICTURE:
I'm an acupuncturist frustrated with current EHRs. They're clunky, slow, and force me to think about software instead of patients. My vision is an EHR that handles ALL practice management automatically - from booking to payment to documentation - so I can focus on healing.

TARGET USER: Solo acupuncture practitioners (expanding to clinics later)

PRIMARY GOAL: "Not having to think about practice management"

- Patients book themselves online
- Automated reminders (no missed appointments)
- Seamless check-in (tablet or self-service)
- Lightning-fast clinical documentation (click-based, minimal typing)
- Automatic payments (card on file)
- Everything just works

INSPIRATION: Harvey.ai's clean, professional aesthetic

- Generous whitespace
- Subtle shadows and borders
- Modern but not flashy
- Professional healthcare look with natural healing vibe

DEVICE: iPad in landscape mode, touch-first interface

- Large tap targets (44px minimum)
- Minimal typing required
- Visual point selection (body diagram)
- One-handed operation where possible

KEY DIFFERENTIATORS FROM GENERIC EHRS:

1. Acupuncture-specific point protocols with needling techniques
2. Guided questioning system (prompts follow-up questions by condition)
3. Multi-patient tracking with timers (see multiple patients resting simultaneously)
4. Smart needling organization (shows points in logical order with cun measurements)
5. Automated practice management (booking, reminders, payments, packages)

CORE WORKFLOWS (In Priority Order):

1. TODAY SCREEN: Dashboard showing timeline of appointments + active patients
2. FAST SOAP ENTRY: Click-based documentation with point protocols
3. APPOINTMENT MANAGEMENT: Online booking, check-in, automated reminders
4. PAYMENT AUTOMATION: Card on file, auto-charge, treatment packages
5. PATIENT EDUCATION: Auto-generate pattern-based lifestyle advice

TECH STACK DECISIONS:

- Next.js 14 + TypeScript + App Router
- Tailwind CSS with custom design tokens
- shadcn/ui component library (chosen over Catalyst for flexibility)
- PostgreSQL + Prisma ORM
- Stripe for payments, Twilio for SMS
- Framer Motion for subtle animations

DESIGN SYSTEM (Pending final color choice):

- Base: Neutral whites and grays (professional, clean)
- Accent: Muted teal #8daa9d
- Typography: Noto Sans font, generous line-height
- Spacing: 24-32px between sections
- Components: 8px rounded corners, subtle shadows

DEVELOPMENT APPROACH: "Shell First, Then Details"
Phase 1: Build main screen layouts and navigation (look & feel)
Phase 2: Make core workflows functional
Phase 3: Add intelligent features (protocols, guided questions, timers)
Phase 4: Complete practice management automation

TIMELINE: 4-week MVP, then iterate with real usage

RIGHT NOW: I want to start by building the foundation and getting the visual aesthetic right. Let's create the app shell with navigation, set up our design system in Tailwind, and build the TODAY SCREEN layout (not fully functional yet - just the structure and look).

The Today Screen should have:

- LEFT (40%): Vertical timeline of day's appointments (8am-8pm)
- RIGHT (60%): Stacked patient status panels (In Progress with timers, Checked In, Scheduled, Unsigned Notes, Completed, No-shows)

Let's get the foundation perfect, then we'll build on it rapidly.

FIRST TASKS:

1. Set up Next.js 14 project with TypeScript
2. Configure Tailwind with our design tokens (neutral + sage green accents)
3. Install shadcn/ui components we'll need
4. Build collapsible sidebar navigation (Home, Calendar, Patients, Protocols, Settings)
5. Create basic Today Screen layout structure
6. Add mock data for appointments and patients
7. Make it look beautiful and spacious (Harvey.ai aesthetic)

Ready to start building?
