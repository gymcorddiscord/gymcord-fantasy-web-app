import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Button,
    Card,
    Dialog,
    Heading,
    LoadingIndicator,
    Text,
    TextField,
    SearchBar,
    SegmentedToggle,
    Dropdown,
    DisciplineTag,
    type Discipline,
    type SegmentedToggleOption
} from 'gymcord-design-system';
import { api, Gymnast, LeagueMembership } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { matchGymnastName, NameMatchResult } from '../lib/nameMatch';
import { TeamBadge } from '../components/TeamBadge';

type Method = 'search' | 'paste';

interface RosterEntry {
    leagueMemberId: number;
    teamName: string;
}

type PasteRowState =
    | { kind: 'matched'; pasted: string; gymnast: Gymnast; removed: boolean }
    | { kind: 'ambiguous'; pasted: string; candidates: Gymnast[] }
    | { kind: 'unmatched'; pasted: string; retryText: string }
    | { kind: 'rostered'; pasted: string; gymnast: Gymnast; teamName: string };

function eventsToDisciplines(g: Gymnast): Discipline[] {
    const list: Discipline[] = [];
    if (g.events.vault) list.push('VT');
    if (g.events.bars) list.push('UB');
    if (g.events.beam) list.push('BB');
    if (g.events.floor) list.push('FX');
    if (g.events.allAround) list.push('AA');
    return list;
}

function initials(g: Gymnast): string {
    return g.team.shortName.slice(0, 2).toUpperCase();
}

const ADD_METHOD_OPTIONS: SegmentedToggleOption<Method>[] = [
    { value: 'paste', label: 'Paste from Clipboard' },
    { value: 'search', label: 'Search & Add' }
];

