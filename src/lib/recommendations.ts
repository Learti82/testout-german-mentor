import { GRAMMAR_TOPICS, TOPIC_BY_ID } from "@/content/grammar";
import { computeStatus, needsRevision } from "./grammar-progress";
import { estimateLevel } from "./level";
import { groupMistakes } from "./mistakes";
import { dueQueue } from "./srs";
import type { DB, Recommendation } from "./types";
import { daysBetween } from "./utils";
import { rankWeaknesses, topicAccuracy } from "./weakness";

export function improvements(db: DB, now = new Date()): string[] {
  const out: string[] = [];
  for (const t of GRAMMAR_TOPICS) {
    const ev = db.skill_evidence.filter((e) => e.topicId === t.id);
    const recent = ev.filter((e) => daysBetween(e.at, now) <= 7);
    const before = ev.filter((e) => daysBetween(e.at, now) > 7 && daysBetween(e.at, now) <= 30);
    if (recent.length >= 4 && before.length >= 4) {
      const a = recent.reduce((s, e) => s + e.score, 0) / recent.length;
      const b = before.reduce((s, e) => s + e.score, 0) / before.length;
      if (a - b >= 0.15) out.push(`${t.titleSq}: nga ${Math.round(b * 100)}% në ${Math.round(a * 100)}%`);
    }
  }
  const resolved = db.mistakes.filter((m) => m.resolved && daysBetween(m.lastSeenAt, now) <= 30);
  if (resolved.length) out.push(`${resolved.length} gabime të korrigjuara (nuk i ke përsëritur më)`);
  return out.slice(0, 4);
}

export function nextTopicToLearn(db: DB): { topicId: string; reason: string } | null {
  const known = new Set(db.profile[0]?.knownWeaknesses ?? []);
  const open = GRAMMAR_TOPICS.filter((t) => {
    const s = computeStatus(db, t.id);
    return s === "available" || s === "studied";
  });
  const pick = open.find((t) => known.has(t.id)) ?? open[0];
  if (!pick) return null;
  return {
    topicId: pick.id,
    reason: known.has(pick.id) ? "Është një nga pikat e tua të dobëta dhe nuk e ke provuar ende." : "Tema e radhës në programin mësimor.",
  };
}

export function buildRecommendation(db: DB, now = new Date()): Recommendation {
  const weak = rankWeaknesses(db, now).filter((w) => w.score > 0.5).slice(0, 3);
  const due = dueQueue(db.srs_cards, { now }).length;
  const reviewTopics = GRAMMAR_TOPICS.filter((t) => needsRevision(db, t.id, now))
    .slice(0, 3)
    .map((t) => {
      const { acc } = topicAccuracy(db, t.id, 30, now);
      return { topicId: t.id, reason: acc !== null ? `saktësia e fundit ${Math.round(acc * 100)}%` : "koha për përsëritje" };
    });
  const repeated = groupMistakes(db, now)
    .filter((g) => g.recent >= 2)
    .slice(0, 3)
    .map((g) => ({ label: g.label, count: g.recent, topicId: g.topicId }));
  const practiceToday: string[] = [];
  if (due) practiceToday.push(`Përsërit ${Math.min(due, 15)} fjalë (fjalor)`);
  for (const w of weak) practiceToday.push(`${TOPIC_BY_ID[w.topicId]?.titleSq} — ${w.reasons[0] ?? "ushtrim"}`);
  if (!practiceToday.length) practiceToday.push("Fillo me vlerësimin fillestar ose me një temë të re gramatike");
  practiceToday.push("Një bisedë e shkurtër në gjermanisht (5–10 min)");

  const minutes = db.profile[0]?.dailyMinutes ?? 35;
  const level = estimateLevel(db, now);
  const next = nextTopicToLearn(db);
  const improved = improvements(db, now);

  const parts: string[] = [];
  if (repeated[0]) parts.push(`Gabimi që përsërit më shpesh është te "${repeated[0].label}" (${repeated[0].count}× në 2 javë). Sot do ta ushtrojmë.`);
  else if (weak[0]) parts.push(`Sot fokusi është "${TOPIC_BY_ID[weak[0].topicId]?.titleSq}".`);
  if (improved[0]) parts.push(`Lajm i mirë: ${improved[0]}.`);
  if (level.provisional) parts.push("Niveli yt ende po vlerësohet — sa më shumë ushtron, aq më i saktë bëhet vlerësimi.");

  return {
    practiceToday: practiceToday.slice(0, 5),
    reviewTopics,
    repeatedMistakes: repeated,
    improved,
    nextToLearn: next,
    dailyGoal: `${minutes} minuta: ${due ? `${Math.min(due, 15)} fjalë, ` : ""}${weak[0] ? TOPIC_BY_ID[weak[0].topicId]?.titleSq + ", " : ""}1 bisedë dhe një kuiz i shkurtër.`,
    mentorNote: parts.join(" "),
  };
}
