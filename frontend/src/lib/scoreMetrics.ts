/**
 * Score-metrics computation layer — Average / Median / Most Recent / High,
 * computed live from raw `scores` rows rather than the flat vault_avg /
 * season_average columns on `gymnasts` (those are a one-time import
 * snapshot and won't reflect new weeks as they're added).
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
export type Metric = 'average' | 'median' | 'mostRecent' | 'high';
export type MetricSet = Record<Metric, number | null>;

export interface ScoreRow {
    event: 'vault' | 'bars' | 'beam' | 'floor';
    weekNumber: number;
    score: number;
    // Null for legacy pre-CSV-import rows (see db/schema.sql) — only rows
    // written through the Scores Import flow carry a meet_date.
    meetDate: string | null;
}

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
function mostRecent(rows: { weekNumber: number; score: number; meetDate?: string | null }[]): number | null {
    if (rows.length === 0) return null;
    let best = rows[0];
    for (const row of rows) {
        if (row.weekNumber > best.weekNumber) { best = row; continue; }
        if (row.weekNumber === best.weekNumber && row.meetDate && best.meetDate && row.meetDate > best.meetDate) best = row;
    }
    return best.score;
}

function metricsFromScores(rows: { weekNumber: number; score: number; meetDate?: string | null }[]): MetricSet {
    return {
        average: average(rows.map((r) => r.score)),
        median: median(rows.map((r) => r.score)),
        mostRecent: mostRecent(rows),
        high: high(rows.map((r) => r.score))
    };
}

// AA score for one meet = sum of vault+bars+beam+floor when a gymnast
// competed all four in that meet, matching how NCAA all-around scoring
// actually works. Rows with no meet_date can't be grouped into a meet, so
// they're excluded from AA (they still count toward the other 4 categories).
function aaScoresByMeet(rows: ScoreRow[]): { weekNumber: number; score: number; meetDate: string }[] {
    const byMeet = new Map<string, Partial<Record<ScoreRow['event'], number>> & { weekNumber: number }>();
    for (const row of rows) {
        if (!row.meetDate) continue;
        const entry = byMeet.get(row.meetDate) ?? { weekNumber: row.weekNumber };
        entry[row.event] = row.score;
        byMeet.set(row.meetDate, entry);
    }
    const totals: { weekNumber: number; score: number; meetDate: string }[] = [];
    for (const [meetDate, entry] of byMeet) {
        if (entry.vault != null && entry.bars != null && entry.beam != null && entry.floor != null) {
            totals.push({
                weekNumber: entry.weekNumber,
                score: round3(entry.vault + entry.bars + entry.beam + entry.floor),
                meetDate
            });
        }
    }
    return totals;
}

export function computeScoreMetrics(rows: ScoreRow[]): Record<Category, MetricSet> {
    const byEvent: Record<ScoreRow['event'], { weekNumber: number; score: number; meetDate: string | null }[]> = {
        vault: [], bars: [], beam: [], floor: []
    };
    for (const row of rows) {
        byEvent[row.event].push({ weekNumber: row.weekNumber, score: row.score, meetDate: row.meetDate });
    }
    return {
        vault: metricsFromScores(byEvent.vault),
        bars: metricsFromScores(byEvent.bars),
        beam: metricsFromScores(byEvent.beam),
        floor: metricsFromScores(byEvent.floor),
        aa: metricsFromScores(aaScoresByMeet(rows))
    };
}
