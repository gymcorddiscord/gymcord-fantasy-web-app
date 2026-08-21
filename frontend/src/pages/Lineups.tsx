import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Button,
    Card,
    Checkbox,
    Dialog,
    Dropdown,
    LoadingIndicator,
    ScoreCell,
    Text,
    ByeBadge,
    DoubleWeekBadge,
    HomeAwayBadge,
    InjuryBadge,
    DotsSixIcon,
    type DropdownOption
} from 'gymcord-design-system';
import Sortable from 'sortablejs';
import { api, Gymnast, LeagueMembership } from '../lib/api';
import { Category, Metric, MetricSet } from '../lib/scoreMetrics';
import {
    Event,
    Outcome,
    SelectionMap,
    SEASON_YEAR,
    CURRENT_WEEK,
    SEASON_END_WEEK,
    MeetScheduleEntry,
    fetchMeetSchedule,
    fetchSelections,
    fetchWeekScores,
    computeWeekOutcomes,
    setSelection,
    clearWeek,
    copyWeekSelections
} from '../lib/lineups';

const EVENTS: { key: Event; label: string; category: Category }[] = [
    { key: 'vault', label: 'VT', category: 'vault' },
    { key: 'bars', label: 'UB', category: 'bars' },
    { key: 'beam', label: 'BB', category: 'beam' },
    { key: 'floor', label: 'FX', category: 'floor' }
];

const METRIC_OPTIONS: DropdownOption<Metric>[] = [
    { value: 'average', label: 'Average' },
    { value: 'median', label: 'Median' },
    { value: 'mostRecent', label: 'Most Recent' },
    { value: 'high', label: 'High' },
    { value: 'avgHome', label: 'Average (Home)' },
    { value: 'avgAway', label: 'Average (Away)' },
    { value: 'rolling3', label: 'Rolling 3-Meet Avg' }
];

type SortKey = 'name' | 'university' | Event;
type SortState = { key: SortKey; dir: 'asc' | 'desc' };

interface RosterRow {
    gymnastId: number;
    gymnast: Gymnast;
}

function getSortValue(row: RosterRow, metrics: Record<number, Record<Category, MetricSet>>, metric: Metric, key: SortKey): string | number | null {
    if (key === 'name') return `${row.gymnast.lastName} ${row.gymnast.firstName}`;
    if (key === 'university') return row.gymnast.team.shortName;
    return metrics[row.gymnastId]?.[key]?.[metric] ?? null;
}

function compareValues(a: string | number | null, b: string | number | null, dir: 'asc' | 'desc'): number {
    if (a === null && b === null) return 0;
    if (a === null) return 1; // no-score rows always sort to the bottom
    if (b === null) return -1;
    if (typeof a === 'string' || typeof b === 'string') {
        return dir === 'asc' ? String(a).localeCompare(String(b)) : String(b).localeCompare(String(a));
    }
    return dir === 'asc' ? a - b : b - a;
}

function counterClass(count: number, cap: number): string {
    if (count >= cap) return 'lineup-counter--full';
    if (count >= cap - 2) return 'lineup-counter--near';
    return 'lineup-counter--under';
}

