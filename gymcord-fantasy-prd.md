Product Requirements Document (PRD) Product Name: Gymcord Fantasy Product Type: Web-based Fantasy Sports Application Sport Focus: Women's NCAA Artistic Gymnastics

---

## Table of Contents

1. [Purpose & Vision](#1-purpose--vision)
2. [Current Season Context](#2-current-season-context)
3. [Target Users](#3-target-users)
   - 3.1 [League Definition & Structure](#31-league-definition--structure)
   - 3.2 [Trade Rules & Policies](#32-league-trade-rules--policies)
   - 3.3 [League Membership & Team Management](#33-league-membership--team-management)
4. [Key User Jobs](#4-key-user-jobs)
5. [Core User Flows](#5-core-user-flows)
6. [Visual Design & Developer Features](#6-visual-design--developer-features)
   - 6.1 [Account Switcher (Testing Only)](#61-account-switcher-testing-only)
   - 6.2 [Dark Mode](#62-dark-mode)
   - 6.3 [Light Mode](#63-light-mode)
7. [Navigation & Interface Structure](#7-navigation--interface-structure)
8. [Page-Level Requirements](#8-page-level-requirements)
   - 8.1 [Landing Page (Public)](#81-landing-page-public)
   - 8.2 [Lineups Page](#82-teams-page-lineups-view)
   - 8.3 [Analytics Page](#83-analytics-page)
   - 8.4 [Leaderboard Page](#84-league-page-leaderboard-view)
   - 8.5 [Lineup Page (Week 3)](#85-lineup-page-week-3)
   - 8.6 [Scores & History Page](#86-scores--history-page)
   - 8.7 [Trade Interface](#87-trade-interface)
   - 8.8 [Admin View](#88-admin-view)
9. [Trading System](#9-trading-system)
   - 9.0 [Gymnast Pool & Roster Management](#90-gymnast-pool--roster-management)
   - 9.1 [Trade System Overview](#91-trade-system-overview)
   - 9.2 [Manual Commissioner Trades](#92-manual-commissioner-trades-trade-option-1)
   - 9.3 [No Trades Allowed](#93-no-trades-allowed-trade-option-2)
   - 9.4 [Waiver Wire System](#94-waiver-wire-system-trade-option-3)
   - 9.5 [Trade Restrictions & Deadlines](#95-trade-restrictions--deadlines)
   - 9.6 [Trade History & Logging](#96-trade-history--logging)
10. [Scoring Rules & Logic](#10-scoring-rules--logic)
11. [Analytics Requirements](#11-analytics-requirements)
12. [Authentication & User Flow](#12-authentication--user-flow)
13. [Technical Considerations](#13-technical-considerations)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Testing Requirements](#15-testing-requirements)
16. [Phase 1 Priorities](#16-phase-1-priorities-in-progress)
17. [Out of Scope (Phase 1)](#17-out-of-scope-phase-1)
18. [Success Metrics](#18-success-metrics)
19. [Future Enhancements](#19-future-enhancements-post-phase-1)

---

1. Purpose & Vision Gymcord Fantasy enables gymnastics fans to compete in fantasy leagues using real NCAA women's gymnastics results. Users draft gymnasts, set weekly lineups, and compete against friends across the season.

The product prioritizes:

- Clarity over complexity  
- Trust in scoring  
- Fast lineup management  
- Insightful but lightweight analytics  
2. Current Season Context (Assumptions)  
- The season is underway.  
- Week 1 and Week 2 scores are finalized.  
- Users are currently setting lineups for Week 3\.  
- Default league configuration is 20 gymnasts per team, 10 up, 5 count (20g/10u5c).  
- Historical scores (Weeks 1–2) are immutable.  
- Week 3 lineups are editable until lineup lock.  
3. Target Users

Primary Users

- Gymnastics fans familiar with NCAA meets  
- Fantasy sports users (casual to intermediate)  
- Users participating in multiple leagues simultaneously

User Roles

- Player: Drafts teams, sets lineups, views rankings  
- League Commissioner: Creates leagues, manages league settings, executes manual trades  
- Admin: The Gymcord fantasy admins with elevated system privileges

3.1 League Definition & Structure

What is a League? A league is a competitive group where multiple users (players) each manage their own team by setting weekly lineups from their roster of gymnasts. All teams in a league compete against each other using the same scoring rules and roster configuration.

League Components:

- **League Settings**: Defined by commissioner during creation (roster size, scoring format, trade rules)  
- **Teams**: Each player in the league has one team with a unique name  
- **Rosters**: Each team has a roster of gymnasts (5-50 per league configuration)  
- **Weekly Lineups**: Each week, players select which gymnasts to "put up" from their roster  
- **Scoring**: Based on "X up, Y count" format where only the best Y scores count  
- **Standings**: Rankings based on cumulative season scores

League Roster Configuration:

Roster Size:

- Minimum: 5 gymnasts per team  
- Maximum: 50 gymnasts per team  
- Set by commissioner during league creation  
- All teams in a league must have the same roster size  
- Common configurations:  
  - Small leagues: 5-10 gymnasts (very strategic, every gymnast matters)  
  - Medium leagues: 15-25 gymnasts (balanced strategy and depth)  
  - Large leagues: 30-50 gymnasts (season-long, minimal weekly management)

"Up" and "Count" System:

**UP and COUNT apply per apparatus (VT, UB, BB, FX independently).** Each event is managed and scored as its own pool.

- **UP**: Maximum number of gymnasts selected per apparatus each week  
- **COUNT**: Number of top scores from each apparatus pool that count toward team total  
- UP ≥ COUNT (always)  
- UP ≤ Roster Size (always)  
- A gymnast can be placed "up" on multiple events; each event slot is independent

Default Configuration: 20 Gymnasts, 10 Up, 5 Count (20g/10u5c)

- Roster: 20 gymnasts  
- Weekly lineup: Select up to 10 gymnasts **per apparatus** (e.g., up to 10 on vault, up to 10 on bars, etc.)  
- Scoring: Top 5 scores per apparatus count; bottom 5 per apparatus are dropped  
- Team weekly score = top 5 VT scores + top 5 UB scores + top 5 BB scores + top 5 FX scores  
- A gymnast checked on both bars and beam contributes her bar score to the UB pool and her beam score to the BB pool independently

Other Common Configurations:

- 10g/10u5c: Every gymnast counts, no drops per apparatus (high strategy)  
- 25g/25u25c: Set once at season start, all scores count per apparatus  
- 15g/10u5c: Medium roster, strategic weekly selections per event  
- 30g/15u10c: Large roster with significant drops per apparatus  
- 50g/25u15c: Maximum depth league

Commissioner Configuration Options: During league creation, commissioner sets:

1. Total Roster Size (5-50)  
2. Number UP per apparatus per week (1-50, must be ≤ roster size)  
3. Number that COUNT per apparatus (1-50, must be ≤ UP)

Validation Rules:

- 5 ≤ Roster Size ≤ 50  
- 1 ≤ UP ≤ Roster Size  
- 1 ≤ COUNT ≤ UP  
- All teams in league have identical configuration

Strategic Implications:

- Higher UP/COUNT ratio = more strategy per apparatus (e.g., 10u5c drops half per event)  
- UP = COUNT = minimal weekly decisions (e.g., 25u25c)  
- Small rosters = every pick critical  
- Large rosters = depth insurance against injuries/byes  
- Specialists (single-event gymnasts) can be selected only on their event without "wasting" slots on others

3.2 League Trade Rules & Policies

Commissioners select ONE of three trade systems during league creation:

Trade Option 1: Manual Commissioner Trades How it works:

- Trading is enabled but controlled entirely by commissioner  
- Players cannot directly propose or execute trades  
- Players submit trade requests to commissioner (informal, outside app or via notes)  
- Commissioner manually executes trades on behalf of players  
- Commissioner has full discretion to approve/deny requests

Process:

1. Player contacts commissioner (email, message, etc.) with trade request  
2. Commissioner reviews request  
3. Commissioner uses "Manual Trade" interface in app  
4. Commissioner selects players/teams involved  
5. Commissioner selects gymnasts to swap  
6. Commissioner executes trade with reason/note  
7. Both teams' rosters immediately updated

Use Cases:

- Small leagues where commissioner knows all players  
- Leagues that want human oversight of all trades  
- Leagues with complex custom trade rules  
- Commissioner acts as "trade committee"

Advantages:

- Full control over trade fairness  
- Can enforce unwritten rules  
- Prevents collusion  
- Handles disputes immediately

Disadvantages:

- Slower trade processing  
- Dependent on commissioner availability  
- Commissioner workload increases

Trade Option 2: No Trades Allowed How it works:

- Trading is completely disabled for the league  
- Teams keep their initial roster all season  
- No gymnast movement between teams  
- Pure lineup optimization strategy

Process:

- N/A \- no trading interface shown  
- "Trading disabled in this league" message if users try to access

Use Cases:

- Very casual leagues  
- Draft-based leagues where roster integrity is key (future)  
- Leagues wanting to eliminate trade strategy entirely  
- Season-long commitment leagues

Advantages:

- Simplest to manage  
- No trade disputes  
- No collusion possible  
- Pure lineup optimization competition

Disadvantages:

- No ability to recover from bad draft/selection  
- Injuries more punishing  
- Less interactive/strategic

Trade Option 3: Waiver Wire System How it works:

- Automated trade system using waiver priority  
- Players submit "waiver claims" instead of direct trades  
- Claims processed at scheduled waiver time (e.g., Wednesday midnight)  
- Priority order determines who gets requested gymnasts  
- No direct player-to-player negotiation

Detailed Waiver Wire Process:

Step 1: Player Submits Waiver Claim Interface shows:

- "Gymnasts to Drop" section  
  - Select from current roster  
  - Must drop at least 1 gymnast  
  - Can drop multiple  
- "Gymnasts to Claim" section (priority ordered)  
  - Browse available gymnasts in pool  
  - Set priority order (1st choice, 2nd choice, etc.)  
  - Can claim multiple with preferences  
- "Submit Claim" button  
- Claims can be edited until waiver processing time

Example Claim:

- Drop: Gymnast A, Gymnast B  
- Claim (priority): 1st choice \= Gymnast X, 2nd choice \= Gymnast Y, 3rd choice \= Gymnast Z  
- System will try to get highest priority available

Step 2: Waiver Processing (Automated) Scheduled Time: Set by commissioner (e.g., "Every Wednesday at 11:59 PM ET")

Processing Order (Priority System): Commissioner chooses one of these priority methods during league setup:

a) **Inverse Standings** (Default)

- Last place team gets first priority  
- Second-to-last gets second priority  
- First place team gets last priority  
- Priority resets each week based on current standings  
- Encourages competitive balance

b) **Rolling Priority** (FAAB-style without bidding)

- Each team starts with same priority (random order)  
- After successful claim, team moves to back of priority line  
- Teams that don't make claims maintain priority  
- Creates strategic timing decisions

c) **Fixed Priority** (Draft order)

- Priority set at league start (based on draft order if applicable)  
- Never changes all season  
- Simple but less dynamic

d) **FAAB \- Free Agent Acquisition Budget** (Future)

- Each team has budget (e.g., $100)  
- Blind bidding on gymnasts  
- Highest bid wins  
- Out of scope Phase 1

Step 3: Claim Resolution For each gymnast being claimed:

1. System identifies all teams claiming that gymnast  
2. Awards to team with highest priority  
3. Removes dropped gymnast(s) from winner's roster  
4. Adds claimed gymnast to winner's roster  
5. Moves to next claim

Partial Claim Fulfillment:

- Team claims 3 gymnasts in priority order  
- If 1st choice unavailable, try 2nd choice  
- If 2nd choice unavailable, try 3rd choice  
- If none available, claim fails (no changes)

Multiple Drop/Add:

- If dropping 2 and claiming 2, both must succeed or neither processes  
- Atomic transaction \- all or nothing  
- Prevents roster size violations

Step 4: Notifications After processing:

- Email/notification to all teams with claim results  
- "Your claim for \[Gymnast X\] was successful\!"  
- "Your claim for \[Gymnast Y\] failed \- awarded to \[Team Name\]"  
- Updated rosters immediately visible

Waiver Wire Restrictions (Commissioner Configurable):

- Waiver processing day/time  
- Number of claims per week (unlimited default)  
- Minimum roster size maintenance  
- Same-team swaps only (optional)  
- Conference restrictions (optional)  
- Cannot drop gymnast who competed this week (optional)  
- Waiver claim deadline (e.g., 6 hours before processing)

Waiver Wire Interface Features:

- View all pending claims (own team only)  
- Cancel/edit claim before processing  
- See which gymnasts have pending claims (count only, not which teams)  
- Waiver order displayed (current priority)  
- Next waiver processing time countdown  
- Claim history log

Special Waiver Situations:

- Commissioner can process waivers manually (override schedule)  
- Commissioner can cancel specific claims if needed  
- If system error during processing, commissioner can manually resolve  
- Admin can edit scheduled waiver times

Trade Option Comparison Summary:

| Feature | Manual Commissioner | No Trades | Waiver Wire |
| :---- | :---- | :---- | :---- |
| Player control | Low | None | Medium |
| Commissioner workload | High | None | Low |
| Processing speed | Variable | N/A | Scheduled |
| Strategic depth | Medium | Low | High |
| Trade disputes | Minimal | None | Minimal |
| Collusion risk | Low | None | None |
| Best for | Small leagues | Casual | Competitive |

Changing Trade Rules Mid-Season:

- Not allowed in Phase 1  
- Trade rules locked after league creation  
- Future: May allow commissioner to modify before Week 1 starts  
- Prevents unfair advantage changes

3.3 League Membership & Team Management

League Size:

- Minimum: 2 teams (1v1 league)  
- Maximum: 50 teams  
- Recommended: 6-12 teams for competitive balance  
- No limit on number of leagues a user can join (subject to tier limits)

Team Naming:

- Each player must name their team when joining league  
- Unique within league (no duplicate names)  
- Max 30 characters  
- Can be changed by player at any time (Phase 1\)  
- Commissioner can force team rename if inappropriate

Team Roster Ownership:

- Each team owns their roster independently  
- Can view other teams' full rosters at any time; cannot see which gymnasts are put up until lineup lock  
- Each gymnast can only be on one team in a league — exclusive pool is the only supported model

League Standings & Rankings:

- Based on cumulative season points  
- Weekly scores aggregate to season total  
- Tiebreaker rules apply (see Section 10.4)  
- Live updates throughout weekend (future)  
- Historical weekly rankings preserved  
4. Key User Jobs  
- Quickly understand how my teams are doing  
- Easily set lineups before deadlines  
- Trade current league gymnasts for those in the fantasy pool  
- Create a new league and customize how many gymnasts up, how many count, trading rules  
- See how individual gymnasts are contributing  
- Compare performance across leagues  
- Trust that scoring is accurate and transparent  
- Review actual vs max score potential for past weeks  
- Set lineups for multiple future weeks at once  
5. Core User Flows  
- User logs in → sees Homepage with rankings & insights  
- User clicks a league → views standings and weekly results  
- User sets or edits Week 3 lineup  
- User reviews historical scores from Weeks 1–2  
- User checks analytics (most drafted gymnast, top scorer, etc.)  
- User creates a league  
- User joins a league  
- User purchases more leagues if they have more than 5  
- User proposes or executes trades  
- Commissioner reviews and approves/denies trades  
- Commissioner manually executes trades on behalf of league members  
6. Visual Design & Developer Features

6.1 Account Switcher (Testing Only) Purpose: Enable rapid testing of different user states and permissions without multiple logins

Location: Top right corner of interface

User States Available:

1. New User (Week 1\)  
     
   - No leagues joined  
   - No lineups set  
   - Sees onboarding flow  
   - Can create or join leagues

   

2. Active Player (Week 3\)  
     
   - Member of multiple leagues  
   - Has Weeks 1–2 history  
   - Currently setting Week 3 lineups  
   - Can view analytics and standings

   

3. League Commissioner (Week 3\)  
     
   - Same as Active Player PLUS  
   - Can execute manual trades  
   - Can modify league settings  
   - Can view admin panels

Implementation Notes:

- Only visible in development/testing environments  
- Persists selected user state across page navigation  
- Clearly labeled to prevent confusion with production features  
- Includes visual indicator showing which test user is active

6.2 Dark Mode Purpose: Provide comfortable viewing experience in low-light conditions and user preference

Requirements:

- System-level toggle in top right corner (alongside account switcher in testing)  
- Persists user preference across sessions  
- Applies to all pages and components  
- Maintains sufficient contrast for accessibility (WCAG AA minimum)  
- Smooth transition between light and dark modes

Color Palette Considerations:

- Dark backgrounds should not be pure black (\#000000)  
- Use appropriate contrast ratios for text readability  
- Adjust colors for charts, analytics visualizations  
- Maintain brand identity across both modes

Score State Colors (Dark Mode):

- Score Counted (Top Z): Bright Green (\#10B981 or \#22C55E)  
- Missed Opportunity: Bright Orange (\#F59E0B or \#FB923C)  
- Was Up, Didn't Count: Light Blue-Gray (\#64748B or \#94A3B8)  
- Not Up, Too Low: Medium Gray (\#475569 or \#64748B)  
- Note: Slightly brighter than light mode for visibility on dark background

6.3 Light Mode Purpose: Default viewing mode for general use and bright environments

Requirements:

- Default mode for new users (unless system preference detected)  
- Same toggle as dark mode \- switches between the two  
- All pages and components support light mode  
- Maintains WCAG AA accessibility standards  
- Smooth transition when switching modes

Color Palette Specifications:

Primary Colors (Light Mode):

- Accent/Primary: Cyan/Teal (\#00B8D4 or \#00ACC1)  
  - Slightly darker than dark mode to maintain visibility  
- Background (Primary): Off-white (\#F8F9FA or \#FAFBFC)  
  - Not pure white to reduce eye strain  
- Background (Secondary/Cards): White (\#FFFFFF)  
- Surface/Panel: Light gray (\#F3F4F6)

Text Colors (Light Mode):

- Text (Primary): Near-black (\#1F2937)  
- Text (Secondary): Medium gray (\#6B7280)  
- Text (Tertiary/Disabled): Light gray (\#9CA3AF)  
- Link: Teal (\#0891B2)  
- Link (Hover): Darker teal (\#0E7490)

UI Element Colors (Light Mode):

- Border: Light gray (\#E5E7EB)  
- Border (Focus): Accent teal (\#00ACC1)  
- Hover Background: Very light gray (\#F9FAFB)  
- Active Background: Light teal tint (\#E0F2F1)  
- Disabled: Light gray (\#D1D5DB) with 50% opacity

Status Colors (Light Mode):

- Success: Green (\#10B981)  
- Warning: Orange (\#F59E0B)  
- Error: Red (\#EF4444)  
- Info: Blue (\#3B82F6)  
- Neutral: Gray (\#6B7280)

Score State Colors (Light Mode):

- Score Counted (Top Z): Green (\#10B981) \- "Was up, counted"  
- Missed Opportunity: Orange/Amber (\#F59E0B) \- "NOT up, would have counted"  
- Was Up, Didn't Count: Dark Blue-Gray (\#64748B) \- "Was up, didn't count"  
- Not Up, Too Low: Very Dark Gray (\#475569) \- "NOT up, too low"

Chart & Data Visualization (Light Mode):

- Line colors: Bright, saturated colors for contrast  
- Background: White or very light gray  
- Grid lines: Light gray (\#E5E7EB)  
- Labels: Dark gray (\#374151)  
- Hover highlights: Darker shades of primary colors

Interactive Elements (Light Mode):

- Buttons (Primary): Teal background (\#00ACC1), white text  
- Buttons (Secondary): White background, teal border and text  
- Buttons (Tertiary): Transparent, teal text  
- Inputs: White background, gray border  
- Inputs (Focus): White background, teal border  
- Dropdowns: White background, subtle shadow  
- Cards: White background, light gray border or subtle shadow

Navigation (Light Mode):

- Active tab: Teal background, white text  
- Inactive tab: Light gray background, dark text  
- Hover tab: Slightly darker gray background

Mode Toggle Specifications:

- Location: Top right corner (near account switcher if testing)  
- Icon: Sun (☀️) when in light mode, Moon (🌙) when in dark mode  
- Behavior: Click to toggle between modes  
- Animation: Smooth fade transition (200-300ms)  
- Persistence: Saves to localStorage and user preferences

6.4 System Preference Detection

- On first visit, detect user's OS/browser color scheme preference  
- If prefers-color-scheme: dark → Load in dark mode  
- If prefers-color-scheme: light → Load in light mode  
- User can override with manual toggle  
- Manual toggle takes precedence over system preference

6.5 Mode-Specific Assets Some visual assets may need light/dark variants:

- Logo: May need inverted colors  
- Illustrations: Adjust colors for readability  
- Photos: No adjustment needed  
- Icons: Use appropriate color fill

Asset Loading:

- Load appropriate version based on current mode  
- Swap assets when mode changes  
- Cache both versions for smooth switching

6.6 Accessibility Considerations for Both Modes

- Contrast ratio 4.5:1 minimum for normal text (WCAG AA)  
- Contrast ratio 3:1 minimum for large text and UI components  
- Color not used as only means of conveying information  
- Focus indicators visible in both modes  
- All text readable in both modes

Testing Requirements:

- Test all pages in both light and dark modes  
- Verify smooth transitions  
- Check all interactive states (hover, focus, active, disabled)  
- Validate contrast ratios with tools  
- Test on different displays (calibrated, uncalibrated, various brightness)

6.7 Future Enhancements

- Auto-switch based on time of day  
- Custom theme colors (accent color picker)  
- High contrast mode for accessibility  
- Sepia/reading mode  
- Per-league theme customization  

6.8 Feedback & Bug Report Button

Purpose: Give any user a fast way to flag a bug or send feedback without leaving the page, and give admins the page context for free instead of having to ask "where did this happen?"

Requirements:

- Persistent floating button, bottom-right corner, visible on every page — logged in or logged out
- Clicking opens a modal with a single message field (no category picker in Phase 1 — keep it fast)
- The current page path is captured automatically (not typed by the user) and shown in the modal so the submitter can see what's being logged
- Submits to an admin-visible feedback log (see 8.8 Admin View) storing: submitting user (if logged in), page path, message, timestamp, status (new/reviewed/resolved)
- No login required to submit — logged-out submissions (e.g. from the Landing or Login page) are stored with a null user

7. Navigation & Interface Structure

7.1 Primary Navigation Purpose: Provide consistent access to core application features across all pages

Location: Top of page, horizontal layout

Navigation Items (Left to Right):

1. Lineups (icon: people/users icon)  
     
   - Default active state for main view  
   - Shows current week's lineup management

   

2. Leaderboard (icon: trophy icon)  
     
   - League standings and rankings view  
   - Shows current league context

   

3. Trades (icon: swap/exchange icon)  
     
   - Trade interface and history  
   - Indicates pending trades (optional badge)

   

4. Analytics (icon: chart/graph icon)  
     
   - User analytics and insights dashboard

Visual Design:

- Pills/rounded rectangle buttons with icons and labels  
- Active state: Highlighted background (darker/lighter depending on mode)  
- Inactive state: Subtle border with transparent/semi-transparent background  
- Hover state: Slight background change  
- Icons positioned to left of text labels  
- Consistent spacing between navigation items  
- Responsive: May collapse to icon-only on mobile

7.2 Contextual Navigation Elements

Team/League Selector

- Location: Below primary navigation, left side  
- Format: Dropdown selector with current selection displayed  
- Example: "Precision Flyers in Elite Squad League" with chevron icon  
- Functionality:  
  - Click to reveal dropdown of all user's teams across leagues  
  - Shows team name and league name  
  - Updates all page content when selection changes  
  - Persists selection across navigation within app

Week Navigation

- Location: Below primary navigation, center of page  
- Format: Week indicator with navigation arrows  
- Components:  
  - Left arrow button (previous week)  
  - Week number display (e.g., "Week 3")  
  - "Current" badge when viewing current week  
  - Right arrow button (next week)  
- Behavior:  
  - Arrows navigate between weeks  
  - Current week badge only appears on current week  
  - Past weeks show as locked/historical  
  - Future weeks show as editable (if lineup setting enabled)  
- Visual Design:  
  - Center-aligned  
  - "Current" badge in accent color (cyan/teal)  
  - Navigation arrows in circular/rounded square buttons  
  - Week number prominently displayed

Additional Navigation Controls

- New Team button (Lineups page only)  
    
  - Location: Top right corner  
  - Format: "+ New Team" button in accent color  
  - Action: Opens team creation/league join flow


- Clear All button (Lineups page only)  
    
  - Location: Bottom right of lineup area  
  - Format: Text button in accent color  
  - Action: Clears all current lineup selections  
  - Confirmation dialog before executing


- Score Display Toggle (Lineups page only)  
    
  - Location: Below lineup management area, left side  
  - Format: "Show: \[Avg\] \[High\] \[Last\]" button group  
  - Default: "Avg" selected  
  - Behavior: Toggles which score metric displays for each gymnast

7.3 Page-Specific Header Patterns

Lineups Page Header:

- Primary navigation (Lineups active)  
- Team/League selector (left)  
- Week navigation (center)  
- New Team button (right)

Leaderboard Page Header:

- Primary navigation (Leaderboard active)  
- Team/League selector (left)  
- Week navigation (center)  
- No additional buttons

Trades Page Header:

- Primary navigation (Trades active)  
- Team/League selector (left)  
- Week navigation (center)  
- May include "Propose Trade" button (right) when feature is active

Analytics Page Header:

- Primary navigation (Analytics active)  
- No team selector (shows all teams)  
- No week navigation (shows season-long data)  
- Optional filter controls

7.4 Responsive Navigation Behavior

- Desktop (\>1024px): Full navigation with icons and labels  
- Tablet (768px-1024px): Full navigation, may reduce spacing  
- Mobile (\<768px):  
  - Primary navigation may become bottom tab bar  
  - Team selector may become full-width dropdown  
  - Week navigation remains centered but may reduce size  
  - Action buttons may move to floating action button pattern

7.5 Navigation State Management

Active State Rules:

- Only one primary navigation item active at a time  
- Active state persists during page navigation  
- Team/league selector always shows current context  
- Week navigation always reflects current viewed week

Context Preservation:

- Selected team/league persists across primary navigation  
- Week selection persists when switching between Lineups/Leaderboard  
- Trades may default to current week or show all  
- Analytics shows season-long data regardless of week

URL Structure (Recommended):

- `/lineups?team={teamId}&week={weekNumber}`  
- `/leaderboard?league={leagueId}&week={weekNumber}`  
- `/trades?league={leagueId}`  
- `/analytics?user={userId}`

Navigation Edge Cases:

- If user has only one team: Team selector may be hidden or read-only  
- If viewing past week: Lock indicator visible, navigation limited  
- If user is not in any leagues: Show onboarding/join league flow  
- If user has exceeded league limit: Show upgrade prompt

7.6 Visual Design System

Color Palette:

- Accent/Primary: Cyan/Teal (\#00D9FF or similar)  
- Background (Dark): Near-black (\#0A0E14 or similar)  
- Surface (Dark): Dark gray (\#1A1F2E or similar)  
- Text (Primary): White (\#FFFFFF)  
- Text (Secondary): Light gray (\#A0AEC0 or similar)  
- Success: Green  
- Warning: Yellow/Orange  
- Error: Red

Interactive Elements:

- Buttons: Rounded corners (6-8px radius)  
- Pills/Navigation: Larger radius (16-24px)  
- Hover states: Slight opacity or background change  
- Active states: Solid background fill with accent color  
- Disabled states: Reduced opacity (40-50%)

Typography:

- Headers: Bold, larger size  
- Navigation labels: Medium weight  
- Body text: Regular weight  
- Monospace for scores/numbers (optional)

Spacing:

- Consistent padding within elements  
- Clear visual hierarchy  
- Adequate touch targets (44px minimum on mobile)  
8. Page-Level Requirements

8.1 Landing Page (Public) Purpose: Provide a high-level view of how teams across Gymcord Fantasy are performing and encourage signups.

Key Features: Overview of:

- Top-ranked teams across all leagues  
- Current week indicator ("Lineups open for Week 3")  
- Explanation of how fantasy gymnastics works:  
  - Weekly lineups  
  - Event-based scoring

Call-to-action:

- "Sign up"  
- "Log in"

Data Displayed (Read-only):

- League name  
- Top teams and scores  
- Week 1 & Week 2 winning scores

8.2 Teams Page (Lineups View) Purpose: Allow users to set lineups and view past performances

Page Header:

- Primary navigation with "Lineups" active  
- Team/League selector showing current context  
- Week navigation centered  
- "New Team" button (top right)

Key Sections:

A. Lineup Management Interface

- Drag-and-drop instruction banner:  
  - "Drag and drop to reorder gymnasts. Your custom order will be saved automatically."  
  - Subtle background color to distinguish from main content  
  - Icon indicating drag functionality

B. Score Display Toggle

- Location: Below instruction banner, left aligned  
- Format: Button group with three options  
  - "Avg" (Average score)  
  - "High" (Highest score)  
  - "Last" (Last meet score)  
- Default: "Avg" selected  
- Visual: Selected option highlighted with accent color  
- Behavior: Changes score display for all gymnasts in lineup

C. Score Legend (Historical Weeks Only) Purpose: Help users understand what happened in past weeks

Display Conditions:

- Only shown when viewing past/completed weeks  
- Not shown for current week or future weeks  
- Appears below score toggle, above roster

Visual Design:

- Dark panel with rounded corners  
- Title: "Score Legend:"  
- Four score states displayed horizontally  
- Each state shows:  
  - Score badge with color  
  - Explanatory text  
  - Spacing between states

Score State 1: Was Up, Counted (Top Z)

- Badge Color: Green (\#10B981)  
- Score Display: Bright green badge with score (e.g., "9.90")  
- Text: "Was up, counted (top 5)"  
  - Note: "top 5" adjusts to league's COUNT number (top 5, top 10, etc.)  
- Meaning: Gymnast was in lineup AND score was in top Z counting scores  
- This is the best outcome \- score contributed to team total

Score State 2: NOT Up, Would Have Counted

- Badge Color: Orange/Amber (\#F59E0B)  
- Score Display: Orange badge with score (e.g., "9.90")  
- Text: "NOT up, would have counted"  
- Meaning: Gymnast was NOT in lineup, but if they had been, their score would have been high enough to count (top Z)  
- This represents a missed opportunity \- should have been in lineup

Score State 3: Was Up, Didn't Count (Ranks 6-10)

- Badge Color: Dark Blue/Gray (\#64748B)  
- Score Display: Dark gray-blue badge with score (e.g., "9.85")  
- Text: "Was up, didn't count (6–10)"  
  - Note: Range adjusts based on league settings (e.g., "6-10" for 10u5c, "11-15" for 15u10c)  
  - Shows which positions didn't count: (COUNT+1) to UP  
- Meaning: Gymnast was in lineup but score wasn't high enough to be in top Z  
- Score was dropped \- did not contribute to team total

Score State 4: NOT Up, Too Low

- Badge Color: Very Dark Gray (\#475569 or darker)  
- Score Display: Dark gray badge with score (e.g., "9.80")  
- Text: "NOT up, too low"  
- Meaning: Gymnast was NOT in lineup, and even if they had been, score wouldn't have counted (outside top Z)  
- Correct decision \- leaving them off lineup didn't hurt

Legend Layout:

Score Legend:

\[9.90\] Was up, counted (top 5\)    \[9.90\] NOT up, would have counted    \[9.85\] Was up, didn't count (6–10)    \[9.80\] NOT up, too low

Green                              Orange                                 Gray-Blue                             Dark Gray

Responsive Behavior:

- Desktop: All four states in one row  
- Tablet: Two rows of two states each  
- Mobile: Stacked vertically, one state per row

Interactive Elements:

- Hover over legend item: Highlights all gymnasts in roster with that state  
- Optional: Click to filter roster to show only that state

Usage in Roster Display:

- Each gymnast card shows their score with appropriate color  
- Score badge matches legend colors exactly  
- Tooltip on score badge repeats the state description  
- Helps users quickly see:  
  - Which gymnasts contributed (green)  
  - Which opportunities were missed (orange)  
  - Which selections didn't pan out (gray-blue)  
  - Which correctly stayed on bench (dark gray)

Analytics Integration:

- Aggregate legend statistics:  
  - "X gymnasts counted this week"  
  - "Y missed opportunities (would have counted)"  
  - "Z correct non-selections"  
- Helps user learn and improve lineup decisions

D. Lineup Clear Control

- Location: Opposite side from score toggle (right aligned)  
- Format: "Clear All" button  
- Action: Removes all gymnasts from current week's lineup  
- Requires confirmation before executing  
- Visual: Accent color to make discoverable

D. Lineup Roster Display & Selection

Inspiration: Matrix-style layout with gymnasts as rows and apparatus as columns

Page Layout Structure:

Top Controls Row:

- Left: "Import Last Week" button (rounded, outlined style)  
- Right: Score Display Toggle (3-way pill toggle)  
  - Options: "AVG" | "HIGH" | "PREV"  
  - Default: "AVG" selected  
  - Active option: Purple/accent background  
  - Inactive options: Dark/transparent background  
  - Smooth slide animation between selections

Primary Layout: Matrix/Table View

Column Headers (Fixed at top):

- Column 1: "GYMNAST" (left-aligned, \~200-250px wide)  
- Column 2: "VAULT" (centered, \~180-220px wide)  
- Column 3: "BARS" (centered, \~180-220px wide)  
- Column 4: "BEAM" (centered, \~180-220px wide)  
- Column 5: "FLOOR" (centered, \~180-220px wide)

Each apparatus column header shows:

- Apparatus name in accent color (cyan/green)  
- Selection counter below: "✓ 12 / 12" (with checkmark icon)  
  - Shows: \[checkmark icon\] \[selected count\] / \[total needed\]  
  - Example: "✓ 12 / 12" means 12 out of 12 needed are selected  
  - Color-coded:  
    - Green when at target  
    - Yellow when close (within 1-2)  
    - White/gray when under target  
    - Red when over target

Gymnast Row Layout:

Row Structure (per gymnast):

- Full width row spanning all 5 columns  
- Hover state: Subtle background highlight on entire row  
- 60-80px tall per row

Column 1: Gymnast Info

- School logo (32-40px)  
  - Left-aligned  
  - Team colors  
  - Recognizable icons (UCLA, Oklahoma, Florida, etc.)  
- Gymnast Name (white text, bold, 14-16px)  
  - Right of logo  
  - Example: "Mika Webster-Longin"  
- Status Icons (optional, right of name):  
  - Small icons: injury (red circle with "i"), bye week, etc.  
  - 12-16px size

Columns 2-5: Apparatus Score \+ Checkbox

Each apparatus cell contains:

Checkbox \+ Score Combo:

- Horizontal layout (checkbox left, score right)  
- Combined width: \~140-180px  
- Centered within apparatus column

Checkbox:

- Positioned on the left  
- Large circular checkbox (not toggle switch)  
- Size: 28-32px diameter  
- States:  
  - Unchecked: Gray border circle, empty center  
  - Checked: Purple/accent background with white checkmark  
  - Disabled: Grayed out (when gymnast doesn't compete event)  
  - Hover: Slight glow or border highlight

Score Value:

- Positioned immediately right of checkbox  
- Shows score based on toggle selection (AVG/HIGH/PREV)  
- Score display: "9.875" (3 decimal places, 14-16px font)  
- Color/style:  
  - Purple/Accent (\#8B5CF6 or similar): Gymnast competes this event  
  - Gray/Dark (\#374151 or similar): Gymnast does NOT compete this event (shows "—")  
  - For historical weeks: Use legend colors (green/orange/gray/dark)

Click Target (CRITICAL):

- Entire checkbox \+ score area is clickable (\~120-150px wide x 40px tall)  
- Not just the checkbox circle \- much larger hit area  
- Makes selection significantly easier  
- Visual feedback on hover over entire clickable area  
- Clicking anywhere in this zone toggles selection

Visual States by Event Availability:

- Competes Event: Purple score badge \+ active checkbox  
- Doesn't Compete: Gray score badge ("0.000") \+ disabled gray checkbox  
- Selected: Purple score badge \+ purple checkbox with checkmark  
- Not Selected: Purple score badge \+ empty circle checkbox

Example Row Visualization:

\[UCLA Logo\] Mika Webster-Longin    \[0.000\]\[○\]  \[0.000\]\[○\]  \[0.000\]\[○\]  \[0.000\]\[○\]

                                    Gray        Gray        Gray        Gray

                                    

\[OU Logo\]   Danae Fletcher (\!)     \[0.000\]\[○\]  \[0.000\]\[○\]  \[0.000\]\[○\]  \[0.000\]\[○\]

                                    Gray        Gray        Gray        Gray

                                    

\[UCLA Logo\] Tiana Sumanasekera     \[9.875\]\[✓\]  \[9.825\]\[✓\]  \[9.800\]\[✓\]  \[9.925\]\[✓\]

                                    Purple      Purple      Purple      Purple

                                    Selected    Selected    Selected    Selected

                                    

\[Mizzou\]    Kimarra Echols         \[9.800\]\[○\]  \[9.925\]\[○\]  \[0.000\]\[○\]  \[9.600\]\[✓\]

                                    Purple      Purple      Gray        Purple

                                    Available   Available   N/A         Selected

Hover Tooltip (Rollover): Triggered by: Hovering over gymnast name OR score badge

Tooltip Position:

- Appears near cursor or above/beside hovered element  
- Auto-positions to stay within viewport  
- 280-320px wide  
- Smooth fade-in (150ms)

Tooltip Content:

Header Section:

- Gymnast Name (bold, larger text)  
- School Name \+ Logo  
- Year/Class (FR, SO, JR, SR, 5TH)

This Week's Meet Section:

- Event: \[Apparatus Name\] (e.g., "Floor Exercise")  
- Venue:  
  - 🏠 "Home vs \[Opponent\]" (green text) OR  
  - ✈️ "Away @ \[Opponent\]" (blue text)  
- Date & Time: "Friday, Feb 14, 7:00 PM PT"  
- Meet Format: "Dual Meet" (or Tri/Quad)

Season Stats Section (for hovered apparatus):

- Average: 9.925  
- High: 9.975 (with date: "Jan 12")  
- Last: 9.900 (with date: "Feb 7")  
- NQS: 9.938 (if applicable)  
- Meets Competed: 8

Recent Performance:

- Mini trend indicator: "↗️ Trending up" or "↘️ Trending down"  
- 3-meet rolling average (optional)  
- Consistency note: "Very consistent" or "Variable scores"

Status Notes (if applicable):

- "Day-to-day injury \- game time decision"  
- "First meet back from injury"  
- "Season debut"  
- "Competing twice this week"

Example Tooltip:

Tiana Sumanasekera

UCLA • Junior

This Week \- Floor Exercise:

🏠 Home vs Arizona State

Saturday, Feb 15, 7:00 PM PT

Dual Meet

Season Stats (FX):

Average: 9.925

High: 9.975 (Jan 12\)

Last: 9.900 (Feb 7\)

NQS: 9.938

Meets: 8

Recent: ↗️ Trending up

Very consistent performer

Tooltip Design:

- Dark background (\#1F2937) with slight transparency in dark mode  
- White background with shadow in light mode  
- 8-12px padding  
- Rounded corners (8px)  
- Dividing lines between sections  
- Icons in accent colors

Selection Behavior & Logic:

Per-Apparatus Counting:

- Each apparatus tracks selections independently  
- Counter shows: "✓ 12 / 12" per apparatus  
- No per-apparatus limit enforced (Phase 1\)  
- Per-apparatus limit: Each apparatus column allows up to UP selections independently  
  - Example: For 10u5c, can select up to 10 gymnasts on vault, up to 10 on bars, up to 10 on beam, up to 10 on floor  
  - A gymnast checked on vault AND floor occupies one slot in each apparatus pool  
  - No global cross-apparatus cap

Selection Flow:

1. User clicks checkbox (or entire score badge \+ checkbox area)  
2. Checkbox toggles (empty ○ ↔ filled ✓)  
3. Score badge may update appearance (optional: selected glow)  
4. Counters update in real-time:  
   - Apparatus counter: "✓ 5 / 12"  
   - Global counter (if shown): "Total: 9 of 10"  
5. Visual feedback: Smooth animation

Limit Enforcement:

- When global UP limit reached (e.g., 10 selected):  
  - All unchecked boxes become disabled  
  - Hover shows message: "Limit reached. Uncheck another gymnast first."  
  - Attempting to click shows error message  
  - Must uncheck existing selection to select new one  
- No limit on unchecking (can always remove selections)

Validation Warnings (shown above matrix):

- Banner: "3 gymnasts on bye this week" (yellow)  
- Banner: "2 gymnasts injured \- may not compete" (orange)  
- Banner: "Only 8 of 10 selected" (info, if under limit)

Score Display Toggle Behavior:

AVG (Average):

- Shows season average score per apparatus  
- Most commonly used  
- Helps predict expected performance

HIGH (High Score):

- Shows season-best score per apparatus  
- Useful for seeing ceiling/potential  
- May be optimistic

PREV (Previous):

- Shows most recent meet score per apparatus  
- Useful for seeing current form  
- Most recent data point

Toggle changes all score badges simultaneously:

- Smooth transition (no flash)  
- Scores update across entire matrix  
- Selection states remain unchanged  
- Counter values unchanged

Matrix Features:

Sorting Options (dropdown or buttons above matrix):

- Sort by: Name (A-Z) \[default\]  
- Sort by: School (grouped)  
- Sort by: Average Score (high to low)  
- Sort by: Selected First (checked items at top)

Filtering Options:

- Filter by School: Multi-select dropdown  
- Filter by Status: All | Competing | Bye | Injured  
- Show: All | Selected Only | Available Only

Search:

- Search bar above matrix  
- Searches gymnast names  
- Real-time filtering  
- Results highlight in matrix

School Logo Requirements:

- Consistent size: 32-40px  
- High contrast for dark mode  
- Recognizable team branding  
- Alt text for accessibility  
- Fallback: School initials if logo unavailable

Apparatus Column Behavior:

Column Width:

- Fixed width per apparatus (\~180-220px)  
- All apparatus columns equal width  
- Responsive: May stack or scroll on mobile

Column Scrolling:

- If many gymnasts, vertical scroll within matrix  
- Headers remain fixed at top (sticky)  
- Smooth scrolling behavior

Mobile Responsive:

Desktop (\>1024px):

- Full 5-column matrix visible  
- All apparatus shown simultaneously

Tablet (768-1024px):

- May require horizontal scroll  
- Or show 3 columns at a time with scroll  
- Headers remain visible

Mobile (\<768px):

- Switch to tabbed view or accordion  
- One apparatus at a time  
- Swipe between apparatus  
- Gymnast name column always visible  
- Or: Full matrix with horizontal \+ vertical scroll

Historical View (Past Weeks):

When viewing locked weeks, the matrix transforms to show performance analysis:

Page Title:

- "Athlete Roster" (instead of "Set Lineup")  
- Or "Week \[X\] Results"  
- Clearly indicates this is a historical, read-only view

Score Legend (at top, before matrix):

- Same legend as specified in Section 8.2.C  
- Four color-coded states with examples:  
  - **Green badge (\#10B981)**: "9.90" \- "Was up, counted (top 5)"  
  - **Orange badge (\#F59E0B)**: "9.90" \- "NOT up, would have counted"  
  - **Blue-Gray badge (\#64748B)**: "9.85" \- "Was up, didn't count (6th-10th)"  
  - **Dark Gray badge (\#475569)**: "9.80" \- "NOT up, too low"

Matrix Changes for Historical View:

Column Headers: Each apparatus column shows:

- Apparatus name (VT, UB, BB, FX)  
- Selection count achieved: "12/10" (what was selected vs what was needed)  
  - Shows actual selections made  
  - Example: "12/10" means 12 were selected (all competed), 10 was the limit  
  - Example: "15/10" for different league configs  
- **Aggregate score per apparatus** (new row below header):  
  - Shows total points contributed from that apparatus  
  - Example: "49.600" under VT, "49.625" under UB, etc.  
  - Color: Accent color (cyan)  
  - Helps see which apparatus contributed most

Gymnast Row Changes:

Checkboxes Removed:

- No checkboxes shown (selections are finalized)  
- No interaction possible (read-only)

Score Badges \- Color Coded by State:

State 1: Was Up, Counted (Green)

- **Green badge** (\#10B981 or \#22C55E)  
- Bold, bright green  
- Shows actual score achieved  
- Example: "9.900" or "9.925"  
- This score contributed to team total

State 2: NOT Up, Would Have Counted (Orange)

- **Orange badge** (\#F59E0B or \#FB923C)  
- Shows actual score achieved  
- Example: "9.900"  
- Indicates missed opportunity \- should have been selected  
- This score would have been in top Z if selected

State 3: Was Up, Didn't Count (Blue-Gray)

- **Blue-Gray badge** (\#64748B or \#94A3B8)  
- Shows actual score achieved  
- Example: "9.850"  
- Was selected but score not in top Z  
- Score was dropped \- didn't contribute

State 4: NOT Up, Too Low (Dark Gray)

- **Very Dark Gray badge** (\#475569 or \#1F2937)  
- Shows actual score achieved  
- Example: "9.800"  
- Wasn't selected and score wouldn't have counted anyway  
- Correct decision \- no impact on team

State 5: Did Not Compete (Dash)

- **No badge, just dash** "—"  
- Gymnast didn't compete this event/week  
- May have been injured, scratched, or doesn't compete event  
- Gray text color

Example Row Visualization (Historical):

ATHLETE NAME        VT          UB          BB          FX

Haleigh Bryant     \[9.900\]     \[9.850\]     \[9.925\]     \[9.975\]

LSU                Green       Blue-Gray   Green       Green

Aleah Finnegan     \[9.850\]     \[9.925\]     \[9.850\]     \[9.900\]

LSU                Blue-Gray   Green       Blue-Gray   Dark Gray

Olivia Dunne       —           \[9.800\]     —           \[9.850\]

LSU                           Dark Gray                 Dark Gray

Jordan Chiles      \[9.925\]     \[9.825\]     \[9.900\]     \[9.950\]

UCLA               Green       Blue-Gray   Green       Green

Row-Level Information:

Drag Handle (Left):

- Small drag icon (⋮⋮) in gray  
- Non-functional in historical view (just visual consistency)  
- Or completely hidden in historical view

Gymnast Name & School:

- Same as lineup view  
- Name in white, bold  
- School name below in gray  
- No status icons needed (week is complete)

Additional Visual Indicators (Optional):

Badge Overlays:

- Small badge in corner of score: "C" for Counted, "D" for Dropped  
- Or checkmark (✓) for counted, X for dropped  
- Subtle, doesn't overpower score

Counting Position Indicator:

- Small number showing position: "1st", "5th", "6th", etc.  
- Helps understand ranking  
- Example: "9.925 (2nd)" means 2nd-highest score

Aggregate Statistics (Bottom of Matrix):

Team Total Row:

- Bold row at bottom  
- Shows totals per apparatus  
- Shows overall team score  
- Example:  
    
  TEAM TOTAL        49.600      49.625      49.625      49.750  
    
  OVERALL SCORE: 198.600  
    
  RANK: 3rd of 10 teams

Performance Analysis Section (Below Matrix):

Summary Stats:

- "Top 5 Scores Counted" (or whatever Z count is)  
- "5 Scores Dropped"  
- "Actual Score: 198.600"  
- "Maximum Possible: 201.250" (if optimal selections made)  
- "Efficiency: 98.7%" (actual / max possible)

Event Breakdown:

- Table showing:  
  - Event  
  - Gymnasts Up  
  - Top Score Counted  
  - Scores Dropped  
  - Event Total  
- Example:  
    
  VT: 12 up → Top 5 counted (9.925, 9.900, 9.900, 9.875, 9.850) \= 49.600  
    
      Dropped: 9.850, 9.825, 9.800, 9.775, 9.750, 9.700, 9.650

Opportunities Missed:

- List of gymnasts who weren't up but would have counted  
- Helps user learn for future weeks  
- Example:  
    
  Missed Opportunities:  
    
  \- Olivia Dunne (UB): 9.900 \- Would have been 3rd highest  
    
  \- Sierra Brooks (BB): 9.875 \- Would have been 5th highest  
    
  If selected optimally: \+0.75 points

Hover Tooltips (Historical):

Tooltip Content (when hovering score badge):

- Gymnast Name & School  
- Event name  
- Meet Information:  
  - Opponent faced  
  - Home/Away  
  - Date & time  
  - Meet format  
- Score Details:  
  - Actual score: 9.925  
  - Rank: 2nd of 5 counting scores  
  - Status: "Counted toward team total" or "Dropped"  
  - Position: "2nd highest on VT this week"  
- Comparison:  
  - Expected (avg): 9.900  
  - Difference: \+0.025 (performed better)  
  - Trend: "Scored above average"

Example Tooltip:

Jordan Chiles

UCLA

Week 3 \- Vault

vs Utah (Home)

Saturday, Feb 15, 7:00 PM PT

Score: 9.925 ✓ Counted

Rank: 1st of 5 counting scores

Highest vault score this week

Expected (Avg): 9.900

Actual: 9.925

Difference: \+0.025

Performance: Above average

Navigation in Historical View:

Week Selector:

- Arrows to move between weeks  
- Dropdown to jump to specific week  
- "Current Week" button to return to lineup setting

Compare Weeks:

- Optional: Split screen comparing two weeks  
- Side-by-side matrix view  
- Highlights differences in selections

Export Options:

- "Export Week Results" button  
- Downloads CSV or PDF of week performance  
- Includes all scores, states, and statistics

Learning Insights (Optional Future):

AI Suggestions:

- "Next time, consider selecting \[Gymnast\] on \[Event\]"  
- "Your VT selections were optimal"  
- "BB selections cost you 0.5 points"  
- Learning from historical data

Pattern Recognition:

- "You tend to under-select from \[School\]"  
- "Your averages are accurate for predicting performance"  
- "Home meets are weighted too heavily in your selections"

Mobile Responsive (Historical):

Desktop:

- Full matrix with all apparatus visible  
- Legend at top  
- Aggregate stats at bottom

Tablet:

- Horizontal scroll for apparatus  
- Legend remains visible (sticky)

Mobile:

- Stacked view or tabs per apparatus  
- Legend accessible via toggle  
- Aggregate stats accessible via scroll or separate tab

Accessibility (Historical):

Screen Reader Announcements:

- "Viewing Week 3 results, read-only"  
- Each score announces: "Jordan Chiles, Vault, 9.925, counted, 1st place"  
- Legend items explained: "Green badges indicate scores that counted"

Keyboard Navigation:

- Tab through scores  
- Arrow keys to navigate matrix  
- No checkbox interactions (read-only)

Visual Clarity:

- High contrast colors for state differentiation  
- Not relying on color alone (legend provides text)  
- Patterns or textures in addition to colors (for color-blind users)

Save & Auto-Save:

Save Button:

- Sticky at bottom: "Save Lineup"  
- Shows count: "Saving 10 selections"  
- Success message on save  
- Timestamp of last save

Auto-Save (Optional):

- Save after each selection change  
- Debounced (wait 1-2 seconds after last change)  
- Visual indicator: "Auto-saved at 3:45 PM"  
- No explicit save button needed if auto-save enabled

Accessibility:

Keyboard Navigation:

- Tab through rows  
- Arrow keys to navigate between cells  
- Spacebar to toggle checkbox  
- Enter to toggle checkbox  
- Focus indicators on active cell

Screen Reader:

- Announces: "Tiana Sumanasekera, UCLA, Floor Exercise, 9.925 average, checkbox checked"  
- Counter changes announced  
- Error messages announced  
- Tooltip content readable

Touch Targets:

- Entire score badge \+ checkbox zone: \~120-150px x 40px  
- Well above 44x44px minimum  
- No precision required  
- Large hover/active areas

Color Accessibility:

- High contrast ratios (WCAG AA)  
- Don't rely on color alone  
- Icons \+ colors for status  
- Patterns for score states  
- Test with color blind simulators

E. Lineup Lock State Indicators

- Past weeks: "Locked" badge, no editing allowed  
- Current week: "Lineups Open" status, full editing  
- Future weeks: Editable if populate future weeks feature used  
- Lock deadline countdown (optional enhancement)

Enhanced Lineup Management Features:

- Set lineups for all remaining weeks  
    
  - "Populate All Future Weeks" button  
  - Useful for leagues where you don't need to optimize weekly  
  - Ensures no zero scores even if not optimal


- Athlete Status Icons:  
    
  - Bye week indicator  
  - Double meet indicator (competing twice in one week)  
  - Home meet indicator  
  - Away meet indicator  
  - Dual/Tri/Quad meet indicator  
  - Injured (short term) indicator  
  - Injured (long term) indicator  
  - Score counted in previous week indicator


- Enhanced Score Display Options:  
    
  - Previous meet score  
  - High score (season)  
  - Average score (season)  
  - Average home score  
  - Average away score  
  - NQS (National Qualifying Score)  
  - Rolling 3-meet average  
  - Sparkline visualizations showing performance over time (Google Sheets style)


- Lineup Status Indicator:  
    
  - Clear visual indicator when lineups are set/complete  
  - Warning for incomplete lineups

8.3 Analytics Page Purpose: Give users an immediate snapshot of how they're doing everywhere.

Page Layout:

- Primary navigation with "Analytics" active  
- No team selector (shows aggregate data across all teams)  
- No week navigation (shows season-long data)  
- Optional date range filter (future enhancement)

8.3.1 Page Structure: Three-Column Dashboard Layout

Layout:

- Top Section: Summary Cards (full width)  
- Middle Section: Interactive Visualizations (2/3 width left, 1/3 width right)  
- Bottom Section: Detailed Tables (full width)

8.3.2 Section A: League Rankings Overview Cards

Display as horizontal scrollable cards or stacked list:

Each League Card Shows:

- League Name (header, bold)  
- Team Name (subheader, in that league)  
- Current Rank Badge:  
  - Large number: "3rd" with ordinal  
  - Context: "of 10 teams"  
  - Color-coded by rank:  
    - 1st: Gold background  
    - 2nd: Silver background  
    - 3rd: Bronze background  
    - 4th+: Standard background  
- Key Metrics:  
  - Total Season Score: \[XXX.XX\] points (large, bold)  
  - Last Week Score: \[XX.XX\] points  
  - Weekly Change: "+2 places" or "-1 place" with arrow (↑↓)  
  - Week Status Indicator:  
    - "Week 3 \- Lineups Open" (green)  
    - "Week 3 \- Locked" (gray)  
    - "Week 4 \- Not Started" (blue)  
- Quick Actions:  
  - "Set Lineup" button (if lineups open)  
  - "View League" link

Empty State (No Leagues):

- "You're not in any leagues yet"  
- Illustration  
- "Create a League" button  
- "Join a League" button

8.3.3 Section B: User-Wide Analytics Insights

Layout: Grid of stat cards (2-3 columns depending on screen size)

Card 1: Most Drafted Gymnast Visual: Large athlete photo or icon Stats:

- Gymnast name (bold, large)  
- School name \+ logo  
- "Rostered in \[X\] of your \[Y\] leagues"  
- Progress bar showing league coverage  
- Season performance summary:  
  - Average score: X.XXX  
  - Total fantasy points contributed: XXX.XX  
- "View Details" link → Opens gymnast detail modal

Card 2: Highest Scoring Gymnast Visual: Large athlete photo with trophy icon overlay Stats:

- Gymnast name (bold, large)  
- School name \+ logo  
- "Total fantasy points: XXX.XX" (hero metric)  
- Event breakdown bar chart:  
  - VT: XX.XX points  
  - UB: XX.XX points  
  - BB: XX.XX points  
  - FX: XX.XX points  
- "Appears in \[X\] leagues"  
- Best single score: X.XXX

Card 3: Most Valuable Event Visual: Large event icon (VT/UB/BB/FX) Stats:

- Event name (e.g., "Floor Exercise")  
- Total points contributed: XXX.XX  
- Percentage of total points: XX%  
- Number of gymnasts competing this event: XX  
- Average score from this event: X.XXX  
- Donut chart showing event distribution:  
  - VT: XX%  
  - UB: XX%  
  - BB: XX%  
  - FX: XX%

Card 4: Season Performance Summary Visual: Trend graph Stats:

- Total points across all leagues: X,XXX.XX  
- Average weekly score: XXX.XX  
- Best week: Week X (XXX.XX points)  
- Most consistent team: \[Team Name\] in \[League\]  
- Line chart: Weekly scores across all teams overlaid

Card 5: Roster Diversity Visual: School logos Stats:

- Unique gymnasts rostered: XX  
- Schools represented: XX  
- Most common school: \[School Name\] (XX gymnasts)  
- Conference breakdown:  
  - SEC: XX gymnasts  
  - Big Ten: XX gymnasts  
  - Pac-12: XX gymnasts  
  - etc.

8.3.4 Section C: Weekly Performance Graph

Interactive Line Chart:

- X-axis: Week numbers (1, 2, 3, ..., 12\)  
- Y-axis: Fantasy points (0-500 scale)  
- One line per team (different colors)  
- Legend: Team names with league context  
- Hover tooltips: Show exact scores  
- Toggle Options:  
  - Show/Hide individual teams  
  - Overlay max possible score (dashed line)  
  - Overlay league average (dotted line)  
- Trend Line Toggle:  
  - Show linear regression trend for each team  
  - Helps visualize improvement/decline

Visual Enhancements:

- Highlight current week with vertical line  
- Markers on each data point  
- Smooth line curves  
- Color coordination with league cards

8.3.5 Section D: Individual Gymnast Consistency Metrics

Purpose: Deep-dive into individual athlete performance

Drill-Down View (Triggered from Most Drafted or Highest Scoring cards):

Gymnast Detail Modal:

- Header:  
    
  - Gymnast photo  
  - Name, school, year  
  - Social links (Road to Nationals profile)  
  - "Rostered in X leagues" badge


- Tab 1: Performance Stats  
    
  - Season average by event (table)  
  - Standard deviation by event  
  - Coefficient of variation  
  - High score and date  
  - Low score and date (excluding 0s)  
  - Number of meets competed  
  - Score distribution histogram


- Tab 2: Meet History  
    
  - Table showing all meets:  
    - Date  
    - Opponent/Meet name  
    - Events competed (icons)  
    - Scores per event  
    - Which score counted (if in your lineup)  
  - Sortable by date, score, event  
  - Filter by event


- Tab 3: Consistency Analysis (Similar to Road to Nationals)  
    
  - Consistency score (0-100)  
  - Event-by-event breakdown:  
    - VT consistency: XX/100  
    - UB consistency: XX/100  
    - BB consistency: XX/100  
    - FX consistency: XX/100  
  - Visual indicators (color-coded bars)  
  - Comparison to league average  
  - "Most consistent on: \[Event\]"  
  - "Least consistent on: \[Event\]"


- Tab 4: Fantasy Impact  
    
  - Total fantasy points contributed: XXX.XX  
  - Points by week (bar chart)  
  - Percentage of your teams' total scores  
  - Counting vs dropped scores ratio  
  - "This gymnast counted X out of Y weeks"  
  - Projected ROS (rest of season) value

Close Modal: X button or click outside

8.3.6 Section E: Detailed Performance Tables

Table 1: Gymnast Performance Comparison Columns:

- Rank (1, 2, 3...)  
- Gymnast Name  
- School  
- Leagues Rostered In (count)  
- Total Points Contributed  
- Average Score  
- Consistency Rating  
- Trend (↑↓→)  
- View Details link

Sortable by any column Filterable by:

- School  
- Event  
- League  
- Min/Max scores

Pagination: 25 per page

Table 2: Week-by-Week Team Performance Columns:

- Team Name (League)  
- Week 1  
- Week 2  
- Week 3  
- ... (up to current week)  
- Total  
- Rank  
- Trend

Expandable rows: Click to see which gymnasts scored that week Color-coded cells: Green for top score that week, gradient for others

8.3.7 Filtering & Customization Options

Global Filters (Top of Analytics Page):

- Date Range: "Season to Date" | "Last 4 Weeks" | "Custom"  
- Leagues: "All Leagues" | Select specific leagues (multi-select)  
- Event Focus: "All Events" | VT | UB | BB | FX

Save Views:

- "Save Current View" button  
- Names custom analytics dashboard configuration  
- Quick load from saved views dropdown

Export Options:

- "Export Analytics Report" button  
- Generates PDF summary of all analytics  
- Includes charts, tables, key insights  
- Option to schedule regular email reports (future)

8.3.8 Empty States & Progressive Loading

Loading State:

- Skeleton screens for cards  
- "Loading your analytics..." message  
- Shimmer effect on placeholders

Partial Data State:

- Show available data  
- Gray out unavailable sections  
- "Data available after Week 1 completes" messages

No Data State:

- "Not enough data yet"  
- Suggestion to set lineups  
- Link to lineup management

8.3.9 Mobile-Responsive Analytics

Desktop (\>1024px):

- Full dashboard layout as described  
- Multi-column grids

Tablet (768px-1024px):

- Two-column layouts  
- Stacked cards  
- Horizontally scrollable tables

Mobile (\<768px):

- Single column stack  
- Collapsible sections  
- Simplified charts (fewer data points)  
- Swipeable cards  
- "View Full Report" link to desktop version

8.4 League Page (Leaderboard View) Purpose: Provide detailed standings and weekly breakdowns for a single league.

Page Header:

- Primary navigation with "Leaderboard" active  
- Team/League selector showing current league context  
- Week navigation centered (for week-specific views)

Key Features:

League Metadata:

- League name displayed in team/league selector  
- Number of teams visible in table  
- Roster configuration display:  
  - "20 gymnasts, 10 up, 5 count" or  
  - "20g/10u5c" (compact notation)  
- Trade system: "Waiver Wire" / "Commissioner Trades" / "No Trades"  
- Displayed in league info panel or header

Standings Table: Columns (left to right):

1. RANK  
     
   - Numerical ranking (1, 2, 3, etc.)  
   - Updates based on total points  
   - Visual emphasis on user's own team

   

2. TEAM  
     
   - Team name  
   - Visual indicator for user's team (highlight/bold)  
   - Click to view team details

   

3. OWNER  
     
   - Username/display name  
   - Shows who owns each team

   

4. WEEK 3 (or current week)  
     
   - Points scored in displayed week  
   - Sortable column (indicated by down arrow)  
   - Default sort may be by this column  
   - Updates per week navigation

   

5. TOTAL POINTS  
     
   - Season-long cumulative score  
   - Primary ranking metric  
   - Bold or emphasized

   

6. WEEKLY CHANGE  
     
   - Change in ranking from previous week  
   - Up/down indicators with color coding  
   - Green for improvement, red for decline  
   - Optional: Show numerical change (+2, \-1, etc.)

   

7. VIEW TEAM  
     
   - Action button or link  
   - Opens detailed view of that team's lineup  
   - May show icon (eye icon or arrow)

Table Features:

- Sortable columns (click column header to sort)  
- Current sort indicated by arrow icon  
- Alternating row colors for readability (subtle)  
- User's own team highlighted  
- Responsive: May collapse to card view on mobile

Current Week Indicator:

- Shows "Week 3 – Lineups Open" or similar  
- May appear above table or in dedicated info panel  
- Color-coded based on status (open vs locked)

Commissioner Requirements:

- Commissioner must name their team within a league  
- Cannot proceed without team name  
- Commissioner view may include additional controls:  
  - Edit league settings  
  - Manage trades  
  - View admin options  
  - Export league data

Special Views:

- User's own team row highlighted throughout table  
- Option to toggle between week view and season view  
- Historical week data accessible via week navigation  
- Clicking team name opens detailed roster view

8.5 Lineup Page (Week 3) Purpose: Allow users to select their Week 3 lineup efficiently.

Key Features: Clear indication that:

- Week 1 & 2 are locked  
- Week 3 is editable

Lineup slots:

- 10 gymnast slots total (or custom based on league settings)  
- Visual distinction for "counting" vs "non-counting" scores  
- Status icons for each athlete (see 7.2 for icon types)

Gymnast selector:

- Filter by university  
- Filter by event  
- Filter by team (for same-team swap leagues)  
- Save confirmation  
- Lock status indicator once deadline passes

8.6 Scores & History Page Purpose: Offer transparency into scoring and performance analysis.

Key Features:

Weekly breakdown:

- Week 1 scores  
- Week 2 scores  
- Per-gymnast, per-event scoring

Scoring transparency:

- Identification of which 5 scores counted  
- Identification of which 5 were dropped (10u5c)  
- Visual indicator on athletes who scored in previous week

Performance Analysis (New):

- Actual score vs max possible score  
  - By event  
  - Overall  
- Comparison views:  
  - Your team's actual vs max  
  - Other teams' actual vs max in leaderboard  
- Weekly performance breakdown with visual indicators

8.7 Trade Interface Purpose: Enable users to view trade activity and (in Manual Commissioner leagues) submit trade requests; enable commissioners to execute manual trades.

**Note on trade systems:** The trade UI varies based on league configuration. In **Manual Commissioner** leagues, players submit requests (which become pending trades awaiting commissioner action). In **Waiver Wire** leagues, the "Propose Trade" tab becomes "Submit Waiver Claim." In **No Trades** leagues, this page shows only trade history (empty). See Section 9.1 for the full trade system comparison.

Page Layout:

- Primary navigation with "Trades" active  
- Team/League selector showing current league  
- Optional week navigation (or show "All Trades" view)  
- Tab switcher: "Propose Trade" (or "Submit Waiver Claim") | "Pending Trades" | "Trade History"

8.7.1 Propose Trade Tab (Manual Commissioner Leagues)

Section A: Staged Trade Builder Visual Layout: Two-column design

Left Column: "Gymnasts to Trade Away"

- Header: "Your Gymnasts" or "Select gymnasts to trade away"  
- List of user's current roster  
- Each gymnast shows:  
  - Athlete Card (see 7.7.5 for card specs)  
  - Checkbox or "Add to trade" button  
  - Grayed out if already in active trade proposal  
- Selected gymnasts move to "Trade Away" staging area  
- Staging area shows:  
  - Selected gymnasts in compact card format  
  - Remove button (X icon) to deselect  
  - Count: "Trading away: 3 gymnasts"

Right Column: "Gymnasts to Acquire"

- Header: "Available Gymnasts" or "Select gymnasts to acquire"  
- Priority ranking system:  
  - "Set your preferences in priority order"  
  - Numbered list (1, 2, 3, etc.)  
  - Drag handles to reorder  
- Gymnast Browser:  
  - Search bar  
  - Filters (School, Event, Year, Conference)  
  - Sort options (Avg score, Last score, NQS)  
  - Infinite scroll or pagination  
- Each gymnast shows:  
  - Athlete Card  
  - "Add to Trade" button  
  - "Priority: \[\#\]" if already added  
- Selected gymnasts appear in "Acquire" staging area:  
  - Ordered list with drag handles for reordering  
  - Priority numbers (1st choice, 2nd choice, etc.)  
  - Remove button (X icon)  
  - Count: "Requesting: 3 gymnasts (in priority order)"

Section B: Trade Review & Submission

- Summary box showing:  
    
  - "Trading Away: \[Count\] gymnasts" with thumbnails  
  - Arrow icon (→)  
  - "Requesting: \[Count\] gymnasts" with thumbnails  
  - Trade validation status: ✓ "Trade valid" (green checkmark) ✗ "Cannot exceed roster size" (red X) ⚠ "Imbalanced trade" (yellow warning, if applicable)


- Trade Notes (Optional):  
    
  - Text field for trade message/rationale  
  - Max 200 characters  
  - "Add note for league members..."


- Action Buttons:  
    
  - "Submit Trade Proposal" (primary, cyan button)  
  - "Save as Draft" (secondary, saves for later)  
  - "Clear All" (tertiary, resets staging areas)

Trade Submission Confirmation:

- Modal dialog: "Trade proposal submitted\!"  
- Shows submitted trade summary  
- "View Pending Trades" button  
- Auto-close and navigate to Pending Trades tab

8.7.2 Pending Trades Tab

View: List of all active trade proposals in league

Each Trade Proposal Card Shows:

- Trade ID/timestamp  
- Proposing team name  
- "From: \[Team Name\]"  
- "Giving up:" List of gymnasts (compact cards)  
- "Requesting:" List of gymnasts with priority indicators  
- Trade status:  
  - "Awaiting Commissioner Approval" (if approval required)  
  - "Open \- Can be claimed" (if no approval needed)  
  - "Your Proposal" (if user's own trade)  
- Action buttons:  
  - If commissioner and approval required:  
    - "Approve" (green)  
    - "Deny" (red)  
    - "View Details"  
  - If available to claim:  
    - "Accept Trade" (matches priority \#1)  
    - "View Details"  
  - If user's own proposal:  
    - "Cancel Trade"  
    - "Edit Trade"

Trade Details Modal:

- Full trade information  
- Both teams involved (if matched)  
- All gymnasts in trade with full stats  
- Trade note/message  
- Status timeline  
- Action buttons appropriate to user role

Filter Options:

- Show: All | My Proposals | Available to Me  
- Sort: Newest | Oldest | Priority

Empty State:

- "No pending trades"  
- Illustration  
- "Propose Trade" button

8.7.3 Trade History Tab

View: Completed and cancelled trades

Each Historical Trade Card Shows:

- Date/timestamp  
- Teams involved  
- Gymnasts exchanged  
- Final status:  
  - "Completed" (green badge)  
  - "Cancelled" (gray badge)  
  - "Denied" (red badge)  
- "View Details" link

Filters:

- Date range picker  
- Status filter (Completed, Cancelled, Denied)  
- Team filter (show trades involving specific team)

Export Option:

- "Export Trade History" button  
- Downloads CSV of all trades

8.7.4 Commissioner Manual Trade Interface

Special Commissioner-Only View:

- Accessible from "Commissioner Tools" menu or admin panel  
- Allows forced trades between any teams

Interface:

- Team A selector (dropdown)  
- Team A gymnasts (multi-select list)  
- Swap icon  
- Team B selector (dropdown)  
- Team B gymnasts (multi-select list)  
- "Execute Trade" button (requires confirmation)  
- Reason field (required): "Enter reason for manual trade..."  
- Audit log: All manual trades logged with commissioner, timestamp, reason

Use Cases:

- Correcting errors  
- Resolving disputes  
- Compensating for technical issues  
- Offline agreements between league members

8.7.5 Athlete Card Specifications (for Trade UX)

Card Layout (Compact):

- 280px x 120px (approximately)  
- Left side: Headshot or school logo (80x80px)  
- Right side: Information  
  - Name (bold, 16px)  
  - School name \+ logo (12px, gray)  
  - Year/Class badge (e.g., "JR" in small pill)  
  - Event icons (small, 16x16px: VT, UB, BB, FX)  
- Bottom: Key stat  
  - Season Avg: 9.875 (primary metric)  
  - Small trend indicator (↑ ↓ →)

Card Layout (Expanded \- in Details):

- 320px x 180px  
- Same left side  
- Right side adds:  
  - Last 3 meet scores  
  - High score this season  
  - NQS  
  - Status icons (injury, bye, home/away)  
- Bottom: Sparkline of season performance

Card States:

- Default: White/light gray background (dark mode: dark gray)  
- Hover: Slight elevation shadow, border highlight  
- Selected: Cyan border, cyan background tint  
- Disabled: 50% opacity, no hover effect  
- In active trade: Yellow border, "In Trade" badge

Status Icons on Cards:

- Injury (red cross): 🏥  
- Bye week (calendar X): 📅  
- Home meet (house): 🏠  
- Away meet (plane): ✈️  
- Double meet (2x): ⏱️  
- Scored last week (check): ✓

8.7.6 Trade Validation Rules

Required Checks Before Submission:

- Must trade away at least 1 gymnast  
- Must request at least 1 gymnast  
- Cannot exceed roster size after trade  
- Cannot trade gymnasts not on roster  
- Cannot request gymnasts already rostered by any team in the league  
- If same-team-only rule: All gymnasts must be from same school  
- If year restriction: Must match year/class  
- Cannot propose identical trade to existing pending proposal  
- Must respect trade deadline (if configured)  
- Cannot exceed max trades per week (if configured)

Warning Messages:

- "Imbalanced trade" (optional, informational only)  
- "This trade will leave your roster at \[X\] gymnasts"  
- "Trade deadline is in \[X\] days"  
- "You have \[X\] trades remaining this week"

8.7.7 Trade Execution & Settlement

When Trade is Accepted/Approved:

1. Validate rosters still accommodate trade  
2. Remove traded-away gymnasts from proposing team  
3. Add acquired gymnasts to proposing team  
4. Update both rosters  
5. Log trade in history  
6. Send confirmation (future: email/notification)  
7. Update lineups if trade affects current week

Trade Atomicity:

- All steps must succeed or all rolled back  
- No partial trades  
- Database transaction ensures consistency

Post-Trade State:

- Affected teams immediately see updated rosters  
- Can set lineups with new gymnasts  
- If after lineup lock for current week, new gymnasts available next week

8.7.8 Waiver Wire as Trade System (Alternative)

For leagues using waiver wire instead of direct trades:

- "Propose Trade" becomes "Submit Waiver Claim"  
- User selects gymnast(s) to drop  
- User selects gymnast(s) to claim (priority order)  
- Claims processed at designated waiver time (e.g., Wednesday midnight)  
- Priority order (inverse of standings or FAAB bidding)  
- See Section 9.4 for waiver wire details

8.8 Admin View Purpose: Provide system-level controls and data management for administrators

Key Features:

- Manual score entry interface  
- Bulk score import from Virtius (auto-sync)  
- League management and oversight  
- User management  
- System settings and configurations  
- Trade oversight and intervention  
- Analytics and reporting dashboard  
- Feedback & bug report log (see 6.8) — list of submissions with page path, submitter (or "logged out"), timestamp, and status; admins can mark items reviewed/resolved  
8. Data Management Features

8.1 Roster Management

- CSV Import during league setup  
    
  - Upload roster file  
  - Validation and error handling  
  - Preview before confirmation


- CSV Export  
    
  - Export current roster  
  - Export with stats and scores  
  - Download functionality

8.2 Score Management

- Manual score addition interface (Admin)  
- Virtius auto-sync (backend integration)  
- Score validation rules:  
  - Total points for week 2 should be \<400  
  - Sanity checks for individual event scores  
- Immutable historical scores  
- Score import should be idempotent  
9. Trading System

9.0 Gymnast Pool & Roster Management

9.0.1 Gymnast Pool Definition

- All NCAA Division I women's gymnasts competing in current season  
- Estimated total: \~1,500-2,000 gymnasts  
- Data includes:  
  - Full name  
  - School/University  
  - Year/Class (Freshman, Sophomore, Junior, Senior, 5th Year)  
  - Home state  
  - Event specialization(s): VT, UB, BB, FX, AA  
  - Season statistics  
  - Meet history

Pool Filtering (League Configuration):

- Commissioners can restrict pool to:  
  - Specific conferences (e.g., SEC, Big Ten, Pac-12)  
  - Specific schools  
  - Custom list via CSV upload  
- Default: All NCAA Division I gymnasts available

9.0.2 Roster Structure Active Lineup vs Bench:

- Phase 1: No bench system \- all gymnasts are "active"  
- Roster \= Lineup (e.g., 10 gymnasts if using 10u5c)  
- Future: Potential for bench spots \+ active lineup

Roster Size Calculation:

- Determined by league's UP/COUNT settings  
- Minimum roster size \= UP number (e.g., 10 for 10u5c)  
- No maximum roster size in Phase 1  
- Each team has same roster size within a league

9.0.3 Roster Assignment Methods

Method 1: Manual Selection (Default)

- Each player selects their own gymnasts  
- First-come-first-served: once a gymnast is rostered by any team, that gymnast is unavailable to all other teams in the league  
- Each gymnast can only be on one team per league (exclusive pool — no shared/overlapping rosters)

Method 2: Commissioner Upload (CSV)

- Commissioner pre-assigns rosters  
- All teams start with pre-determined gymnasts  
- Useful for:  
  - School-based leagues (each team gets specific school)  
  - Conference-based distribution  
  - Balanced competitive leagues  
- CSV Format (see Section 13.5)

Method 3: Draft System (Future)

- Snake draft or auction format  
- Scheduled draft time  
- Draft order determination  
- Out of scope for Phase 1

9.0.4 Browsing & Selecting Gymnasts

Gymnast Browser Interface:

- Search bar (by name)  
- Filters:  
  - School (multi-select dropdown)  
  - Conference (multi-select dropdown)  
  - Event (VT, UB, BB, FX, AA)  
  - Year/Class  
  - Availability (already rostered / still available)  
- Sort options:  
  - Alphabetical  
  - By school  
  - By average score (high to low)  
  - By last meet score  
  - By NQS

Gymnast Card Display:

- Photo (if available)  
- Name  
- School \+ logo  
- Year/Class  
- Event icons (which events they compete)  
- Key stats:  
  - Season average  
  - Last meet score  
  - High score  
  - NQS  
  - Home/Away splits  
- Status indicators:  
  - Injured  
  - Bye week upcoming  
  - Double meet upcoming  
  - Already rostered by another team (unavailable)

Add to Roster Action:

- "Add to Roster" button  
- Confirmation feedback  
- Updates roster view immediately  
- Validation:  
  - Roster not full  
  - Gymnast not yet rostered by another team in this league  
  - Not already on this team's roster (no duplicates)

9.0.5 Lineup Setting Process

Weekly Lineup Management:

- Select UP number of gymnasts from roster  
- Interface shows:  
  - All rostered gymnasts available for current week  
  - Gymnasts competing this week highlighted  
  - Gymnasts on bye week grayed out with indicator  
  - Score projections based on selected metric (Avg/High/Last)  
- Drag-and-drop or click-to-add  
- Real-time calculation preview  
- "Save Lineup" button  
- "Clear All" option  
- Auto-save on changes (with indication)

Lineup Validation Rules:

- Must have exactly UP number of gymnasts (or fewer if allowed)  
- Warning if under UP number  
- Cannot set lineup after lock time  
- Cannot modify past week lineups

Lineup Lock:

- Occurs every Friday at 9:00 AM ET (fixed system-wide — not configurable by commissioners)  
- Clear countdown timer before lock  
- After lock:  
  - Lineup becomes read-only  
  - Scores begin calculating as meets occur  
  - No changes permitted

9.0.6 Roster Continuity

- Rosters persist week-to-week  
- Gymnasts remain on roster unless:  
  - Dropped by player (if drops enabled)  
  - Traded away  
  - League ends  
- Must set new lineup each week (unless using "populate all" feature)  
9.1 Trade System Overview

Commissioners choose ONE of three trade systems during league creation:

1. Manual Commissioner Trades  
2. No Trades Allowed  
3. Waiver Wire System

The selected system determines all trade/roster movement rules for the entire season. Trade systems cannot be changed mid-season (Phase 1).

See Section 3.2 for detailed comparison and selection guidance.

9.2 Manual Commissioner Trades (Trade Option 1\)

When Enabled:

- All trades must be requested through commissioner  
- No automated trade system  
- Commissioner has full discretion

Player Experience:

- No trade interface in app for proposals  
- Must contact commissioner outside app (email, message, chat)  
- Commissioner enters trades manually using admin interface  
- Both teams see roster updates immediately after commissioner executes

Commissioner Interface:

- "Manual Trade" tool in Commissioner Tools  
- Select two teams involved  
- Select gymnasts to swap  
- Enter reason/note (required)  
- Confirm and execute  
- Both rosters update immediately  
- Trade logged in history

Restrictions (Optional \- set during league creation):

- Trade deadline date  
- Same team swaps only  
- Conference restrictions  
- Year/class restrictions  
- Maximum trades per team per week

Advantages:

- Full commissioner control  
- Can enforce custom rules  
- Handles special situations easily  
- Prevents collusion

Disadvantages:

- Requires commissioner availability  
- Slower processing  
- Commissioner workload

9.3 No Trades Allowed (Trade Option 2\)

When Enabled:

- All trading features disabled  
- No gymnast movement between teams  
- Rosters remain static all season

Player Experience:

- No trade-related UI shown  
- "Trading is disabled in this league" message if accessed  
- Focus entirely on lineup optimization

Commissioner Experience:

- No trade management required  
- Can still manually adjust rosters if absolutely necessary (emergency only)

Use Cases:

- Very casual leagues  
- Leagues where roster selection strategy is paramount  
- Eliminating trade complexity  
- Preventing any trade-related disputes

Advantages:

- Zero maintenance  
- No trade disputes  
- Simplest option  
- Pure optimization competition

Disadvantages:

- No flexibility for injuries  
- Bad initial selections can't be corrected  
- Less strategic depth

9.4 Waiver Wire System (Trade Option 3\)

When Enabled:

- Automated claim processing system  
- No direct player-to-player trading  
- Scheduled processing times  
- Priority order determines claim success

9.4.1 Waiver Wire Configuration (Set by Commissioner)

Required Settings:

- Processing Schedule:  
    
  - Day of week (e.g., Wednesday)  
  - Time (e.g., 11:59 PM ET)  
  - Frequency: Weekly (Phase 1 only option)


- Priority Method:  
    
  - Inverse Standings (recommended default)  
  - Rolling Priority  
  - Fixed Priority

Optional Settings:

- Maximum claims per week (default: unlimited)  
- Claim deadline before processing (default: none, can claim until processing)  
- Cannot drop gymnast who competed this week (toggle)  
- Same team swaps only (toggle)  
- Conference restrictions (toggle)

9.4.2 Waiver Priority Methods

Method 1: Inverse Standings (Default)

- Team ranked last gets first waiver priority  
- Team ranked 2nd-to-last gets 2nd priority  
- Team ranked 1st gets last priority  
- Priority recalculates each week based on current standings  
- Promotes competitive balance  
- Helps struggling teams improve

Example:

Week 3 Standings → Waiver Priority

1st place (500 pts) → Priority \#10 (last)

2nd place (485 pts) → Priority \#9

...

9th place (410 pts) → Priority \#2

10th place (395 pts) → Priority \#1 (first)

Method 2: Rolling Priority

- All teams start with randomized priority order  
- After successful claim, team moves to back of line  
- Teams that don't claim maintain their position  
- Creates strategic timing decisions  
- More complex but fair over season

Example:

Initial: \[Team A, Team B, Team C, Team D\]

Team A claims → \[Team B, Team C, Team D, Team A\]

Team C claims → \[Team B, Team D, Team A, Team C\]

Next week starts with this order

Method 3: Fixed Priority

- Priority order set at league creation  
- Never changes all season  
- Simple but potentially unfair  
- Could be based on draft order (future)  
- Least recommended

9.4.3 Submitting Waiver Claims (Player Interface)

Access: Trades tab → "Submit Waiver Claim" button

Interface Layout:

Section 1: Gymnasts to Drop

- Shows current roster  
- Multi-select checkboxes  
- Must drop at least 1 gymnast  
- Can drop multiple  
- Shows each gymnast's recent performance  
- Warning if dropping high scorer

Section 2: Gymnasts to Claim (Priority Order)

- Browse available gymnasts  
- Search and filter tools:  
  - School filter  
  - Event filter  
  - Conference filter  
  - Sort by average, NQS, last score  
- Add gymnasts to claim list  
- Drag to reorder priority  
- Priority indicators: "1st choice", "2nd choice", "3rd choice", etc.  
- Can claim multiple with ranking

Section 3: Claim Summary

- Drop list: Shows all selected to drop  
- Claim list: Shows priority-ordered claims  
- Balance check: Dropping X, claiming Y  
- Warning if exceeds max claims per week  
- "Submit Claim" button  
- "Save as Draft" option

Claim Submission:

- Confirmation modal  
- "Your claim will be processed on \[Day\] at \[Time\]"  
- Shows current waiver priority  
- "Confirm" or "Go Back"

Managing Pending Claims:

- View all pending claims  
- Edit claim (updates drop/claim selections)  
- Cancel claim entirely  
- Multiple claims can be pending  
- All process at next waiver time

Countdown Timer:

- Shows time until next waiver processing  
- "Next waiver processing in: 2 days, 5 hours, 23 minutes"

9.4.4 Waiver Processing (Automated)

Processing Occurs:

- At scheduled day/time (e.g., Wednesday 11:59 PM ET)  
- Automatically without manual intervention  
- Processes all pending claims

Processing Algorithm:

1. Collect all pending claims  
2. Sort teams by priority order (based on selected method)  
3. For each team in priority order: a. Identify gymnasts being claimed b. Check if gymnasts available (not yet claimed this round) c. For each claim in team's priority order:  
   - If gymnast available: Award to team  
   - If gymnast already claimed: Move to next priority choice d. If any claims successful:  
   - Remove dropped gymnasts from roster  
   - Add claimed gymnasts to roster  
   - If inverse standings: Move team to end of priority  
4. Generate results for all teams  
5. Send notifications

Tie Handling:

- If multiple teams same priority (shouldn't happen with inverse standings)  
- Random selection among tied teams  
- Logged for commissioner review

Transaction Atomicity:

- All drops and adds for a team happen together or not at all  
- If roster size would be violated, entire claim fails  
- Prevents roster size violations

9.4.5 Post-Processing

Notifications:

- All teams notified of results  
- Success: "Your claim for \[Gymnast Name\] was successful\!"  
- Failure: "Your claim failed. \[Gymnast Name\] was awarded to \[Team Name\]."  
- Partial success: Multiple claims, some succeed, some fail

Roster Updates:

- Rosters immediately reflect changes  
- New gymnasts available for current week (if not locked)  
- New gymnasts available for next week (if current week locked)

Priority Updates:

- If inverse standings: Recalculated based on current standings  
- If rolling: Successful claimants moved to end  
- If fixed: No change

Waiver History:

- All processed claims logged  
- Accessible in Trade History tab  
- Shows: Date, team, dropped, claimed, priority, result

9.4.6 Commissioner Waiver Controls

Commissioner Powers:

- View all pending claims (counts only, not specific details)  
- Manually trigger waiver processing (override schedule)  
- Cancel specific claims if needed  
- Add claims on behalf of players (emergency)  
- Modify waiver schedule (with notice)  
- Override priority in special circumstances

Admin Interface Shows:

- Next scheduled processing time  
- Number of pending claims per team  
- Last processing timestamp  
- Processing logs and any errors

Emergency Manual Processing:

- "Process Waivers Now" button  
- Confirmation required  
- Runs same algorithm as scheduled  
- Useful if system issues during scheduled time

9.5 Trade Restrictions & Deadlines

Applicable to All Trade Systems:

Trade Deadline:

- Optional deadline date set by commissioner  
- After deadline, no trades allowed (any system)  
- Countdown shown in UI  
- Warning 1 week before deadline  
- Common: End of regular season, before playoffs/championships

Roster Movement Restrictions:

- Cannot drop gymnast to below minimum roster size  
- Cannot add gymnast if roster full (must drop first)  
- Cannot add duplicate gymnast already on roster  
- Cannot add gymnast already rostered by another team in this league  
- Dropped gymnasts re-enter the available pool immediately and can be claimed by any team in the league, including the team that just dropped them (subject to normal waiver priority)

Same Team Swaps Only:

- Optional restriction (toggle)  
- Can only trade gymnasts from same school  
- Applies to manual trades and waiver claims  
- Example: Can drop UCLA gymnast, claim UCLA gymnast only

Conference Restrictions:

- Optional restriction  
- Can only claim from specific conferences  
- Set during league creation or by commissioner

Year/Class Restrictions:

- Optional restriction  
- Example: Can only trade sophomores for sophomores  
- More common in keeper/dynasty leagues (future)

9.6 Trade History & Logging

All Trade Systems:

- Complete log of all roster changes  
- Viewable by all league members  
- Shows: Date, teams involved, gymnasts moved, method  
- Filterable and sortable  
- Exportable (CSV)

Trade History Includes:

- Manual commissioner trades (with reason)  
- Waiver claims processed  
- Initial roster assignments  
- Emergency admin adjustments

Trade History Entry Example:

Date: 2025-02-15 11:59 PM

Type: Waiver Claim Processed

Team: Power Squad

Dropped: Jordan Chiles (UCLA)

Claimed: Trinity Thomas (Florida)  

Priority: \#3 of 10

Result: Success

10. Scoring Rules & Logic

10.1 Core Scoring Principles

Understanding "X Gymnasts, Y Up, Z Count" Format

**UP and COUNT apply per apparatus.** Scoring is evaluated independently for each of the four events (VT, UB, BB, FX).

- **X Gymnasts**: Total roster size (5-50 per league settings)  
- **Y Up**: Maximum gymnasts selected per apparatus each week (1-50, ≤ X)  
- **Z Count**: Number of top scores per apparatus that count toward team total (1-50, ≤ Y)  
- Notation: Written as "Xg/YuZc" (e.g., 20g/10u5c)

Default Format: 20g/10u5c

- 20 gymnasts on roster  
- Up to 10 gymnasts selected per apparatus each week (VT, UB, BB, FX independently)  
- Top 5 scores per apparatus count; bottom 5 per apparatus dropped  
- Team weekly score = top 5 VT + top 5 UB + top 5 BB + top 5 FX  
- Maximum possible weekly score = 20 × 10.0 = 200.0

How It Works:

1. Each team has X gymnasts on roster (set by league)  
2. Each week, for each apparatus, select up to Y gymnasts to "put up"  
3. A gymnast can be put up on any events they compete (each event slot is independent)  
4. After meets complete, each gymnast's score is collected for each apparatus they were put up on  
5. For each apparatus: rank the Y selected scores from highest to lowest  
6. Top Z scores per apparatus count toward team total  
7. Remaining (Y - Z) scores per apparatus are dropped  
8. Team total = sum of top Z scores across all 4 apparatus

Example Scenarios:

Scenario 1: Default (20g/10u5c)

- Roster: 20 gymnasts  
- Put up: Up to 10 gymnasts per apparatus  
- Per-apparatus scores (example VT): \[9.95, 9.925, 9.90, 9.875, 9.85, 9.80, 9.775, 9.75, 9.70, 9.65\]  
- Count (VT): Top 5 \= \[9.95, 9.925, 9.90, 9.875, 9.85\] = 49.50  
- Dropped (VT): Bottom 5 \= \[9.80, 9.775, 9.75, 9.70, 9.65\]  
- Same logic applies to UB, BB, FX  
- Team weekly score = sum of all 4 apparatus totals (e.g., 49.50 + 49.25 + 49.10 + 49.75 = 197.60)

Scenario 2: High Strategy (10g/10u5c)

- Roster: 10 gymnasts  
- Put up: All 10 gymnasts per apparatus (for events they compete)  
- No bench — every gymnast must be selected on each applicable event  
- Only top 5 per apparatus count; injuries more impactful

Scenario 3: Set and Forget (25g/25u25c)

- Roster: 25 gymnasts  
- Put up: All 25 per apparatus  
- All 25 scores per apparatus count (no drops)  
- Set lineup once at season start; minimal weekly management

Scenario 4: Large Depth (50g/25u15c)

- Roster: 50 gymnasts (maximum)  
- Put up: 25 gymnasts per apparatus weekly  
- Top 15 per apparatus count; 10 dropped per apparatus  
- Significant depth and flexibility

Custom Scoring Options (Commissioner Configurable)

- Any combination within constraints:  
  - 5 ≤ Roster Size ≤ 50  
  - 1 ≤ UP ≤ Roster Size  
  - 1 ≤ COUNT ≤ UP  
- Commissioner sets during league creation  
- All teams in league use same configuration  
- Cannot be changed mid-season (Phase 1\)

10.2 Gymnast Score Acquisition

Data Source:

- Real NCAA meet results  
- Sourced from Virtius (road-to-nationals.com)  
- Updated throughout weekend as meets complete  
- Typically finalized by Sunday evening

Score Selection Rules:

- Each gymnast's score is tracked **per apparatus** — a gymnast put up on vault contributes only their vault score to the VT pool  
- Gymnasts can be put up on multiple apparatus; each contributes to that apparatus's independent pool  
- Each gymnast may compete in multiple events per meet  
- Each gymnast may compete in multiple meets per week (rare, but possible)

Meet Week Assignment:

- **Thursday night meets count toward the previous week**, not the upcoming week  
- **Friday meets (any time on Friday) count toward the current week**  
- This aligns with the fixed lineup lock of Friday 9:00 AM ET: Thursday night scores are already final before lock, and Friday-forward scores belong to the week being locked  
- Example: Week 3 lineup lock = Friday 9:00 AM ET. A Thursday night meet's scores count toward Week 2 (already locked). A Friday afternoon meet's scores count toward Week 3.

Multi-Event Handling:

- If a gymnast is put up on vault AND floor, their vault score enters the VT pool and their floor score enters the FX pool — independently  
- If a gymnast is put up on vault but NOT floor, their floor score does not count even if they competed it  
- All-Around competitors:  
  - All 4 individual event scores are recorded and available  
  - AA total score (sum of all 4) is NOT used in fantasy scoring  
  - Each event score contributes to its apparatus pool only if the gymnast is checked on that event

Multi-Meet Handling (Double Meet Week):

- If a gymnast competes in two meets in the same week (indicated by the x2 badge in the lineup UI):  
  - For each apparatus the gymnast is put up on, only the **highest score across both meets** is used  
  - Each apparatus is evaluated independently  
  - Example: Gymnast competes vault in both meets — Friday 9.900, Sunday 9.925 → VT score = 9.925  
  - Example: Gymnast competes vault Friday (9.900) and floor Sunday (9.875) → VT = 9.900, FX = 9.875 (each apparatus uses its own best score)

Exhibition Performances:

- Exhibition scores do NOT count  
- Only officially counted NCAA scores used  
- Virtius data should automatically exclude exhibitions

Scratch/Did Not Compete:

- If gymnast is put up on an apparatus but does not compete it:  
  - Score = 0.0 for that apparatus that week  
  - Warning indicators should prevent this (injury/bye icons)

Score Range Validation:

- Valid NCAA scores: 0.0 to 10.0  
- Scores outside this range flagged for manual review  
- Common range: 9.0 to 10.0 for competitive gymnasts  
- Sanity check: With per-apparatus scoring, maximum possible team weekly score = COUNT × 10.0 × 4 events (e.g., for 10u5c: 5 × 10.0 × 4 = 200.0); team scores above this threshold indicate a data error

10.3 Score Calculation Process

Scoring is performed per apparatus. Steps 1–4 run independently for each of VT, UB, BB, and FX.

Step 1: Collect Apparatus Scores

- For each apparatus (VT, UB, BB, FX):  
  - Identify all gymnasts put up on that apparatus  
  - Retrieve each gymnast's best score on that apparatus for the week  
  - Result: up to UP scores in that apparatus pool (e.g., up to 10 scores for 10u5c)

Step 2: Sort Per-Apparatus Scores

- For each apparatus: order the pool scores from highest to lowest  
- Identify the top Z scores (e.g., top 5 for 10u5c)

Step 3: Calculate Per-Apparatus and Team Totals

- Per-apparatus total = sum of top Z scores for that event  
- Example VT: Top 5 = \[9.95, 9.925, 9.90, 9.875, 9.85\] = 49.50  
- Team weekly score = VT total + UB total + BB total + FX total

Step 4: Identify Counting vs Non-Counting

- For each apparatus: top Z scores marked "COUNTED", remaining marked "DROPPED"  
- Visual indicators shown per apparatus on scores page and history  
- A gymnast can have a score COUNTED on one apparatus and DROPPED on another in the same week

10.4 Tiebreaker Rules

Weekly Ties: If two teams have identical weekly scores:

1. Team with higher total of all dropped scores (across all apparatus) wins  
2. If still tied, compare highest individual dropped score  
3. Continue comparing dropped scores from highest to lowest until tie broken  
4. If all scores identical (extremely rare), teams share rank

Season Ties: If two teams tied in total season score:

1. Most weekly wins (times team finished 1st that week)  
2. Total points from all weeks (reconfirm calculation)  
3. Head-to-head record (if applicable)  
4. Higher score in most recent week  
5. Commissioner discretion if still tied

10.5 Historical Scores (Locked Weeks)

Immutability:

- Once a week locks, scores become final  
- No recalculations even if source data changes  
- Protects integrity and trust

Display Requirements:

- Past weeks clearly marked as "LOCKED" or "FINAL"  
- Show which scores counted vs dropped  
- Show team rankings from that week  
- Allow drilling into individual gymnast performances

Data Archival:

- All historical scores stored permanently  
- Available for analytics and review  
- Export functionality for commissioners

10.6 Real-Time Score Updates (Future)

Phase 1: Batch Updates

- Scores updated periodically (hourly during meet windows)  
- Manual trigger option for commissioners  
- Final update Sunday evening

Future Enhancement: Live Updates

- As meets conclude, scores import automatically  
- Real-time leaderboard updates  
- Push notifications for score changes  
- Requires WebSocket or polling implementation

10.7 Score Validation & Quality Control

Automated Checks:

- Score in valid range (0.0-10.0)  
- Total weekly score reasonable (\<400 expected max)  
- No duplicate gymnast scores from same meet/event  
- Gymnast competed at gymnast's registered school

Manual Override (Admin Only):

- Admins can manually adjust scores  
- Requires reason/note  
- Audit log of all manual changes  
- Used for:  
  - Virtius data errors  
  - Exhibition scores accidentally included  
  - Late score updates from NCAA

Error Flags:

- Automatic flagging of suspicious scores  
- Admin dashboard shows flagged scores  
- Review and approve/reject process

10.8 Bonus Points & Special Scoring (Future)

Phase 1: Simple scoring only

- Pure gymnast scores, no bonuses

Future Enhancements:

- Bonus for perfect 10.0 (+0.5 points)  
- Bonus for team championships  
- Bonus for individual event titles  
- Penalties for falls or major deductions  
- Conference-specific scoring adjustments  
11. Analytics Requirements

Analytics should be:

- Computed server-side  
- Cached where possible  
- Read-only for users

Required Analytics

- Most drafted gymnast (by user)  
- Highest total fantasy scorer (by user)  
- Event contribution breakdown  
- League rank trends  
- Actual vs max score analysis  
- Consistency metrics (standard deviation, coefficient of variation)  
- Performance trend analysis

Analytics Integrations

- Road to Nationals athlete pages (external links)  
- Virtius score data (backend sync)  
12. Authentication & User Flow

12.1 Sign In Flow

- Streamlined authentication process  
- Clear error messaging  
- Password recovery  
- Session management  
- Multi-device sync

12.2 Onboarding & First-Time User Experience

New User Landing (Not Logged In):

- Shows public landing page with:  
  - Example leaderboard from featured leagues  
  - "How It Works" section with 3-4 simple steps  
  - Prominent "Sign Up" and "Log In" CTAs  
  - Sample team performance visualization

First Login Experience:

1. Welcome screen  
     
   - Brief explanation: "Welcome to Gymcord Fantasy\!"  
   - Option to "Create a League" or "Join a League"  
   - Link to tutorial/help documentation

   

2. If user selects "Join a League":  
     
   - Input field for league code  
   - Validation feedback  
   - On success: Proceeds to team naming

   

3. If user selects "Create a League":  
     
   - Proceeds to league creation flow (see 12.3)

Tutorial & Help System:

- Optional interactive tutorial on first visit  
- "How to Play" modal accessible from menu  
- Tooltips on first interaction with key features  
- FAQ/Help Center link in footer  
- Demo mode option (view-only example league)

12.3 League Creation & Setup Flow

**Implementation note (current build):** the full multi-step wizard below (Basic Info → Scoring Config → Roster/Pool Settings → Trading Rules → Review → Confirmation) is the target design, not what's built yet. What actually exists today is a single-page "Create a League" form (name, team name, roster/UP/COUNT with presets) and joining via a **shareable invite link** (`/join/:code`) rather than a manually-typed code — a commissioner shares the link directly (e.g. in Discord) instead of a code someone types in. Roster assignment method, gymnast pool restrictions, and trade system selection aren't built yet; every league currently behaves as "no trades" since trading isn't implemented at all.

**Fixed system-wide rules (not configurable by commissioners):**
- Season start: January 2 each year
- Lineup lock: every Friday at 9:00 AM ET

Step 1: Join or Create

The entry point for the league flow. Presented before any creation or join steps.

- Heading: "Get Started"
- Two mutually exclusive options displayed as large selection cards:
  - **Join an existing league** — "Enter a league code to join a friend's league"
  - **Create a new league** — "Set up a new league and invite players"
- Selecting "Join an existing league" routes the user to the Join a League flow (Section 12.4)
- Selecting "Create a new league" advances to Step 2 (Basic League Information) below
- No "Back" or "Cancel" button on this screen; navigating away discards no state

Step 2: Basic League Information Fields:

- League Name\* (required, max 50 characters)  
- League Description (optional, max 200 characters)  
- Privacy Setting:  
  - Private (join by code only) \[default\]  
  - Public (discoverable in league browser) \[future\]

Step 3: Scoring Configuration Options:

- Total Roster Size per Team (required)  
    
  - Slider or input: 5 to 50 gymnasts  
  - Default: 20 gymnasts  
  - Helper text: "How many gymnasts will each team have on their roster?"


- Number of gymnasts UP (required)  
    
  - Slider or input: 1 to \[Roster Size\]  
  - Default: 10  
  - Helper text: "How many gymnasts will be selected for weekly lineups?"  
  - Validation: Must be ≤ Roster Size


- Number of scores that COUNT (required)  
    
  - Slider or input: 1 to \[UP number\]  
  - Default: 5  
  - Helper text: "How many of the top scores will count toward team total?"  
  - Validation: Must be ≤ UP number


- Common Presets (Quick Select):  
    
  - "20g/10u5c \- Default" (20 roster, 10 up, 5 count) \[Highlighted\]  
  - "10g/10u5c \- High Strategy" (10 roster, 10 up, 5 count)  
  - "25g/25u25c \- Set and Forget" (25 roster, 25 up, 25 count)  
  - "15g/10u5c \- Medium" (15 roster, 10 up, 5 count)  
  - "Custom" \- Manual configuration

Example Preview:

- "In your league, each team will have \[20\] gymnasts on their roster."  
- "Each week, players select \[10\] gymnasts to put up."  
- "The top \[5\] scores will count toward their team total."  
- Visual diagram showing UP vs COUNT with color coding

Step 4: Roster & Gymnast Pool Settings Options:

- Roster Assignment Method:  
    
  - Manual Selection (each player picks their own roster) \[default\]  
  - Commissioner Assignment (commissioner uploads rosters via CSV)  
  - Draft (future enhancement)


- Gymnast Pool: Exclusive (fixed)  
  - Each gymnast can only be on one team within a league  
  - Once a gymnast is added to any roster, they are unavailable to all other teams  
  - Gymnasts are shown as "Available" or "Rostered" in the gymnast browser


- Available Gymnast Pool:  
    
  - All NCAA gymnasts (default)  
  - Specific conferences only (dropdown multi-select)  
  - Specific teams only (dropdown multi-select)  
  - Custom list (CSV upload)

Step 5: Trading Rules & Policies Commissioner selects ONE trade system:

Option 1: Manual Commissioner Trades \[Radio Button\]

- Description: "You will manually execute all trades when players request them"  
- How it works:  
  - Players submit trade requests to you  
  - You review and decide whether to execute  
  - You manually swap gymnasts between teams using the commissioner trade interface  
- Best for: "Small leagues where you know all players and want full control"  
- Settings (if selected):  
  - Trade deadline (optional): Date picker or "No deadline"  
  - Allowed restrictions: Same team swaps only, Conference limits, etc.

Option 2: No Trades Allowed \[Radio Button\]

- Description: "Trading is completely disabled \- teams keep their roster all season"  
- How it works:  
  - No trading interface shown to players  
  - Rosters remain unchanged after initial selection  
  - Pure lineup optimization strategy  
- Best for: "Casual leagues or leagues emphasizing draft/selection strategy"  
- Settings (if selected):  
  - None \- simply disables all trading

Option 3: Waiver Wire System \[Radio Button\] \[Highlighted as Recommended\]

- Description: "Automated system where players submit claims, processed at scheduled times"  
    
- How it works:  
    
  - Players select gymnasts to drop and claim (with priority order)  
  - System processes all claims at scheduled waiver time  
  - Priority order determines who gets requested gymnasts


- Best for: "Competitive leagues that want automated, fair trading"  
    
- Settings (if selected):  
    
  Waiver Processing Schedule:  
    
  - Day of week: Dropdown (Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday)  
  - Time: Time picker (Default: 11:59 PM ET)  
  - Frequency: Weekly \[Phase 1 only option\]


  Waiver Priority Method:


  - Inverse Standings: Last place gets first priority \[default, recommended\]  
  - Rolling Priority: Priority rotates after successful claims  
  - Fixed Priority: Set order never changes


  Additional Waiver Rules (Optional toggles):


  - Maximum claims per week: Input (default: Unlimited)  
  - Claim deadline: Hours before processing (default: 0, allows until last minute)  
  - Cannot drop gymnast who competed this week: Toggle  
  - Same team swaps only: Toggle  
  - Conference restrictions: Toggle \+ multi-select

Visual Comparison Table: Shows all 3 options side-by-side with:

- Player control level  
- Commissioner workload  
- Processing speed  
- Best use case

Step 6: Review & Create Display:

- Summary of all league settings  
- Editable: "Edit" link for each section goes back to that step  
- Terms acknowledgment:  
  - "I will serve as commissioner and manage this league"  
  - "I understand settings cannot be changed after Week 1 starts" (or similar restriction)

Actions:

- "Create League" button (primary CTA)  
- "Save as Draft" (saves settings, can return later)  
- "Cancel" (returns to dashboard)

Step 7: League Created \- Confirmation Display:

- Success message: "Your league '\[League Name\]' has been created\!"  
- League Code displayed prominently in large text  
  - Example: "CHALK2025" (6-8 character alphanumeric)  
  - Copy button next to code  
- Share options:  
  - Copy link to clipboard  
  - Share via email (opens email client with pre-filled message)  
  - Share code manually (displays code to share)

Next Steps:

- "Name Your Team" button (required before setting lineups)  
- "Invite Players" reminder with code  
- "Go to League" button (navigates to league page)

Commissioner Roster Upload (if selected):

- CSV template download link  
- Upload interface  
- Validation results  
- Confirmation of successful upload

12.4 Joining a League Flow

Step 1: Enter League Code

- Input field for code  
- "Join League" button  
- Validation:  
  - Code format check  
  - Code existence check  
  - League full check  
  - User already in league check

Error States:

- "Invalid code. Please check and try again."  
- "This league is full. Contact the commissioner."  
- "You're already in this league\!"

Step 2: League Preview Display (before committing):

- League name  
- Commissioner name  
- Number of current teams  
- Scoring format (e.g., "10 up, 5 count")  
- Trade rules summary  
- Current week

Actions:

- "Join League" button (primary)  
- "Cancel" (returns to previous screen)

Step 3: Name Your Team

- Input field for team name (required, max 30 characters)  
- Character counter  
- Validation: No duplicate names in league  
- Preview: "Your team '\[Team Name\]' in \[League Name\]"

Actions:

- "Confirm and Join" button  
- "Back" (returns to preview)

Step 4: Welcome to League Display:

- Success message: "Welcome to \[League Name\]\!"  
- "You're now competing as \[Team Name\]"  
- Current standings (if mid-season)  
- Next action prompts:  
  - "Set Your Lineup for Week X" (if lineups are open)  
  - "View League Standings"  
  - "Browse Available Gymnasts"

12.5 League Discovery (Future)

- Browse public leagues  
- Filter by:  
  - Scoring format  
  - Conference  
  - Open spots  
  - Start date  
- Search by league name  
- Sort by: Newest, Most Popular, Starting Soon

12.6 Multi-League Management Dashboard View:

- List of all leagues user is in  
- Each league shows:  
  - League name  
  - Team name  
  - Current rank  
  - Week status  
  - Alerts (lineup not set, pending trade, etc.)

League Limit:

- Free tier: 5 leagues maximum  
- Prompt to upgrade when limit reached  
- "Purchase More Leagues" flow (out of scope Phase 1, but UI should accommodate)

League Switching:

- Team/League selector dropdown (as specified in Section 7.2)  
- Quick switch between leagues without navigation  
- Recent leagues appear first  
13. Technical Considerations

13.0 Hosting & Backend Stack

- **Frontend:** React + Vite, deployed as a static site to GitHub Pages via GitHub Actions (build on every push to `main`)
- **Backend:** No custom API server. **Supabase** (managed Postgres) provides the database, authentication, and an auto-generated REST API that the frontend calls directly
- **Auth:** Discord OAuth via Supabase Auth — no separate registration step; signing in with Discord creates the account automatically on first use
- **Why this over Azure:** replaces the original Azure Static Web Apps + Azure Functions + Azure SQL plan. Cheaper at this project's scale (Supabase's free tier covers DB + auth + Discord OAuth with no custom auth code to maintain), and GitHub Pages matches how the other Gymcord community pages are already hosted
- **Routing:** the frontend uses hash-based routing (`/#/gymnasts`) rather than path-based routing, since GitHub Pages has no server-side rewrite rule for deep links

13.1 Backend Data Structure

- Proper data modeling for:  
  - Users and teams  
  - Leagues and settings  
  - Gymnasts and scores  
  - Trades and transactions  
  - Historical data

13.2 Data Scraping

- Virtius integration strategy  
- Score validation  
- Automated sync schedules  
- Error handling and logging  
- Manual override capability

13.3 Performance

- Handle peak usage during Friday–Sunday meet windows  
- Fast homepage load (\<2 seconds)  
- Efficient analytics queries  
- Caching strategies

13.4 Google Analytics Integration

- Track user engagement  
- Monitor feature usage  
- Conversion tracking  
- Error tracking

13.5 CSV File Formats & Specifications

13.5.1 Roster Import CSV

Purpose: Allow commissioners to upload pre-assigned rosters for all teams in a league

Required Columns:

- team\_name (string, max 30 chars): Team name in league  
- owner\_email (string, email format): User's email address  
- gymnast\_name (string): Full name of gymnast  
- gymnast\_school (string): School/university name  
- gymnast\_year (string): FR, SO, JR, SR, or 5TH  
- event\_primary (string): VT, UB, BB, FX, or AA

Optional Columns:

- gymnast\_id (integer): Internal gymnast ID if known  
- roster\_position (integer): Preferred order in roster  
- notes (string, max 200 chars): Commissioner notes

Example Format:

team\_name,owner\_email,gymnast\_name,gymnast\_school,gymnast\_year,event\_primary

Power Squad,user1@example.com,Jordan Chiles,UCLA,SR,FX

Power Squad,user1@example.com,Leanne Wong,Florida,JR,AA

Chalk Masters,user2@example.com,Trinity Thomas,Florida,5TH,AA

Chalk Masters,user2@example.com,Jade Carey,Oregon State,SR,VT

Validation Rules:

- Each team must have at least UP number of gymnasts (from league settings)  
- No duplicate gymnast\_name \+ gymnast\_school combinations per team  
- owner\_email must match registered user or invitation sent  
- All required columns must be present  
- gymnast\_school must match known NCAA schools  
- Max 1000 rows per upload

Error Handling:

- Show line-by-line errors with specific messages  
- "Row 5: Invalid email format"  
- "Row 12: Gymnast not found in database"  
- "Row 18: Duplicate gymnast in team"  
- Allow partial upload if some rows valid (with confirmation)

13.5.2 Roster Export CSV

Purpose: Allow users/commissioners to download current rosters

Generated Columns:

- team\_name  
- league\_name  
- gymnast\_name  
- gymnast\_school  
- gymnast\_year  
- events\_competing (comma-separated: VT,UB,BB,FX)  
- season\_avg  
- last\_score  
- high\_score  
- nqs  
- total\_fantasy\_points  
- weeks\_counted (how many weeks score counted)  
- current\_status (Active, Injured, Bye, etc.)

File Naming:

- Format: `{league_name}_roster_{YYYY-MM-DD}.csv`  
- Example: `Elite_Squad_League_roster_2025-02-15.csv`

Download Trigger:

- "Export Roster" button on Lineups page  
- "Export All Rosters" button on League admin page (commissioner only)

13.5.3 Scores Import CSV (Admin Only)

Purpose: Manual score entry for admins when Virtius sync fails

Required Columns:

- meet\_date (date, YYYY-MM-DD format)  
- gymnast\_name (string)  
- gymnast\_school (string)  
- event (string): VT, UB, BB, or FX  
- score (decimal): Score value (0.0-10.0)

Optional Columns:

- meet\_name (string)  
- opponent (string)  
- exhibition (boolean): true if exhibition performance (will be excluded)

Example Format:

meet\_date,gymnast\_name,gymnast\_school,event,score,meet\_name

2025-02-14,Jordan Chiles,UCLA,FX,9.950,UCLA vs Utah

2025-02-14,Jordan Chiles,UCLA,VT,9.925,UCLA vs Utah

2025-02-14,Leanne Wong,Florida,AA,39.650,Florida vs Georgia

Note: All-Around scores are NOT used for fantasy scoring \- individual events only

Validation Rules:

- meet\_date must be valid date  
- score must be between 0.0 and 10.0  
- event must be VT, UB, BB, or FX (not AA)  
- gymnast must exist in database or be auto-created with approval  
- Duplicate score entries for same gymnast/event/meet flagged for review

13.5.4 League Settings Export CSV (Commissioner)

Purpose: Export league configuration for backup or migration

Generated Columns:

- setting\_name  
- setting\_value  
- setting\_description

Example:

setting\_name,setting\_value,setting\_description

league\_name,Elite Squad League,League display name

scoring\_format,10u5c,Number up / number count

trade\_deadline,2025-03-15,Last day for trades

commissioner\_email,admin@example.com,League commissioner

created\_date,2025-01-15,League creation date

13.5.5 Analytics Export CSV

Purpose: Export user analytics data for external analysis

Generated Columns:

- metric\_name  
- metric\_value  
- league\_name (if applicable)  
- week\_number (if applicable)  
- timestamp

Example:

metric\_name,metric\_value,league\_name,week\_number,timestamp

total\_season\_points,487.65,Elite Squad League,3,2025-02-15T10:30:00Z

weekly\_rank,3,Elite Squad League,3,2025-02-15T10:30:00Z

most\_valuable\_gymnast,Jordan Chiles,Elite Squad League,3,2025-02-15T10:30:00Z

13.6 Status Icons Specifications

13.6.1 Icon Definitions & Visual Design

All status icons should be:

- 16x16px or 20x20px depending on context  
- Simple, recognizable designs  
- Work in both light and dark modes  
- Accompanied by tooltips

Icon 1: Bye Week

- Symbol: Calendar with X  
- Icon: 📅 or crossed-out calendar  
- Color: Gray (\#6B7280)  
- Tooltip: "Bye week \- not competing"  
- When shown: Gymnast's school has no meets this week  
- Location: Athlete card, lineup view

Icon 2: Injury (Short Term)

- Symbol: Band-aid or medical cross  
- Icon: 🏥 or bandage symbol  
- Color: Yellow/Orange (\#F59E0B)  
- Tooltip: "Day-to-day injury — check CGN Injury List for details"  
- When shown: Gymnast listed as injured, may compete  
- Location: Athlete card, lineup view

Icon 3: Injury (Long Term)

- Symbol: Medical cross with exclamation  
- Icon: ⚠️🏥 or bold medical cross  
- Color: Red (\#EF4444)  
- Tooltip: "Season-ending injury — check CGN Injury List for details"  
- When shown: Gymnast confirmed out for season  
- Location: Athlete card, roster view  
- Additional: Grayed out/reduced opacity

Icon 4: Home Meet

- Symbol: House  
- Icon: 🏠 or home icon  
- Color: Green (\#10B981)  
- Tooltip: "Competing at home"  
- When shown: Meet is at gymnast's school  
- Location: Athlete card, lineup view  
- Note: Home advantage often correlates with higher scores

Icon 5: Away Meet

- Symbol: Airplane or road  
- Icon: ✈️ or location pin  
- Color: Blue (\#3B82F6)  
- Tooltip: "Competing away"  
- When shown: Meet is at opponent's venue  
- Location: Athlete card, lineup view

Icon 6: Double Meet

- Symbol: Two overlapping calendars or "2x"  
- Icon: ⏱️ or "2×" badge  
- Color: Purple (\#8B5CF6)  
- Tooltip: "Competing twice this week"  
- When shown: Gymnast has 2+ meets scheduled  
- Location: Athlete card, lineup view  
- Note: Rare but possible; best score from either meet counts

Icon 7: Dual Meet

- Symbol: Two people icon or "vs 1"  
- Icon: 👥 (simplified)  
- Color: Teal (\#14B8A6)  
- Tooltip: "Dual meet format"  
- When shown: Two teams competing (standard format)  
- Location: Athlete card (optional, less critical)

Icon 8: Tri Meet

- Symbol: Three people icon or "vs 2"  
- Icon: 👥👥 (simplified)  
- Color: Teal (\#14B8A6)  
- Tooltip: "Tri meet \- 3 teams competing"  
- When shown: Three teams in meet  
- Location: Athlete card (optional)

Icon 9: Quad Meet

- Symbol: Four people or "vs 3"  
- Icon: 👥👥 (simplified)  
- Color: Teal (\#14B8A6)  
- Tooltip: "Quad meet \- 4 teams competing"  
- When shown: Four teams in meet  
- Location: Athlete card (optional)  
- Note: More teams may mean different lineup strategies

Icon 10: Scored Last Week (Counted)

- Symbol: Green checkmark  
- Icon: ✓  
- Color: Green (\#10B981)  
- Tooltip: "Score counted in Week X"  
- When shown: Score was in top Y (e.g., top 5\) last week  
- Location: Athlete card in lineup view when reviewing past weeks

Icon 11: Scored Last Week (Dropped)

- Symbol: Gray checkmark or minus  
- Icon: ○ or –  
- Color: Gray (\#6B7280)  
- Tooltip: "Competed but score dropped in Week X"  
- When shown: Gymnast competed but score didn't count toward total  
- Location: Athlete card in lineup view when reviewing past weeks

Icon 12: Did Not Compete

- Symbol: Zero or dash  
- Icon: — or 0  
- Color: Red (\#EF4444)  
- Tooltip: "Did not compete \- scored 0"  
- When shown: Gymnast was in lineup but didn't compete  
- Location: Scores history view

13.6.2 Icon Priority & Stacking

When multiple statuses apply to one gymnast:

- Show maximum 3 icons per card  
- Priority order (highest to lowest):  
  1. Long-term injury (critical)  
  2. Short-term injury (warning)  
  3. Bye week (informational)  
  4. Scored last week (performance)  
  5. Double meet (opportunity)  
  6. Home/Away meet (context)  
  7. Meet format (least critical)

Visual stacking:

- Horizontal row of icons  
- 4px spacing between icons  
- Overflow: Show "+2 more" indicator with tooltip

13.6.3 Icon Data Sources

Injury Status:

- Admins manually update injury status based on the CGN Injury List  
- Injury icon tooltips direct players to check the CGN Injury List for the latest details  
- Scraped from team websites (future)  
- User-reported with admin verification (future)

Bye Week:

- Calculated from meet schedule data  
- Week with no scheduled meets for that school

Home/Away:

- Determined from meet location data  
- Home \= meet at gymnast's school venue

Meet Format:

- Parsed from meet name/description  
- Number of participating teams

Scored Last Week:

- Calculated from scoring logic  
- Top Y scores \= counted  
- Remaining \= dropped

13.6.4 Icon Accessibility

Requirements:

- All icons must have alt text  
- Tooltips appear on hover (desktop) and tap (mobile)  
- Screen reader compatible descriptions  
- Color-blind safe color choices  
- Do not rely on color alone \- include shape/symbol distinction

Example Alt Text:

- "Bye week"  
- "Day-to-day injury — check CGN Injury List for details"  
- "Season-ending injury — check CGN Injury List for details"  
- "Home meet"  
- "Score counted last week"

13.7 Permissions & Access Control Matrix

13.7.1 Permission Levels Overview

Four Permission Levels:

1. **Guest** \- Not logged in  
2. **Player** \- Logged in, member of league(s)  
3. **Commissioner** \- League creator/admin  
4. **Admin** \- System administrator

13.7.2 Detailed Permissions by Feature

| Feature / Action | Guest | Player | Commissioner | Admin |
| :---- | :---- | :---- | :---- | :---- |
| **Account & Authentication** |  |  |  |  |
| View landing page | ✓ | ✓ | ✓ | ✓ |
| Sign up / Register | ✓ | — | — | — |
| Log in | ✓ | — | — | — |
| Log out | — | ✓ | ✓ | ✓ |
| Edit own profile | — | ✓ | ✓ | ✓ |
| Change password | — | ✓ | ✓ | ✓ |
| Delete own account | — | ✓ | ✓ | ✗ |
| **League Management** |  |  |  |  |
| View public league info | ✓ | ✓ | ✓ | ✓ |
| Browse public leagues | ✓ | ✓ | ✓ | ✓ |
| Create league | — | ✓ | ✓ | ✓ |
| Join league (with code) | — | ✓ | ✓ | ✓ |
| View own league standings | — | ✓ | ✓ | ✓ |
| View other teams' lineups | — | ✓ | ✓ | ✓ |
| Leave league | — | ✓ | ✓ | ✗ |
| Edit league settings | — | — | ✓\* | ✓ |
| Delete league | — | — | ✓\* | ✓ |
| Upload league rosters (CSV) | — | — | ✓\* | ✓ |
| Export league data | — | — | ✓\* | ✓ |
| **Team & Lineup Management** |  |  |  |  |
| Name team | — | ✓\*\* | ✓\*\* | ✓ |
| Set own lineups | — | ✓ | ✓ | ✓ |
| Edit own lineups (before lock) | — | ✓ | ✓ | ✓ |
| View own historical lineups | — | ✓ | ✓ | ✓ |
| Add gymnasts to roster | — | ✓ | ✓ | ✓ |
| Remove gymnasts from roster | — | ✓ | ✓ | ✓ |
| Add/remove athletes from another team's roster (override) | — | — | ✓† | ✓ |
| Edit another team's lineup | — | — | — | ✓ |
| Set lineups for future weeks | — | ✓ | ✓ | ✓ |
| Populate all future weeks | — | ✓ | ✓ | ✓ |
| Clear lineup | — | ✓ | ✓ | ✓ |
| **Trading & Waiver** |  |  |  |  |
| Propose trade | — | ✓ | ✓ | ✓ |
| Accept trade | — | ✓ | ✓ | ✓ |
| Cancel own trade | — | ✓ | ✓ | ✓ |
| Approve/deny trades | — | — | ✓\*\*\* | ✓ |
| Force/execute manual trade | — | — | ✓\* | ✓ |
| View trade history | — | ✓ | ✓ | ✓ |
| Modify trade rules | — | — | ✓\* | ✓ |
| Submit waiver claim | — | ✓ | ✓ | ✓ |
| Process waiver claims | — | — | ✓\* | ✓ |
| **Analytics & Reporting** |  |  |  |  |
| View own analytics | — | ✓ | ✓ | ✓ |
| View league analytics | — | ✓ | ✓ | ✓ |
| Export analytics | — | ✓ | ✓ | ✓ |
| View gymnast details | — | ✓ | ✓ | ✓ |
| View consistency metrics | — | ✓ | ✓ | ✓ |
| **Scores & Data** |  |  |  |  |
| View live scores | — | ✓ | ✓ | ✓ |
| View historical scores | — | ✓ | ✓ | ✓ |
| Manually enter scores | — | — | — | ✓ |
| Upload scores (CSV) | — | — | — | ✓ |
| Trigger score sync | — | — | ✓\* | ✓ |
| Override locked scores | — | — | — | ✓ |
| **Admin Functions** |  |  |  |  |
| View admin dashboard | — | — | — | ✓ |
| Manage all leagues | — | — | — | ✓ |
| Manage all users | — | — | — | ✓ |
| View error logs | — | — | — | ✓ |
| Configure system settings | — | — | — | ✓ |
| Access database directly | — | — | — | ✓ |
| Impersonate users (testing) | — | — | — | ✓ |

Legend:

- ✓ \= Allowed  
- ✗ \= Explicitly denied  
- — \= Not applicable / Not logged in  
- \* \= Only for their own league  
- \*\* \= Required before other actions  
- \*\*\* \= Only if league settings require approval  
- † \= Commissioner override only — for correcting league issues (e.g., wrong roster assignment). All override actions are logged with a required reason.

13.7.3 Role-Specific Restrictions

Player Restrictions:

- Can only edit own teams  
- Cannot see other users' draft picks (if draft mode)  
- Cannot modify league settings  
- Cannot force trades involving other teams  
- Limited to 5 leagues (free tier)

Commissioner Restrictions:

- Can only manage leagues they created  
- Cannot edit another team's weekly lineup under any circumstances  
- Can add or remove athletes from any team's roster as a commissioner override (e.g., to correct a wrong roster assignment or resolve a league issue); all such actions require a reason and are logged  
- Cannot override system scoring rules  
- Cannot access admin dashboard  
- Cannot view site-wide analytics  
- Must follow same trading rules as players (unless overriding)

Admin Restrictions:

- Should not participate in leagues for fairness (policy, not technical)  
- All admin actions logged for audit  
- Cannot delete system-critical data without confirmation  
- Two-factor authentication required  
- IP whitelist optional for high-security instances

13.7.4 Permission Checks & Enforcement

Backend Validation:

- Every API endpoint checks user permissions  
- JWT tokens contain user role  
- Additional database checks for ownership  
- Return 403 Forbidden for unauthorized actions

Frontend Enforcement:

- Hide UI elements user cannot access  
- Disable buttons for unavailable actions  
- Show informational tooltips when action restricted  
- Redirect unauthorized navigation attempts

Permission Escalation:

- Players cannot become commissioners except by creating league  
- Commissioners cannot become admins  
- Admins assigned manually by system owner  
- No self-service role upgrades

Audit Logging:

- All permission-restricted actions logged  
- Log includes: User, action, timestamp, result  
- Sensitive actions (score overrides, manual trades) flagged  
- Admin dashboard shows recent permission-related events

13.7.5 Special Cases

Commissioner Transfership:

- Original commissioner can transfer role  
- Requires confirmation from new commissioner  
- Cannot have \>1 commissioner per league (Phase 1\)  
- Admins can reassign commissioner if needed

League Ownership Disputes:

- Admins can intervene  
- Transfer commissioner role  
- Resolve reported issues  
- May require user verification

Inactive Commissioner:

- If commissioner inactive \>30 days (future)  
- System may prompt players to vote new commissioner  
- Or admin can assign replacement  
- Out of scope for Phase 1

Multi-League Permissions:

- User has different roles in different leagues  
- Player in League A, Commissioner in League B  
- UI shows appropriate permissions per context  
- Team/league selector updates available actions  
14. Non-Functional Requirements

14.1 Error States & Edge Cases

14.1.1 Network & System Errors

Virtius Data Source Down:

- Display: "Score updates temporarily unavailable"  
- Behavior:  
  - Show last successfully synced data with timestamp  
  - Retry button for manual sync attempt  
  - Auto-retry every 15 minutes  
  - Admin notification sent  
- Fallback: Manual score entry by admin  
- User Impact: Minimize \- show cached data, inform of delay

Database Connection Loss:

- Display: "Connection lost. Retrying..."  
- Behavior:  
  - Automatic reconnection attempts  
  - Queue failed operations for retry  
  - Show offline indicator in UI  
- Fallback: Local storage cache (read-only mode)  
- User Impact: Cannot save changes until reconnected

API Timeout:

- Display: "Request timed out. Please try again."  
- Behavior:  
  - Retry button  
  - Log error details  
  - Suggest refreshing page if persistent  
- Fallback: Cached data shown with warning  
- User Impact: Operation not completed, must retry

Server Error (500):

- Display: "Something went wrong on our end. We're working on it."  
- Behavior:  
  - Error logged with stack trace  
  - Admin alert sent  
  - Error ID shown to user for support reference  
- Fallback: Show error page with return options  
- User Impact: Cannot complete action, support may be needed

14.1.2 Data Integrity Errors

Missing Scores for Gymnast:

- Display: Warning icon on gymnast card  
- Tooltip: "Score not yet available for Week X"  
- Behavior:  
  - Show "Pending" status  
  - Auto-update when score becomes available  
  - If past deadline: Score \= 0.0 (did not compete)  
- Admin Action: Can manually enter score  
- User Impact: Lineup may score 0 until data arrives

Score Discrepancy (Source Data Changes):

- Display: "Score discrepancy detected" alert  
- Behavior:  
  - Flag for admin review  
  - Show both old and new values  
  - Require admin approval to update locked week  
- Rule: Historical scores generally immutable  
- User Impact: Rare; admin resolves case-by-case

Invalid Score Range:

- Display: "Invalid score detected: X.XXX"  
- Behavior:  
  - Reject score on import  
  - Flag for manual review  
  - Request re-sync from source  
- Validation: Must be 0.0 ≤ score ≤ 10.0  
- Admin Action: Manual correction or override  
- User Impact: Lineup may show pending until corrected

14.1.3 User Action Errors

Incomplete Lineup at Lock Time:

- Display: Warning banner 24 hours before lock  
- Warning: "Your lineup has only X/Y gymnasts set"  
- Behavior:  
  - Email reminder (future)  
  - In-app notification  
  - After lock: Empty slots \= 0.0 score  
- Fallback: None \- user responsibility  
- User Impact: Lower score potential for that week

Attempting to Edit Locked Week:

- Display: "This week is locked and cannot be edited"  
- Icon: Lock symbol on week navigation  
- Behavior:  
  - Edit buttons disabled  
  - Grayed out UI elements  
  - Tooltip states: "Lineups lock every Friday at 9:00 AM ET"  
- Fallback: Cannot edit \- absolute rule  
- User Impact: Must wait until next week

Duplicate Gymnast in Lineup:

- Display: "This gymnast is already in your lineup"  
- Behavior:  
  - Prevent adding duplicate  
  - Highlight existing instance  
  - Error message with shake animation  
- Fallback: Operation blocked  
- User Impact: Must select different gymnast

Roster Size Exceeded:

- Display: "Maximum roster size reached (X/Y)"  
- Behavior:  
  - Disable "Add Gymnast" buttons  
  - Suggest removing gymnast first  
  - Show which gymnasts to consider dropping  
- Fallback: Must drop before adding  
- User Impact: Must manage roster space

Invalid Trade Proposal:

- Display: Error message specific to violation  
  - "Cannot trade more gymnasts than roster allows"  
  - "Trade violates same-team-only rule"  
  - "Trade deadline has passed"  
  - "Maximum trades this week exceeded"  
- Behavior:  
  - Prevent submission  
  - Highlight violating gymnasts  
  - Suggest corrections  
- Fallback: Must fix violations  
- User Impact: Cannot submit until valid

14.1.4 Access & Permission Errors

User Not in League:

- Display: "You don't have access to this league"  
- Behavior:  
  - Redirect to user's leagues dashboard  
  - 404 page or access denied message  
  - Suggest joining league with code  
- Fallback: Cannot view  
- User Impact: Must join league first

Commissioner-Only Action by Player:

- Display: "This action requires commissioner permissions"  
- Behavior:  
  - Disable commissioner-only buttons for players  
  - Show info tooltip explaining limitation  
  - Hide admin-only UI elements  
- Fallback: Feature not accessible  
- User Impact: Cannot perform admin actions

Deleted League Access Attempt:

- Display: "This league no longer exists"  
- Behavior:  
  - Remove league from user's list  
  - Redirect to dashboard  
  - Optionally save archived league data (future)  
- Fallback: Cannot access  
- User Impact: League history lost (unless archived)

Session Expired:

- Display: "Your session has expired. Please log in again."  
- Behavior:  
  - Redirect to login page  
  - Preserve attempted action for post-login  
  - Return to original page after re-auth  
- Fallback: Re-authentication required  
- User Impact: Must log in again

14.1.5 Empty States

No Leagues Joined:

- Display: Empty state illustration  
- Message: "You're not in any leagues yet"  
- CTAs:  
  - "Create Your First League" (primary button)  
  - "Join a League with Code" (secondary button)  
  - "Browse Public Leagues" (tertiary, if available)  
- Help text: Brief explanation of how leagues work

No Gymnasts in Roster:

- Display: Empty roster illustration  
- Message: "Your roster is empty"  
- CTA: "Browse Gymnasts" button  
- Help text: "Add gymnasts to your roster to start competing"

No Pending Trades:

- Display: Empty state illustration  
- Message: "No active trades"  
- CTA: "Propose a Trade" button  
- Help text: "Start trading to improve your team"

No Analytics Data Yet:

- Display: Empty state illustration  
- Message: "Not enough data to show analytics"  
- Explanation: "Analytics will appear after Week 1 completes"  
- CTA: "Set Your Lineup" button

No Search Results:

- Display: "No gymnasts found matching your criteria"  
- Suggestions:  
  - "Try different filters"  
  - "Clear all filters"  
  - "Search for a different name"  
- Show count of total available gymnasts

14.1.6 Loading & Processing States

Page Loading:

- Skeleton screens showing layout structure  
- Shimmer/pulse animation on placeholders  
- "Loading..." text for slower connections  
- Progress indicators for multi-step operations

Score Calculation in Progress:

- Display: "Calculating scores..." with spinner  
- Behavior:  
  - Show during batch score imports  
  - Update progress: "Processing meet X of Y"  
  - Complete: "Scores updated successfully"  
- Duration: Typically \<30 seconds

Trade Processing:

- Display: "Processing trade..." modal  
- Behavior:  
  - Prevent page navigation  
  - Show spinner  
  - On success: "Trade completed\!" with confetti animation  
  - On error: Specific error message  
- Duration: Typically \<3 seconds

CSV Upload Processing:

- Display: Progress bar "Uploading... X%"  
- Behavior:  
  - Show upload progress  
  - Then: "Validating data..."  
  - Show validation results  
  - Errors displayed in list with line numbers  
- Duration: Depends on file size

14.1.7 User Guidance & Warnings

First-Time User Tooltips:

- Contextual help on first interaction  
- "?" icons near complex features  
- "Learn More" links to documentation  
- Optional tutorial walkthrough

Confirmation Dialogs: Required for destructive actions:

- "Delete League" → "Are you sure? This cannot be undone."  
- "Clear All Gymnasts" → "Remove all gymnasts from lineup?"  
- "Cancel Trade" → "Cancel this trade proposal?"  
- "Drop Gymnast" → "Remove \[Name\] from your roster?"

All confirmations include:

- Clear description of action  
- Consequences explanation  
- "Confirm" button (red for destructive)  
- "Cancel" button (gray)  
- Optional "Don't ask again" checkbox (for non-critical actions)

Warning Banners:

- Lineup incomplete: 24 hours before lock  
- Trade deadline approaching: 3 days before  
- League nearing capacity: 2 spots remaining  
- Score discrepancy detected: Admin attention needed

14.1.8 Graceful Degradation

JavaScript Disabled:

- Display: "JavaScript is required for Gymcord Fantasy"  
- Provide basic functionality if possible  
- Show instructions to enable JavaScript

Slow Network:

- Reduce image quality  
- Simplify animations  
- Show "Using data-saver mode" indicator  
- Option to disable auto-refresh

Browser Compatibility:

- Detect unsupported browsers  
- Show warning with upgrade suggestion  
- Provide basic functionality for older browsers  
- Tested on: Chrome, Firefox, Safari, Edge (last 2 versions)

Mobile Data Usage:

- Option to enable "Low data mode"  
- Disable auto-loading of images  
- Reduce polling frequency  
- Show data usage estimate

14.1.9 Error Logging & Monitoring

Client-Side Error Tracking:

- All errors logged to monitoring service (e.g., Sentry)  
- Include: User ID, timestamp, browser, page, action  
- Privacy-compliant \- no PII in logs  
- Error categorization: Critical, High, Medium, Low

Server-Side Error Tracking:

- All API errors logged  
- Include: Endpoint, user, request params, stack trace  
- Alert thresholds for error rates  
- Auto-escalation for critical errors

Admin Error Dashboard:

- Real-time error monitoring  
- Filter by: Type, severity, user, time range  
- One-click resolution actions  
- Error trend graphs

User Error Reporting:

- "Report a Problem" link in footer  
- Pre-fills error details when appropriate  
- Allows user description  
- Includes screenshot option  
- Submits to support ticket system  
15. Testing Requirements

Critical User Flows to Test:

- User A creates league → receives code  
- User B joins with code → sees league  
- Both users see each other's teams in leaderboard  
- Lineup changes persist across browser refresh  
- Teams sync across different devices  
- League commissioner can modify rules  
- Players can only edit their own teams  
- Scores calculate correctly based on "X up, Y count" rules  
- Leaderboard updates when lineups change  
- Trade proposals and executions work correctly  
- Dark mode persists across sessions  
- Account switcher (testing) transitions smoothly  
16. Phase 1 Priorities (In Progress)

High Priority:

- ✓ Fix sign in flow  
- ✓ Fix backend data structure  
- ✓ Virtius data scraping integration  
- ✓ Past week view with correct score logic  
- ✓ Fix light mode (and implement dark mode)  
- ✓ Make admin view  
- ✓ Manual trade view for commissioner  
- ✓ Total points validation (Week 2 \< 400\)  
- ✓ Compiled trade view  
- ✓ Fix trade UX  
- ✓ Fix athlete card in trade UX  
- ✓ Roster import/export with CSV  
- ✓ Add scores UX  
- ✓ Status icons (byes, doubles, home/away, injuries)  
- ✓ Denote if score counted last week  
- ✓ Lineup set indicator  
- ✓ Require commissioner team naming  
- ✓ Google Analytics integration

Medium Priority:

- Waiver wire trades  
- Scheduled waiver wire with admin editing  
- Enhanced lineup features (populate all weeks, sparklines)  
- Advanced analytics (consistency, trend lines)  
- Actual vs max score views

Lower Priority:

- Road to Nationals integration  
- Advanced filtering options  
- Custom scoring formulas  
17. Out of Scope (Phase 1\)  
- Payments / subscriptions (beyond basic league limits)  
- Mobile native apps  
- Dynasty or keeper leagues  
- Automated notifications and reminders  
- In-app messaging between users  
- Live score updates during meets  
- Video highlights integration  
- Social sharing features  
18. Success Metrics

User Engagement:

- % of users setting lineups before lock  
- Average number of leagues per user  
- Return rate week-over-week  
- Trade volume and frequency

Technical Quality:

- Error-free score imports  
- Page load time \<2 seconds  
- Zero score calculation errors  
- System uptime \>99.5%

User Satisfaction:

- User trust in standings (qualitative)  
- Feature adoption rates  
- Dark mode usage percentage  
- Analytics page engagement  
- Support ticket volume (lower is better)  
19. Future Enhancements (Post-Phase 1\)  
- Mobile native applications (iOS, Android)  
- Push notifications for lineup deadlines  
- Dynasty and keeper league formats  
- Social features and league chat  
- Live meet tracking  
- Video integration  
- Enhanced statistical modeling  
- Machine learning lineup suggestions  
- Expanded trading marketplace  
- Premium analytics features  
- Multi-sport expansion (Men's NCAA, Elite, etc.)

