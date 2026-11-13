// Honest CEFR estimation from evidence. A level counts as demonstrated for a skill only with
// enough recent items AT that level answered with ≥70% (recency-weighted) accuracy.

import type { CEFR, DB, Skill, SkillEvidence } from "./types";
import { CEFR_LEVELS } from "./types";

export const CORE_SKILLS: Skill[] = ["grammar", "vocabulary", "reading", "listening", "speaking"];

const MIN_ITEMS: Record<Skill, number> = {
  grammar: 25,
  vocabulary: 25,
  reading: 6,
  listening: 6,
  speaking: 10,
  writing: 12,
};
const PASS = 0.7;
const HALF_LIFE_DAYS = 30;
const WINDOW_DAYS = 120;

export interface SkillLevel {
  skill: Skill;
  /** highest demonstrated level, or null if not even A1 is demonstrated */
  level: CEFR | null;
  /** level currently being worked on */
  working: CEFR;
  /** progress toward demonstrating `working` (0..1) */
  progress: number;
  evidenceCount: number;
  accuracy: number | null;
}

export interface LevelEstimate {
  overall: CEFR | null;
  working: CEFR;
  label: string;
  provisional: boolean;
  skills: SkillLevel[];
}

function weight(at: string, now: Date) {
  const days = (now.getTime() - new Date(at).getTime()) / 86400000;
  if (days > WINDOW_DAYS) return 0;
  return Math.pow(0.5, days / HALF_LIFE_DAYS);
}

export function skillLevel(evidence: SkillEvidence[], skill: Skill, now = new Date()): SkillLevel {
  const items = evidence.filter((e) => e.skill === skill);
  let level: CEFR | null = null;
  let working: CEFR = "A1";
  let progress = 0;
  for (const L of CEFR_LEVELS) {
    const atL = items.filter((e) => e.level === L);
    let w = 0;
    let s = 0;
    for (const e of atL) {
      const wt = weight(e.at, now);
      w += wt;
      s += wt * e.score;
    }
    const acc = w > 0 ? s / w : 0;
    const enough = w >= MIN_ITEMS[skill] * 0.6 && atL.length >= MIN_ITEMS[skill];
    if (enough && acc >= PASS) {
      level = L;
      continue;
    }
    working = L;
    progress = Math.min(1, atL.length / MIN_ITEMS[skill]) * Math.min(1, acc / PASS);
    break;
  }
  if (level === "B2") {
    working = "B2";
    progress = 1;
  }
  const total = items.filter((e) => weight(e.at, now) > 0);
  const acc = total.length ? total.reduce((a, e) => a + e.score, 0) / total.length : null;
  return { skill, level, working, progress, evidenceCount: total.length, accuracy: acc };
}

const idx = (l: CEFR | null) => (l ? CEFR_LEVELS.indexOf(l) : -1);

export function estimateLevel(db: DB, now = new Date()): LevelEstimate {
  const skills = CORE_SKILLS.map((s) => skillLevel(db.skill_evidence, s, now));
  const assessed = skills.filter((s) => s.evidenceCount > 0);
  const provisional = assessed.length < CORE_SKILLS.length || assessed.some((s) => s.evidenceCount < 10);
  // Conservative: the second-weakest skill decides (one weak skill is tolerated, not more).
  const sorted = [...skills].sort((a, b) => idx(a.level) - idx(b.level));
  const pick = sorted[1] ?? sorted[0];
  const overall = pick?.level ?? null;
  const working = overall ? CEFR_LEVELS[Math.min(idx(overall) + 1, 3)] : "A1";
  let label: string;
  if (!db.skill_evidence.length) label = "Noch nicht bewertet";
  else if (!overall) label = `A1 in Arbeit`;
  else if (overall === "B2") label = "B2";
  else label = `${overall} → ${working}`;
  return { overall, working, label, provisional, skills };
}

export const SKILL_LABEL: Record<Skill, { de: string; sq: string }> = {
  grammar: { de: "Grammatik", sq: "Gramatika" },
  vocabulary: { de: "Wortschatz", sq: "Fjalori" },
  reading: { de: "Lesen", sq: "Leximi" },
  listening: { de: "Hören", sq: "Dëgjimi" },
  speaking: { de: "Sprechen", sq: "Të folurit" },
  writing: { de: "Schreiben", sq: "Të shkruarit" },
};
