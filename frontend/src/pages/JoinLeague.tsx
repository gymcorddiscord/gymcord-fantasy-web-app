import { FormEvent, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SignInWithDiscordButton, Button } from 'gymcord-design-system';
import { api, League } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { setPendingJoinCode } from '../lib/pendingJoin';

export function JoinLeague() {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { user, signInWithDiscord } = useAuth();

    const [league, setLeague] = useState<League | null>(null);
    const [memberCount, setMemberCount] = useState<number | null>(null);
    const [teamName, setTeamName] = useState('');
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        if (!code) return;
        let cancelled = false;
        (async () => {
            const found = await api.getLeagueByCode(code);
            if (cancelled) return;
            if (!found) {
                setNotFound(true);
                setLoading(false);
                return;
            }
            setLeague(found);
            setMemberCount(await api.leagueMemberCount(found.id));
            setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [code]);

    async function handleSignIn() {
        if (code) setPendingJoinCode(code);
        await signInWithDiscord();
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!league) return;
        setFormError(null);

        if (!teamName.trim()) {
            setFormError('Team name is required.');
            return;
        }

        setSubmitting(true);
        try {
            await api.joinLeague(league.id, teamName.trim());
            navigate('/home');
        } catch (err: unknown) {
            const pgErr = err as { code?: string };
            if (pgErr?.code === '23505') {
                setFormError('That team name is taken, or you already joined this league.');
            } else {
                setFormError('Something went wrong joining this league. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <div className="full-page-loader">Loading…</div>;

    if (notFound) {
        return (
            <main className="page-narrow">
                <h1 className="page-title">League not found</h1>
                <p className="page-subtitle">
                    That invite link doesn't match any league. Double-check it with whoever sent it.
                </p>
            </main>
        );
    }

    return (
        <main className="page-narrow">
            <h1 className="page-title">Join {league!.name}</h1>
            <p className="page-subtitle">
                {league!.rosterSize}g/{league!.upCount}u{league!.countScore}c · {memberCount}{' '}
                {memberCount === 1 ? 'team' : 'teams'} so far
            </p>

            <div className="card">
                {!user ? (
                    <>
                        <p style={{ marginTop: 0, color: 'var(--text-muted)' }}>
                            Sign in with Discord to join this league.
                        </p>
                        <SignInWithDiscordButton label="Continue with Discord" onClick={handleSignIn} className="auth-discord-btn" />
                    </>
                ) : (
                    <form onSubmit={handleSubmit} noValidate>
                        {formError && (
                            <div className="form-error" role="alert">
                                {formError}
                            </div>
                        )}
                        <div className="form-row">
                            <label htmlFor="teamName">Your Team Name</label>
                            <input
                                id="teamName"
                                type="text"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                disabled={submitting}
                                autoFocus
                            />
                        </div>
                        <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
                            {submitting ? 'Joining…' : 'Join League'}
                        </Button>
                    </form>
                )}
            </div>
        </main>
    );
}
