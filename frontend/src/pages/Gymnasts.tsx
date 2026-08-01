import { Fragment, useEffect, useMemo, useState } from 'react';
import { api, EventFilter, Gymnast, NcaaTeam } from '../lib/api';

const EVENT_OPTIONS: { value: '' | EventFilter; label: string }[] = [
    { value: '',      label: 'All events' },
    { value: 'aa',    label: 'All-around' },
    { value: 'vault', label: 'Vault' },
    { value: 'bars',  label: 'Bars' },
    { value: 'beam',  label: 'Beam' },
    { value: 'floor', label: 'Floor' }
];

const EVENT_ROW: { key: keyof Gymnast['eventAverages']; label: string }[] = [
    { key: 'vault', label: 'VT' },
    { key: 'bars',  label: 'UB' },
    { key: 'beam',  label: 'BB' },
    { key: 'floor', label: 'FX' }
];

const EVENT_DETAIL_ROW: { key: keyof Gymnast['eventAverages']; label: string }[] = [
    { key: 'vault', label: 'Vault' },
    { key: 'bars',  label: 'Bars' },
    { key: 'beam',  label: 'Beam' },
    { key: 'floor', label: 'Floor' }
];

// Realistic NCAA scoring band — scores rarely fall outside 9.0-10.0, so
// scaling to this window (instead of 0-10) makes differences between
// events actually visible instead of every value reading as ~95% of scale.
const CHART_MIN = 9.0;
const CHART_MAX = 10.0;

function trendDirection(scores: number[]): 'up' | 'down' | 'flat' {
    if (scores.length < 2) return 'flat';
    const mid = Math.ceil(scores.length / 2);
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const diff = avg(scores.slice(mid)) - avg(scores.slice(0, mid));
    if (diff > 0.03) return 'up';
    if (diff < -0.03) return 'down';
    return 'flat';
}

const TREND_ICON: Record<'up' | 'down' | 'flat', string> = { up: '↗', down: '↘', flat: '→' };

function Sparkline({ scores }: { scores: number[] }) {
    const width = 200;
    const height = 32;
    const points = scores.map((s, i) => {
        const clamped = Math.min(Math.max(s, CHART_MIN), CHART_MAX);
        const x = scores.length > 1 ? (i / (scores.length - 1)) * width : width / 2;
        const y = height - ((clamped - CHART_MIN) / (CHART_MAX - CHART_MIN)) * height;
        return [x, y];
    });
    const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
    const [lastX, lastY] = points[points.length - 1];

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="sparkline" preserveAspectRatio="none" aria-hidden="true">
            <path d={areaPath} className="sparkline__area" />
            <path d={linePath} className="sparkline__line" />
            <circle cx={lastX} cy={lastY} r={2.5} className="sparkline__dot" />
        </svg>
    );
}

