/**
 * Data access layer, backed directly by Supabase (Postgres + PostgREST) —
 * no custom backend. Auth lives in AuthContext; this file covers reads of
 * public catalog data and feedback submission.
 */
import { supabase } from './supabase';

export interface User {
    id: string;
    email: string | null;
    displayName: string;
    role: 'player' | 'commissioner' | 'admin' | string;
}

export type Division = 'Div I' | 'Div II' | 'Div III';

export interface NcaaTeam {
    id: number;
    slug: string;
    name: string;
    shortName: string;
    conference: string | null;
    color: string | null;
    division: Division | null;
}

export interface Gymnast {
    id: number;
    firstName: string;
    lastName: string;
    classYear: string | null;
    events: {
        vault: boolean;
        bars: boolean;
        beam: boolean;
        floor: boolean;
        allAround: boolean;
    };
    eventAverages: {
        vault: number | null;
        bars: number | null;
        beam: number | null;
        floor: number | null;
    };
    // Official NCAA National Qualifying Score — 2026 regular-season
    // snapshot scraped from roadtonationals.com, null where not yet
    // calculable (needs >=3 home + >=3 away scores) or no catalog match.
    eventNqs: {
        vault: number | null;
        bars: number | null;
        beam: number | null;
        floor: number | null;
    };
    aaNqs: number | null;
    seasonAverage: number | null;
    team: NcaaTeam;
}

export interface League {
    id: number;
    name: string;
    joinCode: string;
    commissionerId: string;
    rosterSize: number;
    upCount: number;
    countScore: number;
    injuryTradesAllowed: boolean;
    injuryTradeTiming: 'as_it_happens' | 'draft';
    lateRosterAdds: boolean;
    manualInjuryTrades: boolean;
    seasonEndingOnly: boolean;
    regularSeasonTrades: boolean;
    otherTradeRules: string | null;
}

export interface LeagueMembership {
    id: number;
    leagueId: number;
    userId: string;
    teamName: string;
    teamColor1: string | null;
    teamColor2: string | null;
    league: League;
}

/** Thrown by `joinLeague` for the two spec'd unique-constraint conflicts, so pages can render the exact matching error copy without parsing Postgres error text themselves. */
export class JoinLeagueError extends Error {
    constructor(public reason: 'already_member' | 'team_name_taken', message: string) {
        super(message);
        this.name = 'JoinLeagueError';
    }
}

export type EventFilter = 'vault' | 'bars' | 'beam' | 'floor' | 'aa';

const EVENT_COLUMN: Record<EventFilter, string> = {
    vault: 'competes_vault',
    bars: 'competes_bars',
    beam: 'competes_beam',
    floor: 'competes_floor',
    aa: 'is_all_around'
};

function toNcaaTeam(row: any): NcaaTeam {
    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        shortName: row.short_name,
        conference: row.conference,
        color: row.primary_color,
        division: row.division
    };
}

function toLeague(row: any): League {
    return {
        id: row.id,
        name: row.name,
        joinCode: row.join_code,
        commissionerId: row.commissioner_id,
        rosterSize: row.roster_size,
        upCount: row.up_count,
        countScore: row.count_score,
        injuryTradesAllowed: row.injury_trades_allowed,
        injuryTradeTiming: row.injury_trade_timing,
        lateRosterAdds: row.late_roster_adds,
        manualInjuryTrades: row.manual_injury_trades,
        seasonEndingOnly: row.season_ending_only,
        regularSeasonTrades: row.regular_season_trades,
        otherTradeRules: row.other_trade_rules
    };
}

function toMembership(row: any): LeagueMembership {
    return {
        id: row.id,
        leagueId: row.league_id,
        userId: row.user_id,
        teamName: row.team_name,
        teamColor1: row.team_color_1,
        teamColor2: row.team_color_2,
        league: toLeague(row.leagues)
    };
}

const MEMBERSHIP_SELECT = 'id, league_id, user_id, team_name, team_color_1, team_color_2, leagues (*)';

// No 0/O/1/I — avoids ambiguous characters in a code someone has to read
// off a screen or type out.
const JOIN_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomJoinCode(): string {
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += JOIN_CODE_ALPHABET[Math.floor(Math.random() * JOIN_CODE_ALPHABET.length)];
    }
    return code;
}

