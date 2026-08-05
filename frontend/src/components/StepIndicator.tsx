import { CheckIcon } from 'gymcord-design-system';

export interface StepIndicatorProps {
    steps: string[];
    /** 0-based index of the active step. Steps before it render as completed (checkmark). */
    currentIndex: number;
}

/** Numbered step pills for multi-step wizards (Join League, Create League) — completed steps show a checkmark, the current step is highlighted, future steps are dim. */
export function StepIndicator({ steps, currentIndex }: StepIndicatorProps) {
    return (
        <ol className="step-indicator" aria-label="Progress">
            {steps.map((label, i) => {
                const state = i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'future';
                return (
                    <li key={label} className={`step-indicator__step step-indicator__step--${state}`}>
                        <span className="step-indicator__dot">
                            {state === 'done' ? <CheckIcon size={12} /> : i + 1}
                        </span>
                        <span className="step-indicator__label">{label}</span>
                        {i < steps.length - 1 && <span className="step-indicator__line" aria-hidden="true" />}
                    </li>
                );
            })}
        </ol>
    );
}
