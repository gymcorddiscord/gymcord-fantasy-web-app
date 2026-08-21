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
    PlusIcon,
    type AppHeaderTab,
    type LeagueOption,
    type SegmentedToggleOption,
    type WeekOption
} from 'gymcord-design-system';
import { useAuth } from '../lib/AuthContext';
import { applyTheme, getInitialTheme, Theme } from '../lib/theme';
import { api, LeagueMembership } from '../lib/api';
import { CURRENT_WEEK, SEASON_END_WEEK } from '../lib/lineups';
import { useModals } from '../lib/ModalsContext';
import { LeagueBadge } from './LeagueBadge';

type NavTab = 'draft' | 'gymnasts';

const NAV_TABS: SegmentedToggleOption<NavTab>[] = [
    { value: 'draft', label: 'Draft', icon: <ClipboardTextIcon size={16} /> },
    { value: 'gymnasts', label: 'Gymnasts', icon: <PeopleIcon size={16} /> }
];

// Every week in the season, for the header's week-switcher dropdown —
// shared by the Lineups and View League headers below.
const WEEK_OPTIONS: WeekOption[] = Array.from({ length: SEASON_END_WEEK }, (_, i) => {
    const value = i + 1;
    const statusLabel = value === CURRENT_WEEK ? 'CURRENT' : value < CURRENT_WEEK ? 'LOCKED' : 'UPCOMING';
    return { value, label: `Week ${value}`, statusLabel };
});

const TAB_PATHS: Record<NavTab, string> = {
    draft: '/home',
    gymnasts: '/gymnasts'
};

export function AppHeader() {
    const { user, logout } = useAuth();
    const { openCreateLeague } = useModals();
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

    // Real leagues, plus two synthetic entries so "Join a League" / "Create
    // a League" stay reachable from the same top-corner switcher now that
    // Home (where they used to live front-and-center) isn't the default
    // landing page anymore. The switcher has no other extension point.
    const leagueOptions: LeagueOption[] = useMemo(
        () => [
            ...myLeagues.map((m) => ({
                id: String(m.id),
                teamName: m.teamName,
                leagueName: m.league.name,
                icon: <LeagueBadge icon={m.league.leagueIcon} color1={m.teamColor1} color2={m.teamColor2} size="sm" />
            })),
            { id: '__join__', teamName: 'Join a League', leagueName: 'Enter an invite code', icon: <PlusIcon size={16} /> },
            { id: '__create__', teamName: 'Create a League', leagueName: 'Start a new league', icon: <PlusIcon size={16} /> }
        ],
        [myLeagues]
    );

    function handleLeagueChange(id: string) {
        if (id === '__join__') navigate('/join');
        else if (id === '__create__') openCreateLeague();
        else navigate(`/leagues/${id}`);
    }

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
            <div className="app-header--authed">
                <DSAppHeader
                    logoHref="#/home"
                    phase="preseason"
                    activeTab="gymnasts"
                    onTabChange={onPreseasonTabChange}
                    theme={theme}
                    onThemeToggle={setTheme}
                    onLogOut={onLogout}
                />
            </div>
        );
    }

    const lineupsMatch = location.pathname.match(/^\/leagues\/(\d+)\/lineups(?:\/(\d+))?/);
    if (lineupsMatch) {
        const lineupsMembershipId = lineupsMatch[1];
        const viewedWeek = lineupsMatch[2] ? Number(lineupsMatch[2]) : CURRENT_WEEK;
        return (
            <div className="app-header--authed">
                <DSAppHeader
                    logoHref="#/home"
                    phase="season"
                    activeTab="lineups"
                    onTabChange={(tab) => {
                        if (tab === 'lineups') navigate(`/leagues/${lineupsMembershipId}/lineups/${viewedWeek}`);
                        else if (tab === 'draft') navigate(`/leagues/${lineupsMembershipId}`);
                    }}
                    weeks={WEEK_OPTIONS}
                    activeWeek={viewedWeek}
                    onWeekChange={(week) => navigate(`/leagues/${lineupsMembershipId}/lineups/${week}`)}
                    leagues={leagueOptions}
                    activeLeagueId={lineupsMembershipId}
                    onLeagueChange={handleLeagueChange}
                    theme={theme}
                    onThemeToggle={setTheme}
                    onLogOut={onLogout}
                />
            </div>
        );
    }

    // View League (the Draft tab's destination) shows the switcher pointed
    // at whichever league is on screen, so the player can jump straight to
    // another one without detouring through the dashboard. It uses the same
    // 5-tab season nav as Lineups (not the 2-tab preseason Draft/Gymnasts
    // set) since Draft is now one of those five tabs rather than a
    // separate phase of its own.
    const viewLeagueMatch = location.pathname.match(/^\/leagues\/(\d+)$/);
    if (viewLeagueMatch) {
        const viewLeagueMembershipId = viewLeagueMatch[1];
        return (
            <div className="app-header--authed">
                <DSAppHeader
                    logoHref="#/home"
                    phase="season"
                    activeTab="draft"
                    onTabChange={(tab) => {
                        if (tab === 'lineups') navigate(`/leagues/${viewLeagueMembershipId}/lineups`);
                    }}
                    weeks={WEEK_OPTIONS}
                    activeWeek={CURRENT_WEEK}
                    onWeekChange={(week) => navigate(`/leagues/${viewLeagueMembershipId}/lineups/${week}`)}
                    leagues={leagueOptions}
                    activeLeagueId={viewLeagueMembershipId}
                    onLeagueChange={handleLeagueChange}
                    theme={theme}
                    onThemeToggle={setTheme}
                    onLogOut={onLogout}
                />
            </div>
        );
    }

    // Join League is a one-off flow with no section/week of its own to
    // navigate — no tabs, no week switcher, just enough header to keep
    // branding/theme/account reachable while the player's attention is on
    // the wizard. (Create League and Build Your Roster used to be routes
    // handled the same way here; they're modals now — see ModalsContext —
    // so they layer on top of whatever page's header is already showing.)
    if (location.pathname.startsWith('/join')) {
        return (
            <div className="app-header--authed">
                <DSAppHeader logoHref="#/home" hideNav theme={theme} onThemeToggle={setTheme} onLogOut={onLogout} />
            </div>
        );
    }

    if (location.pathname.startsWith('/credits')) {
        return (
            <div className="app-header--authed">
                <DSAppHeader logoHref="#/home" phase="standard" theme={theme} onThemeToggle={setTheme} onLogOut={onLogout} />
            </div>
        );
    }

    const activeTab = NAV_TABS.find((t) => location.pathname.startsWith(TAB_PATHS[t.value]))?.value ?? NAV_TABS[0].value;

    return (
        <div className="app-header--authed">
            <header className="gds-app-header">
                <div className="gds-app-header__row">
                    <Link to="/home" className="gds-app-header__logo-link">
                        <Logo />
                    </Link>
                    {leagueOptions.length > 0 && (
                        <LeagueSwitcher leagues={leagueOptions} activeLeagueId={null} onChange={handleLeagueChange} />
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
        </div>
    );
}
