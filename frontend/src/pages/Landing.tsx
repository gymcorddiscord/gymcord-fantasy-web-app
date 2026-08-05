import { Link } from 'react-router-dom';

const STEPS = [
    {
        title: 'Draft your roster',
        body: "Pick gymnasts from any NCAA program before the season's first salute. Your league sets the roster size.",
    },
    {
        title: 'Set your weekly lineup',
        body: 'Choose who competes each week, per apparatus. Your league’s UP and COUNT rules decide how many scores count.',
    },
    {
        title: 'Track real scores',
        body: 'Every 2026 meet result feeds your team total, straight from vault, bars, beam, and floor.',
    },
];

export function Landing() {
    return (
        <main className="page">
            <section className="landing-hero">
                <h1>Fantasy gymnastics for gym fans, by gym fans.</h1>
                <p>
                    Create a team, set your lineup each week across all four events, and see how your
                    picks stack up once the routines are scored.
                </p>
                <div className="cta-row">
                    <Link to="/register" className="gds-button gds-button--primary">
                        Create an account
                    </Link>
                    <Link to="/login" className="gds-button gds-button--secondary">
                        Log In
                    </Link>
                </div>
            </section>

            <section className="feature-grid">
                {STEPS.map((step, i) => (
                    <div className="feature-card" key={step.title}>
                        <span className="feature-card__step">{i + 1}</span>
                        <h3>{step.title}</h3>
                        <p>{step.body}</p>
                    </div>
                ))}
            </section>
        </main>
    );
}
