import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    AppHeader as DSAppHeader,
    Logo,
    LoggedOutHeader,
    LeagueSwitcher,
    SegmentedToggle,
    ThemeToggle,
    UserCircleIcon,
    PeopleIcon,
    ClipboardTextIcon,
    type AppHeaderTab,
    type LeagueOption,
    type SegmentedToggleOption
} from 'gymcord-design-system';
import { useAuth } from '../lib/AuthContext';
import { applyTheme, getInitialTheme, Theme } from '../lib/theme';
import { api, LeagueMembership } from '../lib/api';
import { TeamBadge } from './TeamBadge';

type NavTab = 'draft' | 'gymnasts';

const NAV_TABS: SegmentedToggleOption<NavTab>[] = [
    { value: 'draft', label: 'Draft', icon: <ClipboardTextIcon size={16} /> },
    { value: 'gymnasts', label: 'Gymnasts', icon: <PeopleIcon size={16} /> }
];

const TAB_PATHS: Record<NavTab, string> = {
    draft: '/home',
    gymnasts: '/gymnasts'
};

export function AppHeader() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [theme, setTheme] = useState<Theme>(getInitialTheme());
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const accountRef = useRef<HTMLDivElement>(null);
    const [myLeagues, setMyLeagues] = useState<LeagueMembership[]>([]);

    useEffect(() => { applyTheme(theme); }, [theme]);

    // Fetched once per session (not per navigation) — only rendered into the
    // header on the Home page, but cheap enough to keep warm regardless.
    useEffect(() => {
        if (!user) {
            setMyLeagues([]);
            return;
        }
        let cancelled = false;
        api.myLeagues().then((leagues) => {
            if (!cancelled) setMyLeagues(leagues);
        });
        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    const leagueOptions: LeagueOption[] = useMemo(
        () =>
            myLeagues.map((m) => ({
                id: String(m.id),
                teamName: m.teamName,
                leagueName: m.league.name,
                icon: <TeamBadge color1={m.teamColor1} color2={m.teamColor2} size="sm" />
            })),
        [myLeagues]
    );

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
                logoHref="#/home"
                theme={theme}
                onThemeToggle={setTheme}
                onLogIn={() => navigate('/login')}
                onSignUp={() => navigate('/register')}
            />
        );
    }

    // Draft <-> Gymnasts tabs stay switchable everywhere below, including
    // mid-flow (Join/Create League wizards, View League, Add Gymnasts) —
    // "Draft" routes to the home dashboard since there's no dedicated
    // /draft page yet.
    function onPreseasonTabChange(tab: AppHeaderTab) {
        navigate(tab === 'gymnasts' ? '/gymnasts' : '/home');
    }

    if (location.pathname.startsWith('/gymnasts')) {
        return (
            <DSAppHeader
                logoHref="#/home"
                phase="preseason"
                activeTab="gymnasts"
                onTabChange={onPreseasonTabChange}
                theme={theme}
                onThemeToggle={setTheme}
                onLogOut={onLogout}
            />
        );
    }

    // View League shows the switcher pointed at whichever league is on
    // screen, so the player can jump straight to another one without
    // detouring through the dashboard.
    const viewLeagueMatch = location.pathname.match(/^\/leagues\/(\d+)$/);
    if (viewLeagueMatch) {
        return (
            <DSAppHeader
                logoHref="#/home"
                phase="preseason"
                activeTab="draft"
                onTabChange={onPreseasonTabChange}
                leagues={leagueOptions}
                activeLeagueId={viewLeagueMatch[1]}
                onLeagueChange={(id) => navigate(`/leagues/${id}`)}
                theme={theme}
                onThemeToggle={setTheme}
                onLogOut={onLogout}
            />
        );
    }

    // Join/Create League wizards + Add Gymnasts (roster building) are all
    // part of the same pre-draft flow — "Draft" stays the active nav tab
    // throughout, even though none of them route through the (not-yet-built)
    // /draft page itself.
    const isLeagueFlowRoute = /^\/leagues\/(new|\d+\/roster)/.test(location.pathname);
    if (location.pathname.startsWith('/join') || isLeagueFlowRoute) {
        return (
            <DSAppHeader
                logoHref="#/home"
                phase="preseason"
                activeTab="draft"
                onTabChange={onPreseasonTabChange}
                theme={theme}
                onThemeToggle={setTheme}
                onLogOut={onLogout}
            />
        );
    }

    if (location.pathname.startsWith('/credits')) {
        return <DSAppHeader logoHref="#/home" phase="standard" theme={theme} onThemeToggle={setTheme} onLogOut={onLogout} />;
    }

    const activeTab = NAV_TABS.find((t) => location.pathname.startsWith(TAB_PATHS[t.value]))?.value ?? NAV_TABS[0].value;

    return (
        <header className="gds-app-header">
            <div className="gds-app-header__row">
                <Link to="/home" className="gds-app-header__logo-link">
                    <Logo />
                </Link>
                {leagueOptions.length > 0 && (
                    <LeagueSwitcher leagues={leagueOptions} activeLeagueId={null} onChange={(id) => navigate(`/leagues/${id}`)} />
                )}
                <div className="gds-app-header__tabs app-header-tabs--pushed">
                    <SegmentedToggle size="lg" value={activeTab} onChange={(tab) => navigate(TAB_PATHS[tab])} options={NAV_TABS} />
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
                                {user.role === 'admin' && (
                                    <button
                                        type="button"
                                        role="menuitem"
                                        className="gds-dropdown__item"
                                        onClick={() => {
                                            setAccountMenuOpen(false);
                                            navigate('/admin/scores-import');
                                        }}
                                    >
                                        Scores Import
                                    </button>
                                )}
                                <button type="button" role="menuitem" className="gds-dropdown__item" onClick={onLogout}>
                                    Log out
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </header>
    );
}
