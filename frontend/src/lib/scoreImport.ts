/**
 * Admin Scores Import CSV (PRD 13.5.3) — parsing, validation, gymnast
 * matching, and the Supabase reads/writes specific to this flow. Kept out
 * of api.ts since that file is scoped to public catalog reads.
 */
import { supabase } from './supabase';
import { Gymnast } from './api';

export type EventCode = 'vault' | 'bars' | 'beam' | 'floor';

const EVENT_CODE_MAP: Record<string, EventCode | 'aa'> = {
    VT: 'vault', UB: 'bars', BB: 'beam', FX: 'floor', AA: 'aa'
};

export const EVENT_LABELS: Record<EventCode, string> = {
    vault: 'Vault', bars: 'Bars', beam: 'Beam', floor: 'Floor'
};

// ---------- Week / season derivation ----------
// Mirrors public.week_number_for_meet_date / season_year_for_meet_date in
// db/schema.sql exactly — see that file for the reasoning behind the
// Friday-anchored week boundaries. Keep the two in sync if this changes.
function firstFridayOfSeason(year: number): number {
    const jan2 = Date.UTC(year, 0, 2);
    const dow = new Date(jan2).getUTCDay(); // Sunday=0 .. Saturday=6
    const offsetDays = (5 - dow + 7) % 7;
    return jan2 + offsetDays * 86400000;
}

export function deriveSeasonYear(meetDateIso: string): number {
    return Number(meetDateIso.slice(0, 4));
}

export function deriveWeekNumber(meetDateIso: string): number {
    const [y, m, d] = meetDateIso.split('-').map(Number);
    const meetMs = Date.UTC(y, m - 1, d);
    const diffDays = Math.floor((meetMs - firstFridayOfSeason(y)) / 86400000);
    return Math.max(1, Math.floor(diffDays / 7) + 1);
}

// ---------- CSV parsing ----------
// Minimal RFC 4180 parser (quoted fields, embedded commas/quotes, CRLF or
// LF) — small enough not to warrant a dependency for a single admin page.
export function parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;
    const s = text.replace(/^﻿/, '');

    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (inQuotes) {
            if (c === '"') {
                if (s[i + 1] === '"') { field += '"'; i++; }
                else inQuotes = false;
            } else {
                field += c;
            }
        } else if (c === '"') {
            inQuotes = true;
        } else if (c === ',') {
            row.push(field); field = '';
        } else if (c === '\n') {
            row.push(field); rows.push(row); row = []; field = '';
        } else if (c === '\r') {
            // no-op — \n (or end of input) closes the row
        } else {
            field += c;
        }
    }
    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

    return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''));
}

export interface ParsedScoreRow {
    rowNumber: number; // 1-based, counting from the first data row (header excluded)
    meetDate: string;  // YYYY-MM-DD
    gymnastName: string;
    gymnastSchool: string;
    event: EventCode;
    score: number;
    meetName: string | null;
    opponent: string | null;
}

export type RowOutcome =
    | { kind: 'error'; rowNumber: number; message: string }
    | { kind: 'excluded'; rowNumber: number; reason: 'all_around' | 'exhibition'; gymnastName: string; event: string }
    | { kind: 'ready'; rowNumber: number; row: ParsedScoreRow; gymnastId: number; weekNumber: number; seasonYear: number }
    | {
          kind: 'flagged';
          rowNumber: number;
          row: ParsedScoreRow;
          reason: 'no_gymnast_match' | 'possible_duplicate';
          matchedGymnastId: number | null;
          weekNumber: number;
          seasonYear: number;
      };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ROWS = 2000;

