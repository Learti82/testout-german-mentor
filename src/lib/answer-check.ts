// Offline answer checking for typed German answers. Lenient about punctuation,
// umlaut spellings (ae/oe/ue/ss) and spacing; strict about words and word order.

export type CheckVerdict = "correct" | "almost" | "word_order" | "wrong";

export interface CheckResult {
  verdict: CheckVerdict;
  /** Best-matching accepted answer */
  expected: string;
  /** Short note in Albanian explaining the verdict */
  noteSq: string;
  capitalizationIssue: boolean;
}

export function normalize(s: string, opts: { keepCase?: boolean } = {}): string {
  let x = s.trim();
  if (!opts.keepCase) x = x.toLowerCase();
  x = x
    .replace(/[„“”"«»‚‘’']/g, "")
    .replace(/[.,!?;:¿¡()\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return x;
}

/** Fold umlaut alternatives so "Fuer" == "Für", "Strasse" == "Straße". */
export function foldUmlauts(s: string): string {
  return s
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

function key(s: string) {
  return foldUmlauts(normalize(s));
}

function sortedWords(s: string) {
  return key(s).split(" ").sort().join(" ");
}

export function checkAnswer(input: string, accepted: string[]): CheckResult {
  const answers = accepted.filter(Boolean);
  const k = key(input);
  if (!k) return { verdict: "wrong", expected: answers[0] ?? "", noteSq: "Nuk shkruajte asgjë.", capitalizationIssue: false };

  for (const a of answers) {
    if (key(a) === k) {
      const capIssue = foldUmlauts(normalize(a, { keepCase: true })) !== foldUmlauts(normalize(input, { keepCase: true }));
      return {
        verdict: "correct",
        expected: a,
        noteSq: capIssue ? "Saktë! Kujdes: në gjermanisht emrat shkruhen me shkronjë të madhe." : "Saktë!",
        capitalizationIssue: capIssue,
      };
    }
  }

  for (const a of answers) {
    if (sortedWords(a) === sortedWords(input)) {
      return {
        verdict: "word_order",
        expected: a,
        noteSq: "Fjalët janë të sakta, por renditja nuk është e saktë. Kontrollo ku qëndron folja.",
        capitalizationIssue: false,
      };
    }
  }

  let best = { a: answers[0] ?? "", d: Infinity };
  for (const a of answers) {
    const d = levenshtein(key(a), k);
    if (d < best.d) best = { a, d };
  }
  const len = key(best.a).length;
  const tolerance = len <= 6 ? 1 : len <= 20 ? 2 : 3;
  if (best.d <= tolerance) {
    return {
      verdict: "almost",
      expected: best.a,
      noteSq: "Pothuajse! Ka një gabim të vogël drejtshkrimi ose një mbaresë të gabuar.",
      capitalizationIssue: false,
    };
  }
  return { verdict: "wrong", expected: best.a, noteSq: "Jo saktë.", capitalizationIssue: false };
}

/** Word-level diff for pronunciation / repeat checks. Returns per-target-word match flags and overall similarity 0..1 */
export function compareSpoken(spoken: string, target: string): { words: { word: string; ok: boolean }[]; similarity: number } {
  const t = normalize(target).split(" ").filter(Boolean);
  const s = normalize(spoken).split(" ").filter(Boolean);
  const sFold = s.map(foldUmlauts);
  const used = new Array(s.length).fill(false);
  const words = t.map((w) => {
    const wf = foldUmlauts(w);
    const idx = sFold.findIndex((x, i) => !used[i] && (x === wf || (wf.length > 4 && levenshtein(x, wf) <= 1)));
    if (idx >= 0) used[idx] = true;
    return { word: w, ok: idx >= 0 };
  });
  const matched = words.filter((w) => w.ok).length;
  const extra = s.length - used.filter(Boolean).length;
  const similarity = t.length ? Math.max(0, (matched - extra * 0.5) / t.length) : 0;
  return { words, similarity: Math.min(1, similarity) };
}

/** Is this verdict counted as a success for scoring? "almost" counts as half. */
export function verdictScore(v: CheckVerdict): number {
  return v === "correct" ? 1 : v === "almost" ? 0.5 : 0;
}
