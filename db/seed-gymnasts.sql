-- =============================================================
-- Gymcord Fantasy — Seed: NCAA teams + a starter pool of gymnasts
-- Target: Supabase (Postgres)
-- =============================================================
-- Idempotent: safe to re-run. Teams are skipped on conflicting slug;
-- gymnasts are skipped when a matching team + first/last name already
-- exists.
--
-- This is a *starter* dataset intended for local development. Roster
-- composition, class years, and season averages are illustrative and
-- will be replaced once we wire up the real meet-data import.
-- =============================================================

-- ---------- Teams ----------
insert into public.ncaa_teams (slug, name, short_name, conference, primary_color)
values
    ('oklahoma',     'Oklahoma Sooners',         'Oklahoma',     'Big 12',  '#841617'),
    ('lsu',          'LSU Tigers',               'LSU',          'SEC',     '#461D7C'),
    ('florida',      'Florida Gators',           'Florida',      'SEC',     '#FA4616'),
    ('utah',         'Utah Utes',                'Utah',         'Big 12',  '#CC0000'),
    ('ucla',         'UCLA Bruins',              'UCLA',         'Big Ten', '#2774AE'),
    ('cal',          'California Golden Bears',  'Cal',          'Big Ten', '#003262'),
    ('michigan',     'Michigan Wolverines',      'Michigan',     'Big Ten', '#00274C'),
    ('alabama',      'Alabama Crimson Tide',     'Alabama',      'SEC',     '#9E1B32'),
    ('auburn',       'Auburn Tigers',            'Auburn',       'SEC',     '#03244D'),
    ('stanford',     'Stanford Cardinal',        'Stanford',     'ACC',     '#8C1515'),
    ('kentucky',     'Kentucky Wildcats',        'Kentucky',     'SEC',     '#0033A0'),
    ('oregon-state', 'Oregon State Beavers',     'Oregon State', 'Big 12',  '#DC4405')
on conflict (slug) do nothing;

-- ---------- Gymnasts ----------
-- Columns: TeamSlug, First, Last, Class, Vault, Bars, Beam, Floor, AllAround, SeasonAvg
insert into public.gymnasts (
    ncaa_team_id, first_name, last_name, class_year,
    competes_vault, competes_bars, competes_beam, competes_floor,
    is_all_around, season_average
)
select t.id, s.first_name, s.last_name, s.class_year,
       s.vault, s.bars, s.beam, s.floor, s.all_around, s.season_avg
