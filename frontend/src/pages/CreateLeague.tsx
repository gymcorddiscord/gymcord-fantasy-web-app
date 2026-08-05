import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
    Button,
    Card,
    CheckIcon,
    ClipboardTextIcon,
    CopyIcon,
    DateTimePicker,
    Dropdown,
    Heading,
    LockIcon,
    SegmentedToggle,
    SwapIcon,
    Text,
    TextField
} from 'gymcord-design-system';
import { api, DraftOrder, DraftStyle, TradeMode, WaiverPriority } from '../lib/api';
import { StepIndicator } from '../components/StepIndicator';

const STEP_LABELS = ['League Details', 'League Rules', 'Draft Settings', 'Trade Settings'];

const PRESETS: { label: string; rosterSize: number; upCount: number; countScore: number }[] = [
    { label: 'Standard', rosterSize: 20, upCount: 10, countScore: 5 },
    { label: 'Hardcore', rosterSize: 20, upCount: 5, countScore: 5 },
    { label: 'Florida', rosterSize: 20, upCount: 20, countScore: 5 },
    { label: 'Deep', rosterSize: 30, upCount: 20, countScore: 5 }
];

const WAIVER_DAY_OPTIONS: { value: string; label: string }[] = [
    { value: 'sun_2359', label: 'Sunday 11:59 PM' },
    { value: 'mon_2359', label: 'Monday 11:59 PM' },
    { value: 'tue_2359', label: 'Tuesday 11:59 PM' },
    { value: 'wed_2359', label: 'Wednesday 11:59 PM' },
    { value: 'thu_2359', label: 'Thursday 11:59 PM' },
    { value: 'fri_2359', label: 'Friday 11:59 PM' },
    { value: 'sat_2359', label: 'Saturday 11:59 PM' }
];

const WAIVER_PRIORITY_OPTIONS: { value: WaiverPriority; label: string }[] = [
    { value: 'reverse_snake', label: 'Reverse draft order snake (4,3,2,1,1,2,3,4)' },
    { value: 'reverse_rotating', label: 'Reverse draft order rotating (1,2,3,4,2,3,4,1)' },
    { value: 'reverse_fixed', label: 'Reverse draft order fixed (1,2,3,4,1,2,3,4)' }
];

function defaultAutodraftStart(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(20, 0, 0, 0);
    return d;
}

function clamp(value: number, min: number, max: number): number {
    if (Number.isNaN(value)) return min;
    return Math.min(max, Math.max(min, Math.round(value)));
}

function launchConfetti() {
    const duration = 400;
    const animationEnd = Date.now() + duration;
    let skew = 1;

    (function frame() {
        const timeLeft = animationEnd - Date.now();
        const ticks = Math.max(200, 500 * (timeLeft / duration));
        skew = Math.max(0.8, skew - 0.001);

        confetti({
            particleCount: 1,
            startVelocity: 0,
            ticks,
            origin: { x: Math.random(), y: Math.random() * skew - 0.2 },
            colors: ['#ffffff'],
            shapes: ['circle'],
            gravity: 0.4 + Math.random() * 0.2,
            scalar: 0.4 + Math.random() * 0.6,
            drift: Math.random() * 0.8 - 0.4
        });

        if (timeLeft > 0) requestAnimationFrame(frame);
    })();
}

interface ChoiceCardProps {
    selected: boolean;
    icon: React.ReactNode;
    title: string;
    desc: string;
    onClick: () => void;
}

function ChoiceCard({ selected, icon, title, desc, onClick }: ChoiceCardProps) {
    return (
        <button type="button" className={`choice-card${selected ? ' choice-card--selected' : ''}`} onClick={onClick}>
            {selected && (
                <span className="choice-card__badge">
                    <CheckIcon size={12} />
                </span>
            )}
            <span className="choice-card__icon">{icon}</span>
            <span className="choice-card__title">{title}</span>
            <span className="choice-card__desc">{desc}</span>
        </button>
    );
}