export function AddGymnasts() {
    const { membershipId } = useParams<{ membershipId: string }>();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [membership, setMembership] = useState<LeagueMembership | null>(null);
    const [loading, setLoading] = useState(true);
    const [method, setMethod] = useState<Method>('paste');

    const [allGymnasts, setAllGymnasts] = useState<Gymnast[]>([]);
    const [roster, setRoster] = useState<Map<number, RosterEntry>>(new Map());
    const [rosterViewOpen, setRosterViewOpen] = useState(false);

    // Method A: Search & Add
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Gymnast[]>([]);
    const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Method B: Paste from Clipboard
    const [pasteText, setPasteText] = useState('');
    const [pasteRows, setPasteRows] = useState<PasteRowState[] | null>(null);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        // Wait for auth to resolve — user starts out null while the session
        // loads, and checking ownership against a not-yet-loaded user would
        // bounce the page home even for its rightful owner.
        if (!membershipId || authLoading) return;
        let cancelled = false;
        (async () => {
            const [m, catalog] = await Promise.all([api.getMembershipById(Number(membershipId)), api.gymnasts()]);
            if (cancelled) return;
            if (!m || m.userId !== user?.id) {
                navigate('/home');
                return;
            }
            setMembership(m);
            setAllGymnasts(catalog.gymnasts);
            const rows = await api.rosterForLeague(m.leagueId);
            if (cancelled) return;
            const map = new Map<number, RosterEntry>();
            for (const r of rows) map.set(r.gymnastId, { leagueMemberId: r.leagueMemberId, teamName: r.teamName });
            setRoster(map);
            setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [membershipId, authLoading, user?.id]);

    useEffect(() => {
        if (searchDebounce.current) clearTimeout(searchDebounce.current);
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        searchDebounce.current = setTimeout(async () => {
            const { gymnasts } = await api.gymnasts({ search: searchQuery });
            setSearchResults(gymnasts);
        }, 300);
        return () => {
            if (searchDebounce.current) clearTimeout(searchDebounce.current);
        };
    }, [searchQuery]);

    const rosterSize = membership?.league.rosterSize ?? 0;
    const rosterCount = useMemo(() => {
        if (!membership) return 0;
        let n = 0;
        for (const entry of roster.values()) if (entry.leagueMemberId === membership.id) n++;
        return n;
    }, [roster, membership]);
    const remainingSlots = Math.max(0, rosterSize - rosterCount);
    const full = remainingSlots === 0;
    const myRosterGymnasts = useMemo(() => {
        if (!membership) return [];
        const ids = new Set<number>();
        for (const [gymnastId, entry] of roster) if (entry.leagueMemberId === membership.id) ids.add(gymnastId);
        return allGymnasts.filter((g) => ids.has(g.id));
    }, [roster, allGymnasts, membership]);

    async function handleAdd(gymnast: Gymnast) {
        if (!membership || full || roster.has(gymnast.id)) return;
        setRoster((prev) => new Map(prev).set(gymnast.id, { leagueMemberId: membership.id, teamName: membership.teamName }));
        try {
            await api.addToRoster(membership.leagueId, membership.id, gymnast.id);
        } catch {
            // Roll back the optimistic add if the insert failed (e.g. raced by another team).
            setRoster((prev) => {
                const next = new Map(prev);
                next.delete(gymnast.id);
                return next;
            });
        }
    }

    function handleMatchNames() {
        const tokens = pasteText
            .split(/[\n,]/)
            .map((t) => t.trim())
            .filter(Boolean);

        const rows: PasteRowState[] = tokens.map((token) => {
            const result: NameMatchResult = matchGymnastName(token, allGymnasts);
            if (result.state === 'matched') {
                const rostered = roster.get(result.gymnast.id);
                if (rostered) {
                    return { kind: 'rostered', pasted: token, gymnast: result.gymnast, teamName: rostered.teamName };
                }
                return { kind: 'matched', pasted: token, gymnast: result.gymnast, removed: false };
            }
            if (result.state === 'ambiguous') {
                return { kind: 'ambiguous', pasted: token, candidates: result.candidates };
            }
            return { kind: 'unmatched', pasted: token, retryText: token };
        });
        setPasteRows(rows);
    }

    function updateRow(index: number, row: PasteRowState) {
        setPasteRows((prev) => (prev ? prev.map((r, i) => (i === index ? row : r)) : prev));
    }

    function resolveAmbiguous(index: number, row: Extract<PasteRowState, { kind: 'ambiguous' }>, gymnast: Gymnast) {
        const rostered = roster.get(gymnast.id);
        updateRow(
            index,
            rostered
                ? { kind: 'rostered', pasted: row.pasted, gymnast, teamName: rostered.teamName }
                : { kind: 'matched', pasted: row.pasted, gymnast, removed: false }
        );
    }

    function retryUnmatched(index: number, row: Extract<PasteRowState, { kind: 'unmatched' }>) {
        const result = matchGymnastName(row.retryText, allGymnasts);
        if (result.state === 'matched') {
            const rostered = roster.get(result.gymnast.id);
            updateRow(
                index,
                rostered
                    ? { kind: 'rostered', pasted: row.pasted, gymnast: result.gymnast, teamName: rostered.teamName }
                    : { kind: 'matched', pasted: row.pasted, gymnast: result.gymnast, removed: false }
            );
        } else if (result.state === 'ambiguous') {
            updateRow(index, { kind: 'ambiguous', pasted: row.pasted, candidates: result.candidates });
        } else {
            updateRow(index, { ...row });
        }
    }

    const matchedRows = useMemo(
        () => (pasteRows ?? []).filter((r): r is Extract<PasteRowState, { kind: 'matched' }> => r.kind === 'matched' && !r.removed),
        [pasteRows]
    );
    const matchedToAdd = matchedRows.slice(0, remainingSlots);
    const matchedOverflow = matchedRows.length - matchedToAdd.length;
    const includedMatchedSet = useMemo(() => new Set(matchedToAdd), [matchedToAdd]);

    async function handleConfirmPaste() {
        if (!membership || matchedToAdd.length === 0) return;
        setConfirming(true);
        try {
            const inserted = await api.addManyToRoster(
                membership.leagueId,
                membership.id,
                matchedToAdd.map((r) => r.gymnast.id)
            );
            setRoster((prev) => {
                const next = new Map(prev);
                for (const g of matchedToAdd) {
                    if (inserted.includes(g.gymnast.id)) next.set(g.gymnast.id, { leagueMemberId: membership.id, teamName: membership.teamName });
                }
                return next;
            });
            setPasteText('');
            setPasteRows(null);
        } finally {
            setConfirming(false);
        }
    }

    if (loading || !membership) {
        return (
            <div className="full-page-loader">
                <LoadingIndicator />
            </div>
        );
    }

    return (
        <main className="page">
            <div className="roster-page">
            <div className="roster-header">
                <div>
                    <Heading level={1}>Build Your Roster</Heading>
                    <div className="roster-header__team">
                        <TeamBadge color1={membership.teamColor1} color2={membership.teamColor2} teamName={membership.teamName} size="sm" />
                        <Text tone="secondary">in {membership.league.name}</Text>
                        <Link to={`/leagues/${membership.id}`} className="team-settings-link">
                            View League
                        </Link>
                    </div>
                </div>
                <div className="roster-progress">
                    <Text tone={full ? 'primary' : 'secondary'}>
                        {rosterCount} / {rosterSize} gymnasts added
                    </Text>
                </div>
            </div>

            {full && (
                <div className="roster-banner">
                    Maximum roster size reached ({rosterCount}/{rosterSize})
                </div>
            )}

            <SegmentedToggle value={method} onChange={setMethod} options={ADD_METHOD_OPTIONS} />

            {method === 'search' ? (
                <Card elevation="flat">
                    <div className="wizard-panel">
                    <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="e.g. Lily Pederson" />
                    <div className="gymnast-result-list">
                        {searchResults.map((g) => {
                            const entry = roster.get(g.id);
                            const mine = entry?.leagueMemberId === membership.id;
                            const takenByOther = Boolean(entry) && !mine;
                            return (
                                <div className="gymnast-result-row" key={g.id}>
                                    <span className="school-avatar">{initials(g)}</span>
                                    <div className="gymnast-result-row__info">
                                        <Text>
                                            {g.firstName} {g.lastName}
                                        </Text>
                                        <Text size="caption" tone="secondary">
                                            {g.team.shortName} {g.classYear ? `· ${g.classYear}` : ''}
                                        </Text>
                                        <div className="gymnast-result-row__tags">
                                            {eventsToDisciplines(g).map((d) => (
                                                <DisciplineTag key={d} discipline={d} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="gymnast-result-row__stat">
                                        <Text size="caption" tone="tertiary">
                                            Avg
                                        </Text>
                                        <Text>{g.seasonAverage !== null ? g.seasonAverage.toFixed(3) : 'N/A'}</Text>
                                    </div>
                                    {mine ? (
                                        <Button variant="secondary" disabled>
                                            Added ✓
                                        </Button>
                                    ) : takenByOther ? (
                                        <Button variant="tertiary" disabled>
                                            Already Rostered
                                        </Button>
                                    ) : (
                                        <Button onClick={() => handleAdd(g)} disabled={full}>
                                            Add
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                        {searchQuery.trim() && searchResults.length === 0 && (
                            <Text tone="tertiary">No gymnasts match "{searchQuery}".</Text>
                        )}
                    </div>
                    </div>
                </Card>
            ) : (
                <Card elevation="flat">
                    {!pasteRows ? (
                        <div className="wizard-panel">
                            <TextField
                                label="Paste gymnast names (one per line)"
                                value={pasteText}
                                onChange={setPasteText}
                                multiline
                                rows={8}
                                placeholder="Carsyn Coleman, Anika Most, Summer Gronski"
                            />
                            <Button onClick={handleMatchNames} disabled={!pasteText.trim()}>
                                Match Names
                            </Button>
                        </div>
                    ) : (
                        <div className="wizard-panel">
                            <Text size="caption" tone="tertiary">
                                Ambiguous / Unmatched / Already Rostered rows don't count toward the total and aren't auto-added.
                            </Text>
                            <div className="paste-result-list">
                                {pasteRows.map((row, i) => (
                                    <div className={`paste-result-row paste-result-row--${row.kind}`} key={i}>
                                        <span className={`paste-result-row__icon paste-result-row__icon--${row.kind}`}>
                                            {row.kind === 'matched' ? '✓' : row.kind === 'ambiguous' ? '!' : '✕'}
                                        </span>
                                        <div className="paste-result-row__body">
                                            {row.kind === 'matched' && !row.removed && (
                                                <Text>
                                                    {row.gymnast.firstName} {row.gymnast.lastName} · {row.gymnast.team.shortName}
                                                    {!includedMatchedSet.has(row) && (
                                                        <span className="paste-result-row__overflow"> · Roster full, not added</span>
                                                    )}
                                                </Text>
                                            )}
                                            {row.kind === 'matched' && row.removed && (
                                                <Text tone="tertiary">
                                                    {row.gymnast.firstName} {row.gymnast.lastName} · removed
                                                </Text>
                                            )}
                                            {row.kind === 'ambiguous' && (
                                                <>
                                                    <Text tone="secondary">"{row.pasted}" matches multiple gymnasts:</Text>
                                                    <Dropdown
                                                        placeholder="Pick the right gymnast"
                                                        value=""
                                                        options={row.candidates.map((c) => ({
                                                            value: String(c.id),
                                                            label: `${c.firstName} ${c.lastName} · ${c.team.shortName}`
                                                        }))}
                                                        onChange={(v) => {
                                                            const chosen = row.candidates.find((c) => String(c.id) === v);
                                                            if (chosen) resolveAmbiguous(i, row, chosen);
                                                        }}
                                                    />
                                                </>
                                            )}
                                            {row.kind === 'unmatched' && (
                                                <div className="paste-result-row__retry">
                                                    <Text tone="secondary">No match found for "{row.pasted}"</Text>
                                                    <TextField
                                                        label="Retry"
                                                        value={row.retryText}
                                                        onChange={(v) => updateRow(i, { ...row, retryText: v })}
                                                    />
                                                    <Button variant="secondary" onClick={() => retryUnmatched(i, row)}>
                                                        Retry
                                                    </Button>
                                                </div>
                                            )}
                                            {row.kind === 'rostered' && (
                                                <Text tone="secondary">
                                                    {row.gymnast.firstName} {row.gymnast.lastName} · Already on {row.teamName}'s roster
                                                </Text>
                                            )}
                                        </div>
                                        {row.kind === 'matched' && (
                                            <button
                                                type="button"
                                                className="paste-result-row__remove"
                                                onClick={() => updateRow(i, { ...row, removed: !row.removed })}
                                            >
                                                {row.removed ? 'Restore' : 'Remove'}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="wizard-footer">
                                <Button variant="tertiary" onClick={() => setPasteRows(null)} disabled={confirming}>
                                    Start Over
                                </Button>
                                <Button onClick={handleConfirmPaste} disabled={matchedToAdd.length === 0 || confirming}>
                                    {confirming
                                        ? 'Adding'
                                        : `Add ${matchedToAdd.length} Matched Gymnast${matchedToAdd.length === 1 ? '' : 's'}`}
                                    {matchedOverflow > 0 ? ` (${matchedOverflow} won't fit)` : ''}
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            <div className="roster-done-row">
                <Button variant="secondary" onClick={() => setRosterViewOpen(true)}>
                    View Roster
                </Button>
                <Button variant="secondary" onClick={() => navigate('/home')}>
                    Done
                </Button>
            </div>
            </div>

            <Dialog
                open={rosterViewOpen}
                onClose={() => setRosterViewOpen(false)}
                title={`${membership.teamName}'s Roster`}
                actions={<Button onClick={() => setRosterViewOpen(false)}>Close</Button>}
            >
                {myRosterGymnasts.length === 0 ? (
                    <Text tone="tertiary">No gymnasts added yet.</Text>
                ) : (
                    <div className="gymnast-result-list">
                        {myRosterGymnasts.map((g) => (
                            <div className="gymnast-result-row" key={g.id}>
                                <span className="school-avatar">{initials(g)}</span>
                                <div className="gymnast-result-row__info">
                                    <Text>
                                        {g.firstName} {g.lastName}
                                    </Text>
                                    <Text size="caption" tone="secondary">
                                        {g.team.shortName} {g.classYear ? `· ${g.classYear}` : ''}
                                    </Text>
                                    <div className="gymnast-result-row__tags">
                                        {eventsToDisciplines(g).map((d) => (
                                            <DisciplineTag key={d} discipline={d} />
                                        ))}
                                    </div>
                                </div>
                                <div className="gymnast-result-row__stat">
                                    <Text size="caption" tone="tertiary">
                                        Avg
                                    </Text>
                                    <Text>{g.seasonAverage !== null ? g.seasonAverage.toFixed(3) : 'N/A'}</Text>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Dialog>
        </main>
    );
}
