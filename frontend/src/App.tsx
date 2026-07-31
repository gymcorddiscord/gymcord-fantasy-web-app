import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { AppHeader } from './components/AppHeader';
import { FeedbackButton } from './components/FeedbackButton';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Gymnasts } from './pages/Gymnasts';
import { ReactElement } from 'react';

// HashRouter (not BrowserRouter) because this deploys as a static site on
// GitHub Pages, which has no server-side rewrite rule for deep links —
// refreshing /gymnasts directly would 404 without one. Hash routes
// (/#/gymnasts) always resolve to index.html.

function RequireAuth({ children }: { children: ReactElement }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="full-page-loader">Loading…</div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

function Shell() {
    const { loading } = useAuth();
    return (
        <div className="app-shell">
            <AppHeader />
            {loading ? (
                <div className="full-page-loader">Loading…</div>
            ) : (
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
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
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            )}
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
