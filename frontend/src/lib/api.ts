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

export interface NcaaTeam {
    id: number;
    slug: string;
    name: string;
    shortName: string;
    conference: string | null;
    color: string | null;
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
}

export interface LeagueMembership {
    id: number;
    leagueId: number;
    teamName: string;
    league: League;
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
        color: row.primary_color
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
        countScore: row.count_score
    };
}

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
            .select('id, slug, name, short_name, conference, primary_color')
            .order('name');
        if (error) throw error;
        return { teams: (data || []).map(toNcaaTeam) };
    },

    gymnasts: async (
        params: { team?: string; search?: string; event?: EventFilter } = {}
    ): Promise<{ count: number; gymnasts: Gymnast[] }> => {
        // `!inner` on the embedded team is required so filtering by
        // `ncaa_teams.slug` below works (PostgREST only supports filtering
        // an embedded resource when it's joined as inner).
        let query = supabase
            .from('gymnasts')
            .select(
                `
                id, first_name, last_name, class_year,
                competes_vault, competes_bars, competes_beam, competes_floor, is_all_around,
                season_average,
                ncaa_teams!inner ( id, slug, name, short_name, conference, primary_color )
                `,
                { count: 'exact' }
            )
            .eq('active', true)
            .order('last_name');

        if (params.search) {
            const term = params.search.replace(/[%,]/g, '');
            query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`);
        }
        if (params.team) {
            query = query.eq('ncaa_teams.slug', params.team);
        }
        if (params.event) {
            query = query.eq(EVENT_COLUMN[params.event], true);
        }

        const { data, count, error } = await query;
        if (error) throw error;

        const gymnasts: Gymnast[] = (data || []).map((g: any) => ({
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
            seasonAverage: g.season_average,
            team: toNcaaTeam(g.ncaa_teams)
        }));

        return { count: count ?? gymnasts.length, gymnasts };
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
                    count_score: params.countScore
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

    joinLeague: async (leagueId: number, teamName: string): Promise<void> => {
        const {
            data: { user }
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Not signed in.');
        const { error } = await supabase
            .from('league_members')
            .insert({ league_id: leagueId, user_id: user.id, team_name: teamName });
        if (error) throw error;
    },

    myLeagues: async (): Promise<LeagueMembership[]> => {
        const {
            data: { user }
        } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('league_members')
            .select('id, league_id, team_name, leagues (*)')
            .eq('user_id', user.id);
        if (error) throw error;

        return (data || []).map((row: any) => ({
            id: row.id,
            leagueId: row.league_id,
            teamName: row.team_name,
            league: toLeague(row.leagues)
        }));
    }
};
