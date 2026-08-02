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
            <div className="hero-inner">
                <Link to={user ? '/home' : '/'} className="brand">
                    <h1>Gymcord Fantasy</h1>
                </Link>
                <nav>
                    {user ? (
                        <>
                            <NavLink
                                to="/gymnasts"
                                className={({ isActive }) => `header-link${isActive ? ' header-link--active' : ''}`}
                            >
                                Gymnasts
                            </NavLink>
                            <span className="header-username">{user.displayName}</span>
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
                    <button
                        type="button"
                        className="theme-toggle"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </nav>
            </div>
        </header>
    );
}
