import { Link } from 'react-router-dom';

const EVENTS = ['VT', 'UB', 'BB', 'FX'];

const STEPS = [
    {
        title: 'Draft your roster',
        body: 'Pick gymnasts from any NCAA program before the season tips off — your league sets the roster size.',
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
                <h1>Draft NCAA gymnasts. Score real 2026 meets.</h1>
                <p>
                    Create a team, set your lineup each week across all four events, and see how your
                    picks stack up once the routines are scored.
                </p>
                <div className="apparatus-chips apparatus-chips--center">
                    {EVENTS.map((e) => (
                        <span className="apparatus-chip" key={e}>{e}</span>
                    ))}
                </div>
                <div className="cta-row">
                    <Link to="/register" className="btn btn-primary" style={{ width: 'auto' }}>
                        Create an account
                    </Link>
                    <Link to="/login" className="btn btn-ghost">
                        I already have one
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
