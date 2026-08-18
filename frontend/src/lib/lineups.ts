/**
 * Data access for the Lineups page — lineup_selections and
 * gymnast_meet_schedule (see lineups-page-requirements.md §0). Kept out of
 * api.ts since that file is scoped to public catalog reads.
 */
import { supabase } from './supabase';
import { MeetLocation } from './scoreMetrics';

export type Event = 'vault' | 'bars' | 'beam' | 'floor';

// This is a prototype build against mock 2027 data (see
// lineups-page-requirements.md §14) — there's no real season calendar to
// derive "today's week" from yet, so both are hardcoded here rather than
// computed. Real week-resolution logic is future work, not a gap in this
// page's own logic.
export const SEASON_YEAR = 2027;
export const CURRENT_WEEK = 3;
// Typical NCAA regular-season length — used only as the upper bound for
// "Populate All Future Weeks." Weeks beyond CURRENT_WEEK have no mock
// schedule/score data yet, same as a real season's not-yet-scheduled weeks.
export const SEASON_END_WEEK = 12;

export interface MeetScheduleEntry {
    meetDate: string;
    meetTime: string | null;
    opponent: string | null;
    location: MeetLocation | null;
    meetFormat: 'dual' | 'tri' | 'quad' | null;
}

// Zero entries = bye, one = normal week, two+ = double meet — derived from
// row count rather than a stored flag (see requirements §0.2).
export async function fetchMeetSchedule(
    gymnastIds: number[],
    seasonYear: number,
    weekNumber: number
): Promise<Record<number, MeetScheduleEntry[]>> {
    if (gymnastIds.length === 0) return {};
    const { data, error } = await supabase
        .from('gymnast_meet_schedule')
        .select('gymnast_id, meet_date, meet_time, opponent, location, meet_format')
        .eq('season_year', seasonYear)
        .eq('week_number', weekNumber)
        .in('gymnast_id', gymnastIds)
        .order('meet_date');
    if (error) throw error;

    const result: Record<number, MeetScheduleEntry[]> = {};
    for (const row of data || []) {
        const list = result[row.gymnast_id] ?? (result[row.gymnast_id] = []);
        list.push({ meetDate: row.meet_date, meetTime: row.meet_time, opponent: row.opponent, location: row.location, meetFormat: row.meet_format });
    }
    return result;
}

// gymnastId -> set of events currently selected for that gymnast this week.
export type SelectionMap = Map<number, Set<Event>>;

export async function fetchSelections(leagueMemberId: number, seasonYear: number, weekNumber: number): Promise<SelectionMap> {
    const { data, error } = await supabase
        .from('lineup_selections')
        .select('gymnast_id, event')
        .eq('league_member_id', leagueMemberId)
        .eq('season_year', seasonYear)
        .eq('week_number', weekNumber);
    if (error) throw error;

    const map: SelectionMap = new Map();
    for (const row of data || []) {
        const set = map.get(row.gymnast_id) ?? new Set<Event>();
        set.add(row.event);
        map.set(row.gymnast_id, set);
    }
    return map;
}

// Selecting inserts a row, deselecting deletes it — no boolean flag to keep
// in sync (same convention as roster_gymnasts).
export async function setSelection(
    leagueMemberId: number,
    leagueId: number,
    gymnastId: number,
    event: Event,
    seasonYear: number,
    weekNumber: number,
    selected: boolean
): Promise<void> {
    if (selected) {
        const { error } = await supabase
            .from('lineup_selections')
            .insert({ league_member_id: leagueMemberId, league_id: leagueId, gymnast_id: gymnastId, event, season_year: seasonYear, week_number: weekNumber });
        if (error && error.code !== '23505') throw error; // ignore duplicate-select races
    } else {
        const { error } = await supabase
            .from('lineup_selections')
            .delete()
            .eq('league_member_id', leagueMemberId)
            .eq('gymnast_id', gymnastId)
            .eq('event', event)
            .eq('season_year', seasonYear)
            .eq('week_number', weekNumber);
        if (error) throw error;
    }
}

export async function clearWeek(leagueMemberId: number, seasonYear: number, weekNumber: number): Promise<void> {
    const { error } = await supabase
        .from('lineup_selections')
        .delete()
        .eq('league_member_id', leagueMemberId)
        .eq('season_year', seasonYear)
        .eq('week_number', weekNumber);
    if (error) throw error;
}

// Replaces every selection in `toWeek` with a copy of `fromWeek`'s —
// backs both "Import Last Week" (one target week) and "Populate All Future
// Weeks" (called once per remaining week).
export async function copyWeekSelections(
    leagueMemberId: number,
    leagueId: number,
    seasonYear: number,
    fromWeek: number,
    toWeek: number
): Promise<void> {
    const source = await fetchSelections(leagueMemberId, seasonYear, fromWeek);
    await clearWeek(leagueMemberId, seasonYear, toWeek);
    const rows = [...source.entries()].flatMap(([gymnastId, events]) =>
        [...events].map((event) => ({ league_member_id: leagueMemberId, league_id: leagueId, gymnast_id: gymnastId, event, season_year: seasonYear, week_number: toWeek }))
    );
    if (rows.length === 0) return;
    const { error } = await supabase.from('lineup_selections').insert(rows);
    if (error) throw error;
}
