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

-- =============================================================
-- Future tables (Leagues, FantasyTeams, Rosters, Scores, Trades, etc.)
-- will be added in later migrations.
-- =============================================================
