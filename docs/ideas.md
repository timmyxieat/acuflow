# Ideas & Future Features

<!--
## For AI Agents

When working on this project:
1. Check this file before implementing features to see if they're already planned
2. Mark items `[x]` when fully implemented
3. Add new ideas under the appropriate section with `[ ]`
4. When completing work, update this file as part of your final commit
5. Move completed items to the bottom of their section

Status: `[ ]` = not done, `[x]` = done
-->

---

## Core Vision

- All about navigation (and flow)
- Mission: Unify acupuncturists across different techniques
  - Lead Magnet micro application idea
  - "They focus on the branch, but forgot the root"

---

## General UI

- [ ] Show `cursor: pointer` for all clickable items

---

## Sidenav

- [ ] Today nav item expands to show in-progress appointments inline

---

## Patient Cards / Right Sidebar

- [ ] when clicking a patient card, it doesn't have a click highlight feedback for the sake of the animation
- [X] Persistent patient cards panel (left of calendar)
- [X] Collapse/expand toggle for cards
- [X] Compact mode (avatar + time only when collapsed)
- [X] Clicking patient opens SOAP / appointment detail
- [X] Selection highlighting with status-color indicator

---

## Today Screen

- [ ] iPad navigation — needs second button or touch target for long-press alternative
- [ ] iPad scrolling issues (tailwind scrollbar)
- [ ] "Open Full Record" — make more accessible
- [ ] Remove shadow / try down arrow visual instead
- [X] Press Esc to unselect appointment
- [X] Double-click to open appointment detail
- [X] PatientCard "expands" on selection (collapse/expand implemented)
- [X] Selected patient scrolls into view
- [X] Keyboard navigation (arrow keys, Enter, Esc)
- [X] when pressing up or down arrow when no PatientCards are selected, it should start highlighting from the previously selected appointment
- [X] pressing down arrow on the last patientcard should go to the first. Presing the up arrow on the first patientcard should go to the last.

---

## Search

- [ ] Show upcoming + last visit appointments in results
- [ ] Quick access chip: "Today's In Progress" patients
- [X] Patient search (name, phone, email)
- [X] Date-based appointment search

---

## Patient Intake

- [ ] Patient fills out intake questions before appointment
- [ ] Practitioner highlights text for emphasis
- [ ] Highlighted items persist as "flagged"
- [ ] Collapsed section shows highlighted excerpts (truncated)
- [ ] Example: `"Allergies: *Penicillin*..."` with highlight

---

## SOAP Note UX

- [ ] **Focus mode (iPad):** One section expanded at a time, tap header to toggle
- [ ] Add 3rd toggle unit
- [X] Basic SOAP sections (Subjective, Objective, Assessment, Plan)
- [X] Visit timeline with "Use past treatment" copy feature

---

## Treatment Timer

- [X] Needle retention timer (20-min default)
- [X] MM:SS countdown display on PatientCards
- [X] Bell animation when timer completes
- [X] Separate from appointment slot countdown
- [X] Works in both expanded and compact card modes
