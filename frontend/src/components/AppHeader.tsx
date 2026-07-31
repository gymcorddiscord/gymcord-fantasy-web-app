import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useEffect, useState } from 'react';
import { applyTheme, getInitialTheme, Theme } from '../lib/theme';

export function AppHeader() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [theme, setTheme] = useState<Theme>(getInitialTheme());

    useEffect(() => { applyTheme(theme); }, [theme]);

    async function onLogout() {
        await logout();
        navigate('/');
    }

    return (
        <header className="app-header">
            <Link to="/" className="brand">
                <span className="brand-mark" aria-hidden="true" />
                <span>Gymcord Fantasy</span>
            </Link>
            <nav>
                <button
                    className="theme-toggle"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>
                {user ? (
                    <>
                        <NavLink
                            to="/home"
                            className={({ isActive }) => `header-link${isActive ? ' header-link--active' : ''}`}
                        >
                            Home
                        </NavLink>
                        <NavLink
                            to="/gymnasts"
                            className={({ isActive }) => `header-link${isActive ? ' header-link--active' : ''}`}
                        >
                            Gymnasts
                        </NavLink>
                        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                            {user.displayName}
                        </span>
                        <button className="btn btn-ghost" onClick={onLogout}>
                            Log out
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="btn btn-ghost">Log in</Link>
                        <Link to="/register" className="btn btn-primary" style={{ width: 'auto' }}>
                            Sign up
                        </Link>
                    </>
                )}
            </nav>
        </header>
    );
}