from (values
    -- Oklahoma
    ('oklahoma',     'Jordan',   'Bowers',     'SR', true,  true,  true,  true,  true,  9.890),
    ('oklahoma',     'Faith',    'Torrez',     'JR', true,  true,  true,  true,  true,  9.860),
    ('oklahoma',     'Audrey',   'Davis',      'SR', false, true,  true,  false, false, 9.875),
    ('oklahoma',     'Danielle', 'Sievers',    'SO', true,  false, false, true,  false, 9.825),
    ('oklahoma',     'Meilin',   'Sullivan',   'FR', true,  true,  true,  true,  true,  9.835),

    -- LSU
    ('lsu',          'Aleah',    'Finnegan',   'GR', true,  true,  true,  true,  true,  9.905),
    ('lsu',          'Konnor',   'McClain',    'JR', false, true,  true,  false, false, 9.880),
    ('lsu',          'Kailin',   'Chio',       'SO', true,  true,  true,  true,  true,  9.870),
    ('lsu',          'Haleigh',  'Bryant',     'GR', true,  true,  true,  true,  true,  9.910),
    ('lsu',          'Sierra',   'Ballard',    'JR', true,  false, false, true,  false, 9.830),

    -- Florida
    ('florida',      'Leanne',   'Wong',       'GR', true,  true,  true,  true,  true,  9.895),
    ('florida',      'Sloane',   'Blakely',    'SR', false, false, true,  true,  false, 9.845),
    ('florida',      'Selena',   'Harris',     'SR', true,  true,  true,  true,  true,  9.870),
    ('florida',      'Skye',     'Blakely',    'JR', true,  true,  true,  true,  true,  9.865),
    ('florida',      'Anya',     'Pilgrim',    'SO', false, true,  true,  false, false, 9.815),

    -- Utah
    ('utah',         'Maile',    'O''Keefe',   'GR', false, true,  true,  true,  false, 9.900),
    ('utah',         'Grace',    'McCallum',   'SR', true,  true,  true,  true,  true,  9.885),
    ('utah',         'Avery',    'Neff',       'JR', true,  true,  true,  true,  true,  9.870),
    ('utah',         'Jaedyn',   'Rucker',     'SR', true,  false, false, false, false, 9.840),
    ('utah',         'Makenna',  'Smith',      'SO', false, true,  true,  true,  false, 9.825),

    -- UCLA
    ('ucla',         'Jordan',   'Chiles',     'GR', true,  true,  true,  true,  true,  9.905),
    ('ucla',         'Emma',     'Malabuyo',   'GR', true,  true,  true,  true,  true,  9.880),
    ('ucla',         'Brooklyn', 'Moors',      'GR', false, true,  true,  true,  false, 9.855),
    ('ucla',         'Chae',     'Campbell',   'SR', false, false, true,  true,  false, 9.825),
    ('ucla',         'Ciena',    'Alipio',     'SO', false, true,  true,  true,  false, 9.810),

    -- Cal
    ('cal',          'eMjae',    'Frazier',    'SR', true,  false, true,  true,  false, 9.845),
    ('cal',          'Maddie',   'Williams',   'SR', false, true,  true,  false, false, 9.830),
    ('cal',          'Ondine',   'Achampong',  'SO', true,  true,  true,  true,  true,  9.855),
    ('cal',          'Mya',      'Lauzon',     'JR', true,  true,  true,  true,  true,  9.820),

    -- Michigan
    ('michigan',     'Sierra',   'Brooks',     'GR', true,  true,  true,  true,  true,  9.860),
    ('michigan',     'Carly',    'Bauman',     'SR', true,  true,  true,  true,  true,  9.840),
    ('michigan',     'Reyna',    'Guggino',    'JR', true,  false, false, true,  false, 9.795),
    ('michigan',     'Kaylen',   'Morgan',     'SR', false, false, true,  true,  false, 9.810),

    -- Alabama
    ('alabama',      'Lilly',    'Hudson',     'JR', true,  true,  true,  true,  true,  9.830),
    ('alabama',      'Cameron',  'Machado',    'SO', false, true,  true,  false, false, 9.805),
    ('alabama',      'Mati',     'Waligora',   'JR', true,  true,  true,  true,  true,  9.825),
    ('alabama',      'Shania',   'Adams',      'GR', false, false, true,  true,  false, 9.810),

    -- Auburn
    ('auburn',       'Sophia',   'Groth',      'SR', true,  true,  true,  true,  true,  9.825),
    ('auburn',       'Cassie',   'Stevens',    'SR', false, true,  true,  true,  false, 9.815),
    ('auburn',       'Gabby',    'McLaughlin', 'JR', true,  false, false, true,  false, 9.790),
    ('auburn',       'Karis',    'Spann',      'SO', true,  true,  true,  true,  true,  9.800),

    -- Stanford
    ('stanford',     'Chloe',    'Widner',     'SR', true,  false, true,  true,  false, 9.815),
    ('stanford',     'Brenna',   'Neault',     'JR', true,  true,  true,  true,  true,  9.825),
    ('stanford',     'Khazia',   'Hislop',     'SO', false, true,  true,  false, false, 9.785),

    -- Kentucky
    ('kentucky',     'Raena',    'Worley',     'GR', true,  true,  true,  true,  true,  9.845),
    ('kentucky',     'Bailey',   'Bunn',       'SR', false, true,  true,  false, false, 9.795),
    ('kentucky',     'Isabella', 'Magnelli',   'JR', true,  true,  true,  true,  true,  9.815),

    -- Oregon State
    ('oregon-state', 'Jade',     'Carey',      'GR', true,  true,  true,  true,  true,  9.895),
    ('oregon-state', 'Lana',     'Navarro',    'SR', false, false, true,  true,  false, 9.810),
    ('oregon-state', 'Madi',     'Dagen',      'SR', true,  true,  true,  true,  true,  9.825)
) as s(team_slug, first_name, last_name, class_year, vault, bars, beam, floor, all_around, season_avg)
join public.ncaa_teams t on t.slug = s.team_slug
where not exists (
    select 1 from public.gymnasts g
    where g.ncaa_team_id = t.id
      and g.first_name = s.first_name
      and g.last_name = s.last_name
);
