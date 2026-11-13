import { TOPIC_BY_ID } from "@/content/grammar";
import { SPEAKING_SCENARIOS } from "@/content/scenarios";
import { buildRecommendation } from "./recommendations";
import { estimateLevel } from "./level";
import { dueQueue } from "./srs";
import type { CEFR, DailyGoal, DB, PlanTask, StudyPlan } from "./types";
import { CEFR_LEVELS } from "./types";
import { addDays, daysBetween, localDate, nowIso, uid } from "./utils";
import { rankWeaknesses } from "./weakness";

const lvl = (l: CEFR) => CEFR_LEVELS.indexOf(l);

export function chooseScenario(db: DB, working: CEFR, now = new Date()): string {
  const lastUsed = new Map<string, string>();
  for (const c of db.conversations) if (c.mode === "speaking" || c.mode === "daily") lastUsed.set(c.scenarioId, c.updatedAt);
  const fit = SPEAKING_SCENARIOS.filter((s) => lvl(s.level) <= Math.max(lvl(working), 1));
  const sorted = [...fit].sort((a, b) => (lastUsed.get(a.id) ?? "").localeCompare(lastUsed.get(b.id) ?? ""));
  return (sorted[0] ?? SPEAKING_SCENARIOS[0]).id;
}

/** Build today's personalised 30–45 minute session. Time is shifted toward the biggest weakness. */
export function buildDailyGoal(db: DB, now = new Date()): DailyGoal {
  const profile = db.profile[0];
  const total = Math.min(60, Math.max(15, profile?.dailyMinutes ?? 35));
  const weak = rankWeaknesses(db, now);
  const top = weak[0];
  const second = weak[1];
  const level = estimateLevel(db, now);
  const due = dueQueue(db.srs_cards, { now }).length;
  const recentMistakes = db.mistakes.filter((m) => !m.resolved && daysBetween(m.lastSeenAt, now) <= 21).length;

  // base split (minutes) for a 35-minute session: 5 / 10 / 10 / 10 / 5 (scaled)
  const f = total / 40;
  let vocab = Math.round(5 * f);
  let grammar = Math.round(10 * f);
  let sentences = Math.round(10 * f);
  let conversation = Math.round(10 * f);
  const quiz = Math.max(3, Math.round(5 * f));
  if (top && top.score >= 5) {
    grammar += 3;
    conversation -= 3;
  }
  if (due > 20) {
    vocab += 2;
    sentences -= 2;
  }
  if (due === 0) {
    grammar += vocab - 2;
    vocab = 2;
  }

  const grammarTopic = top?.topicId ?? "a1-questions";
  const isQuestions = grammarTopic === "a1-questions";
  const scenarioId = chooseScenario(db, level.working, now);
  const tasks: PlanTask[] = [
    {
      id: "vocab",
      block: "vocabulary",
      title: "Wortschatz wiederholen",
      titleSq: "Përsëritja e fjalorit",
      minutes: vocab,
      reason: due ? `${due} fjalë për përsëritje sot` : "Asnjë fjalë e vonuar — shkurt dhe shpejt",
    },
    {
      id: "grammar",
      block: isQuestions ? "questions" : "grammar",
      title: TOPIC_BY_ID[grammarTopic]?.title ?? "Grammatik",
      titleSq: TOPIC_BY_ID[grammarTopic]?.titleSq ?? "Gramatika",
      minutes: grammar,
      topicId: grammarTopic,
      reason: top?.reasons.join(", ") || "Tema e radhës",
    },
    {
      id: "sentences",
      block: "sentences",
      title: "Sätze bauen",
      titleSq: "Ndërtimi i fjalive",
      minutes: sentences,
      topicId: second?.topicId,
      reason: recentMistakes ? `Përfshin ${Math.min(recentMistakes, 3)} gabime të tua të mëparshme` : "Fjali me temat e tua të dobëta",
    },
    {
      id: "conversation",
      block: "conversation",
      title: "Gespräch",
      titleSq: "Bisedë",
      minutes: Math.max(5, conversation),
      scenarioId,
      reason: "Të folurit është prioriteti — përgjigju me fjali të plota",
    },
    { id: "quiz", block: "quiz", title: "Quiz", titleSq: "Kuizi dhe vlerësimi", minutes: quiz, reason: "Kontrollojmë çfarë mbete sot" },
  ];
  const rec = buildRecommendation(db, now);
  return {
    id: localDate(now),
    date: localDate(now),
    tasks,
    completedTaskIds: [],
    minutesTarget: tasks.reduce((a, t) => a + t.minutes, 0),
    recommendation: rec,
    mentorMessage: rec.mentorNote,
    generatedBy: "rules",
    createdAt: nowIso(),
  };
}

/** A 7-day plan after placement (and refreshed after each weekly assessment). */
export function buildStudyPlan(db: DB, now = new Date()): StudyPlan {
  const weak = rankWeaknesses(db, now).slice(0, 5);
  const topics = weak.length ? weak.map((w) => w.topicId) : ["a1-questions", "a1-sein-haben", "a2-connectors"];
  const t = (i: number) => topics[i % topics.length];
  const title = (id: string) => TOPIC_BY_ID[id]?.titleSq ?? id;
  const days = [
    { focus: title(t(0)), topicIds: [t(0)], tasks: ["Mësimi + ushtrime", "Question Trainer (10 min)", "Bisedë: Prezantimi"] },
    { focus: title(t(1)), topicIds: [t(1)], tasks: ["Mësimi + ushtrime", "Fjalor: 10 fjalë", "Call Center: frazat bazë"] },
    { focus: title(t(2)), topicIds: [t(2)], tasks: ["Mësimi + ushtrime", "Ndërtim fjalish me 'weil' dhe 'deshalb'", "Bisedë: Puna"] },
    { focus: `Përsëritje: ${title(t(0))}`, topicIds: [t(0)], tasks: ["Testi i temës", "Gabimet e mia", "Bisedë: Hobet"] },
    { focus: title(t(3)), topicIds: [t(3)], tasks: ["Mësimi + ushtrime", "Fjalor: përsëritje", "Call Center: porosia nuk ka arritur"] },
    { focus: `Përsëritje: ${title(t(1))} + ${title(t(4))}`, topicIds: [t(1), t(4)], tasks: ["Testet e temave", "Question Trainer", "Bisedë: Takim"] },
    { focus: "Vlerësimi javor", topicIds: [], tasks: ["Vlerësimi javor (20–30 min)", "Raporti dhe plani i ri"] },
  ];
  return {
    id: uid(),
    createdAt: nowIso(),
    startsOn: localDate(now),
    days: days.map((d, i) => ({
      day: i + 1,
      date: localDate(addDays(now, i)),
      focus: d.focus,
      focusSq: d.focus,
      topicIds: d.topicIds,
      tasks: d.tasks,
    })),
    rationale:
      "Plani fillon me temat ku vlerësimi dhe gabimet tregojnë më shumë vështirësi. Çdo temë rikthehet pas 2–3 ditësh (përsëritje e shpërndarë), dhe çdo ditë përfshin të folur.",
    generatedBy: "rules",
  };
}
