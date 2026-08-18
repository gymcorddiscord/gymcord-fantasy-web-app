# Lineups Page — Requirements

Consolidates PRD §8.2 ("Teams Page — Lineups View"), `spec-lineups-page.md`, and decisions made
2026-08-18 resolving contradictions between them. **This supersedes §8.5 ("Lineup Page (Week 3)")
and `spec-lineups-page.md` entirely** — §8.5 was an unmaintained early draft (its "10 gymnast slots
total" conflicts with the per-apparatus model below, and its own cross-reference to "7.2 for icon
types" points at the wrong section). Where this doc conflicts with either source, this doc wins.

This is the full-scope build ("the whole enchilada"), not an MVP. Full feature list below, including
what was explicitly cut from the PRD's own optional/future items and what was added beyond the PRD.

---

## 0. Prerequisites — none of this exists today

Before any UI work, three things need to be built. Nothing on this page can be real without them.

### 0.1 `lineup_selections` table (new)

Presence-based, matching the `roster_gymnasts` convention already used in this codebase — a row
means "selected," there's no boolean flag to keep in sync.

```sql
create table public.lineup_selections (
    id                 bigint generated always as identity primary key,
    league_member_id   bigint not null references public.league_members(id) on delete cascade,
    league_id          bigint not null references public.leagues(id) on delete cascade,
    gymnast_id         bigint not null references public.gymnasts(id) on delete cascade,
    event              text not null check (event in ('vault','bars','beam','floor')),
    season_year        integer not null,
    week_number        integer not null,
    created_at         timestamptz not null default now()
);
create unique index on public.lineup_selections
    (league_member_id, gymnast_id, event, season_year, week_number);
```

Selecting = insert a row. Deselecting = delete it. This is also exactly what "Populate All Future
Weeks" and "Import Last Week" operate on (bulk insert, keyed off an existing week's rows).

### 0.2 Weekly meet schedule (new) — replaces a single "status" flag with derived state

Rather than a flag-heavy `gymnast_week_status` table (separate booleans for bye/double-meet that can
drift out of sync with reality), model what's actually true: **a gymnast has zero, one, or two
scheduled meets in a given week.** Bye and double-meet become *derived* from row count, not stored
flags — one less thing to keep consistent.

```sql
create table public.gymnast_meet_schedule (
    id             bigint generated always as identity primary key,
    gymnast_id     bigint not null references public.gymnasts(id) on delete cascade,
    season_year    integer not null,
    week_number    integer not null,
    meet_date      date not null,
    meet_time      text,               -- free text, e.g. "7:00 PM PT" — no timezone-DB modeling needed for v1
    opponent       text,
    location       text check (location in ('home','away')),
    meet_format    text check (meet_format in ('dual','tri','quad')),
    created_at     timestamptz not null default now()
);
```

- **0 rows this week** → Bye
- **1 row** → normal week (home/away icon, opponent, date/time from that row)
- **2 rows** → Double Meet (`x2` badge); scoring already handles "highest score per event across both
  meets counts" at the `scores` table level (existing `meet_date`-keyed uniqueness)

**Needs an admin curation page** (new — doesn't exist). Same shape as Admin Scores Import: a
write-in form + probably a CSV bulk-upload path, since this needs entering for the *entire* gymnast
pool every week before lineups open. Sizing this admin page is a separate task from the Lineups page
itself, but it's a hard blocker — the Lineups page has nothing to show for status icons or the
"This Week's Meet" tooltip section without it.

### 0.3 Injury status (new) — current-state, not week-scoped

The PRD describes this as "whatever the admin has published" — a single current status, not a
per-week history:

```sql
alter table public.gymnasts add column injury_status text not null default 'healthy'
    check (injury_status in ('healthy', 'short_term', 'long_term'));
alter table public.gymnasts add column injury_note text;
```

Updated via the same admin curation page as 0.2. `injury_note` is free text for the tooltip's
"Day-to-day injury — game time decision" / "First meet back from injury" style notes.

### 0.4 School logos (new)

`ncaa_teams` has no logo field and no logo assets exist anywhere in the app today (the Gymnasts page
uses team colors, not logos). Add:

```sql
alter table public.ncaa_teams add column logo_url text;
```

Needs actual logo assets sourced/hosted for all ~87 teams (or as many as available) — this is
asset-sourcing work, not just a schema change. **Fallback required for missing logos:** school
initials, per spec-lineups-page.md.

### 0.5 New metrics needed in `scoreMetrics.ts`

Already built and validated (2026-08-18, 517/517 gymnasts within 0.001 of `vault_avg`): **Average,
Median, Most Recent, High.**

Needed new for this page:
- **Average-Home** / **Average-Away** — same `average()` logic, filtered to `location = 'home'` /
  `'away'`. **Will show no/limited data initially** — `location` was only just added to `scores` and
  has zero rows populated live. This metric is real and correct but empty until new location-tagged
  scores accumulate, same caveat as NQS.
- **Rolling 3-Meet Average** — average of the 3 most-recent scores by `week_number`/`meet_date`
  ordering (same tie-break logic as `mostRecent()`).
- **NQS stays excluded** — blocked on the same `location` data as Average-Home/Away, not on formula
  complexity (see `scoreMetrics.ts` comment from 2026-08-18 for the corrected rationale).

---

## 1. Page Shell & Navigation

- Logo (top-left) → navigates home
- Team/League selector — current team + league name, dropdown to switch across the user's teams/leagues
- Week selector — centered, "Week N" with "CURRENT" badge on the active week, ← → arrows
- Nav tabs (right-aligned): **Lineups** (active) · Leaderboard · Trades · Analytics — these are stubs
  until their own pages ship; Lineups is the only live tab for now

## 2. Page Controls

Row above the matrix.

**Show toggle** — now a dropdown/expanded picker, not a 3-way pill (confirmed necessary once
Avg-Home/Away and Rolling-3 were added — a simple pill group doesn't scale to 7 options):
- Average *(default)*
- Median
- Most Recent ("Prev")
- High
- Average (Home)
- Average (Away)
- Rolling 3-Meet Average

Changes score display for every athlete/event simultaneously. Selection state (checkboxes) is
unaffected by toggle changes.

**Import Last Week** — pre-fills current week's lineup with last week's exact selections, replacing
the current lineup entirely. Confirms first if the current lineup already has selections: "This will
replace your current lineup with last week's. Continue?" Disabled/hidden in Week 1.

**Populate All Future Weeks** — bulk-copies the current week's selections into every remaining week
of the season. Tooltip text: **"Apply these lineups to all future weeks."**

**Clear All** — removes all selections for the current week. Confirms first: "Clear all lineup
selections for Week X?" Disabled when nothing is selected.

## 3. Filtering & Sorting

**No filter-by-university or filter-by-event.** Replacing the PRD's single "Filter by Status"
dropdown with two independent toggles, right-aligned:
- **Hide Bye** — off by default
- **Hide Injured** — off by default

(No "Show: All/Selected/Available" toggle — cut.)

**Sorting is via column headers**, not a separate dropdown:
- **Gymnast** (name) — A→Z / Z→A
- **University** — A→Z / Z→A (its own column — see §4)
- **VT / UB / BB / FX** — sorts by whatever metric the Show toggle currently displays, high→low first
  click, low→high second click, third click returns to default order. Athletes with `—` (no score)
  always sort to the bottom regardless of direction.

Active sort column shows a directional arrow indicator.

## 4. Athlete Table (Matrix)

**6 columns**: Gymnast | University | VT | UB | BB | FX (University promoted to its own sortable
column — not secondary text under the name, per the sorting requirement above).

- Sticky column headers on vertical scroll
- 60–80px row height, hover highlight
- Drag handle for custom roster ordering (reuses the existing `sort_order` / `reorderRoster()`
  roster-ordering infrastructure — not new)

### Gymnast column
- School logo (32–40px, team-colored, initials fallback per §0.4)
- Name (bold)
- Status icons (see §5)

### University column
- School name, sortable

### Event columns (VT/UB/BB/FX)
- Large circular checkbox (28–32px) + score value, horizontally paired
- Entire cell (~120–150px × 40px) is the click target, not just the checkbox
- Dash (`—`) + disabled checkbox when the gymnast doesn't compete that event, or has no score
- Score right-aligned, 3 decimal places
- **Per-apparatus counter in column header**: "✓ 5 / 10" — white/gray under target, amber near
  target, green at capacity. **Enforced**: once an apparatus hits its cap, remaining unchecked boxes
  in that column disable; user must uncheck someone else first. **No cross-apparatus counter or
  limit anywhere** — each of the 4 apparatus pools is fully independent (confirmed against §3.1's
  "no global cross-apparatus cap" model).

## 5. Status Icons

Inline after the gymnast's name, max 3 shown at once, priority order when multiple apply:
**Long-term injury > Short-term injury > Bye > Scored-last-week > Double-meet > Home/Away.**

| Icon | Meaning | Color | Tooltip |
|---|---|---|---|
| 🏠 Home | This week's meet is at home | Green | "Competing at home" |
| ✈️ Away | This week's meet is away | Blue | "Competing away" |
| 📅 Bye | No meet this week (0 rows in `gymnast_meet_schedule`) | Gray, row ~40–50% opacity | "Bye week — not competing" |
| ⚠️ Injury (short-term) | Day-to-day | Orange | "Day-to-day injury — check CGN Injury List for details" |
| 🚨 Injury (long-term) | Season-ending | Red, row grayed out | "Season-ending injury — check CGN Injury List for details" |
| `x2` badge | 2 rows in `gymnast_meet_schedule` this week | Teal pill | "Double meet week — highest score per event counts" |
| ✓ Scored last week (counted) | Top-Z last week | Green | "Score counted in Week X" |
| — Scored last week (dropped) | Competed, not top-Z | Gray | "Competed but score dropped in Week X" |

Tooltip shows on hover (desktop, ~300ms delay) and tap (mobile, tap elsewhere dismisses).

**Meet format icons** (dual/tri/quad) — lower priority, from `gymnast_meet_schedule.meet_format`.

## 6. Hover Tooltip (on gymnast name or score badge)

- **Header**: Name, school + logo, class year
- **This Week's Meet**: event, 🏠/✈️ + opponent, date/time, meet format — sourced from
  `gymnast_meet_schedule`
- **Season Stats** (for the hovered apparatus): Average, Median, High (+ date), Most Recent (+ date),
  NQS (blank/pending until `location` data exists), meets competed — this is exactly what
  `api.scoreMetrics()` already returns, minus NQS
- **Recent Performance**: trend arrow (↗️/↘️), consistency note
- **Status notes**: injury note, "season debut," "competing twice this week," etc., from §0.3

## 7. Selection Behavior

1. Click anywhere in the checkbox+score cell → toggles selection
2. Per-apparatus counter updates in real time
3. At cap, remaining unchecked boxes in that column disable; hover shows "Limit reached. Uncheck
   another gymnast first."
4. No limit on unchecking

**Save: no explicit Save button.** Every toggle auto-saves immediately (insert/delete a
`lineup_selections` row). A lightweight visual indicator confirms the save (e.g. a brief "Saved" or
timestamp near the controls row) — no confirmation dialog, no button, no "unsaved changes" state.

## 8. Week Navigation & Locking

- **Current week**: fully interactive, as above
- **Future weeks**: editable (pre-set via checkboxes same as current, or via Populate All Future
  Weeks), shows "Locks in X days" notice
- **Past weeks**: read-only, switches to Historical View (§9)
- **Lock**: every Friday 9:00 AM ET, fixed system-wide, not league-configurable. Thursday-night meet
  scores count toward the *previous* (already-locked) week; Friday-and-later scores count toward the
  current week.
- **Lock deadline countdown** — shown near the week selector or controls row (e.g. "Locks in 2d 4h")

## 9. Historical View (past, locked weeks)

Same matrix, transformed:

- Title changes to "Week [X] Results" — read-only, no checkboxes
- **Score Legend** at top (before the matrix) — same 4 states as §8.2.C:
  - 🟢 Green — "Was up, counted (top Z)"
  - 🟠 Orange — "NOT up, would have counted"
  - 🔵 Blue-Gray — "Was up, didn't count (positions Z+1 through UP)"
  - ⚫ Dark Gray — "NOT up, too low"
- Every score badge color-coded per the legend, **plus a small "C"/"D" (or ✓/✗) badge stamped in the
  corner of the score** — redundant with color, for colorblind users / at-a-glance clarity (confirmed
  in scope)
- Dash (`—`) for events not competed, no color/badge
- Aggregate row at bottom: per-apparatus team total, overall score, league rank
- Performance Analysis section below the matrix: top-Z counted, scores dropped, actual vs. max
  possible, efficiency %, per-event breakdown, "Missed Opportunities" list
- **Export Week Results** — CSV/PDF download of the week's scores, states, and stats (confirmed in
  scope)
- Hover tooltip (historical variant): actual score, rank among counting scores, counted/dropped
  status, comparison to season average
- Week selector still works to move between historical weeks; "Current Week" button returns to live

## 10. Explicitly Out of Scope

Cut from the PRD's optional/future list — not building these as part of this page:

- Counting position indicator ("1st", "5th" next to score)
- AI Suggestions ("next time, consider selecting X")
- Pattern Recognition insights ("you tend to under-select from X")
- Sparkline visualizations in the matrix
- Show toggle (All / Selected Only / Available Only)
- Filter by university, filter by event (both explicitly cut)

**Backlog, not building now but noted for later:** Compare Weeks (split-screen side-by-side week
comparison).

## 11. Roles & Permissions

| Role | Behavior |
|---|---|
| Active Player | Full access to set lineup for their own team only |
| Commissioner | Can view any team's lineup; **cannot edit another team's weekly lineup**. Can add/remove gymnasts from any team's *roster* as an override (roster action, not a lineup action). |
| Guest / signed out | Read-only or prompted to join/create a league |

## 12. Accessibility

Not flagged as optional by the PRD or in this thread — treating as a core requirement, not a later
pass:

- Full keyboard navigation: Tab through rows, arrow keys between cells, Space/Enter to toggle checkbox
- Screen reader announcements for selections, counter changes, errors, tooltip content
- Touch targets ≥44×44px (the ~120–150×40px checkbox+score zone already clears this)
- WCAG AA contrast; state never conveyed by color alone (icons + text alongside every color-coded state)

## 13. Mobile Responsive

- **Desktop (>1024px)**: full 6-column matrix
- **Tablet (768–1024px)**: horizontal scroll, headers sticky
- **Mobile (<768px)**: tabbed/accordion view, one apparatus at a time, swipe between apparatus,
  Gymnast name column always visible — **this is a default choice, not yet confirmed with you**;
  the alternative (full matrix with horizontal + vertical scroll, no tabs) is the PRD's other stated
  option. Flag if you want the scroll-only variant instead.

## 14. Prototype / Mock Data Strategy

The real 2027 season hasn't started — there is no real `gymnast_meet_schedule` data, no real
`lineup_selections` data, and no real 2027 `scores`. Building and demoing this page requires mock
data. Agreed approach:

- **Simulate "Week 3" as the current week**, with **Week 1 and Week 2 pre-populated as mock
  historical data** (mock `lineup_selections` + mock `scores`, with a realistic spread of
  counted/dropped/would-have-counted outcomes). This is what makes §9 (Historical View — legend,
  badges, aggregates, Performance Analysis) actually testable, not just the live Week 3 matrix.
- Mock `gymnast_meet_schedule` rows for Week 3 too, so status icons (home/away/bye/injury/double-meet)
  have real data to render rather than all showing blank.
- **This mock data does not go into the shared production Supabase project.** That project already
  has real 2026 data and real live leagues (7 leagues, 42 rostered gymnasts, 18,203 real scores as of
  2026-08-18) — seeding synthetic 2027 competition data into the same tables real users' data lives in
  is the wrong place for it. Use a **Supabase development branch** (`mcp__supabase__create_branch`)
  to seed and build against instead, so the mock data can be freely reset/regenerated and never risks
  touching or being mistaken for real data. Merge/promote only the schema changes (§0.1–§0.4) when
  the branch's work is ready — not the mock rows themselves.

---

## Open items carried forward (not blocking, but not decided)

- Exact mobile collapse mechanism (§13, tabs vs. scroll-only)
- Admin curation page for `gymnast_meet_schedule` / injury status (§0.2/§0.3) is a real, separate
  build — sizing it is its own task, not covered by this doc
- Logo asset sourcing (§0.4) — where do ~87 team logos actually come from
