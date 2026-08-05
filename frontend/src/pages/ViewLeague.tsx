import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sortable, { MultiDrag } from 'sortablejs';
import { Button, Card, CloseIcon, Dialog, DotsSixIcon, GearIcon, Heading, LoadingIndicator, Text } from 'gymcord-design-system';
import { api, Gymnast, League, JoinLeagueError, LeagueMembership } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { TeamIdentityStep } from '../components/TeamIdentityStep';

// Multi-item drag (select several rows, then drag any of them together) is
// an opt-in plugin, not part of Sortable's core — must be mounted once.
Sortable.mount(new MultiDrag());

interface RosterRow {
    gymnastId: number;
    gymnast: Gymnast;
}

function tradeRulesSummary(league: League): string {
    const parts: string[] = [];
    if (league.injuryTradesAllowed) {
        parts.push(`Preseason injury trades (${league.injuryTradeTiming === 'draft' ? 'draft window' : 'as-it-happens'})`);
    }
    if (league.manualInjuryTrades) parts.push('In-season injury trades, commissioner-approved');
    parts.push(league.regularSeasonTrades ? 'Regular season trades allowed' : 'No regular season trades');
    return parts.join(' · ');
}

export function ViewLeague() {
    const { membershipId } = useParams<{ membershipId: string }>();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [membership, setMembership] = useState<LeagueMembership | null>(null);
    const [loading, setLoading] = useState(true);
    const [memberCount, setMemberCount] = useState(0);
    const [rosterRows, setRosterRows] = useState<RosterRow[]>([]);
    const rosterRowsRef = useRef<RosterRow[]>([]);
    const tbodyRef = useRef<HTMLTableSectionElement>(null);
    rosterRowsRef.current = rosterRows;

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [editTeamName, setEditTeamName] = useState('');
    const [editColors, setEditColors] = useState<string[]>([]);
    const [editError, setEditError] = useState<string | null>(null);
    const [savingTeam, setSavingTeam] = useState(false);
    const [justSaved, setJustSaved] = useState(false);

    const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
    const [leaving, setLeaving] = useState(false);

    const [linkCopied, setLinkCopied] = useState(false);

    useEffect(() => {
        // Wait for auth to resolve — user starts out null while the session
        // loads, and checking ownership against a not-yet-loaded user would
        // bounce the page home even for its rightful owner.
        if (!membershipId || authLoading) return;
        let cancelled = false;
        (async () => {
            const m = await api.getMembershipById(Number(membershipId));
            if (cancelled) return;
            if (!m || m.userId !== user?.id) {
                navigate('/home');
                return;
            }
            setMembership(m);
            setEditTeamName(m.teamName);
            setEditColors([m.teamColor1, m.teamColor2].filter((c): c is string => Boolean(c)));
            const [count, roster] = await Promise.all([api.leagueMemberCount(m.leagueId), api.rosterForMember(m.id)]);
            if (cancelled) return;
            setMemberCount(count);
            setRosterRows(roster);
            setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [membershipId, authLoading, user?.id]);

    function openSettings() {
        if (!membership) return;
        setEditTeamName(membership.teamName);
        setEditColors([membership.teamColor1, membership.teamColor2].filter((c): c is string => Boolean(c)));
        setEditError(null);
        setSettingsOpen(true);
    }

    async function handleSaveTeam() {
        if (!membership) return;
        const trimmedName = editTeamName.trim();
        if (!trimmedName || editColors.length !== 2) return;
        setSavingTeam(true);
        setEditError(null);
        try {
            const updated = await api.updateTeam(membership.id, {
                teamName: trimmedName,
                teamColor1: editColors[0],
                teamColor2: editColors[1]
            });
            setMembership(updated);
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 2000);
        } catch (err) {
            setEditError(err instanceof JoinLeagueError ? err.message : 'Something went wrong saving your team. Please try again.');
        } finally {
            setSavingTeam(false);
        }
    }

    async function handleLeaveLeague() {
        if (!membership) return;
        setLeaving(true);
        try {
            await api.leaveLeague(membership.id);
            navigate('/home');
        } catch {
            setLeaving(false);
        }
    }

    function copyInviteLink() {
        if (!membership) return;
        const url = `${window.location.origin}${import.meta.env.BASE_URL}#/join/${membership.league.joinCode}`;
        navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    }

    async function handleRemove(gymnastId: number) {
        if (!membership) return;
        const prev = rosterRows;
        setRosterRows(prev.filter((r) => r.gymnastId !== gymnastId));
        try {
            await api.removeFromRoster(membership.id, gymnastId);
        } catch {
            setRosterRows(prev);
        }
    }

    // Sortable.js drags the actual DOM nodes directly (not through React), so
    // after any drag the DOM's row order is the source of truth — read it
    // back into React state (a no-op for the DOM, since it already matches)
    // and persist it. This one Sortable instance is created once the table
    // first has rows and left alone; it isn't torn down on every reorder.
    useEffect(() => {
        if (loading || !tbodyRef.current || !membership) return;
        const tbody = tbodyRef.current;
        const sortable = Sortable.create(tbody, {
            handle: '.roster-table__handle',
            multiDrag: true,
            selectedClass: 'roster-table__row--selected',
            ghostClass: 'roster-table__row--ghost',
            chosenClass: 'roster-table__row--chosen',
            animation: 150,
            onEnd: () => {
                const orderedIds = Array.from(tbody.children)
                    .map((el) => Number((el as HTMLElement).dataset.gymnastId))
                    .filter((id) => !Number.isNaN(id));
                if (orderedIds.length === 0) return;
                const byId = new Map(rosterRowsRef.current.map((r) => [r.gymnastId, r]));
                const reordered = orderedIds.map((id) => byId.get(id)).filter((r): r is RosterRow => Boolean(r));
                setRosterRows(reordered);
                api.reorderRoster(membership.leagueId, membership.id, orderedIds).catch(() => {
                    // Best-effort — a page refresh re-fetches the last-saved order if this failed.
                });
            }
        });
        return () => sortable.destroy();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, membership?.id]);

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
                <Card elevation="raised">
                    <div className="league-summary">
                        <div className="league-summary__head">
                            <div className="league-summary__titles">
                                <Heading level={2}>{membership.teamName}</Heading>
                                <Text tone="secondary" size="caption">
                                    {membership.league.name}
                                </Text>
                            </div>
                            <button type="button" className="gear-button" aria-label="Team settings" onClick={openSettings}>
                                <GearIcon size={20} />
                            </button>
                        </div>
                        <Text tone="secondary" size="caption">
                            {memberCount} team{memberCount === 1 ? '' : 's'} · {membership.league.upCount} up, {membership.league.countScore}{' '}
                            count · {tradeRulesSummary(membership.league)} · Preseason
                        </Text>
                        <div className="view-league-actions">
                            <Link
                                to={`/leagues/${membership.id}/roster`}
                                className={`gds-button gds-button--${rosterRows.length >= membership.league.rosterSize ? 'secondary' : 'primary'}`}
                            >
                                Build Your Roster ({rosterRows.length}/{membership.league.rosterSize})
                            </Link>
                            <Button variant="secondary" onClick={copyInviteLink}>
                                {linkCopied ? 'Copied!' : 'Copy Invite Link'}
                            </Button>
                        </div>
                    </div>
                </Card>

                <Card elevation="raised">
                    <div className="wizard-panel">
                        <Heading level={3}>
                            Your Roster ({rosterRows.length}/{membership.league.rosterSize})
                        </Heading>
                        {rosterRows.length === 0 ? (
                            <Text tone="tertiary">No gymnasts added yet.</Text>
                        ) : (
                            <div className="roster-table-wrap">
                                <table className="roster-table">
                                    <thead>
                                        <tr>
                                            <th aria-hidden="true" />
                                            <th>Name</th>
                                            <th>School</th>
                                            <th>Year</th>
                                            <th aria-hidden="true" />
                                        </tr>
                                    </thead>
                                    <tbody ref={tbodyRef}>
                                        {rosterRows.map((row) => (
                                            <tr key={row.gymnastId} data-gymnast-id={row.gymnastId}>
                                                <td className="roster-table__handle-cell">
                                                    <span
                                                        className="roster-table__handle"
                                                        aria-label={`Drag to reorder ${row.gymnast.firstName} ${row.gymnast.lastName}`}
                                                    >
                                                        <DotsSixIcon size={16} />
                                                    </span>
                                                </td>
                                                <td>
                                                    {row.gymnast.firstName} {row.gymnast.lastName}
                                                </td>
                                                <td>{row.gymnast.team.shortName}</td>
                                                <td>{row.gymnast.classYear ?? 'N/A'}</td>
                                                <td className="roster-table__remove-cell">
                                                    <button
                                                        type="button"
                                                        className="roster-table__remove"
                                                        aria-label={`Remove ${row.gymnast.firstName} ${row.gymnast.lastName}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemove(row.gymnastId);
                                                        }}
                                                    >
                                                        <CloseIcon size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </Card>

                <div className="wizard-footer">
                    <Button variant="secondary" onClick={() => navigate('/home')}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>

            <Dialog
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                title="Team Settings"
                actions={
                    <Button onClick={handleSaveTeam} disabled={!editTeamName.trim() || editColors.length !== 2 || savingTeam}>
                        {savingTeam ? 'Saving' : justSaved ? 'Saved!' : 'Save Changes'}
                    </Button>
                }
            >
                <div className="wizard-panel">
                    <TeamIdentityStep
                        teamName={editTeamName}
                        onTeamNameChange={(v) => {
                            setEditTeamName(v);
                            setEditError(null);
                        }}
                        colors={editColors}
                        onColorsChange={setEditColors}
                        leagueName={membership.league.name}
                        teamNameError={editError}
                        disabled={savingTeam}
                    />
                    <div className="danger-zone-inline">
                        <Heading level={3}>Danger Zone</Heading>
                        <Text tone="secondary">
                            Leaving frees every gymnast on your roster back to the pool for other teams in{' '}
                            {membership.league.name} to draft.
                        </Text>
                        <Button className="btn-danger" onClick={() => setLeaveConfirmOpen(true)}>
                            Leave League
                        </Button>
                    </div>
                </div>
            </Dialog>

            <Dialog
                open={leaveConfirmOpen}
                onClose={() => setLeaveConfirmOpen(false)}
                title="Leave League?"
                actions={
                    <>
                        <Button variant="tertiary" onClick={() => setLeaveConfirmOpen(false)} disabled={leaving}>
                            Cancel
                        </Button>
                        <Button className="btn-danger" onClick={handleLeaveLeague} disabled={leaving}>
                            {leaving ? 'Leaving' : 'Leave League'}
                        </Button>
                    </>
                }
            >
                <Text>
                    Leaving removes your team "{membership.teamName}" from {membership.league.name} and frees every
                    gymnast on your roster back to the pool for other teams to draft. This can't be undone.
                </Text>
            </Dialog>
        </main>
    );
}
