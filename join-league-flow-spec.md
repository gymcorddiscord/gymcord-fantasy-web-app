# Join League Flow — Spec

## Overview

A 4-step flow that lets a player join an existing league via invite code or link, preview the league before committing, and set up their own team. Progress is shown via a step indicator, except on the entry step.

**Steps:** Enter Code → League Preview → Team Identity → *Welcome*

---

## Step 1: Enter League Code

**Goal:** Capture and validate an invite code or link.

### UI Elements

- **No step indicator** — this is the entry screen (mirrors "Join or Create" in the Create League flow)
- **Heading** — "Join a League"
- **Text input** — Label: "League Code", placeholder: "Paste your invite link or code", autofocused
- **Footer actions**
  - Left: "Cancel" — exits, returns to dashboard / Get Started screen
  - Right: "Continue →" — disabled until the field is non-empty

### Behavior

- The current build joins via a shareable `/join/:code` link rather than a manually-typed code (a commissioner shares the link directly, e.g. in Discord). The input should accept **either** a pasted full link or a typed short code in the same field — design should not force the user to strip the link down to just the code.
- A valid code/link advances to Step 2 (League Preview).

### Error States (inline, below the field, do not advance)

- "Invalid code. Please check and try again." — bad format or not found
- "This league is full. Contact the commissioner." — league at roster/team capacity
- "You're already in this league!" — user is already a member

---

## Step 2: League Preview

**Goal:** Let the user confirm they've got the right league before committing to it.

### UI Elements

- **Step indicator** — "1 League Preview" active
- **Card** summarizing the league:
  - League name
  - Commissioner name
  - Current number of teams
  - Scoring format (e.g. "10 up, 5 count")
  - Trade rules summary
  - Current week

### Footer Actions

- Left: "← Back" — returns to Step 1 (Enter Code)
- Right: "Join League →" (primary CTA) — advances to Step 3. No membership is created yet.

---

## Step 3: Team Identity

**Goal:** Name and personalize the team the player will manage in this league.

This step is **identical in component and behavior** to Step 5 of the Create League flow (`create-league-flow-spec.md`) — same curated 10-swatch color palette, same validation rules. Design it once and reuse it here; do not create a second variant.

### UI Elements

- **Step indicator** — "2 Team Identity" active
- **Heading** — "Set Up Your Team"
- **Text input** — Label: "Team Name", required, max 30 characters, character counter
- **Color picker** — same curated palette component as the Create flow (see `create-league-flow-spec.md` Step 5 for the swatch table and the red/injury-color caution note). User selects exactly two distinct swatches.
- **Live preview** — "Your team '**[Team Name]**' in **[League Name]**" with a team badge showing the selected colors

### Validation

- Team name required, non-empty, trimmed
- No duplicate team name within this league (checked server-side against the league being joined) — error: "That team name is already taken in this league."
- Exactly two distinct swatches selected

### Footer Actions

- Left: "← Back" — returns to Step 2 (League Preview)
- Right: "Confirm and Join →" (primary CTA) — submits, creates the membership and team, then advances to Step 4 (Welcome)

---

## Step 4: Welcome

Not a numbered wizard step — a confirmation/routing screen, structurally identical to the Post-Creation Welcome screen in the Create League flow.

### UI Elements

- Success message: "Welcome to **[League Name]**!"
- "You're now competing as **[Team Name]**" with the team badge (selected colors) shown
- Current standings, if the league is mid-season
- Next-action prompts:
  - **"Build Your Roster"** (primary CTA) — routes to the shared roster-building screen (see `add-gymnasts-flow-spec.md`)
  - **"Go to Dashboard"** (secondary) — roster building can be finished later; the gymnast pool remains first-come-first-served in the meantime

---

## General Behavior

- **State persistence** — navigating back between Steps 1–3 preserves all entered values
- **Step indicator** — completed steps show a checkmark; the current step is highlighted; future steps are inactive
- **Cancel** — available only on Step 1 (Enter Code); exits the flow and discards all state, mirroring the Create League flow's Cancel convention
- **Error states** — shown inline on the step where they occur; never silently advance the user past an invalid state
