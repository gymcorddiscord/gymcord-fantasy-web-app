# Gymcord Fantasy — Lineups Page Spec

## Overview

The Lineups page is the primary weekly management screen where a user selects which athletes compete in each gymnastics event for their fantasy team. Users pick athletes for up to 4 events — Vault (VT), Uneven Bars (UB), Balance Beam (BB), and Floor Exercise (FX) — subject to per-event slot limits.

---

## Navigation & Global Shell

### Top Navigation Bar
| Element | Description |
|---|---|
| Logo | Gymcord Fantasy logo + wordmark, top-left. Navigates to home/dashboard. |
| Team Selector | Displays current team name (e.g., "Precision Flyers") and league name (e.g., "Elite Squad League") with a dropdown chevron. Allows switching between teams or leagues if the user belongs to multiple. |
| Week Selector | Centered. Shows current week label (e.g., "Week 3") with "CURRENT" badge when viewing the live week. Left/right arrow buttons navigate to previous/next weeks. Past weeks are read-only. |
| Nav Tabs | Right-aligned: **Lineups** (active), **Leaderboard**, **Trades**, **Analytics** |

### Dev: Account Switcher *(development only)*
A floating panel (top-right) for testing different user roles:
- **Guest / New User** — unauthenticated or first-time experience
- **Active Player** — standard league member (default selected)
- **Commissioner** — league admin with elevated permissions

This panel must be hidden in production builds.

---

## Page Controls

Located above the athlete table, right-aligned.

### Show Toggle
Switches the score display mode for all athletes in the table. Three states:
- **Avg** *(default)* — season average score per event
- **High** — personal best score per event
- **Prev** — score from most recent competition

Only one state active at a time. Active state is visually highlighted (teal fill).

### Import Last Week
- Button with a download icon
- Pre-fills the current week's lineup with the same athlete/event selections from the previous week
- Replaces the current lineup entirely with last week's selections
- Should prompt confirmation if the current lineup already has selections: "This will replace your current lineup with last week's. Continue?"
- Disabled (or hidden) in Week 1 when no prior week exists

### Clear All
- Removes all checkbox selections from the current lineup
- Should prompt confirmation ("Clear all lineup selections for Week X?")
- Disabled when no athletes are currently selected

---

## Athlete Table

### Column Structure

| Column | Header | Sub-label | Description |
|---|---|---|---|
| Athlete Name | ATHLETE NAME | — | Athlete name, school/team, and status icons. Sortable A→Z / Z→A. |
| Vault | VT | 0/10 | Score + selection checkbox; slot counter. Sortable high→low / low→high. |
| Uneven Bars | UB | 0/10 | Score + selection checkbox; slot counter. Sortable high→low / low→high. |
| Balance Beam | BB | 0/10 | Score + selection checkbox; slot counter. Sortable high→low / low→high. |
| Floor Exercise | FX | 0/10 | Score + selection checkbox; slot counter. Sortable high→low / low→high. |

**Slot counter** (e.g., `✓ 5 / 10`): Shows how many athletes are selected for that event out of the maximum allowed. The maximum is read from league configuration — it defaults to **10** but varies by league. Includes a checkmark icon prefix. Updates in real-time as checkboxes are toggled. Color-coded: white/gray when under target, amber when close (within 1–2), green at capacity. At capacity, unchecked athletes' checkboxes for that event should be disabled.

**Column sorting**: Clicking any column header sorts the athlete list by that column. First click sorts descending (high→low for scores, A→Z for names); second click reverses; third click returns to default order. Active sort column should display a directional arrow indicator. Athletes with `—` (no score) sort to the bottom regardless of direction.

---

### Athlete Row

Each row represents one rostered athlete. Rows contain:

#### Athlete Name Cell
- **Name** — bold, primary text (e.g., "Haleigh Bryant")
- **School/Team** — secondary text below name (e.g., "LSU")
- **Status icons** — displayed inline after the name (see Status Icons below)
- **Double meet badge** — e.g., `x2` displayed as a pill/badge; indicates the athlete competes in two meets this weekend. Can appear alongside status icons. Tooltip: "Double meet weekend — this athlete competes twice."

#### Event Score Cells (VT, UB, BB, FX)
Each event cell contains a horizontally paired **checkbox** and **score value**:
- A **checkbox** on the left — large circular checkbox (~28–32px); toggles inclusion of this athlete in this event for the current week's lineup
- A **score value** on the right — numeric (e.g., `9.938`) per the current Show toggle mode (Avg / High / Prev). The entire checkbox + score zone is clickable (~120–150px wide × 40px tall) to make selection easier.
- A **dash (`—`)** when the athlete does not compete in that event, or has no recorded score. Checkbox should be disabled when score is `—`.

Scores are right-aligned within their column for easy comparison.

---

### Status Icons

Icons appear inline after the athlete's name. Multiple icons can appear simultaneously.

| Icon | Meaning | Color | Tooltip Text |
|---|---|---|---|
| 🏠 Home | Athlete's meet this week is at their home venue | Green (`#10B981`) | "Competing at home" |
| ✈️ Away | Athlete is competing at an away meet this week | Blue (`#3B82F6`) | "Competing away" |
| 📅 Bye | Athlete has a bye week — no competition | Gray (`#6B7280`); row visually de-emphasized (~40–50% opacity) | "Bye week — not competing" |
| ⚠️ Injury (short-term) | Day-to-day injury; may or may not compete | Orange (`#F59E0B`) | "Day-to-day injury — check CGN Injury List for details" |
| 🚨 Injury (long-term) | Season-ending injury; will not compete | Red (`#EF4444`); row grayed out | "Season-ending injury — check CGN Injury List for details" |
| x2 Badge | Athlete competes in two meets this weekend — only the highest score per event across both meets counts | Teal pill/badge | "Double meet week — highest score per event counts" |
| ✓ Scored Last Week (counted) | Athlete's score was in the top Z and counted toward team total last week | Green (`#10B981`) | "Score counted in Week X" |
| — Scored Last Week (dropped) | Athlete competed last week but score was dropped | Gray (`#6B7280`) | "Competed but score dropped in Week X" |

**Injury data**: Admins manually update injury status in the backend based on the CGN Injury List. The tooltip on each injury icon directs players to check the CGN Injury List for the latest details on that athlete.

**Tooltip behavior**: All icons and the x2 badge must display a tooltip on hover (desktop) and on tap (mobile/touch). Tooltips should appear within ~300ms of hover and persist until the cursor leaves the icon area. On touch devices, a tap toggles the tooltip; tapping elsewhere dismisses it.

**Priority / display order** (when multiple icons apply, show max 3, highest priority first): Long-term injury > Short-term injury > Bye > Scored last week > Double meet > Home/Away.

**Meet format icons** (dual/tri/quad meets — lower priority, optional display):

| Icon | Meaning | Color | Tooltip |
|---|---|---|---|
| 👥 Dual | Two-team meet | Teal (`#14B8A6`) | "Dual meet format" |
| 👥 Tri | Three-team meet | Teal (`#14B8A6`) | "Tri meet — 3 teams competing" |
| 👥 Quad | Four-team meet | Teal (`#14B8A6`) | "Quad meet — 4 teams competing" |

---

## Behavior & Business Rules

### Lineup Submission
- Selections are auto-saved as checkboxes are toggled; show a "last saved" timestamp or auto-save indicator
- A sticky **"Save Lineup"** button at the bottom of the page shows the current selection count (e.g., "Saving 10 selections") and provides explicit confirmation on save
- **Lineup lock**: occurs every **Friday at 9:00 AM ET** (fixed system-wide, not configurable). After lock, all checkboxes become read-only
- **Meet week assignment**: Thursday night meet scores count toward the *previous* (already locked) week. Friday and later scores count toward the current week
- Locked state: display a "Lineup Locked" banner and disable all checkboxes

