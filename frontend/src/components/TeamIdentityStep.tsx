import { TextField, Heading, Text, CheckIcon } from 'gymcord-design-system';
import { TEAM_COLOR_SWATCHES } from '../lib/teamColors';
import { TeamBadge } from './TeamBadge';

const MAX_TEAM_NAME_LENGTH = 30;

export interface TeamIdentityStepProps {
    teamName: string;
    onTeamNameChange: (name: string) => void;
    /** Selected swatch hex values, in pick order. 0, 1, or 2 entries. */
    colors: string[];
    onColorsChange: (colors: string[]) => void;
    leagueName: string;
    teamNameError?: string | null;
    disabled?: boolean;
}

/**
 * Shared "name and personalize your team" step — used by the Join League
 * wizard (Step 3) and, per spec, meant to be reused by the Create League
 * flow's own Team Identity step. Purely presentational/controlled so it can
 * be dropped into either wizard's state machine unchanged.
 */
export function TeamIdentityStep({
    teamName,
    onTeamNameChange,
    colors,
    onColorsChange,
    leagueName,
    teamNameError,
    disabled
}: TeamIdentityStepProps) {
    function toggleSwatch(hex: string) {
        if (disabled) return;
        if (colors.includes(hex)) {
            onColorsChange(colors.filter((c) => c !== hex));
        } else if (colors.length >= 2) {
            // Picking a 3rd swatch drops the oldest selection rather than
            // blocking the click — matches the design reference behavior.
            onColorsChange([colors[1], hex]);
        } else {
            onColorsChange([...colors, hex]);
        }
    }

    return (
        <div className="team-identity">
            <Heading level={2}>Set Up Your Team</Heading>

            <TextField
                label="Team Name"
                value={teamName}
                onChange={(v) => onTeamNameChange(v.slice(0, MAX_TEAM_NAME_LENGTH))}
                placeholder="e.g. Vault Vixens"
                error={teamNameError ?? undefined}
                helperText={teamNameError ? undefined : `${teamName.length}/${MAX_TEAM_NAME_LENGTH}`}
                disabled={disabled}
            />

            <div className="team-identity__color-picker">
                <Text size="caption" tone="secondary">
                    Team Colors (pick two)
                </Text>
                <div className="team-identity__swatch-grid" role="group" aria-label="Team colors">
                    {TEAM_COLOR_SWATCHES.map((swatch) => {
                        const selected = colors.includes(swatch.hex);
                        return (
                            <button
                                key={swatch.token}
                                type="button"
                                className={`team-identity__swatch${selected ? ' team-identity__swatch--selected' : ''}`}
                                style={{ backgroundColor: swatch.hex }}
                                title={swatch.label}
                                aria-pressed={selected}
                                aria-label={swatch.label}
                                disabled={disabled}
                                onClick={() => toggleSwatch(swatch.hex)}
                            >
                                {selected ? (
                                    <CheckIcon
                                        size={16}
                                        className="team-identity__swatch-check"
                                        style={{
                                            color:
                                                swatch.token === 'white' || swatch.token === 'yellow' || swatch.token === 'gold'
                                                    ? '#14141f'
                                                    : '#f5f5fa'
                                        }}
                                    />
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="team-identity__preview">
                <TeamBadge color1={colors[0] ?? null} color2={colors[1] ?? null} />
                <Text tone="secondary">
                    {teamName.trim() ? (
                        <>
                            Your team "{teamName.trim()}" in {leagueName}
                        </>
                    ) : (
                        <>Your team in {leagueName}</>
                    )}
                </Text>
            </div>
        </div>
    );
}
