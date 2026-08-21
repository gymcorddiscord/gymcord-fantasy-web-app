/**
 * Shared type contract for the score-metrics layer — Average / Median /
 * Most Recent / High / Average-Home / Average-Away / Rolling-3-Meet-Average
 * per gymnast x category x season.
 *
 * The actual computation lives in Postgres now, not here: `api.scoreMetrics()`
 * queries the `gymnast_event_season_metrics` SQL view (built on top of
 * `scores` via `gymnast_event_week_scores` -> `gymnast_aa_week_scores` ->
 * `gymnast_event_scores_all`), so every consumer gets numbers computed once,
 * server-side, instead of recomputing them from raw score rows in the
 * browser. This file previously held that client-side computation directly;
 * it was retired in favor of the SQL views on 2026-08-21 (see
 * gymcord_fantasy_score_view_metrics memory) — only the shared types remain.
 *
 * NQS is intentionally not part of MetricSet even though the SQL view
 * computes it: `scores.location` (home/away) is still NULL for essentially
 * all rows, so a live NQS column would read as empty everywhere. NQS stays
 * on the flat `gymnasts.*_nqs` snapshot columns until there's enough
 * home/away-tagged data to make the live version meaningful.
 */

export type Category = 'vault' | 'bars' | 'beam' | 'floor' | 'aa';
export type Metric = 'average' | 'median' | 'mostRecent' | 'high' | 'avgHome' | 'avgAway' | 'rolling3';
export type MetricSet = Record<Metric, number | null>;
export type MeetLocation = 'home' | 'away';
