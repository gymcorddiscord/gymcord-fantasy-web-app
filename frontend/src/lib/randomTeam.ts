/**
 * Generates a silly team name + color pair for auto-joining a new user
 * into the QA Sandbox League on first login (see App.tsx RedirectIfAuthed).
 * Prototype-only scaffolding — see lineups-page-requirements.md §14.
 */
const ADJECTIVES = ['Flying', 'Chalky', 'Sticky', 'Bouncy', 'Twisting', 'Golden', 'Fearless', 'Electric', 'Wobbly', 'Airborne'];
const NOUNS = ['Landings', 'Chalk Bags', 'Beam Queens', 'Vault Vipers', 'Bar Bandits', 'Floor Foxes', 'Handsprings', 'Twisters', 'Salto Squad', 'Perfect Tens'];

export function randomTeamName(): string {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    return `${adjective} ${noun}`;
}

const TEAM_COLOR_PAIRS: [string, string][] = [
    ['#22d3ee', '#8b5cf6'],
    ['#fb923c', '#3b82f6'],
    ['#34d399', '#ec4899'],
    ['#fbbf24', '#22d3ee']
];

export function randomTeamColors(): [string, string] {
    return TEAM_COLOR_PAIRS[Math.floor(Math.random() * TEAM_COLOR_PAIRS.length)];
}
