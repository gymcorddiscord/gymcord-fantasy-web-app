/**
 * Curated team-color swatch palette — shared by the Join League and Create
 * League "Team Identity" steps (single source of truth per
 * create-league-flow-spec.md). Deliberately avoids `--injury-long-term`
 * (#ef4444), which is reserved system-wide for long-term injury status.
 */
export interface TeamColorSwatch {
    token: string;
    hex: string;
    label: string;
}

export const TEAM_COLOR_SWATCHES: TeamColorSwatch[] = [
    { token: 'red', hex: '#dc2626', label: 'Red' },
    { token: 'orange', hex: '#fb923c', label: 'Orange' },
    { token: 'yellow', hex: '#fbbf24', label: 'Yellow' },
    { token: 'green', hex: '#34d399', label: 'Green' },
    { token: 'blue', hex: '#3b82f6', label: 'Blue' },
    { token: 'purple', hex: '#8b5cf6', label: 'Purple' },
    { token: 'gold', hex: '#f5c542', label: 'Gold' },
    { token: 'grey', hex: '#8a8aa0', label: 'Grey' },
    { token: 'black', hex: '#14141f', label: 'Black' },
    { token: 'white', hex: '#f5f5fa', label: 'White' }
];
