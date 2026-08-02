import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
    AppHeader as DSAppHeader,
    Logo,
    LoggedOutHeader,
    SegmentedToggle,
    ThemeToggle,
    UserCircleIcon,
    PeopleIcon,
    ClipboardTextIcon,
    type SegmentedToggleOption
} from 'gymcord-design-system';
import { useAuth } from '../lib/AuthContext';
import { applyTheme, getInitialTheme, Theme } from '../lib/theme';

type NavTab = 'gymnasts' | 'scores-import';

const NAV_TABS: SegmentedToggleOption<NavTab>[] = [
    { value: 'gymnasts', label: 'Gymnasts', icon: <PeopleIcon size={16} /> }
];

const ADMIN_NAV_TABS: SegmentedToggleOption<NavTab>[] = [
    ...NAV_TABS,
    { value: 'scores-import', label: 'Scores Import', icon: <ClipboardTextIcon size={16} /> }
];

const TAB_PATHS: Record<NavTab, string> = {
    gymnasts: '/gymnasts',
    'scores-import': '/admin/scores-import'
};

export function AppHeader() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [theme, setTheme] = useState<Theme>(getInitialTheme());
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const accountRef = useRef<HTMLDivElement>(null);

    useEffect(() => { applyTheme(theme); }, [theme]);

    useEffect(() => {
        if (!accountMenuOpen) return;
        function onDocClick(e: MouseEvent) {
            if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountMenuOpen(false);
        }
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') setAccountMenuOpen(false);
        }
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [accountMenuOpen]);

    async function onLogout() {
        setAccountMenuOpen(false);
        await logout();
        navigate('/');
    }

    if (!user) {
        return (
            <LoggedOutHeader
                theme={theme}
                onThemeToggle={setTheme}
                onLogIn={() => navigate('/login')}
                onSignUp={() => navigate('/register')}
            />
        );
    }

    if (location.pathname.startsWith('/gymnasts')) {
        return (
            <DSAppHeader
                phase="preseason"
                activeTab="gymnasts"
                onTabChange={(tab) => { if (tab === 'gymnasts') navigate('/gymnasts'); }}
                theme={theme}
                onThemeToggle={setTheme}
                onLogOut={onLogout}
            />
        );
    }

    if (location.pathname.startsWith('/credits')) {
        return <DSAppHeader phase="standard" theme={theme} onThemeToggle={setTheme} onLogOut={onLogout} />;
    }

    const tabs = user.role === 'admin' ? ADMIN_NAV_TABS : NAV_TABS;
    const activeTab = tabs.find((t) => location.pathname.startsWith(TAB_PATHS[t.value]))?.value ?? tabs[0].value;

    return (
        <header className="gds-app-header">
            <Link to="/home" className="gds-app-header__logo-link">
                <Logo />
            </Link>
            <div className="gds-app-header__tabs app-header-tabs--pushed">
                <SegmentedToggle size="lg" value={activeTab} onChange={(tab) => navigate(TAB_PATHS[tab])} options={tabs} />
            </div>
            <div className="gds-app-header__actions">
                <ThemeToggle theme={theme} onToggle={setTheme} />
                <div className="gds-dropdown" ref={accountRef}>
                    <button
                        type="button"
                        className="gds-app-header__account"
                        aria-label="Account"
                        aria-expanded={accountMenuOpen}
                        onClick={() => setAccountMenuOpen((o) => !o)}
                    >
                        <UserCircleIcon size={26} />
                    </button>
                    {accountMenuOpen ? (
                        <div className="gds-dropdown__menu gds-app-header__account-menu" role="menu">
                            <div className="app-header-account-name">{user.displayName}</div>
                            <button type="button" role="menuitem" className="gds-dropdown__item" onClick={onLogout}>
                                Log out
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </header>
    );
}
