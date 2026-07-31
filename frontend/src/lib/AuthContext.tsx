/**
 * React context for the current user, backed by Supabase Auth. Session
 * state is loaded on mount and kept in sync via onAuthStateChange (which
 * also fires after the Discord OAuth redirect completes).
 */
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from './supabase';
import type { User } from './api';

interface AuthState {
    user: User | null;
    loading: boolean;
    signInWithDiscord: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

async function loadUser(): Promise<User | null> {
    const {
        data: { session }
    } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, role')
        .eq('id', session.user.id)
        .single();

    return {
        id: session.user.id,
        email: session.user.email ?? null,
        displayName: profile?.display_name || session.user.user_metadata?.full_name || 'Player',
        role: profile?.role || 'player'
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setUser(await loadUser());
    }, []);

    useEffect(() => {
        (async () => {
            await refresh();
            setLoading(false);
        })();

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange(() => {
            refresh();
        });
        return () => subscription.unsubscribe();
    }, [refresh]);

    const signInWithDiscord = useCallback(async () => {
        // Redirect back to the bare site root, not a specific route: Supabase
        // appends the OAuth result as its own URL hash fragment, which would
        // collide with HashRouter's use of "#" for client-side routing if we
        // baked a route (like "#/home") into this URL. Once the session is
        // picked up, the app itself routes signed-in users to /home (see
        // RedirectIfAuthed in App.tsx).
        await supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}` }
        });
    }, []);

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, signInWithDiscord, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
