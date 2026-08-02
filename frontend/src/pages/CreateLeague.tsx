import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'gymcord-design-system';
import { api } from '../lib/api';

const PRESETS = [
    { label: 'Standard', rosterSize: 20, upCount: 10, countScore: 5 },
    { label: 'Hardcore', rosterSize: 10, upCount: 10, countScore: 5 },
    { label: 'Casual', rosterSize: 25, upCount: 25, countScore: 25 }
];

const OTHER_TRADE_RULE_SNIPPETS = [
    'Must show proof of season-ending injury',
    'Commissioner willing to make manual trades between trading windows',
    'Non-compete trading allowed in first 3 weeks'
];

function PillToggle<T extends string>({
    group,
    value,
    onChange,
    options,
    disabled
}: {
    group: string;
    value: T;
    onChange: (v: T) => void;
    options: { value: T; label: string }[];
    disabled?: boolean;
}) {
    return (
        <div className="pill-toggle">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    className={[value === opt.value ? 'active' : '', opt.value === 'No' ? 'pill-toggle--no' : '']
                        .filter(Boolean)
                        .join(' ')}
                    onClick={() => onChange(opt.value)}
                    disabled={disabled}
                    aria-pressed={value === opt.value}
                    data-group={group}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

export function CreateLeague() {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [teamName, setTeamName] = useState('');
    const [rosterSize, setRosterSize] = useState(20);
    const [upCount, setUpCount] = useState(10);
    const [countScore, setCountScore] = useState(5);

    const [injuryTradesAllowed, setInjuryTradesAllowed] = useState<'Yes' | 'No'>('Yes');
    const [injuryTradeTiming, setInjuryTradeTiming] = useState<'as_it_happens' | 'draft'>('as_it_happens');
    const [lateRosterAdds, setLateRosterAdds] = useState<'Yes' | 'No'>('No');
    const [manualInjuryTrades, setManualInjuryTrades] = useState<'Yes' | 'No'>('No');
    const [seasonEndingOnly, setSeasonEndingOnly] = useState<'Yes' | 'No'>('No');
    const [regularSeasonTrades, setRegularSeasonTrades] = useState<'Yes' | 'No'>('No');
    const [otherTradeRules, setOtherTradeRules] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    function applyPreset(p: (typeof PRESETS)[number]) {
        setRosterSize(p.rosterSize);
        setUpCount(p.upCount);
        setCountScore(p.countScore);
    }

    function toggleOtherTradeRuleSnippet(snippet: string) {
        setOtherTradeRules((prev) => {
            const lines = prev.split('\n').map((l) => l.trim()).filter((l) => l !== '');
            const idx = lines.indexOf(snippet);
            if (idx >= 0) lines.splice(idx, 1);
            else lines.push(snippet);
            return lines.join('\n');
        });
    }

    const activeOtherTradeRuleLines = otherTradeRules.split('\n').map((l) => l.trim());
    const showSeasonEndingOnly = injuryTradesAllowed === 'Yes' || manualInjuryTrades === 'Yes';

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
                countScore,
                injuryTradesAllowed: injuryTradesAllowed === 'Yes',
                injuryTradeTiming,
                lateRosterAdds: lateRosterAdds === 'Yes',
                manualInjuryTrades: manualInjuryTrades === 'Yes',
                seasonEndingOnly: showSeasonEndingOnly && seasonEndingOnly === 'Yes',
                regularSeasonTrades: regularSeasonTrades === 'Yes',
                otherTradeRules
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
                    <p className="section-title">League Basics</p>

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

                    <p className="section-title">Trade Rules</p>

                    <div className="form-row">
                        <label>Preseason injury trades allowed?</label>
                        <PillToggle
                            group="injuryTradesAllowed"
                            value={injuryTradesAllowed}
                            onChange={setInjuryTradesAllowed}
                            options={[
                                { value: 'No', label: 'No' },
                                { value: 'Yes', label: 'Yes' }
                            ]}
                            disabled={submitting}
                        />
                    </div>

                    {injuryTradesAllowed === 'Yes' && (
                        <div className="subgroup">
                            <div className="form-row">
                                <label>
                                    Preseason injury trades: immediate as injuries occur, or a single trade window before the
                                    season starts?
                                </label>
                                <PillToggle
                                    group="injuryTradeTiming"
                                    value={injuryTradeTiming}
                                    onChange={setInjuryTradeTiming}
                                    options={[
                                        { value: 'as_it_happens', label: 'As-it-happens' },
                                        { value: 'draft', label: 'Draft window' }
                                    ]}
                                    disabled={submitting}
                                />
                            </div>
                            <div className="form-row">
                                <label>Can late roster adds be picked up via preseason injury trades?</label>
                                <PillToggle
                                    group="lateRosterAdds"
                                    value={lateRosterAdds}
                                    onChange={setLateRosterAdds}
                                    options={[
                                        { value: 'No', label: 'No' },
                                        { value: 'Yes', label: 'Yes' }
                                    ]}
                                    disabled={submitting}
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-row">
                        <label>
                            Injury trades allowed between the start of the season and the regular trading window?
                            <span className="hint">You'll approve these manually as commissioner.</span>
                        </label>
                        <PillToggle
                            group="manualInjuryTrades"
                            value={manualInjuryTrades}
                            onChange={setManualInjuryTrades}
                            options={[
                                { value: 'No', label: 'No' },
                                { value: 'Yes', label: 'Yes' }
                            ]}
                            disabled={submitting}
                        />
                    </div>

                    {showSeasonEndingOnly && (
                        <div className="form-row">
                            <label>Must these injury trades be season-ending (e.g. Achilles, ACL, surgery)?</label>
                            <PillToggle
                                group="seasonEndingOnly"
                                value={seasonEndingOnly}
                                onChange={setSeasonEndingOnly}
                                options={[
                                    { value: 'No', label: 'No' },
                                    { value: 'Yes', label: 'Yes' }
                                ]}
                                disabled={submitting}
                            />
                        </div>
                    )}

                    <div className="form-row">
                        <label>Regular season trades allowed?</label>
                        <PillToggle
                            group="regularSeasonTrades"
                            value={regularSeasonTrades}
                            onChange={setRegularSeasonTrades}
                            options={[
                                { value: 'No', label: 'No' },
                                { value: 'Yes', label: 'Yes' }
                            ]}
                            disabled={submitting}
                        />
                    </div>

                    <div className="form-row">
                        <label htmlFor="otherTradeRules">Other draft and trade rules</label>
                        <div className="quick-pills">
                            {OTHER_TRADE_RULE_SNIPPETS.map((snippet) => (
                                <button
                                    key={snippet}
                                    type="button"
                                    className={`quick-pill${activeOtherTradeRuleLines.includes(snippet) ? ' active' : ''}`}
                                    onClick={() => toggleOtherTradeRuleSnippet(snippet)}
                                    disabled={submitting}
                                >
                                    {snippet}
                                </button>
                            ))}
                        </div>
                        <textarea
                            id="otherTradeRules"
                            placeholder="e.g. No trades / trade after week 3 / must be in-theme / late roster add policy…"
                            value={otherTradeRules}
                            onChange={(e) => setOtherTradeRules(e.target.value)}
                            disabled={submitting}
                        />
                    </div>

                    <p className="section-title">Team Format</p>

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
                            <label htmlFor="rosterSize">Gymnasts per Team</label>
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

                    <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
                        {submitting ? 'Creating league…' : 'Create League'}
                    </Button>
                </form>
            </div>
        </main>
    );
}
