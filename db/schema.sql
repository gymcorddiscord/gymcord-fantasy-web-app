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
    created_at    timestamptz not null default now()
);

alter table public.ncaa_teams enable row level security;

create policy "NCAA teams are publicly readable"
    on public.ncaa_teams for select
    using (true);

-- ---------- Gymnasts ----------
-- The pool of athletes users can draft. Event flags tell the UI which
-- events the gymnast competes on so we can filter / build lineups later.
create table if not exists public.gymnasts (
    id             bigint generated always as identity primary key,
    ncaa_team_id   bigint not null references public.ncaa_teams(id),
    first_name     text not null,
    last_name      text not null,
    class_year     text,  -- 'FR','SO','JR','SR','GR'
    competes_vault boolean not null default false,
    competes_bars  boolean not null default false,
    competes_beam  boolean not null default false,
    competes_floor boolean not null default false,
    is_all_around  boolean not null default false,
    season_average numeric(5,3),  -- e.g. 9.875 (all-around average)
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
    created_at      timestamptz not null default now(),
    constraint roster_size_bounds check (roster_size between 5 and 50),
    constraint up_count_bounds check (up_count between 1 and roster_size),
    constraint count_score_bounds check (count_score between 1 and up_count)
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

-- =============================================================
-- Future tables (Rosters, Scores, Trades, etc.) will be added in
-- later migrations.
-- =============================================================
