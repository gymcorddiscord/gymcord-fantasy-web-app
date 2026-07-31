import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export function Register() {
    const { signInWithDiscord } = useAuth();

    return (
        <main className="page-narrow">
            <h1 className="page-title">Join Gymcord Fantasy</h1>
            <p className="page-subtitle">
                There's no separate sign-up step — continuing with Discord creates your account automatically.
            </p>

            <div className="card">
                <button type="button" className="btn btn-primary" onClick={signInWithDiscord}>
                    Continue with Discord
                </button>
            </div>

            <p className="auth-footer">
                Already played before? <Link to="/login">Log in</Link>
            </p>
        </main>
    );
}
