import { FormEvent, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api';

type Status = 'idle' | 'sending' | 'sent' | 'error';

/**
 * Floating button rendered once at the app shell level, so it persists on
 * every route regardless of auth state. Auto-captures the current path
 * rather than asking the user to describe where they were.
 */
export function FeedbackButton() {
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<Status>('idle');

    function close() {
        setOpen(false);
        setMessage('');
        setStatus('idle');
    }

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (!message.trim()) return;
        setStatus('sending');
        try {
            await api.submitFeedback(location.pathname, message.trim());
            setStatus('sent');
        } catch {
            setStatus('error');
        }
    }

    return (
        <>
            <button
                type="button"
                className="feedback-fab"
                onClick={() => setOpen(true)}
                aria-label="Report feedback or a bug"
            >
                Feedback
            </button>

            {open && (
                <div className="feedback-modal-backdrop" onClick={close}>
                    <div
                        className="feedback-modal card"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Send feedback"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {status === 'sent' ? (
                            <>
                                <h3>Thanks!</h3>
                                <p>Your feedback was logged from <code>{location.pathname}</code>.</p>
                                <button type="button" className="btn btn-primary" onClick={close}>
                                    Close
                                </button>
                            </>
                        ) : (
                            <form onSubmit={onSubmit}>
                                <h3>Report feedback or a bug</h3>
                                <p className="feedback-page-note">
                                    Logged from <code>{location.pathname}</code>
                                </p>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="What happened? What did you expect instead?"
                                    rows={5}
                                    maxLength={2000}
                                    autoFocus
                                />
                                {status === 'error' && (
                                    <p className="form-error">Something went wrong sending that. Try again.</p>
                                )}
                                <div className="feedback-actions">
                                    <button type="button" className="btn btn-ghost" onClick={close}>
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ width: 'auto' }}
                                        disabled={status === 'sending' || !message.trim()}
                                    >
                                        {status === 'sending' ? 'Sending…' : 'Send'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
