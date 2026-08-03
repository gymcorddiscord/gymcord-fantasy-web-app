import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { api, Gymnast } from '../lib/api';
import {
    EVENT_LABELS,
    EventCode,
    FlaggedRow,
    ParsedScoreRow,
    RowOutcome,
    approveFlaggedRow,
    classifyParsedRows,
    deriveSeasonYear,
    deriveWeekNumber,
    fetchPendingFlaggedRows,
    findExistingScore,
    insertManualScore,
    isValidIsoDate,
    parseScoreImportCsv,
    rejectFlaggedRow,
    submitScoreImport,
    updateScore
} from '../lib/scoreImport';

function GymnastPicker({ gymnasts, onSelect }: { gymnasts: Gymnast[]; onSelect: (g: Gymnast) => void }) {
    const [query, setQuery] = useState('');

    const matches = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (q.length < 2) return [];
        return gymnasts
            .filter((g) => `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) || g.team.name.toLowerCase().includes(q))
            .slice(0, 8);
    }, [query, gymnasts]);

    return (
        <div className="gymnast-picker">
            <input
                type="text"
                placeholder="Search gymnast by name or school…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            {matches.length > 0 && (
                <div className="gymnast-picker__list">
                    {matches.map((g) => (
                        <button
                            key={g.id}
                            type="button"
                            onClick={() => {
                                onSelect(g);
                                setQuery('');
                            }}
                        >
                            {g.firstName} {g.lastName} <span>· {g.team.shortName}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

const EVENT_CODES = Object.keys(EVENT_LABELS) as EventCode[];

function ManualScoreEntry({ gymnasts }: { gymnasts: Gymnast[] }) {
    const [gymnast, setGymnast] = useState<Gymnast | null>(null);
    const [meetDate, setMeetDate] = useState('');
    const [event, setEvent] = useState<EventCode>('vault');
    const [scoreText, setScoreText] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [conflict, setConflict] = useState<{ id: number; score: number } | null>(null);

    const weekPreview = meetDate && isValidIsoDate(meetDate) ? `Week ${deriveWeekNumber(meetDate)} · ${deriveSeasonYear(meetDate)}` : null;

    function clearFeedback() {
        setError(null);
        setSuccess(null);
        setConflict(null);
    }

    async function submitScore(force: boolean) {
        if (!gymnast) {
            setError('Choose a gymnast.');
            return;
        }
        if (!meetDate || !isValidIsoDate(meetDate)) {
            setError('Enter a valid meet date.');
            return;
        }
        const score = Number(scoreText);
        if (scoreText === '' || Number.isNaN(score) || score < 0 || score > 10) {
            setError('Score must be between 0.0 and 10.0.');
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            if (!force) {
                const existing = await findExistingScore(gymnast.id, event, meetDate);
                if (existing) {
                    setConflict(existing);
                    setSubmitting(false);
                    return;
                }
            } else if (conflict) {
                // Same gymnast/event/exact day already on file — this is a
                // correction, not a second meet, so update in place rather
                // than insert (the DB won't allow a second row for the same
                // day anyway).
                await updateScore(conflict.id, score);
                setSuccess(`Updated ${gymnast.firstName} ${gymnast.lastName} · ${EVENT_LABELS[event]} to ${score.toFixed(3)} (${weekPreview}).`);
                setScoreText('');
                setConflict(null);
                setSubmitting(false);
                return;
            }

            await insertManualScore({
                gymnastId: gymnast.id,
                event,
                meetDate,
                score,
                meetName: null,
                opponent: null
            });
            setSuccess(`Added ${gymnast.firstName} ${gymnast.lastName} · ${EVENT_LABELS[event]} · ${score.toFixed(3)} (${weekPreview}).`);
            setScoreText('');
            setConflict(null);
        } catch (err: any) {
            setError(err?.message || 'Could not save this score. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        submitScore(false);
    }

    return (
        <div className="card">
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 0 }}>
                If a gymnast competed twice in one week, add each score separately with its own meet date: both are kept on
                file (the day competed is what tells them apart) so your league's highest-of-two / average-of-two rule can be
                applied later.
            </p>

            <form onSubmit={handleSubmit} noValidate>
                <div className="form-row">
                    <label>Gymnast</label>
                    {gymnast ? (
                        <span className="quick-pill active">
                            {gymnast.firstName} {gymnast.lastName} · {gymnast.team.shortName}
                            <button
                                type="button"
                                className="btn-link"
                                style={{ marginLeft: 8 }}
                                onClick={() => {
                                    setGymnast(null);
                                    clearFeedback();
                                }}
                            >
                                change
                            </button>
                        </span>
                    ) : (
                        <GymnastPicker
                            gymnasts={gymnasts}
                            onSelect={(g) => {
                                setGymnast(g);
                                clearFeedback();
                            }}
                        />
                    )}
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div className="form-row" style={{ width: 170 }}>
                        <label htmlFor="manualMeetDate">Meet Date</label>
                        <input
                            id="manualMeetDate"
                            type="date"
                            value={meetDate}
                            onChange={(e) => {
                                setMeetDate(e.target.value);
                                clearFeedback();
                            }}
                            disabled={submitting}
                        />
                    </div>
                    <div className="form-row" style={{ width: 130 }}>
                        <label htmlFor="manualEvent">Event</label>
                        <select
                            id="manualEvent"
                            value={event}
                            onChange={(e) => {
                                setEvent(e.target.value as EventCode);
                                clearFeedback();
                            }}
                            disabled={submitting}
                        >
                            {EVENT_CODES.map((code) => (
                                <option key={code} value={code}>
                                    {EVENT_LABELS[code]}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-row" style={{ width: 110 }}>
                        <label htmlFor="manualScore">Score</label>
                        <input
                            id="manualScore"
                            type="number"
                            min={0}
                            max={10}
                            step={0.001}
                            value={scoreText}
                            onChange={(e) => {
                                setScoreText(e.target.value);
                                clearFeedback();
                            }}
                            disabled={submitting}
                        />
                    </div>
                </div>

                {weekPreview && (
                    <p className="hint" style={{ marginTop: -10, marginBottom: 16 }}>
                        Derives to {weekPreview}.
                    </p>
                )}

                {error && (
                    <div className="form-error" role="alert">
                        {error}
                    </div>
                )}
                {success && <p style={{ color: 'var(--success)' }}>{success}</p>}

                {conflict ? (
                    <div className="form-error" role="alert" style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}>
                        {gymnast?.firstName} already has a {EVENT_LABELS[event]} score of {conflict.score.toFixed(3)} on{' '}
                        {meetDate}.
                        <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ marginLeft: 12, width: 'auto' }}
                            disabled={submitting}
                            onClick={() => submitScore(true)}
                        >
                            {submitting ? 'Updating…' : `Update it to ${scoreText || '…'}`}
                        </button>
                    </div>
                ) : (
                    <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={submitting}>
                        {submitting ? 'Saving…' : 'Add Score'}
                    </button>
                )}
            </form>
        </div>
    );
}

function FlaggedRowCard({
    row,
    gymnasts,
    onResolved
}: {
    row: FlaggedRow;
    gymnasts: Gymnast[];
    onResolved: (id: number) => void;
}) {
    const [selected, setSelected] = useState<Gymnast | null>(
        row.matchedGymnastId ? gymnasts.find((g) => g.id === row.matchedGymnastId) ?? null : null
    );
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleApprove() {
        if (!selected) return;
        setBusy(true);
        setError(null);
        try {
            await approveFlaggedRow(row, selected.id);
            onResolved(row.id);
        } catch (err: any) {
            setError(err?.message || 'Could not approve this row. Please try again.');
        } finally {
            setBusy(false);
        }
    }

    async function handleReject() {
        setBusy(true);
        setError(null);
        try {
            await rejectFlaggedRow(row);
            onResolved(row.id);
        } catch (err: any) {
            setError(err?.message || 'Could not reject this row. Please try again.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="card flagged-row">
            <div className="flagged-row__meta">
                <span className={`badge ${row.reason === 'possible_duplicate' ? 'badge-warning' : 'badge-error'}`}>
                    {row.reason === 'possible_duplicate' ? 'Possible duplicate' : 'No gymnast match'}
                </span>
                <span>
                    {row.meetDate} · {EVENT_LABELS[row.event]} · {row.score.toFixed(3)}
                    {row.meetName ? ` · ${row.meetName}` : ''}
                </span>
            </div>
            <p style={{ margin: '8px 0' }}>
                CSV row {row.rowNumber}: <strong>{row.gymnastName}</strong> ({row.gymnastSchool})
            </p>

            {error && (
                <div className="form-error" role="alert">
                    {error}
                </div>
            )}

            <div className="flagged-row__resolve">
                {selected ? (
                    <span className="quick-pill active">
                        {selected.firstName} {selected.lastName} · {selected.team.shortName}
                        <button type="button" className="btn-link" onClick={() => setSelected(null)} style={{ marginLeft: 8 }}>
                            change
                        </button>
                    </span>
                ) : (
                    <GymnastPicker gymnasts={gymnasts} onSelect={setSelected} />
                )}

                <div className="flagged-row__actions">
                    <button
                        type="button"
                        className="btn btn-primary"
                        style={{ width: 'auto' }}
                        disabled={!selected || busy}
                        onClick={handleApprove}
                    >
                        {busy ? 'Approving…' : 'Approve & Insert'}
                    </button>
                    <button type="button" className="btn btn-ghost" style={{ width: 'auto' }} disabled={busy} onClick={handleReject}>
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
}

function ImportRow({ outcome }: { outcome: RowOutcome }) {
    if (outcome.kind === 'error') {
        return (
            <tr>
                <td>{outcome.rowNumber}</td>
                <td colSpan={5} style={{ color: 'var(--error)' }}>
                    {outcome.message}
                </td>
                <td>
                    <span className="badge" style={{ background: 'var(--error)', color: '#fff' }}>
                        Error
                    </span>
                </td>
            </tr>
        );
    }
    if (outcome.kind === 'excluded') {
        return (
            <tr>
                <td>{outcome.rowNumber}</td>
                <td colSpan={5} style={{ color: 'var(--text-dim)' }}>
                    {outcome.gymnastName} · {outcome.event}{' '}
                    {outcome.reason === 'all_around' ? '(All-Around, not used for fantasy scoring)' : '(exhibition, excluded)'}
                </td>
                <td>
                    <span className="badge badge-muted">Excluded</span>
                </td>
            </tr>
        );
    }

    const row: ParsedScoreRow = outcome.row;
    return (
        <tr>
            <td>{outcome.rowNumber}</td>
            <td>{row.meetDate}</td>
            <td>{row.gymnastName}</td>
            <td>{row.gymnastSchool}</td>
            <td>{EVENT_LABELS[row.event]}</td>
            <td>{row.score.toFixed(3)}</td>
            <td>
                {outcome.kind === 'ready' ? (
                    <span className="badge" style={{ background: 'var(--success)', color: '#fff' }}>
                        Wk {outcome.weekNumber} · {outcome.seasonYear}
                    </span>
                ) : (
                    <span className="badge" style={{ background: 'var(--warning)', color: '#1F2937' }}>
                        {outcome.reason === 'possible_duplicate' ? 'Possible duplicate' : 'No gymnast match'}
                    </span>
                )}
            </td>
        </tr>
    );
}

export function AdminScoresImport() {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [gymnasts, setGymnasts] = useState<Gymnast[] | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [outcomes, setOutcomes] = useState<RowOutcome[] | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [classifying, setClassifying] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ insertedCount: number; flaggedCount: number } | null>(null);

    const [flaggedRows, setFlaggedRows] = useState<FlaggedRow[] | null>(null);

    // Write-in defaults to first/active — it's the common case (one or two
    // scores after a meet); CSV upload is the bulk path for when Virtius
    // sync fails outright and a whole meet needs backfilling at once.
    const [mode, setMode] = useState<'manual' | 'csv'>('manual');

    useEffect(() => {
        api.gymnasts()
            .then((r) => setGymnasts(r.gymnasts))
            .catch(() => setGymnasts([]));
        loadFlagged();
    }, []);

    function loadFlagged() {
        fetchPendingFlaggedRows()
            .then(setFlaggedRows)
            .catch(() => setFlaggedRows([]));
    }

    async function handleFile(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        setResult(null);
        setParseError(null);
        setOutcomes(null);
        setClassifying(true);
        try {
            const text = await file.text();
            const { parsed, outcomes: badOutcomes } = parseScoreImportCsv(text);
            if (!gymnasts) throw new Error('Still loading gymnast data, try again in a moment.');
            const classified = await classifyParsedRows(parsed, gymnasts);
            setOutcomes([...badOutcomes, ...classified].sort((a, b) => a.rowNumber - b.rowNumber));
        } catch (err: any) {
            setParseError(err?.message || 'Could not parse this CSV.');
        } finally {
            setClassifying(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    async function handleImport() {
        if (!outcomes || !fileName) return;
        setSubmitting(true);
        setParseError(null);
        try {
            const summary = await submitScoreImport(fileName, outcomes);
            setResult(summary);
            setOutcomes(null);
            loadFlagged();
        } catch {
            setParseError('Import failed, no rows were saved. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    const counts = useMemo(() => {
        if (!outcomes) return null;
        return {
            ready: outcomes.filter((o) => o.kind === 'ready').length,
            flagged: outcomes.filter((o) => o.kind === 'flagged').length,
            excluded: outcomes.filter((o) => o.kind === 'excluded').length,
            error: outcomes.filter((o) => o.kind === 'error').length
        };
    }, [outcomes]);

    return (
        <main className="page page--wide">
            <h1 className="page-title">Scores Import</h1>
            <p className="page-subtitle">Enter meet results manually, or bulk-upload a CSV.</p>

            <div className="pill-toggle" style={{ marginBottom: 24 }}>
                <button type="button" className={mode === 'manual' ? 'active' : ''} onClick={() => setMode('manual')}>
                    Write-in Scores
                </button>
                <button type="button" className={mode === 'csv' ? 'active' : ''} onClick={() => setMode('csv')}>
                    Upload CSV
                </button>
            </div>

            {mode === 'manual' && <ManualScoreEntry gymnasts={gymnasts || []} />}

            {mode === 'csv' && (
            <div className="card">
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 0 }}>
                    Required columns: <code>meet_date, gymnast_name, gymnast_school, event, score</code>. Optional:{' '}
                    <code>meet_name, opponent, exhibition</code>. Event must be VT, UB, BB, or FX. AA rows parse fine but are
                    excluded (not used for fantasy scoring), same as exhibition rows.
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFile}
                    disabled={classifying || submitting || !gymnasts}
                />
                {classifying && <p style={{ color: 'var(--text-muted)' }}>Matching gymnasts…</p>}
                {parseError && (
                    <div className="form-error" role="alert">
                        {parseError}
                    </div>
                )}

                {result && (
                    <div className="form-row" style={{ marginTop: 16 }}>
                        <p style={{ color: 'var(--success)', margin: 0 }}>
                            Imported {result.insertedCount} score{result.insertedCount === 1 ? '' : 's'}
                            {result.flaggedCount > 0
                                ? `, flagged ${result.flaggedCount} row${result.flaggedCount === 1 ? '' : 's'} for review below.`
                                : '.'}
                        </p>
                    </div>
                )}

                {outcomes && counts && (
                    <>
                        <div className="import-summary">
                            <span className="badge" style={{ background: 'var(--success)', color: '#fff' }}>
                                {counts.ready} ready
                            </span>
                            {counts.flagged > 0 && (
                                <span className="badge" style={{ background: 'var(--warning)', color: '#1F2937' }}>
                                    {counts.flagged} need review
                                </span>
                            )}
                            {counts.excluded > 0 && <span className="badge badge-muted">{counts.excluded} excluded</span>}
                            {counts.error > 0 && (
                                <span className="badge" style={{ background: 'var(--error)', color: '#fff' }}>
                                    {counts.error} errors
                                </span>
                            )}
                        </div>

                        <div className="table-scroll" style={{ marginTop: 16 }}>
                            <table className="import-table">
                                <thead>
                                    <tr>
                                        <th>Row</th>
                                        <th>Meet Date</th>
                                        <th>Gymnast</th>
                                        <th>School</th>
                                        <th>Event</th>
                                        <th>Score</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {outcomes.map((o) => (
                                        <ImportRow key={o.rowNumber} outcome={o} />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <button
                            type="button"
                            className="btn btn-primary"
                            style={{ width: 'auto', marginTop: 16 }}
                            disabled={submitting || (counts.ready === 0 && counts.flagged === 0)}
                            onClick={handleImport}
                        >
                            {submitting ? 'Importing…' : `Import ${counts.ready + counts.flagged} row${counts.ready + counts.flagged === 1 ? '' : 's'}`}
                        </button>
                    </>
                )}
            </div>
            )}

            <p className="section-title">Pending Review ({flaggedRows?.length ?? 0})</p>
            {flaggedRows === null ? (
                <div className="full-page-loader">Loading…</div>
            ) : flaggedRows.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No rows waiting on review.</p>
            ) : (
                <div className="flagged-row-list">
                    {flaggedRows.map((row) => (
                        <FlaggedRowCard
                            key={row.id}
                            row={row}
                            gymnasts={gymnasts || []}
                            onResolved={(id) => setFlaggedRows((prev) => (prev || []).filter((r) => r.id !== id))}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}
