import { useLocation } from 'react-router-dom';
import { FeedbackButton as DSFeedbackButton } from 'gymcord-design-system';
import { api } from '../lib/api';

/**
 * Floating button rendered once at the app shell level, so it persists on
 * every route regardless of auth state. Auto-captures the current path
 * rather than asking the user to describe where they were.
 */
export function FeedbackButton() {
    const location = useLocation();
    return (
        <DSFeedbackButton
            currentPath={location.pathname}
            onSubmit={async (path, message) => {
                await api.submitFeedback(path, message);
            }}
        />
    );
}
