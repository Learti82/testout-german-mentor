"use client";

import { useEffect, useRef } from "react";
import { useData } from "@/components/providers/DataProvider";
import { ai } from "@/lib/ai/client";
import { buildMentorContext } from "@/lib/memory";
import { buildDailyGoal } from "@/lib/session-plan";
import type { DailyGoal } from "@/lib/types";
import { daysBetween, localDate } from "@/lib/utils";

/** Today's plan + mentor recommendation. Created once per day; enriched by the AI when available. */
export function useDailyGoal(): DailyGoal | null {
  const { db, commit, ready, ai: aiStatus, profile } = useData();
  const today = localDate();
  const existing = db.daily_goals.find((g) => g.id === today) ?? null;
  const creating = useRef(false);
  const enriching = useRef(false);

  useEffect(() => {
    if (!ready || existing || creating.current || !profile.onboardingCompleted) return;
    creating.current = true;
    void commit({ daily_goals: [buildDailyGoal(db)] });
  }, [ready, existing, db, commit, profile.onboardingCompleted]);

  useEffect(() => {
    if (!existing || existing.generatedBy === "ai" || !aiStatus?.available || !aiStatus.warm || enriching.current) return;
    enriching.current = true;
    ai.briefing({ context: buildMentorContext(db), analysis: { recommendation: existing.recommendation, tasks: existing.tasks } })
      .then((b) => commit({ daily_goals: [{ ...existing, mentorMessage: b.messageSq, generatedBy: "ai" }] }))
      .catch(() => {});
  }, [existing, aiStatus?.available, aiStatus?.warm, db, commit]);

  return existing;
}

export function useCompleteTask() {
  const { db, commit } = useData();
  return (taskId: string) => {
    const g = db.daily_goals.find((x) => x.id === localDate());
    if (!g || g.completedTaskIds.includes(taskId)) return;
    void commit({ daily_goals: [{ ...g, completedTaskIds: [...g.completedTaskIds, taskId] }] });
  };
}

export function useWeeklyDue(): { due: boolean; daysSince: number | null } {
  const { db, profile } = useData();
  const last = [...db.weekly_assessments].sort((a, b) => b.takenAt.localeCompare(a.takenAt))[0];
  const ref = last?.takenAt ?? profile.placementCompletedAt;
  if (!ref) return { due: false, daysSince: null };
  const d = daysBetween(ref, new Date());
  return { due: d >= 7, daysSince: d };
}
