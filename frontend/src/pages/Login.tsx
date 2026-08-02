import { Link } from 'react-router-dom';
import { SignInWithDiscordButton } from 'gymcord-design-system';
import { useAuth } from '../lib/AuthContext';

export function Login() {
    const { signInWithDiscord } = useAuth();

    return (
        <main className="page-narrow">
            <h1 className="page-title">Welcome back</h1>
            <p className="page-subtitle">Sign in with Discord to manage your lineups.</p>

            <div className="card">
                <SignInWithDiscordButton label="Continue with Discord" onClick={signInWithDiscord} className="auth-discord-btn" />
            </div>

            <p className="auth-footer">
                New here? <Link to="/register">See how it works</Link>
            </p>
        </main>
    );
}
