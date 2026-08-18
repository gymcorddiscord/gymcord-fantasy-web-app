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

// After Discord OAuth, Supabase redirects to the bare site root (see
// AuthContext.signInWithDiscord) rather than a specific route. Once that
// lands here and a session is picked up, send signed-in users straight to
// the Lineups page for their first league — auto-joining them into the QA
// Sandbox League first if they don't have any league yet, so there's
// always somewhere real to land (see QA_SANDBOX_LEAGUE_CODE above).
function RedirectIfAuthed({ children }: { children: ReactElement }) {
    const { user, loading } = useAuth();
    const [target, setTarget] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setTarget(null);
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
                // fall back to the normal dashboard rather than getting stuck.
            }
            if (!cancelled) setTarget('/home');
        })();
        return () => {
            cancelled = true;
        };
    }, [user]);

    if (loading) return <PageLoader />;
    if (user) {
        if (!target) return <PageLoader />;
        return <Navigate to={target} replace />;
    }
    return children;
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
                                <Home />
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