export function isValidIsoDate(value: string): boolean {
    if (!DATE_RE.test(value)) return false;
    const [y, m, d] = value.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function parseBoolean(value: string | undefined): boolean {
    if (!value) return false;
    return ['true', '1', 'yes', 'y'].includes(value.trim().toLowerCase());
}

// Rows too malformed to classify at all (bad date/event/score/missing
// required field) come back as { kind: 'error' }; well-formed AA and
// exhibition rows come back as { kind: 'excluded' } since the PRD excludes
// them from fantasy scoring, not because anything is wrong with them.
// Everything else is a ParsedScoreRow ready for gymnast matching.
export function parseScoreImportCsv(
    text: string
): { parsed: ParsedScoreRow[]; outcomes: (RowOutcome & { kind: 'error' | 'excluded' })[] } {
    const table = parseCsv(text);
    if (table.length === 0) return { parsed: [], outcomes: [] };

    const header = table[0].map((h) => h.trim().toLowerCase());
    const col = (name: string) => header.indexOf(name);
    const idx = {
        meetDate: col('meet_date'),
        gymnastName: col('gymnast_name'),
        gymnastSchool: col('gymnast_school'),
        event: col('event'),
        score: col('score'),
        meetName: col('meet_name'),
        opponent: col('opponent'),
        exhibition: col('exhibition')
    };

    const missing = (['meetDate', 'gymnastName', 'gymnastSchool', 'event', 'score'] as const).filter(
        (k) => idx[k] === -1
    );
    if (missing.length > 0) {
        throw new Error(`CSV is missing required column(s): ${missing.map((k) => k).join(', ')}`);
    }

    const dataRows = table.slice(1).filter((r) => r.some((c) => c.trim() !== ''));
    if (dataRows.length > MAX_ROWS) {
        throw new Error(`CSV has ${dataRows.length} rows, this page supports up to ${MAX_ROWS} per upload.`);
    }

    const parsed: ParsedScoreRow[] = [];
    const outcomes: (RowOutcome & { kind: 'error' | 'excluded' })[] = [];

    dataRows.forEach((cells, i) => {
        const rowNumber = i + 1;
        const get = (colIdx: number) => (colIdx >= 0 ? (cells[colIdx] ?? '').trim() : '');

        const meetDate = get(idx.meetDate);
        const gymnastName = get(idx.gymnastName);
        const gymnastSchool = get(idx.gymnastSchool);
        const eventRaw = get(idx.event).toUpperCase();
        const scoreRaw = get(idx.score);
        const exhibition = parseBoolean(get(idx.exhibition));

        if (!isValidIsoDate(meetDate)) {
            outcomes.push({ kind: 'error', rowNumber, message: `Invalid meet_date "${meetDate}" (expected YYYY-MM-DD).` });
            return;
        }
        if (!gymnastName) {
            outcomes.push({ kind: 'error', rowNumber, message: 'gymnast_name is required.' });
            return;
        }
        if (!gymnastSchool) {
            outcomes.push({ kind: 'error', rowNumber, message: 'gymnast_school is required.' });
            return;
        }
        const mapped = EVENT_CODE_MAP[eventRaw];
        if (!mapped) {
            outcomes.push({ kind: 'error', rowNumber, message: `Invalid event "${eventRaw}" (expected VT, UB, BB, FX, or AA).` });
            return;
        }
        const score = Number(scoreRaw);
        if (scoreRaw === '' || Number.isNaN(score)) {
            outcomes.push({ kind: 'error', rowNumber, message: `Invalid score "${scoreRaw}".` });
            return;
        }

        if (mapped === 'aa') {
            outcomes.push({ kind: 'excluded', rowNumber, reason: 'all_around', gymnastName, event: eventRaw });
            return;
        }
        if (exhibition) {
            outcomes.push({ kind: 'excluded', rowNumber, reason: 'exhibition', gymnastName, event: eventRaw });
            return;
        }
        if (score < 0 || score > 10) {
            outcomes.push({ kind: 'error', rowNumber, message: `Score ${score} is out of range (must be 0.0–10.0).` });
            return;
        }

        parsed.push({
            rowNumber,
            meetDate,
            gymnastName,
            gymnastSchool,
            event: mapped,
            score,
            meetName: get(idx.meetName) || null,
            opponent: get(idx.opponent) || null
        });
    });

    return { parsed, outcomes };
}

// ---------- Gymnast matching ----------
function normalize(s: string): string {
    return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function schoolMatches(school: string, gymnast: Gymnast): boolean {
    const s = normalize(school);
    const team = gymnast.team;
    return (
        normalize(team.name) === s ||
        normalize(team.shortName) === s ||
        normalize(team.slug.replace(/-/g, ' ')) === s
    );
}

// Exact, case-insensitive match on "first last" + school. Multi-word last
// names (e.g. "De La Cruz") won't split correctly here — those rows simply
// fail to match and fall into manual review, which is the intended
// fallback rather than a silent auto-insert.
function candidateGymnasts(row: ParsedScoreRow, gymnasts: Gymnast[]): Gymnast[] {
    const fullName = normalize(row.gymnastName);
    return gymnasts.filter((g) => normalize(`${g.firstName} ${g.lastName}`) === fullName && schoolMatches(row.gymnastSchool, g));
}

export async function classifyParsedRows(
    parsed: ParsedScoreRow[],
    gymnasts: Gymnast[]
): Promise<RowOutcome[]> {
    const matchByRow = new Map<number, Gymnast | null>();
    for (const row of parsed) {
        const candidates = candidateGymnasts(row, gymnasts);
        matchByRow.set(row.rowNumber, candidates.length === 1 ? candidates[0] : null);
    }

    const matchedGymnastIds = Array.from(new Set(Array.from(matchByRow.values()).filter((g): g is Gymnast => !!g).map((g) => g.id)));
    const seenKeys = await fetchExistingScoreKeys(matchedGymnastIds);

    // Sequential, not .map(): a duplicate can also be two rows of the same
    // upload (a copy-paste mistake in the CSV itself), not just a repeat of
    // an already-imported meet — so each row's key is added to `seenKeys`
    // as it's classified, and later rows check against it too.
    //
    // The dedup key is gymnast+event+exact meet_date, NOT gymnast+event+week
    // — a gymnast can legitimately post two scores on the same event in one
    // week if they competed at two different meets that week (the league
    // host then decides whether the higher or the average of the two
    // counts). Those are two different, real scores, not a duplicate; only
    // the same gymnast/event/day repeated is.
    const outcomes: RowOutcome[] = [];
    for (const row of parsed) {
        const weekNumber = deriveWeekNumber(row.meetDate);
        const seasonYear = deriveSeasonYear(row.meetDate);
        const gymnast = matchByRow.get(row.rowNumber) ?? null;

        if (!gymnast) {
            outcomes.push({ kind: 'flagged', rowNumber: row.rowNumber, row, reason: 'no_gymnast_match', matchedGymnastId: null, weekNumber, seasonYear });
            continue;
        }
        const key = `${gymnast.id}|${row.event}|${row.meetDate}`;
        if (seenKeys.has(key)) {
            outcomes.push({ kind: 'flagged', rowNumber: row.rowNumber, row, reason: 'possible_duplicate', matchedGymnastId: gymnast.id, weekNumber, seasonYear });
            continue;
        }
        seenKeys.add(key);
        outcomes.push({ kind: 'ready', rowNumber: row.rowNumber, row, gymnastId: gymnast.id, weekNumber, seasonYear });
    }
    return outcomes;
}

async function fetchExistingScoreKeys(gymnastIds: number[]): Promise<Set<string>> {
    if (gymnastIds.length === 0) return new Set();
    const { data, error } = await supabase
        .from('scores')
        .select('gymnast_id, event, meet_date')
        .in('gymnast_id', gymnastIds)
        .not('meet_date', 'is', null);
    if (error) throw error;
    return new Set((data || []).map((r: any) => `${r.gymnast_id}|${r.event}|${r.meet_date}`));
}

// ---------- Single manual score entry ----------
// Looks up an existing score for the exact same gymnast/event/day — used
// to warn an admin before they add a second entry, and to offer "update"
// instead of "insert" when it looks like a correction rather than a new
// meet. Two scores in the same week on different days are NOT a conflict
// here since meet_date differs.
export async function findExistingScore(
    gymnastId: number,
    event: EventCode,
    meetDate: string
): Promise<{ id: number; score: number } | null> {
    const { data, error } = await supabase
        .from('scores')
        .select('id, score')
        .eq('gymnast_id', gymnastId)
        .eq('event', event)
        .eq('meet_date', meetDate)
        .limit(1);
    if (error) throw error;
    const row = data?.[0];
    return row ? { id: row.id, score: Number(row.score) } : null;
}

export interface ManualScoreInput {
    gymnastId: number;
    event: EventCode;
    meetDate: string;
    score: number;
    meetName: string | null;
    opponent: string | null;
}

export async function insertManualScore(input: ManualScoreInput): Promise<void> {
    const {
        data: { user }
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in.');

    const { error } = await supabase.from('scores').insert({
        gymnast_id: input.gymnastId,
        event: input.event,
        season_year: deriveSeasonYear(input.meetDate),
        week_number: deriveWeekNumber(input.meetDate),
        score: input.score,
        meet_date: input.meetDate,
        meet_name: input.meetName,
        opponent: input.opponent
    });
    if (error) throw error;
}

export async function updateScore(scoreId: number, score: number): Promise<void> {
    const {
        data: { user }
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in.');

    // Postgres RLS makes a row an UPDATE isn't allowed to touch simply
    // invisible rather than erroring, so a blocked update still comes back
    // as a 200 with zero rows affected — .select() + a length check is
    // what turns that into a real failure instead of a false "success".
    const { data, error } = await supabase.from('scores').update({ score }).eq('id', scoreId).select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Could not update this score, it may no longer exist.');
}

// ---------- Submitting an import ----------
export interface ImportSummary {
    batchId: number;
    insertedCount: number;
    flaggedCount: number;
}

export async function submitScoreImport(filename: string, outcomes: RowOutcome[]): Promise<ImportSummary> {
    const {
        data: { user }
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in.');

    const ready = outcomes.filter((o): o is Extract<RowOutcome, { kind: 'ready' }> => o.kind === 'ready');
    const flagged = outcomes.filter((o): o is Extract<RowOutcome, { kind: 'flagged' }> => o.kind === 'flagged');

    const seasonYears = new Set([...ready.map((o) => o.seasonYear), ...flagged.map((o) => o.seasonYear)]);
    const seasonYear = seasonYears.size === 1 ? [...seasonYears][0] : deriveSeasonYear(new Date().toISOString().slice(0, 10));

    const { data: batch, error: batchError } = await supabase
        .from('score_import_batches')
        .insert({
            uploaded_by: user.id,
            filename,
            season_year: seasonYear,
            row_count: ready.length + flagged.length,
            inserted_count: ready.length,
            flagged_count: flagged.length
        })
        .select()
        .single();
    if (batchError) throw batchError;

    if (ready.length > 0) {
        const { error } = await supabase.from('scores').insert(
            ready.map((o) => ({
                gymnast_id: o.gymnastId,
                event: o.row.event,
                season_year: o.seasonYear,
                week_number: o.weekNumber,
                score: o.row.score,
                meet_date: o.row.meetDate,
                meet_name: o.row.meetName,
                opponent: o.row.opponent,
                import_batch_id: batch.id
            }))
        );
        if (error) throw error;
    }

    if (flagged.length > 0) {
        const { error } = await supabase.from('score_import_flagged_rows').insert(
            flagged.map((o) => ({
                batch_id: batch.id,
                row_number: o.rowNumber,
                meet_date: o.row.meetDate,
                gymnast_name: o.row.gymnastName,
                gymnast_school: o.row.gymnastSchool,
                event: o.row.event,
                score: o.row.score,
                meet_name: o.row.meetName,
                opponent: o.row.opponent,
                reason: o.reason,
                matched_gymnast_id: o.matchedGymnastId
            }))
        );
        if (error) throw error;
    }

    return { batchId: batch.id, insertedCount: ready.length, flaggedCount: flagged.length };
}

// ---------- Reviewing flagged rows ----------
export interface FlaggedRow {
    id: number;
    batchId: number;
    rowNumber: number;
    meetDate: string;
    gymnastName: string;
    gymnastSchool: string;
    event: EventCode;
    score: number;
    meetName: string | null;
    opponent: string | null;
    reason: 'no_gymnast_match' | 'possible_duplicate';
    matchedGymnastId: number | null;
}

function toFlaggedRow(row: any): FlaggedRow {
    return {
        id: row.id,
        batchId: row.batch_id,
        rowNumber: row.row_number,
        meetDate: row.meet_date,
        gymnastName: row.gymnast_name,
        gymnastSchool: row.gymnast_school,
        event: row.event,
        score: row.score,
        meetName: row.meet_name,
        opponent: row.opponent,
        reason: row.reason,
        matchedGymnastId: row.matched_gymnast_id
    };
}

export async function fetchPendingFlaggedRows(): Promise<FlaggedRow[]> {
    const { data, error } = await supabase
        .from('score_import_flagged_rows')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(toFlaggedRow);
}

export async function approveFlaggedRow(row: FlaggedRow, gymnastId: number): Promise<void> {
    const {
        data: { user }
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in.');

    const { error: insertError } = await supabase.from('scores').insert({
        gymnast_id: gymnastId,
        event: row.event,
        season_year: deriveSeasonYear(row.meetDate),
        week_number: deriveWeekNumber(row.meetDate),
        score: row.score,
        meet_date: row.meetDate,
        meet_name: row.meetName,
        opponent: row.opponent,
        import_batch_id: row.batchId
    });
    if (insertError) {
        if (insertError.code === '23505') {
            throw new Error('A score already exists for this gymnast/event/date, approving would create an exact duplicate.');
        }
        throw insertError;
    }

    const { data: updateData, error: updateError } = await supabase
        .from('score_import_flagged_rows')
        .update({ status: 'approved', resolved_gymnast_id: gymnastId, resolved_by: user.id, resolved_at: new Date().toISOString() })
        .eq('id', row.id)
        .select('id');
    if (updateError) throw updateError;
    if (!updateData || updateData.length === 0) throw new Error('Could not mark this row approved, it may no longer exist.');
}

export async function rejectFlaggedRow(row: FlaggedRow): Promise<void> {
    const {
        data: { user }
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in.');

    const { data, error } = await supabase
        .from('score_import_flagged_rows')
        .update({ status: 'rejected', resolved_by: user.id, resolved_at: new Date().toISOString() })
        .eq('id', row.id)
        .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Could not reject this row, it may no longer exist.');
}
