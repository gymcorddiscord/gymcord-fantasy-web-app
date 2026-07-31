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
    }
};
