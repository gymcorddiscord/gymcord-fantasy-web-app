import { Link } from 'react-router-dom';
import { SignInWithDiscordButton } from 'gymcord-design-system';
import { useAuth } from '../lib/AuthContext';

export function Register() {
    const { signInWithDiscord } = useAuth();

    return (
        <main className="page-narrow">
            <h1 className="page-title">Join Gymcord Fantasy</h1>
            <p className="page-subtitle">
                There's no separate sign-up step. Continuing with Discord creates your account automatically.
            </p>

            <div className="card">
                <SignInWithDiscordButton label="Continue with Discord" onClick={signInWithDiscord} className="auth-discord-btn" />
            </div>

            <p className="auth-footer">
                Already played before? <Link to="/login">Log in</Link>
            </p>
        </main>
    );
}
