import { Link } from 'react-router-dom';

export function Landing() {
    return (
        <main className="page">
            <section className="hero">
                <span className="badge badge-accent">Week 3 — Lineups Open</span>
                <h1>
                    Fantasy gymnastics, <span className="accent">done right.</span>
                </h1>
                <p>
                    Draft NCAA gymnasts, set weekly lineups, and compete with friends across the season.
                    Real scores, transparent rules, no nonsense.
                </p>
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
                <div className="feature">
                    <h3>10-up, 5-count scoring</h3>
                    <p>The standard NCAA fantasy format, plus custom rules your commissioner can dial in.</p>
                </div>
                <div className="feature">
                    <h3>Weekly lineups</h3>
                    <p>Drag-and-drop your roster before lock. See averages, highs, or last week at a glance.</p>
                </div>
                <div className="feature">
                    <h3>Insightful analytics</h3>
                    <p>Most-drafted gymnast, top scorer, max-vs-actual — pulled straight from real meet data.</p>
                </div>
                <div className="feature">
                    <h3>Trustworthy scores</h3>
                    <p>Synced from official sources. Past weeks are locked. No silent recalculations.</p>
                </div>
            </section>
        </main>
    );
}
