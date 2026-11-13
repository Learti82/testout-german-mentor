import { GRAMMAR_TOPICS } from "@/content/grammar";
import { computeStatus, needsRevision, recentTopicMistakes } from "./grammar-progress";
import type { DB } from "./types";
import { daysBetween } from "./utils";

export interface TopicWeakness {
  topicId: string;
  score: number;
  reasons: string[];
  recentAccuracy: number | null;
  recentMistakes: number;
}

export function topicAccuracy(db: DB, topicId: string, days = 30, now = new Date()): { acc: number | null; n: number } {
  const ev = db.skill_evidence.filter((e) => e.topicId === topicId && daysBetween(e.at, now) <= days);
  if (!ev.length) return { acc: null, n: 0 };
  return { acc: ev.reduce((a, e) => a + e.score, 0) / ev.length, n: ev.length };
}

/** Rank unlocked topics by how much attention they need right now. */
export function rankWeaknesses(db: DB, now = new Date()): TopicWeakness[] {
  const profile = db.profile[0];
  const known = new Set(profile?.knownWeaknesses ?? []);
  const out: TopicWeakness[] = [];
  for (const t of GRAMMAR_TOPICS) {
    const status = computeStatus(db, t.id, now);
    if (status === "locked") continue;
    const reasons: string[] = [];
    let score = 0;
    const rm = recentTopicMistakes(db, t.id, 14, now);
    if (rm) {
      score += Math.min(rm, 8) * 1.5;
      reasons.push(`${rm} gabime në 14 ditët e fundit`);
    }
    const { acc, n } = topicAccuracy(db, t.id, 30, now);
    if (acc !== null && n >= 3 && acc < 0.8) {
      score += (1 - acc) * 5;
      reasons.push(`saktësia ${Math.round(acc * 100)}%`);
    }
    if (known.has(t.id) && status !== "demonstrated" && status !== "mastered") {
      score += 1.5;
      reasons.push("pikë e dobët e njohur");
    }
    if (needsRevision(db, t.id, now)) {
      score += 2;
      reasons.push("duhet përsëritur");
    }
    if (status === "available" || status === "studied") score += 0.3;
    out.push({ topicId: t.id, score, reasons, recentAccuracy: acc, recentMistakes: rm });
  }
  return out.sort((a, b) => b.score - a.score);
}
