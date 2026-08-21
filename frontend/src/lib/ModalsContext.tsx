/**
 * Global open/close state for the two flows that used to be full pages
 * (Create League, Build Your Roster) and are now modals instead — so opening
 * either one doesn't navigate away from, and lose, whatever the player was
 * already looking at underneath. Triggered from anywhere (header, View
 * League, Home) via the hooks below; rendered once at the app shell level.
 */
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ModalsState {
    createLeagueOpen: boolean;
    openCreateLeague: () => void;
    closeCreateLeague: () => void;
    /** Which team's roster the Build Your Roster modal is open for — null when closed. */
    rosterMembershipId: number | null;
    openRoster: (membershipId: number) => void;
    closeRoster: () => void;
}

const ModalsContext = createContext<ModalsState | undefined>(undefined);

export function ModalsProvider({ children }: { children: ReactNode }) {
    const [createLeagueOpen, setCreateLeagueOpen] = useState(false);
    const [rosterMembershipId, setRosterMembershipId] = useState<number | null>(null);

    const openCreateLeague = useCallback(() => setCreateLeagueOpen(true), []);
    const closeCreateLeague = useCallback(() => setCreateLeagueOpen(false), []);
    const openRoster = useCallback((membershipId: number) => setRosterMembershipId(membershipId), []);
    const closeRoster = useCallback(() => setRosterMembershipId(null), []);

    return (
        <ModalsContext.Provider
            value={{ createLeagueOpen, openCreateLeague, closeCreateLeague, rosterMembershipId, openRoster, closeRoster }}
        >
            {children}
        </ModalsContext.Provider>
    );
}

export function useModals(): ModalsState {
    const ctx = useContext(ModalsContext);
    if (!ctx) throw new Error('useModals must be used inside ModalsProvider');
    return ctx;
}