export function Lineups() {
    const { membershipId, week: weekParam } = useParams<{ membershipId: string; week?: string }>();
    const navigate = useNavigate();

    const parsedWeek = weekParam ? Number(weekParam) : NaN;
    const viewedWeek = Number.isFinite(parsedWeek) && parsedWeek >= 1 ? parsedWeek : CURRENT_WEEK;
    const isHistorical = viewedWeek < CURRENT_WEEK;
    const outcomesWeekLabel = isHistorical ? viewedWeek : viewedWeek - 1;

    const [membership, setMembership] = useState<LeagueMembership | null>(null);
    const [roster, setRoster] = useState<RosterRow[]>([]);
    const [metrics, setMetrics] = useState<Record<number, Record<Category, MetricSet>>>({});
    const [schedule, setSchedule] = useState<Record<number, MeetScheduleEntry[]>>({});
    const [selections, setSelections] = useState<SelectionMap>(new Map());
    const [outcomes, setOutcomes] = useState<Map<string, Outcome>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [metric, setMetric] = useState<Metric>('average');
    const [sort, setSort] = useState<SortState | null>(null);
    const [hideBye, setHideBye] = useState(false);
    const [hideInjured, setHideInjured] = useState(false);
    const [justSaved, setJustSaved] = useState(false);

    function flashSaved() {
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
    }

    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
    const [importConfirmOpen, setImportConfirmOpen] = useState(false);
    const [populateConfirmOpen, setPopulateConfirmOpen] = useState(false);
    const [bulkBusy, setBulkBusy] = useState(false);

    const rosterForSortRef = useRef<RosterRow[]>([]);
    const tbodyRef = useRef<HTMLTableSectionElement>(null);
    rosterForSortRef.current = roster;

    useEffect(() => {
        if (!membershipId) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const m = await api.getMembershipById(Number(membershipId));
                if (cancelled) return;
                if (!m) {
                    navigate('/home');
                    return;
                }
                setMembership(m);

                const rosterRows = await api.rosterForMember(m.id);
                if (cancelled) return;
                setRoster(rosterRows);

                const gymnastIds = rosterRows.map((r) => r.gymnastId);
                // Historical (past) weeks show that week's OWN counted/dropped
                // outcome — that's what "results" means once it's locked. The
                // live/future week instead shows LAST week's outcome, as a
                // reference signal while still deciding this week's picks.
                const outcomesWeek = isHistorical ? viewedWeek : viewedWeek - 1;
                const [metricsResult, scheduleResult, selectionsResult, outcomeSelections, outcomeScores] = await Promise.all([
                    api.scoreMetrics(gymnastIds, SEASON_YEAR),
                    fetchMeetSchedule(gymnastIds, SEASON_YEAR, viewedWeek),
                    fetchSelections(m.id, SEASON_YEAR, viewedWeek),
                    outcomesWeek >= 1 ? fetchSelections(m.id, SEASON_YEAR, outcomesWeek) : Promise.resolve(new Map()),
                    outcomesWeek >= 1 ? fetchWeekScores(gymnastIds, SEASON_YEAR, outcomesWeek) : Promise.resolve([])
                ]);
                if (cancelled) return;
                setMetrics(metricsResult);
                setSchedule(scheduleResult);
                setSelections(selectionsResult);
                setOutcomes(computeWeekOutcomes(outcomeSelections, outcomeScores, m.league.countScore));
            } catch {
                if (!cancelled) setError('Could not load your lineup. Please try again.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [membershipId, viewedWeek, isHistorical, navigate]);

    const filteredRoster = useMemo(() => {
        return roster.filter((row) => {
            if (hideBye && (schedule[row.gymnastId]?.length ?? 0) === 0) return false;
            if (hideInjured && row.gymnast.injuryStatus !== 'healthy') return false;
            return true;
        });
    }, [roster, schedule, hideBye, hideInjured]);

    const sortedRoster = useMemo(() => {
        if (!sort) return filteredRoster;
        return [...filteredRoster].sort((a, b) => compareValues(getSortValue(a, metrics, metric, sort.key), getSortValue(b, metrics, metric, sort.key), sort.dir));
    }, [filteredRoster, metrics, metric, sort]);

    function handleSort(key: SortKey) {
        setSort((prev) => {
            if (prev?.key !== key) return { key, dir: key === 'name' || key === 'university' ? 'asc' : 'desc' };
            if (prev.dir === (key === 'name' || key === 'university' ? 'asc' : 'desc')) {
                return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
            }
            return null; // third click: back to default (drag) order
        });
    }

    function sortIndicator(key: SortKey) {
        if (sort?.key !== key) return null;
        return (
            <span className="th-sort-arrow" aria-hidden="true">
                {sort.dir === 'asc' ? '▲' : '▼'}
            </span>
        );
    }

    // Per-apparatus selection counts, across the FULL roster (not the
    // filtered/sorted view) — enforcement and the header counter are
    // roster-wide, unaffected by Hide Bye/Hide Injured or sorting.
    const counts = useMemo(() => {
        const c: Record<Event, number> = { vault: 0, bars: 0, beam: 0, floor: 0 };
        for (const events of selections.values()) {
            for (const e of events) c[e]++;
        }
        return c;
    }, [selections]);

    const upCount = membership?.league.upCount ?? 10;

    // Drag-to-reorder only applies to the roster's own custom order — once a
    // column sort is active the displayed order is derived, not draggable,
    // same reasoning as disabling it while Hide Bye/Hide Injured are
    // filtering rows out (the DOM wouldn't have every roster row to read
    // positions back from).
    const dragEnabled = sort === null && !hideBye && !hideInjured && !isHistorical;
    useEffect(() => {
        if (!dragEnabled || loading || !tbodyRef.current || !membership) return;
        const tbody = tbodyRef.current;
        const sortable = Sortable.create(tbody, {
            handle: '.lineup-matrix__drag-handle',
            animation: 150,
            onEnd: () => {
                const orderedIds = Array.from(tbody.children)
                    .map((el) => Number((el as HTMLElement).dataset.gymnastId))
                    .filter((id) => !Number.isNaN(id));
                if (orderedIds.length === 0) return;
                const byId = new Map(rosterForSortRef.current.map((r) => [r.gymnastId, r]));
                const reordered = orderedIds.map((id) => byId.get(id)).filter((r): r is RosterRow => Boolean(r));
                setRoster(reordered);
                api.reorderRoster(membership.leagueId, membership.id, orderedIds).catch(() => {
                    // Best-effort — a refresh re-fetches the last-saved order if this failed.
                });
            }
        });
        return () => sortable.destroy();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dragEnabled, loading, membership?.id]);

    async function handleToggle(gymnastId: number, event: Event, checked: boolean) {
        if (!membership || isHistorical) return;
        // Cap enforcement: block new selections once that apparatus is at
        // capacity — unchecking is always allowed.
        if (checked && counts[event] >= upCount) return;

        const prev = selections;
        const next = new Map(prev);
        const set = new Set(next.get(gymnastId) ?? []);
        if (checked) set.add(event);
        else set.delete(event);
        next.set(gymnastId, set);
        setSelections(next);

        try {
            await setSelection(membership.id, membership.leagueId, gymnastId, event, SEASON_YEAR, viewedWeek, checked);
            flashSaved();
        } catch {
            setSelections(prev); // roll back on failure
        }
    }

    async function handleClearAll() {
        if (!membership || isHistorical) return;
        setBulkBusy(true);
        try {
            await clearWeek(membership.id, SEASON_YEAR, viewedWeek);
            setSelections(new Map());
            flashSaved();
        } finally {
            setBulkBusy(false);
            setClearConfirmOpen(false);
        }
    }

    async function handleImportLastWeek() {
        if (!membership || isHistorical) return;
        setBulkBusy(true);
        try {
            await copyWeekSelections(membership.id, membership.leagueId, SEASON_YEAR, viewedWeek - 1, viewedWeek);
            setSelections(await fetchSelections(membership.id, SEASON_YEAR, viewedWeek));
            flashSaved();
        } finally {
            setBulkBusy(false);
            setImportConfirmOpen(false);
        }
    }

    async function handlePopulateFutureWeeks() {
        if (!membership || isHistorical) return;
        setBulkBusy(true);
        try {
            for (let week = viewedWeek + 1; week <= SEASON_END_WEEK; week++) {
                await copyWeekSelections(membership.id, membership.leagueId, SEASON_YEAR, viewedWeek, week);
            }
        } finally {
            setBulkBusy(false);
            setPopulateConfirmOpen(false);
        }
    }

    const hasAnySelections = selections.size > 0 && [...selections.values()].some((s) => s.size > 0);

    if (loading || !membership) {
        return (
            <div className="full-page-loader">
                <LoadingIndicator />
            </div>
        );
    }

    if (error) {
        return (
            <main className="page">
                <Text tone="secondary">{error}</Text>
            </main>
        );
    }

    return (
        <main className="page page--wide">
            <h1 className="page-title">Week {viewedWeek} Lineup</h1>
            <p className="page-subtitle">
                {membership.teamName} · {membership.league.name}
            </p>

            {isHistorical && (
                <div className="lineup-locked-banner">
                    Week {viewedWeek} is locked — showing what actually happened, read-only.
                </div>
            )}

            <div className="lineup-controls">
                <div className="lineup-controls__left">
                    {!isHistorical && (
                        <>
                            <Button variant="secondary" disabled={viewedWeek <= 1 || bulkBusy} onClick={() => setImportConfirmOpen(true)}>
                                Import Last Week
                            </Button>
                            <Button variant="secondary" disabled={bulkBusy} onClick={() => setPopulateConfirmOpen(true)} title="Apply these lineups to all future weeks">
                                Populate All Future Weeks
                            </Button>
                        </>
                    )}
                </div>
                <div className="lineup-controls__right">
                    <Dropdown options={METRIC_OPTIONS} value={metric} onChange={setMetric} />
                    <div className="lineup-toggle">
                        <Checkbox checked={hideBye} onChange={setHideBye} label="Hide Bye" />
                    </div>
                    <div className="lineup-toggle">
                        <Checkbox checked={hideInjured} onChange={setHideInjured} label="Hide Injured" />
                    </div>
                    {!isHistorical && (
                        <Button variant="tertiary" disabled={!hasAnySelections || bulkBusy} onClick={() => setClearConfirmOpen(true)}>
                            Clear All
                        </Button>
                    )}
                </div>
            </div>

            {justSaved ? <div className="lineup-saved-indicator">Saved</div> : null}

            <Card elevation="raised">
                <div className="lineup-matrix-wrap">
                    <table className="lineup-matrix">
                        <thead>
                            <tr>
                                <th className="th-sticky th-sortable" onClick={() => handleSort('name')}>
                                    Gymnast{sortIndicator('name')}
                                </th>
                                <th className="th-sortable lineup-matrix__university-col" onClick={() => handleSort('university')}>
                                    University{sortIndicator('university')}
                                </th>
                                {EVENTS.map((e) => (
                                    <th key={e.key} className="th-sortable" onClick={() => handleSort(e.key)}>
                                        <span className="lineup-matrix__event-header">
                                            <span>
                                                {e.label}
                                                {sortIndicator(e.key)}
                                            </span>
                                            <span className={`lineup-counter ${counterClass(counts[e.key], upCount)}`}>
                                                ✓ {counts[e.key]} / {upCount}
                                            </span>
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody ref={tbodyRef}>
                            {sortedRoster.map((row) => {
                                const meets = schedule[row.gymnastId] ?? [];
                                const isBye = meets.length === 0;
                                const isDouble = meets.length >= 2;
                                return (
                                    <tr key={row.gymnastId} data-gymnast-id={row.gymnastId} className={row.gymnast.injuryStatus === 'long_term' ? 'lineup-row--long-term' : isBye ? 'lineup-row--bye' : undefined}>
                                        <td className="th-sticky">
                                            <span className="lineup-matrix__name-cell">
                                                <span
                                                    className={`lineup-matrix__drag-handle${dragEnabled ? '' : ' lineup-matrix__drag-handle--disabled'}`}
                                                    aria-hidden="true"
                                                    title={dragEnabled ? 'Drag to reorder' : 'Clear sorting/filters to reorder'}
                                                >
                                                    <DotsSixIcon size={14} />
                                                </span>
                                                <span className="lineup-matrix__name">{row.gymnast.firstName} {row.gymnast.lastName}</span>
                                                <span className="lineup-matrix__badges">
                                                    {row.gymnast.injuryStatus === 'long_term' && <InjuryBadge severity="long-term" />}
                                                    {row.gymnast.injuryStatus === 'short_term' && <InjuryBadge severity="short-term" />}
                                                    {isBye && <ByeBadge />}
                                                    {isDouble && <DoubleWeekBadge />}
                                                    {!isBye && !isDouble && meets[0]?.location && <HomeAwayBadge type={meets[0].location} />}
                                                </span>
                                            </span>
                                        </td>
                                        <td className="lineup-matrix__university-col">{row.gymnast.team.shortName}</td>
                                        {EVENTS.map((e) => {
                                            const value = metrics[row.gymnastId]?.[e.category]?.[metric] ?? null;
                                            const checked = selections.get(row.gymnastId)?.has(e.key) ?? false;
                                            const atCap = counts[e.key] >= upCount && !checked;
                                            const competes = row.gymnast.events[e.key];
                                            const outcome = outcomes.get(`${row.gymnastId}-${e.key}`);
                                            const outcomeClass = outcome === 'counted' ? 'lineup-outcome--counted' : outcome === 'dropped' ? 'lineup-outcome--dropped' : '';
                                            return (
                                                <td key={e.key} className={outcomeClass} title={outcome === 'counted' ? `Counted toward the team total in Week ${outcomesWeekLabel}` : outcome === 'dropped' ? `Selected but dropped in Week ${outcomesWeekLabel}` : undefined}>
                                                    <ScoreCell
                                                        value={competes ? value : null}
                                                        checked={checked}
                                                        disabled={atCap || isHistorical}
                                                        onCheckedChange={(next) => handleToggle(row.gymnastId, e.key, next)}
                                                    />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {sortedRoster.length === 0 && (
                        <div className="empty-state">
                            <Text tone="tertiary">
                                {roster.length === 0 ? 'Your roster is empty.' : 'No gymnasts match Hide Bye / Hide Injured.'}
                            </Text>
                        </div>
                    )}
                </div>
            </Card>

            <Dialog
                open={clearConfirmOpen}
                onClose={() => setClearConfirmOpen(false)}
                title={`Clear all lineup selections for Week ${viewedWeek}?`}
                actions={
                    <>
                        <Button variant="tertiary" onClick={() => setClearConfirmOpen(false)} disabled={bulkBusy}>
                            Cancel
                        </Button>
                        <Button className="btn-danger" onClick={handleClearAll} disabled={bulkBusy}>
                            {bulkBusy ? 'Clearing' : 'Clear All'}
                        </Button>
                    </>
                }
            >
                <Text>This removes every gymnast currently selected for Week {viewedWeek}.</Text>
            </Dialog>

            <Dialog
                open={importConfirmOpen}
                onClose={() => setImportConfirmOpen(false)}
                title="Replace this week with last week's lineup?"
                actions={
                    <>
                        <Button variant="tertiary" onClick={() => setImportConfirmOpen(false)} disabled={bulkBusy}>
                            Cancel
                        </Button>
                        <Button onClick={handleImportLastWeek} disabled={bulkBusy}>
                            {bulkBusy ? 'Importing' : 'Import Last Week'}
                        </Button>
                    </>
                }
            >
                <Text>This will replace your current lineup with last week's. Continue?</Text>
            </Dialog>

            <Dialog
                open={populateConfirmOpen}
                onClose={() => setPopulateConfirmOpen(false)}
                title="Apply these lineups to all future weeks?"
                actions={
                    <>
                        <Button variant="tertiary" onClick={() => setPopulateConfirmOpen(false)} disabled={bulkBusy}>
                            Cancel
                        </Button>
                        <Button onClick={handlePopulateFutureWeeks} disabled={bulkBusy}>
                            {bulkBusy ? 'Applying' : 'Apply to All Future Weeks'}
                        </Button>
                    </>
                }
            >
                <Text>This replaces every remaining week's lineup with this week's selections.</Text>
            </Dialog>
        </main>
    );
}
