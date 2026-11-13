"use client";

import { Card, CardTitle } from "@/components/ui";
import type { StudyPlan } from "@/lib/types";

export function PlanCard({ plan }: { plan: StudyPlan }) {
  return (
    <Card>
      <CardTitle sub={plan.generatedBy === "ai" ? "Krijuar nga mentori (AI)" : "Krijuar nga analiza e rezultateve"}>Plani yt 7-ditor</CardTitle>
      <p className="mb-4 text-sm text-muted">{plan.rationale}</p>
      <ol className="space-y-2">
        {plan.days.map((d) => (
          <li key={d.day} className="grid grid-cols-[auto_1fr] gap-3 rounded-lg border border-border p-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-sm font-medium">{d.day}</span>
            <div>
              <p className="text-sm font-medium">{d.focusSq}</p>
              <p className="text-xs text-muted">{d.tasks.join(" · ")}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
