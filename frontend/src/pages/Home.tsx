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
                    : "You're not in any leagues yet. Create one, or ask a friend for their invite link."}
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

            <div className="section-title" style={{ marginTop: 32 }}>Get moving</div>
            <div className="nav-tile-grid">
                <Link to="/gymnasts" className="nav-tile">
                    <div className="nav-tile__head">
                        <h3>Gymnasts</h3>
                    </div>
                    <p>Browse the 2026 NCAA field: averages and most recent scores on every apparatus.</p>
                </Link>

                <div className="nav-tile nav-tile--disabled">
                    <div className="nav-tile__head">
                        <h3>Draft</h3>
                        <span className="badge badge-muted">Coming soon</span>
                    </div>
                    <p>Build your roster once drafting opens for your league.</p>
                </div>

                <div className="nav-tile nav-tile--disabled">
                    <div className="nav-tile__head">
                        <h3>Lineup</h3>
                        <span className="badge badge-muted">Coming soon</span>
                    </div>
                    <p>Choose who competes each week on vault, bars, beam, and floor.</p>
                </div>
            </div>
        </main>
    );
}
