import { Gymnast } from './api';

/** Below this similarity score, a gymnast isn't considered a candidate at all. */
const MIN_CANDIDATE_SCORE = 0.6;
/** How much better the top score must be than the runner-up to count as an unambiguous single match — otherwise it's Ambiguous. */
const MATCH_MARGIN = 0.08;
/** How close to the top score other candidates have to be to also show up in the Ambiguous list — kept >= MATCH_MARGIN so the runner-up that triggered Ambiguous is always itself included in the list. */
const CANDIDATE_WINDOW = 0.1;
const MAX_CANDIDATES = 5;

export function normalizeName(s: string): string {
    return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // strip accents (post NFD decomposition)
        .replace(/[^a-z0-9\s'-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    let curr = new Array(b.length + 1).fill(0);

    for (let i = 1; i <= a.length; i++) {
        curr[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
        }
        [prev, curr] = [curr, prev];
    }
    return prev[b.length];
}

/** 1.0 = identical, 0.0 = completely different. */
export function similarity(a: string, b: string): number {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    return 1 - levenshtein(a, b) / maxLen;
}

export type NameMatchResult =
    | { state: 'matched'; gymnast: Gymnast }
    | { state: 'ambiguous'; candidates: Gymnast[] }
    | { state: 'unmatched' };

/**
 * Fuzzy-matches one pasted name against the full gymnast catalog, tolerating
 * minor typos/close spellings (2,152 gymnasts / 87 schools — near-duplicate
 * names, e.g. "Jordan Chiles" vs "Jordyn Chiles", are expected). A single
 * clearly-best candidate is a Matched result; multiple close candidates
 * (including exact same-name-different-school ties) are Ambiguous; nothing
 * close enough is Unmatched.
 */
export function matchGymnastName(pastedName: string, gymnasts: Gymnast[]): NameMatchResult {
    const query = normalizeName(pastedName);
    if (!query) return { state: 'unmatched' };

    const scored = gymnasts
        .map((g) => ({ gymnast: g, score: similarity(query, normalizeName(`${g.firstName} ${g.lastName}`)) }))
        .filter((s) => s.score >= MIN_CANDIDATE_SCORE)
        .sort((a, b) => b.score - a.score);

    if (scored.length === 0) return { state: 'unmatched' };
    if (scored.length === 1) return { state: 'matched', gymnast: scored[0].gymnast };

    const top = scored[0].score;
    const runnerUp = scored[1].score;
    if (top - runnerUp >= MATCH_MARGIN) {
        return { state: 'matched', gymnast: scored[0].gymnast };
    }

    const candidates = scored.filter((s) => top - s.score <= CANDIDATE_WINDOW).slice(0, MAX_CANDIDATES);
    return { state: 'ambiguous', candidates: candidates.map((c) => c.gymnast) };
}