export function CreateLeague() {
    const navigate = useNavigate();

    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [created, setCreated] = useState(false);
    const [createdLeague, setCreatedLeague] = useState<Awaited<ReturnType<typeof api.createLeague>>['league'] | null>(null);
    const [createdMembership, setCreatedMembership] = useState<Awaited<ReturnType<typeof api.createLeague>>['membership'] | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);

    const [leagueName, setLeagueName] = useState('');
    const [themeText, setThemeText] = useState('');
    const [hostPlaying, setHostPlaying] = useState<'Yes' | 'No'>('Yes');
    const [teamName, setTeamName] = useState('');

    const [rosterSize, setRosterSize] = useState(20);
    const [upCount, setUpCount] = useState(10);
    const [countScore, setCountScore] = useState(5);
    const [activePresetLabel, setActivePresetLabel] = useState<string | null>('Standard');

    const [draftStyle, setDraftStyle] = useState<DraftStyle>('previously_drafted');
    const [draftOrder, setDraftOrder] = useState<DraftOrder>('snake');
    const [autodraftStart, setAutodraftStart] = useState<Date>(defaultAutodraftStart);

    const [tradeMode, setTradeMode] = useState<TradeMode>('waiver');
    const [manualInjuryTrades, setManualInjuryTrades] = useState<'Yes' | 'No'>('No');
    const [seasonEndingOnly, setSeasonEndingOnly] = useState<'Yes' | 'No'>('No');
    const [waiverProcessDay, setWaiverProcessDay] = useState('wed_2359');
    const [waiverPriority, setWaiverPriority] = useState<WaiverPriority>('reverse_snake');

    function applyPreset(p: (typeof PRESETS)[number]) {
        setRosterSize(p.rosterSize);
        setUpCount(p.upCount);
        setCountScore(p.countScore);
        setActivePresetLabel(p.label);
    }

    function onRosterSizeChange(v: number) {
        setRosterSize(v);
        setUpCount((u) => Math.min(u, v));
        setCountScore((c) => Math.min(c, Math.min(upCount, v)));
        setActivePresetLabel(null);
    }
    function onUpCountChange(v: number) {
        setUpCount(v);
        setCountScore((c) => Math.min(c, v));
        setActivePresetLabel(null);
    }
    function onCountScoreChange(v: number) {
        setCountScore(v);
        setActivePresetLabel(null);
    }

    const step0Valid = leagueName.trim().length > 0 && (hostPlaying === 'No' || teamName.trim().length > 0);
    const isWaiver = tradeMode === 'waiver';

    function goBack() {
        setStep((s) => Math.max(0, s - 1));
    }
    function goNext() {
        if (step === 0 && !step0Valid) return;
        setStep((s) => Math.min(3, s + 1));
    }

    async function handleCreate() {
        setSubmitting(true);
        setFormError(null);
        try {
            const result = await api.createLeague({
                name: leagueName.trim(),
                themeText,
                hostPlaying: hostPlaying === 'Yes',
                teamName: teamName.trim(),
                teamColor1: '',
                teamColor2: '',
                rosterSize,
                upCount,
                countScore,
                draftStyle,
                draftOrder: draftStyle === 'autodraft' ? draftOrder : null,
                autodraftStartAt: draftStyle === 'autodraft' ? autodraftStart : null,
                tradeMode,
                manualInjuryTrades: manualInjuryTrades === 'Yes',
                seasonEndingOnly: seasonEndingOnly === 'Yes',
                waiverProcessDay: isWaiver ? waiverProcessDay : null,
                waiverPriority: isWaiver ? waiverPriority : null
            });
            setCreatedLeague(result.league);
            setCreatedMembership(result.membership);
            setCreated(true);
            launchConfetti();
        } catch {
            setFormError('Something went wrong creating your league. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    function copyInviteLink() {
        if (!createdLeague) return;
        const url = `${window.location.origin}${import.meta.env.BASE_URL}#/join/${createdLeague.joinCode}`;
        navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    }
    function copyInviteCode() {
        if (!createdLeague) return;
        navigator.clipboard.writeText(createdLeague.joinCode);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    }

    if (created && createdLeague) {
        return (
            <main className="page-narrow">
                <Card elevation="raised">
                    <div className="wizard-panel create-success">
                        <span className="create-success__check">
                            <CheckIcon size={28} />
                        </span>
                        <Heading level={2}>League Created!</Heading>
                        <Text tone="secondary">Share the invite link with your players to get started.</Text>

                        <div className="invite-code-box">
                            <span className="invite-code-box__value invite-code-box__value--link">
                                {`${window.location.origin}${import.meta.env.BASE_URL}#/join/${createdLeague.joinCode}`}
                            </span>
                            <button type="button" className="copy-btn" onClick={copyInviteLink} aria-label="Copy invite link">
                                {linkCopied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                            </button>
                        </div>
                        <div className="invite-code-box">
                            <span className="invite-code-box__value">{createdLeague.joinCode}</span>
                            <button type="button" className="copy-btn" onClick={copyInviteCode} aria-label="Copy invite code">
                                {codeCopied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                            </button>
                        </div>

                        <dl className="summary-card">
                            <div className="summary-card__row">
                                <dt>League</dt>
                                <dd>{createdLeague.name}</dd>
                            </div>
                            {createdMembership ? (
                                <div className="summary-card__row">
                                    <dt>Your Team</dt>
                                    <dd>{createdMembership.teamName}</dd>
                                </div>
                            ) : (
                                <div className="summary-card__row">
                                    <dt>Host</dt>
                                    <dd>Not playing</dd>
                                </div>
                            )}
                            <div className="summary-card__row">
                                <dt>Format</dt>
                                <dd>
                                    {createdLeague.rosterSize} gymnasts / {createdLeague.upCount} up / {createdLeague.countScore} count
                                </dd>
                            </div>
                            <div className="summary-card__row">
                                <dt>Trades</dt>
                                <dd>{createdLeague.tradeMode === 'waiver' ? 'Waiver Wire' : 'No Trades'}</dd>
                            </div>
                        </dl>

                        <div className="wizard-footer wizard-footer--stacked">
                            {createdMembership && (
                                <Button onClick={() => navigate(`/leagues/${createdMembership.id}/roster`)} style={{ width: '100%' }}>
                                    Build Your Roster
                                </Button>
                            )}
                            <Button variant="secondary" onClick={() => navigate('/home')} style={{ width: '100%' }}>
                                Go to Dashboard
                            </Button>
                        </div>
                    </div>
                </Card>
            </main>
        );
    }

    return (
        <main className="page-narrow page-narrow--wide">
            <Heading level={1}>Create a League</Heading>
            <Text tone="secondary">Hosting a league? Set up your league in a few steps to generate an invite link.</Text>
            <div style={{ marginTop: 24 }}>
                <StepIndicator steps={STEP_LABELS} currentIndex={step} />
            </div>

            <Card elevation="raised">
                <div className="wizard-panel">
                    {formError && (
                        <div className="form-error" role="alert">
                            {formError}
                        </div>
                    )}

                    {step === 0 && (
                        <>
                            <TextField label="League Name" value={leagueName} onChange={setLeagueName} placeholder="e.g. Gymopoly" disabled={submitting} />
                            <div className="toggle-block">
                                <Text size="caption" tone="secondary">
                                    Are you as the league host playing in the league?
                                </Text>
                                <SegmentedToggle
                                    size="sm"
                                    value={hostPlaying}
                                    onChange={setHostPlaying}
                                    options={[
                                        { value: 'No', label: 'No' },
                                        { value: 'Yes', label: 'Yes' }
                                    ]}
                                />
                            </div>
                            {hostPlaying === 'Yes' && (
                                <TextField
                                    label="Your Team Name"
                                    value={teamName}
                                    onChange={setTeamName}
                                    placeholder="e.g. 9.975 With A Step"
                                    disabled={submitting}
                                />
                            )}
                            <TextField
                                label="Theme (optional)"
                                value={themeText}
                                onChange={setThemeText}
                                placeholder="e.g. 80s movies"
                                disabled={submitting}
                            />
                        </>
                    )}

                    {step === 1 && (
                        <>
                            <Heading level={2}>League Rules</Heading>
                            <div>
                                <Text size="caption" tone="secondary">
                                    Presets
                                </Text>
                                <div className="preset-row" style={{ marginTop: 8 }}>
                                    {PRESETS.map((p) => (
                                        <button
                                            key={p.label}
                                            type="button"
                                            className={`preset-btn${activePresetLabel === p.label ? ' preset-btn--active' : ''}`}
                                            onClick={() => applyPreset(p)}
                                        >
                                            {p.label}
                                            <span>
                                                {p.rosterSize}g / {p.upCount}u / {p.countScore}c
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="slider-block">
                                <div className="slider-row">
                                    <Text size="caption" tone="secondary">
                                        Gymnasts per Team (Roster Size)
                                    </Text>
                                    <input
                                        type="number"
                                        className="slider-block__val-input"
                                        min={5}
                                        max={50}
                                        value={rosterSize}
                                        onChange={(e) => e.target.value !== '' && onRosterSizeChange(clamp(Number(e.target.value), 5, 50))}
                                    />
                                </div>
                                <input
                                    type="range"
                                    min={5}
                                    max={50}
                                    value={rosterSize}
                                    onChange={(e) => onRosterSizeChange(Number(e.target.value))}
                                />
                            </div>
                            <div className="slider-block">
                                <div className="slider-row">
                                    <Text size="caption" tone="secondary">
                                        "Up" per Week (Lineup Size)
                                    </Text>
                                    <input
                                        type="number"
                                        className="slider-block__val-input"
                                        min={1}
                                        max={rosterSize}
                                        value={upCount}
                                        onChange={(e) => e.target.value !== '' && onUpCountChange(clamp(Number(e.target.value), 1, rosterSize))}
                                    />
                                </div>
                                <input type="range" min={1} max={rosterSize} value={upCount} onChange={(e) => onUpCountChange(Number(e.target.value))} />
                            </div>
                            <div className="slider-block">
                                <div className="slider-row">
                                    <Text size="caption" tone="secondary">
                                        "Count" per Week (Scores That Count)
                                    </Text>
                                    <input
                                        type="number"
                                        className="slider-block__val-input"
                                        min={1}
                                        max={upCount}
                                        value={countScore}
                                        onChange={(e) => e.target.value !== '' && onCountScoreChange(clamp(Number(e.target.value), 1, upCount))}
                                    />
                                </div>
                                <input type="range" min={1} max={upCount} value={countScore} onChange={(e) => onCountScoreChange(Number(e.target.value))} />
                            </div>

                            <div className="callout">
                                <Text tone="secondary">
                                    Each team drafts <strong>{rosterSize}</strong> gymnasts. Weekly, they'll put <strong>{upCount}</strong> gymnasts
                                    on each apparatus, and the top <strong>{countScore}</strong> scores on each apparatus will count toward their
                                    total.
                                </Text>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <Heading level={2}>Draft Settings</Heading>
                            <div className="panel">
                                <Text size="caption" tone="secondary">
                                    Draft Style
                                </Text>
                                <div className="card-grid" style={{ marginTop: 8 }}>
                                    <ChoiceCard
                                        selected={draftStyle === 'previously_drafted'}
                                        icon={<ClipboardTextIcon size={22} />}
                                        title="Previously Drafted"
                                        desc="Draft already took place live on Discord. Import the resulting rosters."
                                        onClick={() => setDraftStyle('previously_drafted')}
                                    />
                                    <ChoiceCard
                                        selected={draftStyle === 'autodraft'}
                                        icon={<SwapIcon size={22} />}
                                        title="Autodraft"
                                        desc="Waiver wire selects gymnasts for you, in turn order, from your want list."
                                        onClick={() => setDraftStyle('autodraft')}
                                    />
                                </div>

                                {draftStyle === 'autodraft' && (
                                    <>
                                        <div className="toggle-block">
                                            <Text size="caption" tone="secondary">
                                                Autodraft Order
                                            </Text>
                                            <SegmentedToggle
                                                size="sm"
                                                value={draftOrder}
                                                onChange={setDraftOrder}
                                                options={[
                                                    { value: 'snake', label: 'Snake (1,2,3,4,4,3,2,1)' },
                                                    { value: 'rotating', label: 'Rotating (1,2,3,4,2,3,4,1)' }
                                                ]}
                                            />
                                        </div>
                                        <DateTimePicker label="Autodraft Start Time" value={autodraftStart} onChange={setAutodraftStart} />
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <Heading level={2}>Trading Rules</Heading>
                            <Text tone="secondary">Choose how teams can exchange gymnasts after the draft.</Text>

                            {isWaiver && (
                                <>
                                    <div className="toggle-block toggle-block--indented">
                                        <Text size="caption" tone="secondary">
                                            Injury trades allowed between season start and the regular trading window?
                                        </Text>
                                        <Text size="caption" tone="tertiary">
                                            You'll approve these manually as commissioner.
                                        </Text>
                                        <SegmentedToggle
                                            size="sm"
                                            value={manualInjuryTrades}
                                            onChange={setManualInjuryTrades}
                                            options={[
                                                { value: 'No', label: 'No' },
                                                { value: 'Yes', label: 'Yes' }
                                            ]}
                                        />
                                    </div>
                                    {manualInjuryTrades === 'Yes' && (
                                        <div className="toggle-block">
                                            <Text size="caption" tone="secondary">
                                                Must these injury trades be season-ending (e.g. Achilles, ACL, surgery)?
                                            </Text>
                                            <SegmentedToggle
                                                size="sm"
                                                value={seasonEndingOnly}
                                                onChange={setSeasonEndingOnly}
                                                options={[
                                                    { value: 'No', label: 'No' },
                                                    { value: 'Yes', label: 'Yes' }
                                                ]}
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="card-grid">
                                <ChoiceCard
                                    selected={!isWaiver}
                                    icon={<LockIcon size={22} />}
                                    title="No Trades"
                                    desc="Rosters are locked after the draft."
                                    onClick={() => setTradeMode('no_trades')}
                                />
                                <ChoiceCard
                                    selected={isWaiver}
                                    icon={<SwapIcon size={22} />}
                                    title="Waiver Wire"
                                    desc="Automated weekly claims based on priority."
                                    onClick={() => setTradeMode('waiver')}
                                />
                            </div>

                            {isWaiver && (
                                <div className="panel">
                                    <Dropdown
                                        placeholder="Select…"
                                        value={waiverProcessDay}
                                        options={WAIVER_DAY_OPTIONS}
                                        onChange={setWaiverProcessDay}
                                    />
                                    <div className="priority-list">
                                        {WAIVER_PRIORITY_OPTIONS.map((o) => {
                                            const on = waiverPriority === o.value;
                                            return (
                                                <button
                                                    type="button"
                                                    key={o.value}
                                                    className="priority-opt"
                                                    onClick={() => setWaiverPriority(o.value)}
                                                >
                                                    <span className={`priority-check${on ? ' priority-check--on' : ''}`}>
                                                        {on ? <CheckIcon size={12} /> : null}
                                                    </span>
                                                    <Text size="caption">{o.label}</Text>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div className="wizard-footer">
                        {step === 0 ? (
                            <Button variant="tertiary" onClick={() => navigate('/home')} disabled={submitting}>
                                Cancel
                            </Button>
                        ) : (
                            <Button variant="tertiary" onClick={goBack} disabled={submitting}>
                                ← Back
                            </Button>
                        )}
                        {step === 3 ? (
                            <Button onClick={handleCreate} disabled={submitting}>
                                {submitting ? 'Creating' : 'Create League'}
                            </Button>
                        ) : (
                            <Button onClick={goNext} disabled={step === 0 && !step0Valid}>
                                Next Step →
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            <p style={{ textAlign: 'center', marginTop: 16 }}>
                <Link to="/join">Joining someone else's league instead?</Link>
            </p>
        </main>
    );
}
