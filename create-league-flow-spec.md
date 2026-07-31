# Create New League Flow — Spec

## Overview

A 4-step wizard that guides a commissioner through creating a new league. Each step must be completed before advancing. Progress is shown via a step indicator at the top.

**Steps:** Join or Create → League Name → League Rules → Trade Rules

---

## Step 1: Join or Create

**Goal:** Route the user to either the join flow or the creation wizard.

### UI Elements

- **No step indicator** — this is a pre-wizard route selector, not a numbered wizard step
- **Heading** — "Get Started"
- **Two large selection cards** (mutually exclusive):
  - **Join an existing league** — subtitle: "Enter a league code to join a friend's league"
  - **Create a new league** — subtitle: "Set up a new league and invite players"
- Selecting a card immediately advances (no additional confirm button needed)
- **No footer actions** — no Cancel, no Back on this screen

### Behavior

- Selecting **"Join an existing league"** exits this wizard and routes to the Join a League flow
- Selecting **"Create a new league"** advances to Step 2 (League Name)
- Navigating away from this screen before selecting discards no state (nothing has been entered yet)

---

## Step 2: League Name

**Goal:** Capture the league's display name.

### UI Elements

- **Step indicator** — "1 League Name" active, steps 2–3 inactive
- **Heading** — "Name Your League"
- **Text input** — Label: "League Name", placeholder text, autofocused on load
- **Footer actions**
  - Left: "Cancel" — exits the wizard, no league created
  - Right: "Next Step →" — disabled until the field is non-empty

### Validation

- Field must be non-empty to advance
- Trim whitespace before validation

---

## Step 3: League Rules

**Goal:** Configure roster size, lineup size, and scoring depth. Combines the current "Roster & Scoring" and "Draft Settings" steps into one.

### UI Elements

- **Step indicator** — "2 League Rules" active (step 1 shown as complete)
- **Heading** — "League Rules"
- **Subheading** — "Configure how teams are built and scored."

#### Preset Tiles

Four quick-select presets that populate all three sliders at once:

| Preset | Roster | Lineup ("Up") | Scoring ("Count") |
|---|---|---|---|
| Standard | 20 | 10 | 5 |
| Hardcore | 10 | 10 | 5 |
| Casual | 25 | 25 | 25 |
| Deep | 50 | 25 | (to be defined) |

Selecting a preset highlights its tile and updates all sliders. Manually moving a slider deselects any active preset.

#### Sliders

- **Roster Size (Total Gymnasts)** — controls how many gymnasts each team drafts. Range: TBD (min/max).
- **"Up" per Week (Lineup Size)** — controls how many gymnasts a team activates each week. Cannot exceed Roster Size.
- **"Count" per Week (Scoring Scores)** — controls how many scores count toward the team's weekly total. Cannot exceed Lineup Size.

#### Summary Banner

Below the sliders, a read-only callout updates dynamically:

> "Each team will draft **[Roster]** gymnasts. Weekly, they will activate **[Up]**, and the top **[Count]** scores will count toward their total."

### Footer Actions

- Left: "← Back" — returns to Step 2 (League Name), preserving entered name
- Right: "Next Step →" — always enabled (defaults pre-fill valid values)

---

## Step 4: Trade Rules

**Goal:** Choose how roster changes work after the draft.

### UI Elements

- **Step indicator** — "3 Trade Rules" active, steps 1–2 shown as complete (checkmark)
- **Heading** — "Trading Rules"
- **Subheading** — "Choose how teams can exchange gymnasts."

#### Trade Mode Selection (single-select)

Three mutually exclusive options, each displayed as a card:

| Option | Icon | Description |
|---|---|---|
| Commissioner Only | Shield | You manually execute all trades. Total control. |
| No Trades | Lock | Rosters are locked after the draft. |
| Waiver Wire | Exchange arrows | Automated weekly claims based on priority. |

Selecting a card highlights it with a teal border and checkmark.

#### Waiver Settings (conditional)

Shown only when **Waiver Wire** is selected.

**Process Time** — dropdown, selects the day and time waivers process each week.
- Default: Wednesday 11:59 PM
- Options: (all days of the week + time slots — to be defined)

**Priority System** — single-select radio list:
- **Inverse Standings (Last place first)** — team in last place gets first pick; resets each week based on standings
- **Rolling (Moves to bottom after claim)** — after a team claims a gymnast, they drop to the bottom of priority
- **Fixed (Never changes)** — priority order is set at draft and never changes

Default selection: Inverse Standings.

### Footer Actions

- Left: "← Back" — returns to Step 3 (League Rules)
- Right: "Create League" (primary CTA, replaces "Next Step") — submits the form and creates the league

---

## General Behavior

- **State persistence** — navigating back between steps preserves all entered values
- **Step indicator** — completed steps show a checkmark; the current step is highlighted; future steps are inactive
- **Default values** — the wizard opens with Standard preset selected (20/10/5) and Waiver Wire + Inverse Standings selected, so a commissioner can advance through all steps without touching anything
- **Cancel** — available only on Step 2 (League Name); exits the wizard and discards all state. Step 1 (Join or Create) has no Cancel button.
