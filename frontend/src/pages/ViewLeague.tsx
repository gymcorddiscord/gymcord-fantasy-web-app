import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Card, Dialog, Heading, LoadingIndicator, Text } from 'gymcord-design-system';
import { api, Gymnast, League, JoinLeagueError, LeagueMembership } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { TeamIdentityStep } from '../components/TeamIdentityStep';

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
    const [rosterGymnasts, setRosterGymnasts] = useState<Gymnast[]>([]);

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [editTeamName, setEditTeamName] = useState('');
    const [editColors, setEditColors] = useState<string[]>([]);
    const [editError, setEditError] = useState<string | null>(null);
    const [savingTeam, setSavingTeam] = useState(false);
    const [justSaved, setJustSaved] = useState(false);

    const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
    const [leaving, setLeaving] = useState(false);

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
            const [count, roster, catalog] = await Promise.all([
                api.leagueMemberCount(m.leagueId),
                api.rosterForLeague(m.leagueId),
                api.gymnasts()
            ]);
            if (cancelled) return;
            setMemberCount(count);
            const myIds = new Set(roster.filter((r) => r.leagueMemberId === m.id).map((r) => r.gymnastId));
            setRosterGymnasts(catalog.gymnasts.filter((g) => myIds.has(g.id)));
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

    if (loading || !membership) {
        return (
            <div className="full-page-loader">
                <LoadingIndicator />
            </div>
        );
    }

    return (
        <main className="page-narrow">
            <div className="view-league-topbar">
                <Heading level={1}>View League</Heading>
                <button type="button" className="gear-button" aria-label="Team settings" onClick={openSettings}>
                    ⚙
                </button>
            </div>

            <div className="roster-page">
                <Card elevation="raised">
                    <div className="wizard-panel">
                        <Heading level={2}>{membership.league.name}</Heading>
                        <dl className="league-preview">
                            <div>
                                <dt>Your team</dt>
                                <dd>{membership.teamName}</dd>
                            </div>
                            <div>
                                <dt>Teams</dt>
                                <dd>{memberCount}</dd>
                            </div>
                            <div>
                                <dt>Scoring format</dt>
                                <dd>
                                    {membership.league.upCount} up, {membership.league.countScore} count
                                </dd>
                            </div>
                            <div>
                                <dt>Trade rules</dt>
                                <dd>{tradeRulesSummary(membership.league)}</dd>
                            </div>
                            <div>
                                <dt>Current week</dt>
                                <dd>Preseason</dd>
                            </div>
                        </dl>
                        <Link to={`/leagues/${membership.id}/roster`} className="gds-button gds-button--primary view-league-cta">
                            Build Your Roster ({rosterGymnasts.length}/{membership.league.rosterSize})
                        </Link>
                    </div>
                </Card>

                <Card elevation="raised">
                    <div className="wizard-panel">
                        <Heading level={3}>
                            Your Roster ({rosterGymnasts.length}/{membership.league.rosterSize})
                        </Heading>
                        {rosterGymnasts.length === 0 ? (
                            <Text tone="tertiary">No gymnasts added yet.</Text>
                        ) : (
                            <div className="roster-table-wrap">
                                <table className="roster-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>School</th>
                                            <th>Year</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rosterGymnasts.map((g) => (
                                            <tr key={g.id}>
                                                <td>
                                                    {g.firstName} {g.lastName}
                                                </td>
                                                <td>{g.team.shortName}</td>
                                                <td>{g.classYear ?? 'N/A'}</td>
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
