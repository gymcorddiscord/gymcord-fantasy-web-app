import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';
import { LoadingIndicator } from 'gymcord-design-system';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { AppHeader } from './components/AppHeader';
import { FeedbackButton } from './components/FeedbackButton';
import { Footer } from './components/Footer';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Gymnasts } from './pages/Gymnasts';
import { CreateLeague } from './pages/CreateLeague';
import { JoinLeague } from './pages/JoinLeague';
import { ViewLeague } from './pages/ViewLeague';
import { AddGymnasts } from './pages/AddGymnasts';
import { Lineups } from './pages/Lineups';
import { Credits } from './pages/Credits';
import { AdminScoresImport } from './pages/AdminScoresImport';
import { takePendingJoinCode } from './lib/pendingJoin';
import { api } from './lib/api';
import { randomTeamName, randomTeamColors } from './lib/randomTeam';
import { ReactElement, useEffect, useState } from 'react';

// The QA Sandbox League every new user gets auto-joined into so they land
// somewhere with real data to try the Lineups page — see RedirectIfAuthed
// below. Prototype-only convenience (lineups-page-requirements.md §14) —
// reconsider (or gate behind an env flag) before this ever reaches real
// production, where auto-enrolling real users into a fake league is wrong.
const QA_SANDBOX_LEAGUE_CODE = 'QATEST';

// HashRouter (not BrowserRouter) because this deploys as a static site on
// GitHub Pages, which has no server-side rewrite rule for deep links —
// refreshing /gymnasts directly would 404 without one. Hash routes
// (/#/gymnasts) always resolve to index.html.

// Local-only escape hatch so pages behind RequireAuth can be previewed
// without a real Discord login. Gated on both dev mode and an explicit env
// flag so it can never activate in a deployed build. Set
// VITE_DEV_BYPASS_AUTH=true in frontend/.env.local (gitignored) to enable.
const DEV_BYPASS_AUTH = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

function PageLoader() {
    return (
        <div className="full-page-loader">
            <LoadingIndicator />
        </div>
    );
}

function RequireAuth({ children }: { children: ReactElement }) {
    const { user, loading } = useAuth();
    if (DEV_BYPASS_AUTH) return children;
    if (loading) return <PageLoader />;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

function RequireAdmin({ children }: { children: ReactElement }) {
    const { user, loading } = useAuth();
    if (DEV_BYPASS_AUTH) return children;
    if (loading) return <PageLoader />;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'admin') return <Navigate to="/home" replace />;
    return children;
}

// Resolves where a signed-in user's "default view" should be: their first
// league's Lineups page, auto-joining them into the QA Sandbox League
// first if they don't have any league yet (see QA_SANDBOX_LEAGUE_CODE
// above). `target` is `undefined` while still resolving, `null` once
// resolved if there's genuinely nowhere better to send them (auto-join
// failed) — callers must treat `null` as "show the real dashboard, don't
// redirect again," or a failed lookup loops forever between /home and here.
function useDefaultLeagueTarget(): string | null | undefined {
    const { user } = useAuth();
    const [target, setTarget] = useState<string | null | undefined>(undefined);

    useEffect(() => {
        if (!user) {
            setTarget(undefined);
            return;
        }
        let cancelled = false;
        (async () => {
            const pendingCode = takePendingJoinCode();
            if (pendingCode) {
                if (!cancelled) setTarget(`/join/${pendingCode}`);
                return;
            }
            try {
                const leagues = await api.myLeagues();
                if (leagues.length > 0) {
                    if (!cancelled) setTarget(`/leagues/${leagues[0].id}/lineups`);
                    return;
                }
                const qaLeague = await api.getLeagueByCode(QA_SANDBOX_LEAGUE_CODE);
                if (qaLeague) {
                    const [color1, color2] = randomTeamColors();
                    const membership = await api.joinLeague(qaLeague.id, randomTeamName(), color1, color2);
                    if (!cancelled) setTarget(`/leagues/${membership.id}/lineups`);
                    return;
                }
            } catch {
                // Auto-join failed (name collision, QATEST missing, network) —
                // fall back to the real dashboard rather than getting stuck.
            }
            if (!cancelled) setTarget(null);
        })();
        return () => {
            cancelled = true;
        };
    }, [user]);

    return target;
}

// After Discord OAuth, Supabase redirects to the bare site root (see
// AuthContext.signInWithDiscord) rather than a specific route. Once that
// lands here and a session is picked up, send signed-in users on to their
// default view (see useDefaultLeagueTarget) — /home as the final fallback
// only, never as a redirect target of its own (see HomeRoute below).
function RedirectIfAuthed({ children }: { children: ReactElement }) {
    const { user, loading } = useAuth();
    const target = useDefaultLeagueTarget();

    if (loading) return <PageLoader />;
    if (user) {
        if (target === undefined) return <PageLoader />;
        return <Navigate to={target ?? '/home'} replace />;
    }
    return children;
}

// /home itself (reachable via the logo, the Draft tab, and direct links)
// redirects the same way — to whichever league's Lineups page a user
// should land on. Only renders the real Home dashboard once resolution
// comes back with nowhere better to go, so this can never loop with the
// '/home' fallback in RedirectIfAuthed above.
function HomeRoute() {
    const target = useDefaultLeagueTarget();
    if (target === undefined) return <PageLoader />;
    if (target) return <Navigate to={target} replace />;
    return <Home />;
}

function Shell() {
    const { loading } = useAuth();
    return (
        <div className="app-shell">
            <AppHeader />
            {loading ? (
                <PageLoader />
            ) : (
                <Routes>
                    <Route
                        path="/"
                        element={
                            <RedirectIfAuthed>
                                <Landing />
                            </RedirectIfAuthed>
                        }
                    />
                    <Route
                        path="/login"
                        element={
                            <RedirectIfAuthed>
                                <Login />
                            </RedirectIfAuthed>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <RedirectIfAuthed>
                                <Register />
                            </RedirectIfAuthed>
                        }
                    />
                    <Route
                        path="/home"
                        element={
                            <RequireAuth>
                                <HomeRoute />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/gymnasts"
                        element={
                            <RequireAuth>
                                <Gymnasts />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/leagues/new"
                        element={
                            <RequireAuth>
                                <CreateLeague />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/admin/scores-import"
                        element={
                            <RequireAdmin>
                                <AdminScoresImport />
                            </RequireAdmin>
                        }
                    />
                    <Route path="/join" element={<JoinLeague />} />
                    <Route path="/join/:code" element={<JoinLeague />} />
                    <Route
                        path="/leagues/:membershipId"
                        element={
                            <RequireAuth>
                                <ViewLeague />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/leagues/:membershipId/roster"
                        element={
                            <RequireAuth>
                                <AddGymnasts />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/leagues/:membershipId/lineups"
                        element={
                            <RequireAuth>
                                <Lineups />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/leagues/:membershipId/lineups/:week"
                        element={
                            <RequireAuth>
                                <Lineups />
                            </RequireAuth>
                        }
                    />
                    <Route path="/credits" element={<Credits />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            )}
            <Footer />
            <FeedbackButton />
        </div>
    );
}

export default function App() {
    return (
        <HashRouter>
            <AuthProvider>
                <Shell />
            </AuthProvider>
        </HashRouter>
    );
}