export const api = {
    ncaaTeams: async (): Promise<{ teams: NcaaTeam[] }> => {
        const { data, error } = await supabase
            .from('ncaa_teams')
            .select('id, slug, name, short_name, conference, primary_color, division')
            .order('name');
        if (error) throw error;
        return { teams: (data || []).map(toNcaaTeam) };
    },

    gymnasts: async (
        params: { teams?: string[]; divisions?: Division[]; search?: string; event?: EventFilter } = {}
    ): Promise<{ count: number; gymnasts: Gymnast[] }> => {
        // `!inner` on the embedded team is required so filtering by
        // `ncaa_teams.slug`/`ncaa_teams.division` below works (PostgREST
        // only supports filtering an embedded resource when it's an
        // inner join).
        const buildQuery = () => {
            let query = supabase
                .from('gymnasts')
                .select(
                    `
                    id, first_name, last_name, class_year,
                    competes_vault, competes_bars, competes_beam, competes_floor, is_all_around,
                    vault_avg, bars_avg, beam_avg, floor_avg, season_average,
                    vault_nqs, bars_nqs, beam_nqs, floor_nqs, aa_nqs,
                    ncaa_teams!inner ( id, slug, name, short_name, conference, primary_color, division )
                    `,
                    { count: 'exact' }
                )
                .eq('active', true)
                .order('last_name');

            if (params.search) {
                const term = params.search.replace(/[%,]/g, '');
                query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`);
            }
            if (params.teams && params.teams.length > 0) {
                query = query.in('ncaa_teams.slug', params.teams);
            }
            if (params.divisions && params.divisions.length > 0) {
                query = query.in('ncaa_teams.division', params.divisions);
            }
            if (params.event) {
                query = query.eq(EVENT_COLUMN[params.event], true);
            }
            return query;
        };

        // PostgREST caps a single request at 1000 rows regardless of an
        // explicit range past that — well under the ~2150-gymnast pool, so
        // fetch in pages until a page comes back short.
        const PAGE_SIZE = 1000;
        let rows: any[] = [];
        let count = 0;
        for (let from = 0; ; from += PAGE_SIZE) {
            const { data, count: pageCount, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);
            if (error) throw error;
            count = pageCount ?? rows.length + (data?.length ?? 0);
            rows = rows.concat(data || []);
            if (!data || data.length < PAGE_SIZE) break;
        }

        const gymnasts: Gymnast[] = rows.map((g: any) => ({
            id: g.id,
            firstName: g.first_name,
            lastName: g.last_name,
            classYear: g.class_year,
            events: {
                vault: g.competes_vault,
                bars: g.competes_bars,
                beam: g.competes_beam,
                floor: g.competes_floor,
                allAround: g.is_all_around
            },
            eventAverages: {
                vault: g.vault_avg,
                bars: g.bars_avg,
                beam: g.beam_avg,
                floor: g.floor_avg
            },
            eventNqs: {
                vault: g.vault_nqs,
                bars: g.bars_nqs,
                beam: g.beam_nqs,
                floor: g.floor_nqs
            },
            aaNqs: g.aa_nqs,
            seasonAverage: g.season_average,
            team: toNcaaTeam(g.ncaa_teams)
        }));

        return { count: count || gymnasts.length, gymnasts };
    },

    weeklyScores: async (
        gymnastId: number,
        seasonYear = 2026
    ): Promise<Record<'vault' | 'bars' | 'beam' | 'floor', { week: number; score: number }[]>> => {
        const { data, error } = await supabase
            .from('scores')
            .select('event, week_number, score')
            .eq('gymnast_id', gymnastId)
            .eq('season_year', seasonYear)
            .order('week_number');
        if (error) throw error;

        const byEvent: Record<'vault' | 'bars' | 'beam' | 'floor', { week: number; score: number }[]> = {
            vault: [], bars: [], beam: [], floor: []
        };
        for (const row of data || []) {
            byEvent[row.event as 'vault' | 'bars' | 'beam' | 'floor']?.push({ week: row.week_number, score: row.score });
        }
        return byEvent;
    },

    // Most recent (highest week_number) score per event for a batch of
    // gymnasts in one query, rather than one weeklyScores() call per row —
    // this is what the Gymnasts table's "Last" columns are built from.
    lastScores: async (
        gymnastIds: number[],
        seasonYear = 2026
    ): Promise<Record<number, Record<'vault' | 'bars' | 'beam' | 'floor', number | null>>> => {
        if (gymnastIds.length === 0) return {};

        const { data, error } = await supabase
            .from('scores')
            .select('gymnast_id, event, week_number, score')
            .eq('season_year', seasonYear)
            .in('gymnast_id', gymnastIds);
        if (error) throw error;

        const latestWeek: Record<number, Partial<Record<string, number>>> = {};
        const latestScore: Record<number, Partial<Record<string, number>>> = {};
        for (const row of data || []) {
            const seenWeek = latestWeek[row.gymnast_id]?.[row.event];
            if (seenWeek === undefined || row.week_number > seenWeek) {
                (latestWeek[row.gymnast_id] ??= {})[row.event] = row.week_number;
                (latestScore[row.gymnast_id] ??= {})[row.event] = row.score;
            }
        }

        const result: Record<number, Record<'vault' | 'bars' | 'beam' | 'floor', number | null>> = {};
        for (const id of gymnastIds) {
            const scores = latestScore[id] || {};
            result[id] = {
                vault: scores.vault ?? null,
                bars: scores.bars ?? null,
                beam: scores.beam ?? null,
                floor: scores.floor ?? null
            };
        }
        return result;
    },

    submitFeedback: async (pagePath: string, message: string): Promise<{ ok: true }> => {
        const {
            data: { user }
        } = await supabase.auth.getUser();
        const { error } = await supabase
            .from('feedback')
            .insert({ user_id: user?.id ?? null, page_path: pagePath, message });
        if (error) throw error;
        return { ok: true };
    },

    createLeague: async (params: {
        name: string;
        teamName: string;
        rosterSize: number;
        upCount: number;
        countScore: number;
        injuryTradesAllowed: boolean;
        injuryTradeTiming: 'as_it_happens' | 'draft';
        lateRosterAdds: boolean;
        manualInjuryTrades: boolean;
        seasonEndingOnly: boolean;
        regularSeasonTrades: boolean;
        otherTradeRules: string;
    }): Promise<League> => {
        const {
            data: { user }
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Not signed in.');

        // Retry a couple of times in the vanishingly unlikely case the
        // random join code collides with an existing one.
        let row: any = null;
        let lastError: unknown = null;
        for (let attempt = 0; attempt < 3 && !row; attempt++) {
            const { data, error } = await supabase
                .from('leagues')
                .insert({
                    name: params.name,
                    join_code: randomJoinCode(),
                    commissioner_id: user.id,
                    roster_size: params.rosterSize,
                    up_count: params.upCount,
                    count_score: params.countScore,
                    injury_trades_allowed: params.injuryTradesAllowed,
                    injury_trade_timing: params.injuryTradeTiming,
                    late_roster_adds: params.lateRosterAdds,
                    manual_injury_trades: params.manualInjuryTrades,
                    season_ending_only: params.seasonEndingOnly,
                    regular_season_trades: params.regularSeasonTrades,
                    other_trade_rules: params.otherTradeRules.trim() || null
                })
                .select()
                .single();
            if (!error) {
                row = data;
                break;
            }
            lastError = error;
            if (error.code !== '23505') break; // only retry on unique_violation
        }
        if (!row) throw lastError;

        const { error: memberError } = await supabase
            .from('league_members')
            .insert({ league_id: row.id, user_id: user.id, team_name: params.teamName });
        if (memberError) throw memberError;

        return toLeague(row);
    },

    getLeagueByCode: async (code: string): Promise<League | null> => {
        const { data, error } = await supabase
            .from('leagues')
            .select('*')
            .eq('join_code', code.trim().toUpperCase())
            .maybeSingle();
        if (error) throw error;
        return data ? toLeague(data) : null;
    },

    leagueMemberCount: async (leagueId: number): Promise<number> => {
        const { count, error } = await supabase
            .from('league_members')
            .select('*', { count: 'exact', head: true })
            .eq('league_id', leagueId);
        if (error) throw error;
        return count ?? 0;
    },

    joinLeague: async (
        leagueId: number,
        teamName: string,
        teamColor1: string,
        teamColor2: string
    ): Promise<LeagueMembership> => {
        const {
            data: { user }
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Not signed in.');
        const { data, error } = await supabase
            .from('league_members')
            .insert({
                league_id: leagueId,
                user_id: user.id,
                team_name: teamName,
                team_color_1: teamColor1,
                team_color_2: teamColor2
            })
            .select(MEMBERSHIP_SELECT)
            .single();
        if (error) {
            if (error.code === '23505') {
                if (error.message.includes('league_id_team_name')) {
                    throw new JoinLeagueError('team_name_taken', 'That team name is already taken in this league.');
                }
                throw new JoinLeagueError('already_member', "You're already in this league!");
            }
            throw error;
        }
        return toMembership(data);
    },

    // Single-membership lookup for the current user in a league, independent
    // of myLeagues() — used by the Join wizard's Step 1 "already a member?" check.
    getMembership: async (leagueId: number): Promise<LeagueMembership | null> => {
        const {
            data: { user }
        } = await supabase.auth.getUser();
        if (!user) return null;
        const { data, error } = await supabase
            .from('league_members')
            .select(MEMBERSHIP_SELECT)
            .eq('league_id', leagueId)
            .eq('user_id', user.id)
            .maybeSingle();
        if (error) throw error;
        return data ? toMembership(data) : null;
    },

    getMembershipById: async (membershipId: number): Promise<LeagueMembership | null> => {
        const { data, error } = await supabase
            .from('league_members')
            .select(MEMBERSHIP_SELECT)
            .eq('id', membershipId)
            .maybeSingle();
        if (error) throw error;
        return data ? toMembership(data) : null;
    },

    myLeagues: async (): Promise<LeagueMembership[]> => {
        const {
            data: { user }
        } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('league_members')
            .select(MEMBERSHIP_SELECT)
            .eq('user_id', user.id);
        if (error) throw error;

        return (data || []).map(toMembership);
    },

    // Every rostered gymnast in a league, with which team has them — used to
    // disable/label Search & Add rows and to flag "Already Rostered" pastes.
    rosterForLeague: async (
        leagueId: number
    ): Promise<{ gymnastId: number; leagueMemberId: number; teamName: string }[]> => {
        const { data, error } = await supabase
            .from('roster_gymnasts')
            .select('gymnast_id, league_member_id, league_members ( team_name )')
            .eq('league_id', leagueId);
        if (error) throw error;
        return (data || []).map((row: any) => ({
            gymnastId: row.gymnast_id,
            leagueMemberId: row.league_member_id,
            teamName: row.league_members?.team_name ?? ''
        }));
    },

    addToRoster: async (leagueId: number, leagueMemberId: number, gymnastId: number): Promise<void> => {
        const { error } = await supabase
            .from('roster_gymnasts')
            .insert({ league_id: leagueId, league_member_id: leagueMemberId, gymnast_id: gymnastId });
        if (error) throw error;
    },

    // Bulk add via upsert-with-ignoreDuplicates rather than a plain insert,
    // so a gymnast sniped by another team between name-matching and
    // confirming is silently skipped instead of failing the whole batch.
    // Returns the gymnast ids that actually landed.
    addManyToRoster: async (leagueId: number, leagueMemberId: number, gymnastIds: number[]): Promise<number[]> => {
        if (gymnastIds.length === 0) return [];
        const { data, error } = await supabase
            .from('roster_gymnasts')
            .upsert(
                gymnastIds.map((gymnastId) => ({ league_id: leagueId, league_member_id: leagueMemberId, gymnast_id: gymnastId })),
                { onConflict: 'league_id,gymnast_id', ignoreDuplicates: true }
            )
            .select('gymnast_id');
        if (error) throw error;
        return (data || []).map((row: any) => row.gymnast_id);
    }
};
