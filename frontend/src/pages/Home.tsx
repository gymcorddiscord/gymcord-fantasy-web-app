import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadingIndicator, PlusIcon } from 'gymcord-design-system';
import { useAuth } from '../lib/AuthContext';
import { api, LeagueMembership } from '../lib/api';

export function Home() {
    const { user } = useAuth();
    const [leagues, setLeagues] = useState<LeagueMembership[] | null>(null);

    useEffect(() => {
        api.myLeagues()
            .then(setLeagues)
            .catch(() => setLeagues([]));
    }, []);

    return (
        <main className="page">
            <h1 className="page-title">Welcome, {user?.displayName}.</h1>
            <p className="page-subtitle">
                {leagues && leagues.length > 0
                    ? 'Switch leagues from the menu above, or join another below.'
                    : "You're not in any leagues yet. Create one, or ask a friend for their invite link."}
            </p>

            {leagues === null ? (
                <div className="full-page-loader">
                    <LoadingIndicator />
                </div>
            ) : leagues.length === 0 ? (
                <div className="card">
                    <div className="create-league-cta">
                        <Link to="/join" className="gds-button gds-button--primary">
                            Join a League
                        </Link>
                        <button type="button" className="gds-button gds-button--secondary" disabled>
                            Create a League
                        </button>
                        <span className="badge badge-muted">Coming soon</span>
                    </div>
                </div>
            ) : (
                <div className="create-league-cta">
                    <Link to="/join" className="gds-button gds-button--secondary">
                        <span className="gds-button__icon">
                            <PlusIcon size={16} />
                        </span>
                        Join another league
                    </Link>
                    <button type="button" className="gds-button gds-button--secondary" disabled>
                        <span className="gds-button__icon">
                            <PlusIcon size={16} />
                        </span>
                        Create another league
                    </button>
                    <span className="badge badge-muted">Coming soon</span>
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
