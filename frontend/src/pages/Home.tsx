import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export function Home() {
    const { user } = useAuth();

    return (
        <main className="page">
            <span className="badge badge-accent">Week 3 — Lineups Open</span>
            <h1 className="page-title" style={{ marginTop: 12 }}>
                Welcome, {user?.displayName}.
            </h1>
            <p className="page-subtitle">
                You're signed in. Next up: leagues, teams, and lineups — coming in the next build.
            </p>

            <div className="card">
                <h3 style={{ marginTop: 0 }}>What's next</h3>
                <ul style={{ color: 'var(--text-muted)', lineHeight: 1.7, paddingLeft: 20 }}>
                    <li>
                        <Link to="/gymnasts">Browse the gymnast pool</Link>
                    </li>
                    <li>Create or join a league <em style={{ color: 'var(--text-dim)' }}>(coming soon)</em></li>
                    <li>Draft your gymnasts <em style={{ color: 'var(--text-dim)' }}>(coming soon)</em></li>
                    <li>Set your Week 3 lineup before lock <em style={{ color: 'var(--text-dim)' }}>(coming soon)</em></li>
                </ul>
                <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 0 }}>
                    Account email: <code>{user?.email}</code> · Role: <code>{user?.role}</code>
                </p>
            </div>
        </main>
    );
}
