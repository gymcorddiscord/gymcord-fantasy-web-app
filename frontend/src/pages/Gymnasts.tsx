import { useEffect, useMemo, useRef, useState } from 'react';
import { api, Division, Gymnast, NcaaTeam } from '../lib/api';

// Plain geometric glyph, not an emoji — every other icon in this table
// (⌄ ▲ ▼ × → ↗ ↘) is a monochrome character that inherits currentColor,
// and a colorful 🔍 would be the one icon that doesn't fit that language.
function SearchIcon() {
    return (
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
            <line x1="11" y1="11" x2="15" y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    );
}

// Free-text filter dropdown used on the Name column header — bound
// directly to the page's existing `search` state so it drives the same
// debounced fetch as any other entry point into that filter.
function NameSearchPopover({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
    const wrapRef = useRef<HTMLSpanElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        function reposition() {
            const rect = triggerRef.current?.getBoundingClientRect();
            if (rect) setCoords({ top: rect.bottom + 6, left: rect.left });
        }
        reposition();
        function onPointerDown(e: MouseEvent) {
            const target = e.target as Node;
            if (
                wrapRef.current && !wrapRef.current.contains(target) &&
                !document.querySelector('.col-filter__panel')?.contains(target)
            ) {
                setOpen(false);
            }
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKey);
        window.addEventListener('scroll', reposition, true);
        window.addEventListener('resize', reposition);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKey);
            window.removeEventListener('scroll', reposition, true);
            window.removeEventListener('resize', reposition);
        };
    }, [open]);

    return (
        <span className="col-filter" ref={wrapRef} onClick={(e) => e.stopPropagation()}>
            <button
                ref={triggerRef}
                type="button"
                className="col-filter__trigger"
                onClick={() => setOpen(o => !o)}
                aria-label="Search by name"
                aria-expanded={open}
            >
                <SearchIcon />
                {value && <span className="col-filter__badge">1</span>}
            </button>
            {open && coords && (
                <div className="col-filter__panel card" style={{ position: 'fixed', top: coords.top, left: coords.left }}>
                    <input
                        type="text"
                        className="col-filter__search"
                        placeholder="Search by name…"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        autoFocus
                    />
                    {value && (
                        <button type="button" className="btn-link col-filter__clear" onClick={() => onChange('')}>
                            Clear
                        </button>
                    )}
                </div>
            )}
        </span>
    );
}

