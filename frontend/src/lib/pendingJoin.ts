/**
 * Discord OAuth always redirects back to the bare site root (see
 * AuthContext.signInWithDiscord), so if someone clicks a league invite
 * link while logged out, we'd otherwise lose their destination. Stash the
 * code here before sending them to sign in, and resume it afterward.
 */
const KEY = 'gymcord_pending_join_code';

export function setPendingJoinCode(code: string) {
    localStorage.setItem(KEY, code);
}

export function takePendingJoinCode(): string | null {
    const code = localStorage.getItem(KEY);
    if (code) localStorage.removeItem(KEY);
    return code;
}
