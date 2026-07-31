import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const PRESETS = [
    { label: 'Standard', rosterSize: 20, upCount: 10, countScore: 5 },
    { label: 'Hardcore', rosterSize: 10, upCount: 10, countScore: 5 },
    { label: 'Casual', rosterSize: 25, upCount: 25, countScore: 25 }
];

export function CreateLeague() {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [teamName, setTeamName] = useState('');
    const [rosterSize, setRosterSize] = useState(20);
    const [upCount, setUpCount] = useState(10);
    const [countScore, setCountScore] = useState(5);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    function applyPreset(p: (typeof PRESETS)[number]) {
        setRosterSize(p.rosterSize);
        setUpCount(p.upCount);
        setCountScore(p.countScore);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setFormError(null);

        if (!name.trim() || !teamName.trim()) {
            setFormError('League name and team name are required.');
            return;
        }
        if (rosterSize < 5 || rosterSize > 50) {
            setFormError('Roster size must be between 5 and 50.');
            return;
        }
        if (upCount < 1 || upCount > rosterSize) {
            setFormError('Up must be between 1 and the roster size.');
            return;
        }
        if (countScore < 1 || countScore > upCount) {
            setFormError('Count must be between 1 and Up.');
            return;
        }

        setSubmitting(true);
        try {
            await api.createLeague({
                name: name.trim(),
                teamName: teamName.trim(),
                rosterSize,
                upCount,
                countScore
            });
            navigate('/home');
        } catch {
            setFormError('Something went wrong creating your league. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="page-narrow">
            <h1 className="page-title">Create a league</h1>
            <p className="page-subtitle">Set your league up, then share the invite link with players.</p>

            <div className="card">
                {formError && (
                    <div className="form-error" role="alert">
                        {formError}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-row">
                        <label htmlFor="leagueName">League Name</label>
                        <input
                            id="leagueName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={submitting}
                            autoFocus
                        />
                    </div>

                    <div className="form-row">
                        <label htmlFor="teamName">Your Team Name</label>
                        <input
                            id="teamName"
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            disabled={submitting}
                        />
                    </div>

                    <div className="form-row">
                        <label>Presets</label>
                        <div className="preset-row">
                            {PRESETS.map((p) => (
                                <button
                                    key={p.label}
                                    type="button"
                                    className={`preset-btn${
                                        rosterSize === p.rosterSize && upCount === p.upCount && countScore === p.countScore
                                            ? ' preset-btn--active'
                                            : ''
                                    }`}
                                    onClick={() => applyPreset(p)}
                                    disabled={submitting}
                                >
                                    {p.label}
                                    <span>
                                        {p.rosterSize}g/{p.upCount}u{p.countScore}c
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="row3">
                        <div className="form-row">
                            <label htmlFor="rosterSize">Roster Size</label>
                            <input
                                id="rosterSize"
                                type="number"
                                min={5}
                                max={50}
                                value={rosterSize}
                                onChange={(e) => setRosterSize(Number(e.target.value))}
                                disabled={submitting}
                            />
                        </div>
                        <div className="form-row">
                            <label htmlFor="upCount">Up</label>
                            <input
                                id="upCount"
                                type="number"
                                min={1}
                                max={rosterSize}
                                value={upCount}
                                onChange={(e) => setUpCount(Number(e.target.value))}
                                disabled={submitting}
                            />
                        </div>
                        <div className="form-row">
                            <label htmlFor="countScore">Count</label>
                            <input
                                id="countScore"
                                type="number"
                                min={1}
                                max={upCount}
                                value={countScore}
                                onChange={(e) => setCountScore(Number(e.target.value))}
                                disabled={submitting}
                            />
                        </div>
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                        Each team drafts <strong>{rosterSize}</strong> gymnasts. Weekly, they'll activate{' '}
                        <strong>{upCount}</strong> per event, and the top <strong>{countScore}</strong> scores will count.
                    </p>

                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Creating league…' : 'Create League'}
                    </button>
                </form>
            </div>
        </main>
    );
}