// Multi-select filter dropdown used on the University and Division column
// headers. Each instance owns its own open/search state — clicking the
// trigger must not also fire the header's onClick (which sorts).
function ColumnFilterPopover({
    options,
    selected,
    onToggle,
    onClear,
    searchable
}: {
    options: { value: string; label: string }[];
    selected: Set<string>;
    onToggle: (value: string) => void;
    onClear: () => void;
    searchable?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
    const wrapRef = useRef<HTMLSpanElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        function reposition() {
            const rect = triggerRef.current?.getBoundingClientRect();
            if (rect) setCoords({ top: rect.bottom + 6, left: rect.left });
        }
        reposition();
        function onPointerDown(e: MouseEvent) {
            const target = e.target as Node;
            if (
                wrapRef.current && !wrapRef.current.contains(target) &&
                !document.querySelector('.col-filter__panel')?.contains(target)
            ) {
                setOpen(false);
            }
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKey);
        window.addEventListener('scroll', reposition, true);
        window.addEventListener('resize', reposition);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKey);
            window.removeEventListener('scroll', reposition, true);
            window.removeEventListener('resize', reposition);
        };
    }, [open]);

    const visibleOptions = searchable && search
        ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
        : options;

    return (
        <span className="col-filter" ref={wrapRef} onClick={(e) => e.stopPropagation()}>
            <button
                ref={triggerRef}
                type="button"
                className="col-filter__trigger"
                onClick={() => setOpen(o => !o)}
                aria-label="Filter this column"
                aria-expanded={open}
            >
                {searchable ? <SearchIcon /> : '⌄'}
                {selected.size > 0 && <span className="col-filter__badge">{selected.size}</span>}
            </button>
            {open && coords && (
                <div className="col-filter__panel card" style={{ position: 'fixed', top: coords.top, left: coords.left }}>
                    {searchable && (
                        <input
                            type="text"
                            className="col-filter__search"
                            placeholder="Search…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    )}
                    <div className="col-filter__options">
                        {visibleOptions.map(o => (
                            <label className="col-filter__option" key={o.value}>
                                <input type="checkbox" checked={selected.has(o.value)} onChange={() => onToggle(o.value)} />
                                {o.label}
                            </label>
                        ))}
                        {visibleOptions.length === 0 && <div className="col-filter__empty">No matches</div>}
                    </div>
                    {selected.size > 0 && (
                        <button type="button" className="btn-link col-filter__clear" onClick={onClear}>
                            Clear
                        </button>
                    )}
                </div>
            )}
        </span>
    );
}

type ApparatusKey = 'vault' | 'bars' | 'beam' | 'floor';
type MetricKey = 'avg' | 'last' | 'nqs';
type ColumnId = `${ApparatusKey}-${MetricKey}`;

const EVENT_ROW: { key: ApparatusKey; label: string }[] = [
    { key: 'vault', label: 'VT' },
    { key: 'bars',  label: 'UB' },
    { key: 'beam',  label: 'BB' },
    { key: 'floor', label: 'FX' }
];

const METRICS: { key: MetricKey; label: string; title: string }[] = [
    { key: 'avg',  label: 'Avg',  title: 'Season average' },
    { key: 'last', label: 'Last', title: 'Most recent meet score' },
    { key: 'nqs',  label: 'NQS',  title: 'National Qualifying Score (2026 regular season)' }
];

function columnId(event: ApparatusKey, metric: MetricKey): ColumnId {
    return `${event}-${metric}`;
}

// Derived "if N of her events counted" totals, built from the Avg column
// across apparatus — not stored data, computed per row.
type CompositeKey = 'aa4' | 'top3' | 'top2' | 'top1';
const COMPOSITE_COLUMNS: { key: CompositeKey; n: number; label: string; title: string }[] = [
    { key: 'aa4',  n: 4, label: 'AA',    title: 'All-around average — sum of all 4 apparatus averages' },
    { key: 'top3', n: 3, label: '3-Evt', title: 'Sum of the 3 highest apparatus averages' },
    { key: 'top2', n: 2, label: '2-Evt', title: 'Sum of the 2 highest apparatus averages' },
    { key: 'top1', n: 1, label: '1-Evt', title: 'Highest single apparatus average' }
];

// Requires at least `n` non-null apparatus averages — a specialist with
// only 2 events can't produce a real "3 highest" sum, so that cell is
// null (—) rather than a misleadingly partial total.
function topNAverageSum(g: Gymnast, n: number): number | null {
    const vals = EVENT_ROW
        .map(({ key }) => g.eventAverages[key])
        .filter((v): v is number => v !== null)
        .sort((a, b) => b - a);
    if (vals.length < n) return null;
    return vals.slice(0, n).reduce((sum, v) => sum + v, 0);
}

const COLUMNS_STORAGE_KEY = 'gymcordGymnastsColumns';

// Identity columns beyond Name — togglable like any stat column, just
// rendered outside the per-apparatus grid.
const INFO_COLUMNS: { key: 'university' | 'division'; label: string }[] = [
    { key: 'university', label: 'University' },
    { key: 'division', label: 'Division' }
];

// First-run defaults: University/Division and every apparatus's "Last"
// column start hidden to keep the table dense — the user can turn any of
// them back on via the Columns menu, and that choice then persists.
const DEFAULT_HIDDEN_COLUMNS = ['university', 'division', 'vault-last', 'bars-last', 'beam-last', 'floor-last'];

function loadHiddenColumns(): Set<string> {
    try {
        const raw = localStorage.getItem(COLUMNS_STORAGE_KEY);
        if (raw) return new Set(JSON.parse(raw));
    } catch {
        // fall through to defaults
    }
    return new Set(DEFAULT_HIDDEN_COLUMNS);
}

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

type SortKey = 'name' | 'university' | 'division' | ColumnId | CompositeKey;
type SortState = { key: SortKey; dir: 'asc' | 'desc' };

const COMPOSITE_KEYS = new Set<string>(COMPOSITE_COLUMNS.map(c => c.key));

function getSortValue(
    g: Gymnast,
    lastScores: Record<number, Record<ApparatusKey, number | null>>,
    key: SortKey
): string | number | null {
    if (key === 'name') return `${g.lastName} ${g.firstName}`;
    if (key === 'university') return g.team.shortName;
    if (key === 'division') return g.team.division;
    if (COMPOSITE_KEYS.has(key)) {
        const c = COMPOSITE_COLUMNS.find(c => c.key === key)!;
        return topNAverageSum(g, c.n);
    }
    const [event, metric] = key.split('-') as [ApparatusKey, MetricKey];
    if (metric === 'avg') return g.eventAverages[event];
    if (metric === 'last') return lastScores[g.id]?.[event] ?? null;
    return g.eventNqs[event];
}

function compareValues(a: string | number | null, b: string | number | null, dir: 'asc' | 'desc'): number {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    if (typeof a === 'string' || typeof b === 'string') {
        return dir === 'asc' ? String(a).localeCompare(String(b)) : String(b).localeCompare(String(a));
    }
    return dir === 'asc' ? a - b : b - a;
}

const DIVISION_OPTIONS: Division[] = ['Div I', 'Div II', 'Div III'];

export function Gymnasts() {
    const [teams, setTeams]       = useState<NcaaTeam[]>([]);
    const [selectedTeams, setSelectedTeams]         = useState<Set<string>>(new Set());
    const [selectedDivisions, setSelectedDivisions] = useState<Set<string>>(new Set());
    const [search, setSearch]     = useState<string>('');
    const [items, setItems]       = useState<Gymnast[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState<string | null>(null);
    const [selected, setSelected] = useState<Gymnast | null>(null);
    const [lastScores, setLastScores] = useState<Record<number, Record<'vault' | 'bars' | 'beam' | 'floor', number | null>>>({});
    const [sort, setSort]         = useState<SortState | null>({ key: 'aa4', dir: 'desc' });
    const [hiddenCols, setHiddenCols] = useState<Set<string>>(() => loadHiddenColumns());
    const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);

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
                    teams:     selectedTeams.size > 0 ? [...selectedTeams] : undefined,
                    divisions: selectedDivisions.size > 0 ? [...selectedDivisions] as Division[] : undefined,
                    search:    search || undefined
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
    }, [selectedTeams, selectedDivisions, search]);

    const resultsLabel = useMemo(() => {
        if (loading) return 'Loading…';
        if (items.length === 0) return 'No gymnasts match those filters.';
        return `${items.length} gymnast${items.length === 1 ? '' : 's'}`;
    }, [loading, items.length]);

    const sortedItems = useMemo(() => {
        if (!sort) return items;
        return [...items].sort((a, b) =>
            compareValues(getSortValue(a, lastScores, sort.key), getSortValue(b, lastScores, sort.key), sort.dir)
        );
    }, [items, lastScores, sort]);

    function handleSort(key: SortKey) {
        setSort(prev => {
            if (prev?.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
            return { key, dir: key === 'name' || key === 'university' || key === 'division' ? 'asc' : 'desc' };
        });
    }

    function sortIndicator(key: SortKey) {
        if (sort?.key !== key) return null;
        return <span className="th-sort-arrow" aria-hidden="true">{sort.dir === 'asc' ? '▲' : '▼'}</span>;
    }

    function toggleColumn(id: ColumnId | CompositeKey | 'university' | 'division') {
        setHiddenCols(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify([...next]));
            return next;
        });
    }

    function toggleTeam(slug: string) {
        setSelectedTeams(prev => {
            const next = new Set(prev);
            if (next.has(slug)) next.delete(slug); else next.add(slug);
            return next;
        });
    }

    function toggleDivision(division: string) {
        setSelectedDivisions(prev => {
            const next = new Set(prev);
            if (next.has(division)) next.delete(division); else next.add(division);
            return next;
        });
    }

    const teamOptions = useMemo(
        () => teams.map(t => ({ value: t.slug, label: t.shortName })),
        [teams]
    );
    const divisionOptions = useMemo(
        () => DIVISION_OPTIONS.map(d => ({ value: d, label: d })),
        []
    );

    const visibleMetricsByEvent = useMemo(() => {
        const map = {} as Record<ApparatusKey, MetricKey[]>;
        for (const { key: event } of EVENT_ROW) {
            map[event] = METRICS.filter(m => !hiddenCols.has(columnId(event, m.key))).map(m => m.key);
        }
        return map;
    }, [hiddenCols]);

    const visibleComposite = useMemo(
        () => COMPOSITE_COLUMNS.filter(c => !hiddenCols.has(c.key)),
        [hiddenCols]
    );

    const hiddenCount = hiddenCols.size;

    const columnsMenuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!columnsMenuOpen) return;
        function onPointerDown(e: MouseEvent) {
            if (columnsMenuRef.current && !columnsMenuRef.current.contains(e.target as Node)) {
                setColumnsMenuOpen(false);
            }
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setColumnsMenuOpen(false);
        }
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [columnsMenuOpen]);

    return (
        <main className="page page--wide">
            <h1 className="page-title">Gymnasts</h1>
            <p className="page-subtitle">
                Review 2026 season data to help you draft your teams.
            </p>

            <div className="results-row">
                <div className="results-count">{resultsLabel}</div>
                <div className="columns-menu" ref={columnsMenuRef}>
                    <button
                        type="button"
                        className="btn btn-ghost columns-menu__trigger"
                        onClick={() => setColumnsMenuOpen(o => !o)}
                        aria-expanded={columnsMenuOpen}
                    >
                        Columns{hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ''}
                    </button>
                    {columnsMenuOpen && (
                        <div className="columns-menu__panel card">
                            <div className="columns-menu__group">
                                <div className="columns-menu__group-label">Info</div>
                                {INFO_COLUMNS.map(c => (
                                    <label className="columns-menu__option" key={c.key}>
                                        <input
                                            type="checkbox"
                                            checked={!hiddenCols.has(c.key)}
                                            onChange={() => toggleColumn(c.key)}
                                        />
                                        {c.label}
                                    </label>
                                ))}
                            </div>
                            {EVENT_ROW.map(({ key: eventKey, label }) => (
                                <div className="columns-menu__group" key={eventKey}>
                                    <div className="columns-menu__group-label">{label}</div>
                                    {METRICS.map(m => {
                                        const id = columnId(eventKey, m.key);
                                        return (
                                            <label className="columns-menu__option" key={id}>
                                                <input
                                                    type="checkbox"
                                                    checked={!hiddenCols.has(id)}
                                                    onChange={() => toggleColumn(id)}
                                                />
                                                {m.label}
                                            </label>
                                        );
                                    })}
                                </div>
                            ))}
                            <div className="columns-menu__group">
                                <div className="columns-menu__group-label">Totals</div>
                                {COMPOSITE_COLUMNS.map(c => (
                                    <label className="columns-menu__option" key={c.key}>
                                        <input
                                            type="checkbox"
                                            checked={!hiddenCols.has(c.key)}
                                            onChange={() => toggleColumn(c.key)}
                                        />
                                        {c.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="table-scroll">
                <table className="gymnast-table">
                    <thead>
                        <tr>
                            <th rowSpan={2} className="th-sticky th-sticky--name th-sortable" onClick={() => handleSort('name')}>
                                Name{sortIndicator('name')}
                                <NameSearchPopover value={search} onChange={setSearch} />
                            </th>
                            {!hiddenCols.has('university') && (
                                <th rowSpan={2} className="th-sticky th-sticky--team th-sortable" onClick={() => handleSort('university')}>
                                    University{sortIndicator('university')}
                                    <ColumnFilterPopover
                                        options={teamOptions}
                                        selected={selectedTeams}
                                        onToggle={toggleTeam}
                                        onClear={() => setSelectedTeams(new Set())}
                                        searchable
                                    />
                                </th>
                            )}
                            {!hiddenCols.has('division') && (
                                <th rowSpan={2} className="th-sortable th-division" onClick={() => handleSort('division')}>
                                    Division{sortIndicator('division')}
                                    <ColumnFilterPopover
                                        options={divisionOptions}
                                        selected={selectedDivisions}
                                        onToggle={toggleDivision}
                                        onClear={() => setSelectedDivisions(new Set())}
                                    />
                                </th>
                            )}
                            {EVENT_ROW.map(({ key, label }) => (
                                visibleMetricsByEvent[key].length > 0 && (
                                    <th key={key} colSpan={visibleMetricsByEvent[key].length} className="th-group">{label}</th>
                                )
                            ))}
                            {visibleComposite.length > 0 && (
                                <th colSpan={visibleComposite.length} className="th-group">Totals</th>
                            )}
                        </tr>
                        <tr>
                            {EVENT_ROW.map(({ key: eventKey }) => (
                                visibleMetricsByEvent[eventKey].map(metric => {
                                    const id = columnId(eventKey, metric);
                                    const m = METRICS.find(x => x.key === metric)!;
                                    return (
                                        <th key={id} className="th-sortable" title={m.title} onClick={() => handleSort(id)}>
                                            {m.label}{sortIndicator(id)}
                                        </th>
                                    );
                                })
                            ))}
                            {visibleComposite.map(c => (
                                <th key={c.key} className="th-sortable" title={c.title} onClick={() => handleSort(c.key)}>
                                    {c.label}{sortIndicator(c.key)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedItems.map(g => {
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
                                    {!hiddenCols.has('university') && (
                                        <td className="td-sticky td-sticky--team">{g.team.shortName}</td>
                                    )}
                                    {!hiddenCols.has('division') && (
                                        <td className={`td-division${g.team.division === null ? ' td-muted' : ''}`}>{g.team.division ?? '—'}</td>
                                    )}
                                    {EVENT_ROW.map(({ key: eventKey }) =>
                                        visibleMetricsByEvent[eventKey].map(metric => {
                                            const id = columnId(eventKey, metric);
                                            let value: number | null;
                                            let extraClass = '';
                                            if (metric === 'avg') {
                                                value = g.eventAverages[eventKey];
                                            } else if (metric === 'last') {
                                                value = gymnastLastScores?.[eventKey] ?? null;
                                                extraClass = ' td-last';
                                            } else {
                                                value = g.eventNqs[eventKey];
                                            }
                                            return (
                                                <td key={id} className={`stat-figure${extraClass}${value === null ? ' td-muted' : ''}`}>
                                                    {value !== null ? value.toFixed(3) : '—'}
                                                </td>
                                            );
                                        })
                                    )}
                                    {visibleComposite.map(c => {
                                        const value = topNAverageSum(g, c.n);
                                        return (
                                            <td key={c.key} className={`stat-figure${value === null ? ' td-muted' : ''}`}>
                                                {value !== null ? value.toFixed(3) : '—'}
                                            </td>
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
