import { Link } from 'react-router-dom';

export function Landing() {
    return (
        <main className="page">
            <section className="landing-hero">
                <h1>
                    Draft your gymnasts. <span className="accent">Talk your trash.</span>
                </h1>
                <p>
                    A fantasy league for Gymcord — pick your team, set a lineup every week, and find out
                    whose picks actually held up once the scores come in.
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
        </main>
    );
}
