# Ideas & Future Features

## Core Idea of App

- All about navigation (and flow)

## General

- show cursor:pointer for clickable items

## Sidenav

- Today nav item has an expand that expands the in progress appointments to quickly show them

## Right Sidebar Idea

- OR persistent secondary navigation move cards left of the calendar
  - have it collapse and toggle between patient appointments
- have a collapsed version of patient cards on the right
- clicking on a patient - column persists - opens up SOAP

## Today Screen

- Press Esc to unselect appointment
- Double click/long press to open appointment detail
  - Figure out for iPad navigation - probably add a second button or touch target
- Figure out scrolling with iPad - not working right now (prob tailwind scrollbar)
- Feedback
  - Increase size of the appointment detail overlay OR transition to modal
  - OR **On the PatientCard it "expands the card"**
  - take off shadow? somehow make it look like 2 solid entities
    (maybe down arrow instead of shadow)
  - If we keep it vertically stacked, move the selected patient so it's visible
  - Open Full Record hard to reach

## Search

- Show patient results
- Appointments (2 at most):
  - The upcoming appointment — shown first if today
  - Last visit appointment — shown first otherwise
- Quick access to Today's patients - In Progress

## Patient Intake

- Patient fills out intake questions before appointment
- Practitioner can highlight text anywhere in intake for emphasis
- Highlighted items persist as "flagged"
- When intake section is collapsed, highlighted excerpts remain visible (truncated with ellipsis)
- Example: `"Allergies: *Penicillin* since 5 years ago..."` → highlight "Penicillin"

## SOAP Note UX

- **Focus mode:** On iPad, only one SOAP section expanded at a time — tap header to expand/collapse. Keeps focus tight on limited screen space.

## Treatment Timer

- Timer for managing how long patients are on treatment table
- Ties in with syringe icon and timer display on Today screen
- Separate from appointment countdown (which shows time until end of scheduled slot)
