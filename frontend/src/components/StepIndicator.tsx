import { CheckIcon } from 'gymcord-design-system';

export interface StepIndicatorProps {
    steps: string[];
    /** 0-based index of the active step. Steps before it render as completed (checkmark). */
    currentIndex: number;
}

/** Numbered step circles on a shared progress track (Join League, Create League) — completed steps show a filled checkmark circle, the current step is an outlined circle, future steps are dim. */
export function StepIndicator({ steps, currentIndex }: StepIndicatorProps) {
    const n = steps.length;
    const edgeOffset = 50 / n;
    const trackSpan = 100 - 2 * edgeOffset;
    const fillWidth = n > 1 ? (currentIndex / (n - 1)) * trackSpan : 0;

    return (
        <div className="step-indicator" aria-label="Progress">
            <span className="step-indicator__track" style={{ left: `${edgeOffset}%`, right: `${edgeOffset}%` }} aria-hidden="true" />
            <span
                className="step-indicator__fill"
                style={{ left: `${edgeOffset}%`, width: `${fillWidth}%` }}
                aria-hidden="true"
            />
            {steps.map((label, i) => {
                const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming';
                return (
                    <div key={label} className="step-indicator__step" style={{ width: `${100 / n}%` }}>
                        <span className={`step-indicator__circle step-indicator__circle--${state}`}>
                            {state === 'done' ? <CheckIcon size={16} /> : i + 1}
                        </span>
                        <span className={`step-indicator__label${state === 'upcoming' ? ' step-indicator__label--inactive' : ''}`}>
                            {label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
