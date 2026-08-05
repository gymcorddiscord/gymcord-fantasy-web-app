import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Heading, Text, TextField } from 'gymcord-design-system';
import { api, League, LeagueMembership, JoinLeagueError } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { setPendingJoinCode } from '../lib/pendingJoin';
import { StepIndicator } from '../components/StepIndicator';
import { TeamIdentityStep } from '../components/TeamIdentityStep';
import { TeamBadge } from '../components/TeamBadge';

type Step = 'code' | 'preview' | 'identity' | 'welcome';

const MAX_TEAMS = 50; // PRD §3.3 — hard system-wide cap, not commissioner-configurable

// Accepts either a bare code or a full ".../join/:code" link (including the
// app's own hash-routed URLs) — pulls just the code segment out either way.
function parseJoinCode(input: string): string {
    const trimmed = input.trim();
    const marker = '/join/';
    const idx = trimmed.toLowerCase().lastIndexOf(marker);
    if (idx === -1) return trimmed;
    return trimmed.slice(idx + marker.length).split(/[/?#]/)[0];
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

export function JoinLeague() {
    const { code: codeParam } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { user, signInWithDiscord } = useAuth();

    const [step, setStep] = useState<Step>('code');
    const [code, setCode] = useState(codeParam ?? '');
    const [codeError, setCodeError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [league, setLeague] = useState<League | null>(null);
    const [memberCount, setMemberCount] = useState<number | null>(null);

    const [teamName, setTeamName] = useState('');
    const [teamNameError, setTeamNameError] = useState<string | null>(null);
    const [colors, setColors] = useState<string[]>([]);

    const [membership, setMembership] = useState<LeagueMembership | null>(null);

    // A real invite link is pre-validated for existence on load (so a bad
    // link shows its error immediately) — the user still clicks Continue
    // to run the rest of validation and advance, per the join flow spec.
    useEffect(() => {
        if (!codeParam) return;
        let cancelled = false;
        api.getLeagueByCode(parseJoinCode(codeParam)).then((found) => {
            if (!cancelled && !found) setCodeError('Invalid code. Please check and try again.');
        });
        return () => {
            cancelled = true;
        };
    }, [codeParam]);

    async function handleContinue() {
        const parsed = parseJoinCode(code);
        if (!parsed) return;

        if (!user) {
            setPendingJoinCode(parsed);
            await signInWithDiscord();
            return;
        }

        setSubmitting(true);
        setCodeError(null);
        try {
            const found = await api.getLeagueByCode(parsed);
            if (!found) {
                setCodeError('Invalid code. Please check and try again.');
                return;
            }
            const count = await api.leagueMemberCount(found.id);
            if (count >= MAX_TEAMS) {
                setCodeError('This league is full. Contact the commissioner.');
                return;
            }
            const existing = await api.getMembership(found.id);
            if (existing) {
                setCodeError("You're already in this league!");
                return;
            }
            setLeague(found);
            setMemberCount(count);
            setStep('preview');
        } catch {
            setCodeError('Something went wrong checking that code. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleConfirmAndJoin() {
        if (!league) return;
        const trimmedName = teamName.trim();
        if (!trimmedName || colors.length !== 2) return;

        setSubmitting(true);
        setTeamNameError(null);
        try {
            const result = await api.joinLeague(league.id, trimmedName, colors[0], colors[1]);
            setMembership(result);
            setStep('welcome');
        } catch (err) {
            if (err instanceof JoinLeagueError) {
                setTeamNameError(err.message);
            } else {
                setTeamNameError('Something went wrong joining this league. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    }

    if (step === 'code') {
        return (
            <main className="page-narrow">
                <Card elevation="raised">
                    <div className="wizard-panel">
                        <Heading level={2}>Join a League</Heading>
                        <TextField
                            label="League Code"
                            placeholder="Paste your invite link or code"
                            value={code}
                            onChange={(v) => {
                                setCode(v);
                                setCodeError(null);
                            }}
                            error={codeError ?? undefined}
                            helperText={!user ? "You'll sign in with Discord on the next step." : undefined}
                            disabled={submitting}
                        />
                        <div className="wizard-footer">
                            <Button variant="tertiary" onClick={() => navigate(user ? '/home' : '/')} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button onClick={handleContinue} disabled={!code.trim() || submitting}>
                                {submitting ? 'Checking' : 'Continue →'}
                            </Button>
                        </div>
                    </div>
                </Card>
            </main>
        );
    }

    if (step === 'preview' && league) {
        return (
            <main className="page-narrow">
                <Card elevation="raised">
                    <div className="wizard-panel">
                        <StepIndicator steps={['League Preview', 'Team Identity']} currentIndex={0} />
                        <Heading level={3}>{league.name}</Heading>
                        <dl className="league-preview">
                            <div>
                                <dt>Teams</dt>
                                <dd>{memberCount}</dd>
                            </div>
                            <div>
                                <dt>Scoring format</dt>
                                <dd>
                                    {league.upCount} up, {league.countScore} count
                                </dd>
                            </div>
                            <div>
                                <dt>Trade rules</dt>
                                <dd>{tradeRulesSummary(league)}</dd>
                            </div>
                            <div>
                                <dt>Current week</dt>
                                <dd>Preseason</dd>
                            </div>
                        </dl>
                        <div className="wizard-footer">
                            <Button variant="tertiary" onClick={() => setStep('code')} disabled={submitting}>
                                ← Back
                            </Button>
                            <Button onClick={() => setStep('identity')} disabled={submitting}>
                                Join League →
                            </Button>
                        </div>
                    </div>
                </Card>
            </main>
        );
    }

    if (step === 'identity' && league) {
        return (
            <main className="page-narrow">
                <Card elevation="raised">
                    <div className="wizard-panel">
                        <StepIndicator steps={['League Preview', 'Team Identity']} currentIndex={1} />
                        <TeamIdentityStep
                            teamName={teamName}
                            onTeamNameChange={(v) => {
                                setTeamName(v);
                                setTeamNameError(null);
                            }}
                            colors={colors}
                            onColorsChange={setColors}
                            leagueName={league.name}
                            teamNameError={teamNameError}
                            disabled={submitting}
                        />
                        <div className="wizard-footer">
                            <Button variant="tertiary" onClick={() => setStep('preview')} disabled={submitting}>
                                ← Back
                            </Button>
                            <Button onClick={handleConfirmAndJoin} disabled={!teamName.trim() || colors.length !== 2 || submitting}>
                                {submitting ? 'Joining' : 'Confirm and Join →'}
                            </Button>
                        </div>
                    </div>
                </Card>
            </main>
        );
    }

    if (step === 'welcome' && league && membership) {
        return (
            <main className="page-narrow">
                <Card elevation="raised">
                    <div className="wizard-panel">
                        <Heading level={2}>Welcome to {league.name}!</Heading>
                        <div className="welcome-team-row">
                            <TeamBadge color1={membership.teamColor1} color2={membership.teamColor2} size="md" />
                            <Text>
                                You're now competing as <strong>{membership.teamName}</strong>
                            </Text>
                        </div>
                        <div className="wizard-footer wizard-footer--stacked">
                            <Button onClick={() => navigate(`/leagues/${membership.id}/roster`)} style={{ width: '100%' }}>
                                Build Your Roster
                            </Button>
                            <Button variant="secondary" onClick={() => navigate('/home')} style={{ width: '100%' }}>
                                Go to Dashboard
                            </Button>
                        </div>
                    </div>
                </Card>
            </main>
        );
    }

    return <div className="full-page-loader">Loading</div>;
}