function GymnastDetailModal({ gymnast, onClose }: { gymnast: Gymnast; onClose: () => void }) {
    const [weeklyScores, setWeeklyScores] = useState<Record<'vault' | 'bars' | 'beam' | 'floor', { week: number; score: number }[]> | null>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        let cancelled = false;
        setWeeklyScores(null);
        api.weeklyScores(gymnast.id, 2026)
            .then((scores) => { if (!cancelled) setWeeklyScores(scores); })
            .catch(() => { if (!cancelled) setWeeklyScores({ vault: [], bars: [], beam: [], floor: [] }); });
        return () => { cancelled = true; };
    }, [gymnast.id]);

    const bestEvent = useMemo(() => {
        let best: { key: string; label: string; value: number } | null = null;
        for (const { key, label } of EVENT_DETAIL_ROW) {
            const value = gymnast.eventAverages[key];
            if (value !== null && (!best || value > best.value)) best = { key, label, value };
        }
        return best;
    }, [gymnast]);

    return (
        <div className="gymnast-modal-backdrop" onClick={onClose}>
            <div
                className="gymnast-modal card"
                role="dialog"
                aria-modal="true"
                aria-label={`${gymnast.firstName} ${gymnast.lastName} performance detail`}
                onClick={(e) => e.stopPropagation()}
            >
                <button type="button" className="gymnast-modal__close" onClick={onClose} aria-label="Close">
                    &times;
                </button>

                <div className="gymnast-modal__head">
                    <div className="gymnast-card__team">
                        <div className="gymnast-card__team-name">{gymnast.team.shortName}</div>
                        <div className="gymnast-card__team-conf">{gymnast.team.conference || ''}</div>
                    </div>
                </div>

                <div className="gymnast-modal__name-row">
                    <h2 className="gymnast-modal__name">
                        {gymnast.firstName} {gymnast.lastName}
                    </h2>
                    {gymnast.classYear && <span className="class-pill">{gymnast.classYear}</span>}
                </div>

                <div className="gymnast-modal__season">
                    <div className="gymnast-modal__season-value">
                        {gymnast.seasonAverage !== null ? gymnast.seasonAverage.toFixed(3) : '—'}
                    </div>
                    <div className="gymnast-modal__season-label">Season average</div>
                </div>

                <div className="gymnast-modal__events">
                    {EVENT_DETAIL_ROW.map(({ key, label }) => {
                        const value = gymnast.eventAverages[key];
                        const competes = gymnast.events[key];
                        const weeks = weeklyScores?.[key];
                        const scores = weeks && weeks.length > 0 ? weeks.map((w) => w.score) : null;
                        const trend = scores ? trendDirection(scores) : null;
                        return (
                            <div className="event-bar-row" key={key}>
                                <div className="event-bar-row__label">
                                    {label}
                                    {bestEvent?.key === key && (
                                        <span className="event-bar-row__best">Best event</span>
                                    )}
                                </div>
                                <div className="event-bar-row__track">
                                    {scores && <Sparkline scores={scores} />}
                                    {!scores && weeklyScores && competes && (
                                        <span className="event-bar-row__no-data">No 2026 meet data yet</span>
                                    )}
                                </div>
                                <div className="event-bar-row__value">
                                    {value !== null ? (
                                        <>
                                            {trend && (
                                                <span className={`event-bar-row__trend event-bar-row__trend--${trend}`}>
                                                    {TREND_ICON[trend]}
                                                </span>
                                            )}
                                            {value.toFixed(3)}
                                        </>
                                    ) : competes ? '—' : 'N/A'}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {weeklyScores && (
                    <p className="gymnast-modal__note">
                        Weekly trend shows real 2026 season meet scores.
                    </p>
                )}

                {gymnast.events.allAround && (
                    <div className="gymnast-modal__aa-note">Competes all-around</div>
                )}
            </div>
        </div>
    );
}

export function Gymnasts() {
    const [teams, setTeams]       = useState<NcaaTeam[]>([]);
    const [team, setTeam]         = useState<string>('');
    const [event, setEvent]       = useState<'' | EventFilter>('');
    const [search, setSearch]     = useState<string>('');
    const [items, setItems]       = useState<Gymnast[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState<string | null>(null);
    const [selected, setSelected] = useState<Gymnast | null>(null);
    const [lastScores, setLastScores] = useState<Record<number, Record<'vault' | 'bars' | 'beam' | 'floor', number | null>>>({});

    // Load teams once.
    useEffect(() => {
        (async () => {
            try {
                const { teams } = await api.ncaaTeams();
                setTeams(teams);
            } catch {
                // Non-fatal — the team filter just won't be populated.
            }
        })();
    }, []);

    // Debounced reload when filters change.
    useEffect(() => {
        let cancelled = false;
        const t = setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                const { gymnasts } = await api.gymnasts({
                    team:   team   || undefined,
                    search: search || undefined,
                    event:  event  || undefined
                });
                if (!cancelled) setItems(gymnasts);

                // "Last" column needs each gymnast's most recent 2026 meet
                // score — fetched in one batched query rather than per row.
                api.lastScores(gymnasts.map(g => g.id))
                    .then(scores => { if (!cancelled) setLastScores(scores); })
                    .catch(() => { if (!cancelled) setLastScores({}); });
            } catch (e) {
                const err = e as { error?: string };
                if (!cancelled) setError(err.error || 'Could not load gymnasts.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 200);

        return () => { cancelled = true; clearTimeout(t); };
    }, [team, event, search]);

    const resultsLabel = useMemo(() => {
        if (loading) return 'Loading…';
        if (items.length === 0) return 'No gymnasts match those filters.';
        return `${items.length} gymnast${items.length === 1 ? '' : 's'}`;
    }, [loading, items.length]);

    return (
        <main className="page">
            <h1 className="page-title">Gymnasts</h1>
            <p className="page-subtitle">
                The pool of NCAA athletes you can draft. Filter by program, event, or name.
            </p>

            <div className="filter-bar">
                <input
                    type="text"
                    placeholder="Search by name…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search gymnasts"
                />
                <select
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    aria-label="Filter by team"
                >
                    <option value="">All teams</option>
                    {teams.map(t => (
                        <option key={t.slug} value={t.slug}>{t.shortName}</option>
                    ))}
                </select>
                <select
                    value={event}
                    onChange={(e) => setEvent(e.target.value as '' | EventFilter)}
                    aria-label="Filter by event"
                >
                    {EVENT_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            </div>

            <div style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 12px' }}>
                {resultsLabel}
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="table-scroll">
                <table className="gymnast-table">
                    <thead>
                        <tr>
                            <th rowSpan={2} className="th-sticky th-sticky--name">Name</th>
                            <th rowSpan={2} className="th-sticky th-sticky--team">University</th>
                            {EVENT_ROW.map(({ key, label }) => (
                                <th key={key} colSpan={2} className="th-group">{label}</th>
                            ))}
                        </tr>
                        <tr>
                            {EVENT_ROW.map(({ key }) => (
                                <Fragment key={key}>
                                    <th>Avg</th>
                                    <th>Last</th>
                                </Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(g => {
                            const gymnastLastScores = lastScores[g.id];
                            return (
                                <tr
                                    key={g.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setSelected(g)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(g); } }}
                                    aria-label={`View performance detail for ${g.firstName} ${g.lastName}`}
                                >
                                    <td className="td-sticky td-sticky--name td-name">{g.firstName} {g.lastName}</td>
                                    <td className="td-sticky td-sticky--team">{g.team.shortName}</td>
                                    {EVENT_ROW.map(({ key }) => {
                                        const avg = g.eventAverages[key];
                                        const last = gymnastLastScores?.[key] ?? null;
                                        return (
                                            <Fragment key={key}>
                                                <td className={avg === null ? 'td-muted' : undefined}>
                                                    {avg !== null ? avg.toFixed(3) : '—'}
                                                </td>
                                                <td className={last === null ? 'td-muted' : undefined}>
                                                    {last !== null ? last.toFixed(3) : '—'}
                                                </td>
                                            </Fragment>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {selected && (
                <GymnastDetailModal gymnast={selected} onClose={() => setSelected(null)} />
            )}
        </main>
    );
}
