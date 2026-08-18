import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadingIndicator, PlusIcon } from 'gymcord-design-system';
import { api, LeagueMembership } from '../lib/api';

const GREETINGS = [
    'Bite any cups today?',
    "You're the special-list.",
    'Balance is your superpower.',
    'Take a deep breath.',
    'Let it flow.',
    'Just beam yourself.',
    'Confidence is your best skill.'
];

function randomGreeting(): string {
    return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

export function Home() {
    const [leagues, setLeagues] = useState<LeagueMembership[] | null>(null);
    const [greeting] = useState(randomGreeting);

    useEffect(() => {
        api.myLeagues()
            .then(setLeagues)
            .catch(() => setLeagues([]));
    }, []);

    return (
        <main className="page">
            <h1 className="page-title">{greeting}</h1>
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
                        <Link to="/leagues/new" className="gds-button gds-button--secondary">
                            Create a League
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="create-league-cta">
                    <Link to="/join" className="gds-button gds-button--secondary">
                        <span className="gds-button__icon">
                            <PlusIcon size={16} />
                        </span>
                        Join a League
                    </Link>
                    <Link to="/leagues/new" className="gds-button gds-button--secondary">
                        <span className="gds-button__icon">
                            <PlusIcon size={16} />
                        </span>
                        Create a League
                    </Link>
                </div>
            )}
        </main>
    );
}