### Slot Limits
- Each event column has a max slot count defined by the league rules (displayed in the column sub-header as `selected/max`, e.g., `0/10`)
- The max is not hardcoded — it is read from the league configuration and may vary by league
- Once the cap is reached for an event, all unchecked checkboxes in that column are disabled
- Counter turns a warning color (e.g., amber) as the user approaches capacity, and turns green or accent color at capacity

### Score Display
- Dashes (`—`) indicate the athlete does not compete in that event — disable checkbox, show dash in score cell
- All score values update simultaneously when the Show toggle changes
- Scores should be formatted consistently to 3 decimal places

### Double Meet (x2)
- Badge is shown on the athlete row when the athlete is scheduled to compete in two meets this week
- This is a **scheduling indicator only** — it is not a score multiplier
- **Scoring rule**: if an athlete competes in two meets in the same week, only their **highest score per event** across both meets counts toward the lineup
- This page displays the badge only; the best-score-per-event logic is handled by the backend

### Week Navigation
- Current week: fully interactive
- Past weeks: read-only view of submitted lineup and actual scores earned
- Future weeks: can pre-set lineup but should show a "Locks in X days" notice
- "CURRENT" badge appears only on the active week

---

## Empty / Edge States

| State | Display |
|---|---|
| No athletes on roster | Empty state message: "Your roster is empty." with a "Browse Gymnasts" CTA button |
| Lineup cleared | Table visible with all checkboxes unchecked |
| Lineup locked | Read-only checkboxes; "Lineup Locked" banner above table |
| All slots filled for an event | Column header counter shows full capacity; remaining unchecked rows in that column disabled |
| Athlete on bye | Row still shows; checkboxes disabled; row visually de-emphasized (reduced opacity ~40–50%); bye icon clearly visible |
| Away from current week (viewing past week) | Read-only; show actual scores earned rather than projected scores |

---

## Roles & Permissions

| Role | Behavior |
|---|---|
| Active Player | Full access to set lineup for their own team only |
| Commissioner | Can view any team's lineup; **cannot edit another team's weekly lineup**. Can add/remove athletes from any team's roster as a commissioner override (to fix league issues), but this is a roster action — not a lineup action. |
| Guest / New User | Read-only or prompted to join/create a league |

---

## Open Questions

1. ~~**Slot limit value**~~ — **Resolved:** Max slots per event are defined by league rules, not hardcoded. UI reads from league config and enforces accordingly.
2. ~~**Multiplier source**~~ — **Resolved:** `x2` badge means the athlete has a double meet that weekend (competes twice). Not a score multiplier — a scheduling indicator. Tooltips required on all icons (see Status Icons section).
3. ~~**Injury details**~~ — **Resolved:** Admins manually update injury status based on the CGN Injury List. Two severity levels: short-term (orange, day-to-day) and long-term (red, season-ending). Injury icon tooltips direct players to check the CGN Injury List for the latest information.
4. ~~**Bye behavior**~~ — **Resolved:** Bye-week athlete rows are visually de-emphasized (reduced opacity ~40–50%). Checkboxes disabled. Bye icon still clearly visible.
5. ~~**Score source**~~ — **Resolved:** Scores are updated by the Gymcord Fantasy admin via the backend. No live data feed; no commissioner input. Front-end displays whatever the admin has published.
6. ~~**Import Last Week**~~ — **Resolved:** Replaces the current lineup entirely. Confirmation prompt required if lineup already has selections.
7. ~~**Athlete sorting**~~ — **Resolved:** Users sort by clicking column headers. All columns sortable; score columns sort high→low by default, name sorts A→Z. Athletes with no score (`—`) sort to the bottom.
8. **Mobile layout** — How do the 4 event columns + athlete name collapse on smaller screens?
