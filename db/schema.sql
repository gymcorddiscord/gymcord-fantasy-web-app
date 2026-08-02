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
    created_at      timestamptz not null default now(),
    constraint roster_size_bounds check (roster_size between 5 and 50),
    constraint up_count_bounds check (up_count between 1 and roster_size),
    constraint count_score_bounds check (count_score between 1 and up_count),
    constraint injury_trade_timing_valid check (injury_trade_timing in ('as_it_happens', 'draft'))
);

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
    reason               text not null check (reason in ('no_gymnast_match', 'possible_duplicate')),
    matched_gymnast_id   bigint references public.gymnasts(id),
    status               text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    resolved_gymnast_id  bigint references public.gymnasts(id),
    resolved_by          uuid references auth.users(id),
    resolved_at          timestamptz,
    created_at           timestamptz not null default now()
);

create index if not exists idx_score_import_flagged_rows_batch_id on public.score_import_flagged_rows(batch_id);
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
    import_batch_id bigint references public.score_import_batches(id) on delete set null,
    created_at      timestamptz not null default now()
);

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

-- =============================================================
-- Future tables (Trades, Waivers, Draft, etc.) will be added in
-- later migrations.
-- =============================================================
