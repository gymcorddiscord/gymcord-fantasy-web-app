export interface TeamBadgeProps {
    color1: string | null;
    color2: string | null;
    /** Team name shown next to the swatch. Omit to render just the swatch (e.g. inline in a picker preview). */
    teamName?: string;
    size?: 'sm' | 'md';
}

/** Two-tone team-color pill — the visual identity a team's colors render as everywhere (Team Identity preview, Welcome screen, roster header). */
export function TeamBadge({ color1, color2, teamName, size = 'md' }: TeamBadgeProps) {
    const dim = size === 'sm' ? 20 : 28;
    const background =
        color1 && color2
            ? `linear-gradient(135deg, ${color1} 50%, ${color2} 50%)`
            : color1 ?? 'var(--bg-3)';

    return (
        <span className="team-badge">
            <span
                className="team-badge__swatch"
                style={{ width: dim, height: dim, background }}
                aria-hidden="true"
            />
            {teamName ? <span className="team-badge__name">{teamName}</span> : null}
        </span>
    );
}
