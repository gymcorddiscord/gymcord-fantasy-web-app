import { useEffect, useMemo, useState } from 'react';
import { api, EventFilter, Gymnast, NcaaTeam } from '../lib/api';

const EVENT_OPTIONS: { value: '' | EventFilter; label: string }[] = [
    { value: '',      label: 'All events' },
    { value: 'aa',    label: 'All-around' },
    { value: 'vault', label: 'Vault' },
    { value: 'bars',  label: 'Bars' },
    { value: 'beam',  label: 'Beam' },
    { value: 'floor', label: 'Floor' }
];

function eventBadges(g: Gymnast): string {
    const flags: string[] = [];
    if (g.events.allAround) flags.push('AA');
    if (g.events.vault)     flags.push('VT');
    if (g.events.bars)      flags.push('UB');
    if (g.events.beam)      flags.push('BB');
    if (g.events.floor)     flags.push('FX');
    return flags.join(' · ');
}

export function Gymnasts() {
    const [teams, setTeams]       = useState<NcaaTeam[]>([]);
    const [team, setTeam]         = useState<string>('');
    const [event, setEvent]       = useState<'' | EventFilter>('');
    const [search, setSearch]     = useState<string>('');
    const [items, setItems]       = useState<Gymnast[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState<string | null>(null);

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

            <div className="gymnast-grid">
                {items.map(g => (
                    <article key={g.id} className="gymnast-card">
                        <div className="gymnast-card__head">
                            <span
                                className="team-dot"
                                style={{ background: g.team.color || 'var(--accent)' }}
                                aria-hidden="true"
                            />
                            <div className="gymnast-card__team">
                                <div className="gymnast-card__team-name">{g.team.shortName}</div>
                                <div className="gymnast-card__team-conf">{g.team.conference || ''}</div>
                            </div>
                            {g.classYear && (
                                <span className="class-pill">{g.classYear}</span>
                            )}
                        </div>
                        <div className="gymnast-card__name">
                            {g.firstName} {g.lastName}
                        </div>
                        <div className="gymnast-card__events">{eventBadges(g)}</div>
                        <div className="gymnast-card__avg">
                            <span className="gymnast-card__avg-label">Season avg</span>
                            <span className="gymnast-card__avg-value">
                                {g.seasonAverage !== null ? g.seasonAverage.toFixed(3) : '—'}
                            </span>
                        </div>
                    </article>
                ))}
            </div>
        </main>
    );
}
