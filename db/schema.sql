-- =============================================================
-- Gymcord Fantasy — Database schema
-- Target: Supabase (Postgres)
-- =============================================================
-- Run this once in your Supabase project's SQL Editor.
--
-- Auth (users, sessions, password/Discord login) is handled entirely by
-- Supabase Auth (the built-in auth.users table) — we only add the
-- app-specific fields Supabase doesn't store itself.
-- =============================================================

-- ---------- Profiles ----------
-- One row per auth.users row: display name + app role.
create table if not exists public.profiles (
    id           uuid primary key references auth.users(id) on delete cascade,
    display_name text not null,
    role         text not null default 'player', -- 'player' | 'commissioner' | 'admin'
    created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are readable by their owner"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- Auto-create a profile row the first time someone signs in via Discord.
-- Supabase normalizes the Discord username into user_metadata.full_name.
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Player'));
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ---------- NCAA Teams ----------
-- The college programs gymnasts compete for. Kept small and stable; we
-- pre-populate from a seed script rather than expose a write API.
create table if not exists public.ncaa_teams (
    id            bigint generated always as identity primary key,
    slug          text not null unique,  -- e.g. 'oklahoma', 'lsu'
    name          text not null,         -- e.g. 'Oklahoma Sooners'
    short_name    text not null,         -- e.g. 'Oklahoma'
    conference    text,                  -- e.g. 'SEC', 'Big 12'
    primary_color text,                  -- hex like '#841617'
    division      text check (division in ('Div I', 'Div II', 'Div III')),  -- 2026 roadtonationals.com scrape; null for a handful of unmatched teams
    created_at    timestamptz not null default now()
);

alter table public.ncaa_teams enable row level security;

create policy "NCAA teams are publicly readable"
    on public.ncaa_teams for select
    using (true);

-- ---------- Gymnasts ----------
-- The pool of athletes users can draft. Event flags + per-event averages
-- tell the UI which events the gymnast competes on and how they've scored,
-- so players can make roster decisions per apparatus (matching how scoring
-- actually works — see PRD 10.1). Populated from a season roster CSV
-- (team/name/class) merged with a season's actual weekly scores by sheet
-- (VT/UB/BB/FX); gymnasts with no prior-season data (freshmen, transfers)
-- have every average as null until real scores come in.
create table if not exists public.gymnasts (
    id             bigint generated always as identity primary key,
    ncaa_team_id   bigint not null references public.ncaa_teams(id),
    first_name     text not null,
    last_name      text not null,
    class_year     text,  -- 'FR','SO','JR','SR','5TH','R-SO','R-JR','R-SR', etc.
    competes_vault boolean not null default false,
    competes_bars  boolean not null default false,
    competes_beam  boolean not null default false,
    competes_floor boolean not null default false,
    is_all_around  boolean not null default false,
    vault_avg      numeric(5,3),  -- season average on this event, null if they don't compete it / no data yet
    bars_avg       numeric(5,3),
    beam_avg       numeric(5,3),
    floor_avg      numeric(5,3),
    season_average numeric(5,3),  -- mean of whichever per-event averages exist (not a true all-around score)
    vault_nqs      numeric(5,3),  -- official NCAA National Qualifying Score, null if not yet calculable / no catalog match
    bars_nqs       numeric(5,3),
    beam_nqs       numeric(5,3),
    floor_nqs      numeric(5,3),
    aa_nqs         numeric(5,3),  -- only calculable for true all-around competitors
    active         boolean not null default true,
    created_at     timestamptz not null default now()
);

create index if not exists idx_gymnasts_ncaa_team_id on public.gymnasts(ncaa_team_id);
create index if not exists idx_gymnasts_last_name on public.gymnasts(last_name);

alter table public.gymnasts enable row level security;

create policy "Gymnasts are publicly readable"
    on public.gymnasts for select
    using (true);

-- ---------- Feedback ----------
-- Bug reports / feedback submitted from the persistent feedback button.
-- Captures the page it was logged from so admins have context.
create table if not exists public.feedback (
    id         bigint generated always as identity primary key,
    user_id    uuid references auth.users(id) on delete set null, -- null if submitted while logged out
    page_path  text not null,
    message    text not null,
    status     text not null default 'new', -- 'new' | 'reviewed' | 'resolved'
    created_at timestamptz not null default now()
);

create index if not exists idx_feedback_created_at on public.feedback(created_at);

alter table public.feedback enable row level security;

create policy "Anyone can submit feedback"
    on public.feedback for insert
    with check (true);

create policy "Admins can view feedback"
    on public.feedback for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

create policy "Admins can update feedback status"
    on public.feedback for update
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- ---------- Leagues ----------
-- A league is created by a commissioner with a roster/scoring format
-- (see PRD 3.1 "Up and Count"). join_code is the short token used in the
-- shareable invite link (/join/:code) — no separate numeric league id is
-- ever exposed to players.
create table if not exists public.leagues (
    id              bigint generated always as identity primary key,
    name            text not null,
    join_code       text not null unique,
    commissioner_id uuid not null references auth.users(id),
    roster_size     integer not null default 20,
    up_count        integer not null default 10,
    count_score     integer not null default 5,
    -- Trade rules (see PRD "Trade system") — all commissioner-configurable at creation.
    injury_trades_allowed  boolean not null default true,
    injury_trade_timing    text not null default 'as_it_happens',
    late_roster_adds       boolean not null default false,
    manual_injury_trades   boolean not null default false,
    season_ending_only     boolean not null default false,
    regular_season_trades  boolean not null default false,
    other_trade_rules      text,
    theme_text      text,
    -- Draft/trade/waiver settings from the Create League wizard (CreateLeague.tsx).
    -- These already existed on the live table — this block just catches
    -- schema.sql up to match, it was never captured here when they shipped.
    draft_style         text not null default 'previously_drafted' check (draft_style in ('previously_drafted', 'autodraft')),
    draft_order         text check (draft_order in ('snake', 'rotating', 'fixed')),
    autodraft_start_at  timestamptz,
    trade_mode          text not null default 'waiver' check (trade_mode in ('no_trades', 'waiver')),
    -- Day+time a waiver window closes, always 11:59 PM on the named day —
    -- see WAIVER_DAY_OPTIONS in CreateLeague.tsx for the full 7-value set.
    waiver_process_day  text default 'wed_2359' check (waiver_process_day in ('sun_2359', 'mon_2359', 'tue_2359', 'wed_2359', 'thu_2359', 'fri_2359', 'sat_2359')),
    waiver_priority     text default 'reverse_snake' check (waiver_priority in ('reverse_snake', 'reverse_rotating', 'reverse_fixed')),
    league_icon         text not null default 'star' check (league_icon in (
        'books', 'butterfly', 'coins', 'confetti', 'crown', 'dice-three', 'evergreen-tree', 'exam',
        'fast-forward', 'fire', 'gift', 'globe', 'graduation-cap', 'hand-peace', 'magic-wand', 'medal',
        'moon-stars', 'music-notes', 'palette', 'paw-print', 'shooting-star', 'snowflake', 'sparkle',
        'star', 'student', 'trophy', 'unicorn', 'yin-yang'
    )),
    created_at      timestamptz not null default now(),
    constraint roster_size_bounds check (roster_size between 5 and 50),
    constraint up_count_bounds check (up_count between 1 and roster_size),
    constraint count_score_bounds check (count_score between 1 and up_count),
    constraint injury_trade_timing_valid check (injury_trade_timing in ('as_it_happens', 'draft'))
);

-- Backfills the columns above on an already-provisioned database, where the
-- `create table if not exists` is a no-op — safe to re-run, and a no-op
-- itself against the live DB, which already has all of these.
alter table public.leagues add column if not exists theme_text text;
alter table public.leagues add column if not exists draft_style text not null default 'previously_drafted' check (draft_style in ('previously_drafted', 'autodraft'));
alter table public.leagues add column if not exists draft_order text check (draft_order in ('snake', 'rotating', 'fixed'));
alter table public.leagues add column if not exists autodraft_start_at timestamptz;
alter table public.leagues add column if not exists trade_mode text not null default 'waiver' check (trade_mode in ('no_trades', 'waiver'));
alter table public.leagues add column if not exists waiver_process_day text default 'wed_2359' check (waiver_process_day in ('sun_2359', 'mon_2359', 'tue_2359', 'wed_2359', 'thu_2359', 'fri_2359', 'sat_2359'));
alter table public.leagues add column if not exists waiver_priority text default 'reverse_snake' check (waiver_priority in ('reverse_snake', 'reverse_rotating', 'reverse_fixed'));
alter table public.leagues add column if not exists league_icon text not null default 'star' check (league_icon in (
    'books', 'butterfly', 'coins', 'confetti', 'crown', 'dice-three', 'evergreen-tree', 'exam',
    'fast-forward', 'fire', 'gift', 'globe', 'graduation-cap', 'hand-peace', 'magic-wand', 'medal',
    'moon-stars', 'music-notes', 'palette', 'paw-print', 'shooting-star', 'snowflake', 'sparkle',
    'star', 'student', 'trophy', 'unicorn', 'yin-yang'
));

create index if not exists idx_leagues_join_code on public.leagues(join_code);

alter table public.leagues enable row level security;

create policy "Leagues are publicly readable"
    on public.leagues for select
    using (true);

create policy "Authenticated users can create a league as themselves"
    on public.leagues for insert
    with check (auth.uid() = commissioner_id);

-- ---------- League Members ----------
-- One row per team in a league. The commissioner gets a row here too,
-- like any other player, once they name their team.
create table if not exists public.league_members (
    id        bigint generated always as identity primary key,
    league_id bigint not null references public.leagues(id) on delete cascade,
    user_id   uuid not null references auth.users(id) on delete cascade,
    team_name text not null,
    joined_at timestamptz not null default now(),
    unique (league_id, user_id),
    unique (league_id, team_name)
);

create index if not exists idx_league_members_league_id on public.league_members(league_id);
create index if not exists idx_league_members_user_id on public.league_members(user_id);

alter table public.league_members enable row level security;

create policy "League members are publicly readable"
    on public.league_members for select
    using (true);

create policy "Users can join a league as themselves"
    on public.league_members for insert
    with check (auth.uid() = user_id);

-- ---------- Score import week/season derivation ----------
-- Fixed system-wide rules (PRD 12.3): season starts January 2 each year,
-- lineups lock every Friday 9:00 AM ET. Meets happen after that lock
-- through the following Thursday, so weeks are anchored to Fridays:
-- Week 1 = the first Friday on/after Jan 2 of that season through the
-- following Thursday; each later week is a 7-day block from there. Any
-- meet_date before that first Friday (e.g. an early exhibition) clamps
-- into Week 1 rather than going negative.
create or replace function public.week_number_for_meet_date(meet_date date)
returns integer
language sql
immutable
set search_path = public, pg_temp
as $$
    with season as (
        select make_date(extract(year from meet_date)::int, 1, 2) as season_start
    ),
    lock as (
        select season_start + ((5 - extract(dow from season_start)::int + 7) % 7) as first_friday
        from season
    )
    select greatest(1, ((meet_date - first_friday) / 7) + 1)
    from lock;
$$;

-- The NCAA season runs entirely within one calendar year (Jan-April), so
-- season_year is just the meet_date's year.
create or replace function public.season_year_for_meet_date(meet_date date)
returns integer
language sql
immutable
set search_path = public, pg_temp
as $$
    select extract(year from meet_date)::int;
$$;

-- ---------- Score Import Batches ----------
-- One row per CSV upload (PRD 13.5.3 Scores Import CSV), for admin audit
-- history.
create table if not exists public.score_import_batches (
    id             bigint generated always as identity primary key,
    uploaded_by    uuid references auth.users(id) on delete set null,
    filename       text not null,
    season_year    integer not null,
    row_count      integer not null default 0,
    inserted_count integer not null default 0,
    flagged_count  integer not null default 0,
    created_at     timestamptz not null default now()
);

alter table public.score_import_batches enable row level security;

create policy "Admins can view import batches"
    on public.score_import_batches for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

create policy "Admins can create import batches"
    on public.score_import_batches for insert
    with check (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- ---------- Score Import Flagged Rows ----------
-- CSV rows that couldn't be auto-inserted: either gymnast_name +
-- gymnast_school didn't resolve to exactly one gymnast ('no_gymnast_match'),
-- or the row matched an existing score for the same gymnast/event/week
-- ('possible_duplicate'). Held here for manual admin approval rather than
-- silently dropped or auto-inserted.
create table if not exists public.score_import_flagged_rows (
    id                   bigint generated always as identity primary key,
    batch_id             bigint not null references public.score_import_batches(id) on delete cascade,
    row_number           integer not null,
    meet_date            date not null,
    gymnast_name         text not null,
    gymnast_school       text not null,
    event                text not null check (event in ('vault','bars','beam','floor')),
    score                numeric(5,3) not null,
    meet_name            text,
    opponent             text,
    location             text check (location in ('home','away')),
    reason               text not null check (reason in ('no_gymnast_match', 'possible_duplicate')),
    matched_gymnast_id   bigint references public.gymnasts(id),
    status               text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    resolved_gymnast_id  bigint references public.gymnasts(id),
    resolved_by          uuid references auth.users(id),
    resolved_at          timestamptz,
    created_at           timestamptz not null default now()
);

create index if not exists idx_score_import_flagged_rows_batch_id on public.score_import_flagged_rows(batch_id);

alter table public.score_import_flagged_rows add column if not exists location text check (location in ('home','away'));
create index if not exists idx_score_import_flagged_rows_status on public.score_import_flagged_rows(status);

alter table public.score_import_flagged_rows enable row level security;

create policy "Admins can view flagged rows"
    on public.score_import_flagged_rows for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

create policy "Admins can create flagged rows"
    on public.score_import_flagged_rows for insert
    with check (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

create policy "Admins can resolve flagged rows"
    on public.score_import_flagged_rows for update
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- ---------- Scores ----------
-- One row per gymnast/event/week of actual competition scoring.
-- Populated from a season's meet-by-meet results (see 2026 Competition
-- Data); admins will enter new weeks manually until a live scores API
-- (Road to Nationals / Virtius) is available. meet_date/meet_name/opponent
-- and import_batch_id are nullable — the pre-loaded 2026 season data
-- predates the CSV import flow (see "Scores Import" below) and has no
-- source meet on file; only rows created through that flow populate them.
-- location is nullable for the same reason, plus admins may simply not
-- know it for a given row — it exists so individual NQS (PRD 10.9: 3
-- highest home + 3 highest away scores, drop the top of those six,
-- average the rest) becomes computable once enough rows have it, without
-- retrofitting the historical 2026 data.
create table if not exists public.scores (
    id              bigint generated always as identity primary key,
    gymnast_id      bigint not null references public.gymnasts(id) on delete cascade,
    event           text not null check (event in ('vault','bars','beam','floor')),
    season_year     integer not null default 2026,
    week_number     integer not null,
    score           numeric(5,3) not null,
    meet_date       date,
    meet_name       text,
    opponent        text,
    location        text check (location in ('home','away')),
    import_batch_id bigint references public.score_import_batches(id) on delete set null,
    created_at      timestamptz not null default now()
);

-- Backfills the column on an already-provisioned database, where the
-- `create table if not exists` above is a no-op — safe to re-run.
alter table public.scores add column if not exists location text check (location in ('home','away'));

create index if not exists idx_scores_gymnast_id on public.scores(gymnast_id);
create index if not exists idx_scores_import_batch_id on public.scores(import_batch_id);

alter table public.scores enable row level security;

create policy "Scores are publicly readable"
    on public.scores for select
    using (true);

-- scores previously had no insert policy at all (only the select policy
-- above), so admin CSV import couldn't write through the anon/authenticated
-- client — this is required for that flow to function.
create policy "Admins can insert scores"
    on public.scores for insert
    with check (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

create policy "Admins can update scores"
    on public.scores for update
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- A gymnast can legitimately have two scores for the same event in the
-- same week (two meets that week) — those aren't duplicates, and meet_date
-- is what disambiguates them. A true duplicate is the same gymnast/event/
-- meet_date entered twice; enforce that at the DB level. Partial (meet_date
-- is not null) so the ~18k legacy rows with no meet_date on file (imported
-- before this column existed) are unaffected.
create unique index if not exists uq_scores_gymnast_event_meet_date
    on public.scores (gymnast_id, event, meet_date)
    where meet_date is not null;

-- ---------- Roster Gymnasts ----------
-- One row per (team, gymnast): Phase 1 manual roster-building (PRD 9.0.3
-- Method 1) — first-come-first-served, no draft. league_id is denormalized
-- alongside league_member_id so a gymnast's exclusivity can be enforced
-- league-wide (one team per league), not just within a single team.
create table if not exists public.roster_gymnasts (
    id               bigint generated always as identity primary key,
    league_id        bigint not null references public.leagues(id) on delete cascade,
    league_member_id bigint not null references public.league_members(id) on delete cascade,
    gymnast_id       bigint not null references public.gymnasts(id) on delete cascade,
    created_at       timestamptz not null default now(),
    unique (league_id, gymnast_id),
    unique (league_member_id, gymnast_id)
);

create index if not exists idx_roster_gymnasts_league_id on public.roster_gymnasts(league_id);
create index if not exists idx_roster_gymnasts_league_member_id on public.roster_gymnasts(league_member_id);
create index if not exists idx_roster_gymnasts_gymnast_id on public.roster_gymnasts(gymnast_id);

alter table public.roster_gymnasts enable row level security;

create policy "Roster gymnasts are publicly readable"
    on public.roster_gymnasts for select
    using (true);

create policy "Users can add gymnasts to their own team roster"
    on public.roster_gymnasts for insert
    with check (exists (
        select 1 from public.league_members
        where league_members.id = roster_gymnasts.league_member_id
        and league_members.user_id = auth.uid()
    ));

create policy "Users can remove gymnasts from their own team roster"
    on public.roster_gymnasts for delete
    using (exists (
        select 1 from public.league_members
        where league_members.id = roster_gymnasts.league_member_id
        and league_members.user_id = auth.uid()
    ));

-- ---------- Lineup Selections ----------
-- Presence-based, same convention as roster_gymnasts: a row means "this
-- gymnast is up for this event this week" — selecting inserts a row,
-- deselecting deletes it. No boolean flag to keep in sync.
create table if not exists public.lineup_selections (
    id                 bigint generated always as identity primary key,
    league_member_id   bigint not null references public.league_members(id) on delete cascade,
    league_id          bigint not null references public.leagues(id) on delete cascade,
    gymnast_id         bigint not null references public.gymnasts(id) on delete cascade,
    event              text not null check (event in ('vault','bars','beam','floor')),
    season_year        integer not null,
    week_number        integer not null,
    created_at         timestamptz not null default now()
);

create unique index if not exists uq_lineup_selections_slot
    on public.lineup_selections (league_member_id, gymnast_id, event, season_year, week_number);
create index if not exists idx_lineup_selections_league_member_id on public.lineup_selections(league_member_id);
create index if not exists idx_lineup_selections_league_id on public.lineup_selections(league_id);

alter table public.lineup_selections enable row level security;

create policy "Lineup selections are publicly readable"
    on public.lineup_selections for select
    using (true);

create policy "Users can select gymnasts for their own team's lineup"
    on public.lineup_selections for insert
    with check (exists (
        select 1 from public.league_members
        where league_members.id = lineup_selections.league_member_id
        and league_members.user_id = auth.uid()
    ));

create policy "Users can deselect gymnasts from their own team's lineup"
    on public.lineup_selections for delete
    using (exists (
        select 1 from public.league_members
        where league_members.id = lineup_selections.league_member_id
        and league_members.user_id = auth.uid()
    ));

-- ---------- Gymnast Meet Schedule ----------
-- One row per scheduled meet for a gymnast in a given week (Lineups Page
-- Requirements §0.2). Bye and double-meet are derived from row count, not
-- stored flags: 0 rows this week = bye, 2 rows = double meet. Admin-curated
-- (same access pattern as scores), since nothing else populates this.
create table if not exists public.gymnast_meet_schedule (
    id             bigint generated always as identity primary key,
    gymnast_id     bigint not null references public.gymnasts(id) on delete cascade,
    season_year    integer not null,
    week_number    integer not null,
    meet_date      date not null,
    meet_time      text,
    opponent       text,
    location       text check (location in ('home','away')),
    meet_format    text check (meet_format in ('dual','tri','quad')),
    created_at     timestamptz not null default now()
);

create index if not exists idx_gymnast_meet_schedule_gymnast_week
    on public.gymnast_meet_schedule(gymnast_id, season_year, week_number);

alter table public.gymnast_meet_schedule enable row level security;

create policy "Gymnast meet schedule is publicly readable"
    on public.gymnast_meet_schedule for select
    using (true);

create policy "Admins can insert gymnast meet schedule rows"
    on public.gymnast_meet_schedule for insert
    with check (exists (
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'admin'
    ));

create policy "Admins can update gymnast meet schedule rows"
    on public.gymnast_meet_schedule for update
    using (exists (
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'admin'
    ));

create policy "Admins can delete gymnast meet schedule rows"
    on public.gymnast_meet_schedule for delete
    using (exists (
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'admin'
    ));

-- ---------- Gymnast injury status & school logos (Lineups Page Requirements §0.3-0.4) ----------
-- Current-state, not week-scoped — "whatever the admin has most recently
-- published," per the PRD. Admin-curated alongside gymnast_meet_schedule.
alter table public.gymnasts add column if not exists injury_status text not null default 'healthy'
    check (injury_status in ('healthy', 'short_term', 'long_term'));
alter table public.gymnasts add column if not exists injury_note text;

create policy "Admins can update gymnasts"
    on public.gymnasts for update
    using (exists (
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'admin'
    ));

alter table public.ncaa_teams add column if not exists logo_url text;

-- ---------- Score metrics views ----------
-- Computed score-metrics layer over `scores` — not flat columns, so future
-- seasons compute automatically as rows are added instead of needing a new
-- import/backfill step each week. Backs api.scoreMetrics() in the frontend
-- (see gymcord_fantasy_score_view_metrics memory for the fuller history).

-- One row per gymnast/season/week/event, deduped defensively (avg() collapses
-- the rare duplicate data-entry row rather than double-counting a meet).
create or replace view public.gymnast_event_week_scores
with (security_invoker = true) as
select
    gymnast_id,
    season_year,
    week_number,
    event,
    avg(score) as score,
    min(meet_date) as meet_date,
    min(location) as location
from public.scores
group by gymnast_id, season_year, week_number, event;

comment on view public.gymnast_event_week_scores is
    'One row per gymnast/season/week/event, deduped from raw scores. Building block for gymnast_event_scores_all.';

-- Derived all-around score per meet: sum of vault+bars+beam+floor for weeks
-- where a gymnast has all four events recorded (i.e. she actually went
-- all-around that meet). Grouped by week_number rather than meet_date since
-- meet_date is null on nearly all rows in practice.
create or replace view public.gymnast_aa_week_scores
with (security_invoker = true) as
select
    gymnast_id,
    season_year,
    week_number,
    sum(score) as score,
    min(meet_date) as meet_date,
    min(location) as location
from public.gymnast_event_week_scores
group by gymnast_id, season_year, week_number
having count(*) = 4;

comment on view public.gymnast_aa_week_scores is
    'Derived all-around total per meet (sum of VT/UB/BB/FX), only for weeks a gymnast competed all four events.';

-- Unified per-meet score feed across VT/UB/BB/FX/AA, so the metrics view
-- below treats all-around like any other event instead of needing separate logic.
create or replace view public.gymnast_event_scores_all
with (security_invoker = true) as
select gymnast_id, season_year, week_number, event, score, meet_date, location
from public.gymnast_event_week_scores
union all
select gymnast_id, season_year, week_number, 'aa' as event, score, meet_date, location
from public.gymnast_aa_week_scores;

comment on view public.gymnast_event_scores_all is
    'Per-meet scores for vault/bars/beam/floor plus derived aa, one feed for gymnast_event_season_metrics.';

-- Average / Median / Most Recent / High / NQS / Average-Home / Average-Away /
-- Rolling-3-Meet-Average per gymnast x event(vault/bars/beam/floor/aa) x
-- season. NQS (individual per-event National Qualifying Score): 3 highest
-- home + 3 highest away scores this season (6 total), drop the single
-- highest of those six, average the remaining five. Requires >=3 home and
-- >=3 away scores to be calculable; null otherwise.
create or replace view public.gymnast_event_season_metrics
with (security_invoker = true) as
with base as (
    select * from public.gymnast_event_scores_all
),
agg as (
    select
        gymnast_id,
        event,
        season_year,
        avg(score) as average_score,
        percentile_cont(0.5) within group (order by score) as median_score,
        max(score) as high_score,
        count(*) as meet_count,
        count(*) filter (where location = 'home') as home_count,
        count(*) filter (where location = 'away') as away_count,
        avg(score) filter (where location = 'home') as avg_home_score,
        avg(score) filter (where location = 'away') as avg_away_score
    from base
    group by gymnast_id, event, season_year
),
most_recent as (
    select distinct on (gymnast_id, event, season_year)
        gymnast_id, event, season_year,
        score as most_recent_score,
        week_number as most_recent_week
    from base
    order by gymnast_id, event, season_year, week_number desc, meet_date desc nulls last
),
nqs_pool as (
    select
        gymnast_id, event, season_year, score,
        row_number() over (
            partition by gymnast_id, event, season_year, location
            order by score desc
        ) as location_rank
    from base
    where location is not null
),
nqs_calc as (
    select gymnast_id, event, season_year,
        (sum(score) - max(score)) / 5 as nqs
    from nqs_pool
    where location_rank <= 3
    group by gymnast_id, event, season_year
),
rolling_pool as (
    select
        gymnast_id, event, season_year, score,
        row_number() over (
            partition by gymnast_id, event, season_year
            order by week_number desc, meet_date desc nulls last
        ) as recency_rank
    from base
),
rolling_calc as (
    select gymnast_id, event, season_year, avg(score) as rolling3_score
    from rolling_pool
    where recency_rank <= 3
    group by gymnast_id, event, season_year
)
select
    a.gymnast_id,
    a.event,
    a.season_year,
    round(a.average_score::numeric, 3) as average_score,
    round(a.median_score::numeric, 3) as median_score,
    mr.most_recent_score,
    mr.most_recent_week,
    a.high_score,
    a.meet_count,
    a.home_count,
    a.away_count,
    case when a.home_count >= 3 and a.away_count >= 3 then round(n.nqs::numeric, 3) else null end as nqs,
    round(a.avg_home_score::numeric, 3) as avg_home_score,
    round(a.avg_away_score::numeric, 3) as avg_away_score,
    round(r.rolling3_score::numeric, 3) as rolling3_score
from agg a
left join most_recent mr using (gymnast_id, event, season_year)
left join nqs_calc n using (gymnast_id, event, season_year)
left join rolling_calc r using (gymnast_id, event, season_year);

comment on view public.gymnast_event_season_metrics is
    'Average/Median/Most Recent/High/NQS/AvgHome/AvgAway/Rolling3 per gymnast x event(vault/bars/beam/floor/aa) x season_year, computed live from scores. Backs api.scoreMetrics() in the frontend.';

grant select on public.gymnast_event_week_scores to anon, authenticated;
grant select on public.gymnast_aa_week_scores to anon, authenticated;
grant select on public.gymnast_event_scores_all to anon, authenticated;
grant select on public.gymnast_event_season_metrics to anon, authenticated;

-- ---------- Roster size cap ----------
-- roster_gymnasts had no enforcement of leagues.roster_size (default 20,
-- commissioner-configurable 5-50) — any number of gymnasts could be added to
-- one team regardless of the league's configured cap. security invoker (not
-- definer) is enough since both leagues and roster_gymnasts already have
-- public-read RLS policies, and trigger firing doesn't require the invoking
-- role to hold execute on the trigger function.
create or replace function public.enforce_roster_size()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
    v_roster_size integer;
    v_current_count integer;
begin
    select roster_size into v_roster_size
    from public.leagues
    where id = new.league_id;

    select count(*) into v_current_count
    from public.roster_gymnasts
    where league_member_id = new.league_member_id;

    if v_current_count >= v_roster_size then
        raise exception 'Roster is full (% of % spots filled)', v_current_count, v_roster_size
            using errcode = 'check_violation';
    end if;

    return new;
end;
$$;

comment on function public.enforce_roster_size is
    'Blocks inserting a gymnast onto a roster_gymnasts row once the team already has league.roster_size gymnasts.';

revoke execute on function public.enforce_roster_size() from public, anon, authenticated;

drop trigger if exists roster_gymnasts_enforce_size on public.roster_gymnasts;
create trigger roster_gymnasts_enforce_size
    before insert on public.roster_gymnasts
    for each row
    execute function public.enforce_roster_size();

-- =============================================================
-- Future tables (Trades, Waivers, Draft, etc.) will be added in
-- later migrations.
-- =============================================================
