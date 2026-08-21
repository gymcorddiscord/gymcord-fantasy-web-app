import { LEAGUE_ICON_COMPONENTS } from '../lib/leagueIcons';
import { LeagueIcon } from '../lib/api';

export interface LeagueBadgeProps {
    icon: LeagueIcon;
    /** Icon glyph color — the host's first team color. */
    color1: string | null;
    /** Badge background — the host's second team color. */
    color2: string | null;
    size?: 'sm' | 'md';
}

/** A league's chosen icon, tinted with its host's team colors — fills whatever badge slot it's placed in (e.g. the League Switcher), rather than drawing its own shape. */
export function LeagueBadge({ icon, color1, color2, size = 'md' }: LeagueBadgeProps) {
    const Icon = LEAGUE_ICON_COMPONENTS[icon];

    return (
        <span
            className="league-badge"
            style={{ background: color2 ?? 'var(--bg-3)', color: color1 ?? 'var(--text-primary)' }}
            aria-hidden="true"
        >
            <Icon size={size === 'sm' ? 18 : 20} />
        </span>
    );
}
