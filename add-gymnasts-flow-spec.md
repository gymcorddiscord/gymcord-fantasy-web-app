# Build Your Roster — Add Gymnasts Flow Spec

## Overview

The screen where a player adds gymnasts to their team's roster. Reached via the **"Build Your Roster"** CTA on the Welcome screen after creating or joining a league (see `create-league-flow-spec.md` and `join-league-flow-spec.md`), or anytime later from the league's Roster page — roster building isn't forced to complete in one sitting.

Offers two entry methods that write into the same roster and share the same validation rules:

**Method A: Search & Add** (single gymnast, quick) | **Method B: Paste from Clipboard** (bulk)

Both methods enforce the same underlying rule: each gymnast can only be on one team per league (exclusive pool, first-come-first-served — see PRD Section 9.0.3).

---

## Shared Context (persistent header while on this screen)

- Roster progress indicator: "**[X] / [Roster Size]** gymnasts added" (Roster Size was set by the commissioner at league creation)
- Once roster size is reached, both add methods disable further additions until the user drops a gymnast first
- A toggle or tab control switches between Method A and Method B — both operate on the same underlying roster, so switching methods mid-session doesn't lose progress

---

## Method A: Search & Add

**Goal:** Quickly find and add one gymnast at a time by typing a name.

### UI Elements

- **Search bar** — type-ahead, searches by gymnast name (same search behavior as the full Gymnast Browser in PRD Section 9.0.4, surfaced here in a lightweight form)
- **Results list** — updates as the user types, each row a compact gymnast card:
  - Name
  - School + logo
  - Year/Class
  - Event icons (which events they compete)
  - One key stat (season average)
  - "Add" button
- Rows for gymnasts **already rostered by another team in this league** render in a disabled state, "Add" button replaced with a label: "Already Rostered"

### Behavior

- Tapping "Add" adds the gymnast to the roster immediately (no confirmation step) and gives brief inline feedback — the row updates to an "Added ✓" state
- The search results list persists as the user adds multiple gymnasts in sequence; it does not reset or close after each add, so a user can add several gymnasts back-to-back without re-searching

### Validation / Error States

- **Roster full** — "Add" controls disable across the whole screen; banner: "Maximum roster size reached ([X]/[Y])"
- **Already on this team** — gymnast simply can't be re-added; row already shows "Added ✓"

---

## Method B: Paste from Clipboard

**Goal:** Bulk-add gymnasts by pasting a list of names instead of searching one at a time.

### UI Elements

- **Paste target** — a textarea, label: "Paste gymnast names (one per line)"
- **"Match Names"** button — submits the pasted text for matching

> **Open item for design agent:** exact accepted format is undecided — one name per line vs. comma-separated. Recommend supporting both by splitting on newlines *or* commas, since users copying from different sources (spreadsheet column vs. inline list) will paste differently.

### Behavior — Matching Results

After "Match Names" is submitted, replace the paste target with a results list, one row per pasted name, grouped into four states:

1. **Matched** — green check icon; shows the matched gymnast's name + school; row has a "Remove" control if the user wants to exclude it before confirming
2. **Ambiguous** — warning icon; shows the pasted text plus an inline list/dropdown of all candidate gymnasts (name + school for each, since the same name can exist across NCAA schools); user must pick one candidate before this row counts as matched
3. **Unmatched** — error icon; shows the pasted text with "No match found"; includes an inline retry text field so the user can correct a typo and re-search that single row without redoing the whole paste
4. **Already Rostered** — error icon; shows the pasted text plus the matched gymnast's name and "Already on [Other Team Name]'s roster"; informational only, cannot be added

Matching tolerates minor typos and close spellings — it is **not** exact-match-only, given the catalog spans 2,152 gymnasts across 87 schools and near-duplicate names are expected.

### Confirming

- Footer CTA: **"Add [N] Matched Gymnasts"** — the count reflects only rows currently in the Matched state (Ambiguous / Unmatched / Already Rostered rows are excluded from the count)
- Confirming adds only the Matched rows to the roster and returns to the roster progress view
- Unresolved rows (Ambiguous, Unmatched) are **not** silently added and are **not** auto-retried — the user must resolve them inline (pick a candidate / fix a typo) or re-paste them in a follow-up pass

### Validation / Error States

- **Roster full mid-paste** — if the number of Matched rows would exceed remaining roster space, cap the "Add" action at the remaining slots and flag the excess rows with "Roster full — not added" rather than silently dropping them without explanation

---

## Footer (roster screen overall)

- **"Done"** — returns to the league dashboard. Available even with an incomplete roster; roster building can resume later from the Roster page.

## Open Items for Design Agent

- Paste format support (see note above under Method B)
- Whether a minimum roster size should block leaving this screen, or leaving with zero gymnasts is acceptable
- Visual treatment for the four paste-result states (Matched / Ambiguous / Unmatched / Already Rostered) — needs to be scannable at a glance when a user pastes a long list
