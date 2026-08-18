/**
 * Score-metrics computation layer — Average / Median / Most Recent / High /
 * Average-Home / Average-Away / Rolling-3-Meet-Average, computed live from
 * raw `scores` rows rather than the flat vault_avg / season_average columns
 * on `gymnasts` (those are a one-time import snapshot and won't reflect new
 * weeks as they're added).
 *
 * Average-Home/Away are filtered by `scores.location`, added 2026-08-18
 * alongside that column — expect sparse/empty results until enough new
 * scores carry it (see below).
 *
 * NQS is intentionally not computed here yet. Individual NQS (PRD 10.9) is
 * actually a per-gymnast formula — 3 highest home + 3 highest away scores
 * on an apparatus, drop the top of those six, average the remaining five —
 * so it's computable in principle from her own rows. The blocker is data,
 * not the formula: `scores` only gained a `location` (home/away) column
 * once this file was written, so the historical rows it needs don't carry
 * it. Until enough new rows do, NQS stays the scraped snapshot on
 * `gymnasts.*_nqs` (see db/2026-nqs-import.sql). Revisit once there's
 * enough home/away-tagged data to compute it live.
 */

export type Category = 'vault' | 'bars' | 'beam' | 'floor' | 'aa';
export type Metric = 'average' | 'median' | 'mostRecent' | 'high' | 'avgHome' | 'avgAway' | 'rolling3';
export type MetricSet = Record<Metric, number | null>;
export type MeetLocation = 'home' | 'away';

export interface ScoreRow {
    event: 'vault' | 'bars' | 'beam' | 'floor';
    weekNumber: number;
    score: number;
    // Null for legacy pre-CSV-import rows (see db/schema.sql) — only rows
    // written through the Scores Import flow carry a meet_date.
    meetDate: string | null;
    // Null for the vast majority of rows today — location only exists as
    // of 2026-08-18 and isn't backfilled on historical scores.
    location: MeetLocation | null;
}

type InternalRow = { weekNumber: number; score: number; meetDate?: string | null; location?: MeetLocation | null };

function round3(n: number): number {
    return Math.round(n * 1000) / 1000;
}

function average(scores: number[]): number | null {
    if (scores.length === 0) return null;
    return round3(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

function median(scores: number[]): number | null {
    if (scores.length === 0) return null;
    const sorted = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? round3((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

function high(scores: number[]): number | null {
    return scores.length === 0 ? null : Math.max(...scores);
}

// Highest week_number wins. Two meets in the same week are a real case, so
// meet_date breaks the tie; without one (legacy rows) the first row is kept
// rather than the last, so the result doesn't depend on row arrival order.
function mostRecent(rows: InternalRow[]): number | null {
    if (rows.length === 0) return null;
    let best = rows[0];
    for (const row of rows) {
        if (row.weekNumber > best.weekNumber) { best = row; continue; }
        if (row.weekNumber === best.weekNumber && row.meetDate && best.meetDate && row.meetDate > best.meetDate) best = row;
    }
    return best.score;
}

// Same recency ordering as mostRecent(), but averages the N most recent
// instead of taking just the single latest — a steadier "recent form"
// signal than Most Recent alone, more current than a full-season Average.
function rollingAverage(rows: InternalRow[], n: number): number | null {
    if (rows.length === 0) return null;
    const sorted = [...rows].sort((a, b) => {
        if (a.weekNumber !== b.weekNumber) return b.weekNumber - a.weekNumber;
        if (a.meetDate && b.meetDate) return b.meetDate.localeCompare(a.meetDate);
        return 0;
    });
    return average(sorted.slice(0, n).map((r) => r.score));
}

function averageByLocation(rows: InternalRow[], location: MeetLocation): number | null {
    return average(rows.filter((r) => r.location === location).map((r) => r.score));
}

function metricsFromScores(rows: InternalRow[]): MetricSet {
    return {
        average: average(rows.map((r) => r.score)),
        median: median(rows.map((r) => r.score)),
        mostRecent: mostRecent(rows),
        high: high(rows.map((r) => r.score)),
        avgHome: averageByLocation(rows, 'home'),
        avgAway: averageByLocation(rows, 'away'),
        rolling3: rollingAverage(rows, 3)
    };
}

// AA score for one meet = sum of vault+bars+beam+floor when a gymnast
// competed all four in that meet, matching how NCAA all-around scoring
// actually works. Rows with no meet_date can't be grouped into a meet, so
// they're excluded from AA (they still count toward the other 4 categories).
// location is taken from whichever of the four rows sets it first — all
// four events at one meet share the same venue, so any of them agrees.
function aaScoresByMeet(rows: ScoreRow[]): InternalRow[] {
    const byMeet = new Map<string, Partial<Record<ScoreRow['event'], number>> & { weekNumber: number; location: MeetLocation | null }>();
    for (const row of rows) {
        if (!row.meetDate) continue;
        const entry = byMeet.get(row.meetDate) ?? { weekNumber: row.weekNumber, location: row.location };
        entry[row.event] = row.score;
        if (!entry.location && row.location) entry.location = row.location;
        byMeet.set(row.meetDate, entry);
    }
    const totals: InternalRow[] = [];
    for (const [meetDate, entry] of byMeet) {
        if (entry.vault != null && entry.bars != null && entry.beam != null && entry.floor != null) {
            totals.push({
                weekNumber: entry.weekNumber,
                score: round3(entry.vault + entry.bars + entry.beam + entry.floor),
                meetDate,
                location: entry.location
            });
        }
    }
    return totals;
}

export function computeScoreMetrics(rows: ScoreRow[]): Record<Category, MetricSet> {
    const byEvent: Record<ScoreRow['event'], InternalRow[]> = {
        vault: [], bars: [], beam: [], floor: []
    };
    for (const row of rows) {
        byEvent[row.event].push({ weekNumber: row.weekNumber, score: row.score, meetDate: row.meetDate, location: row.location });
    }
    return {
        vault: metricsFromScores(byEvent.vault),
        bars: metricsFromScores(byEvent.bars),
        beam: metricsFromScores(byEvent.beam),
        floor: metricsFromScores(byEvent.floor),
        aa: metricsFromScores(aaScoresByMeet(rows))
    };
}
