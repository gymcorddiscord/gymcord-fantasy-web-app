import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api, LeagueMembership } from '../lib/api';

export function Home() {
    const { user } = useAuth();
    const [leagues, setLeagues] = useState<LeagueMembership[] | null>(null);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    useEffect(() => {
        api.myLeagues()
            .then(setLeagues)
            .catch(() => setLeagues([]));
    }, []);

    function copyInviteLink(joinCode: string, membershipId: number) {
        const url = `${window.location.origin}${import.meta.env.BASE_URL}#/join/${joinCode}`;
        navigator.clipboard.writeText(url);
        setCopiedId(membershipId);
        setTimeout(() => setCopiedId((c) => (c === membershipId ? null : c)), 2000);
    }

    return (
        <main className="page">
            <h1 className="page-title">Welcome, {user?.displayName}.</h1>
            <p className="page-subtitle">
                {leagues && leagues.length > 0
                    ? "Here's where things stand across your leagues."
                    : "You're not in any leagues yet — create one, or ask a friend for their invite link."}
            </p>

            {leagues === null ? (
                <div className="full-page-loader">Loading…</div>
            ) : leagues.length === 0 ? (
                <div className="card">
                    <Link to="/leagues/new" className="btn btn-primary" style={{ width: 'auto' }}>
                        Create a League
                    </Link>
                </div>
            ) : (
                <div className="league-list">
                    {leagues.map((m) => (
                        <div className="card league-card" key={m.id}>
                            <div>
                                <h3 style={{ margin: '0 0 4px' }}>{m.league.name}</h3>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
                                    {m.teamName} · {m.league.rosterSize}g/{m.league.upCount}u{m.league.countScore}c
                                </p>
                            </div>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => copyInviteLink(m.league.joinCode, m.id)}
                            >
                                {copiedId === m.id ? 'Copied!' : 'Copy invite link'}
                            </button>
                        </div>
                    ))}
                    <Link to="/leagues/new" className="btn btn-ghost" style={{ width: 'auto' }}>
                        + Create another league
                    </Link>
                </div>
            )}

            <div className="card" style={{ marginTop: 24 }}>
                <h3 style={{ marginTop: 0 }}>Coming soon</h3>
                <ul style={{ color: 'var(--text-muted)', lineHeight: 1.7, paddingLeft: 20 }}>
                    <li>
                        <Link to="/gymnasts">Browse the gymnast pool</Link>
                    </li>
                    <li>Draft your gymnasts</li>
                    <li>Set your weekly lineup</li>
                </ul>
            </div>
        </main>
    );
}
