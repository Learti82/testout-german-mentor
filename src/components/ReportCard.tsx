"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import type { WeeklyAssessment } from "@/lib/types";
import { pct } from "@/lib/utils";

export const SECTION_LABEL: Record<string, string> = {
  vocabulary: "Fjalori",
  grammar: "Gramatika",
  sentences: "Fjalitë",
  questions: "Pyetjet",
  reading: "Leximi",
  listening: "Dëgjimi",
  speaking: "Të folurit",
};

export function ReportCard({ r, prev, defaultOpen }: { r: WeeklyAssessment; prev?: WeeklyAssessment; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <Card>
      <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setOpen(!open)}>
        <span>
          <span className="font-medium">Java nga {r.weekStart}</span>
          <span className="ml-3 text-sm text-muted">Rezultati {Math.round(r.overall * 100)}% · Niveli {r.estimatedLevel}</span>
        </span>
        <span className="text-sm text-muted">{open ? "Mbyll" : "Hap"}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-7">
            {Object.entries(r.sectionScores).map(([k, v]) => {
              const pv = prev?.sectionScores[k as keyof typeof r.sectionScores];
              const delta = v !== null && pv !== null && pv !== undefined ? v - pv : null;
              return (
                <div key={k} className="rounded-lg bg-surface-2 p-2.5">
                  <p className="text-xs text-muted">{SECTION_LABEL[k] ?? k}</p>
                  <p className="font-semibold tabular-nums">{pct(v)}</p>
                  {delta !== null && <p className={`text-xs ${delta >= 0 ? "text-good" : "text-bad"}`}>{delta >= 0 ? "+" : ""}{Math.round(delta * 100)}</p>}
                </div>
              );
            })}
          </div>
          {r.report.narrative && <p className="leading-relaxed">{r.report.narrative}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            <List title="Çfarë mësove" items={r.report.learned} />
            <List title="Çfarë kupton mirë" items={r.report.strengths} tone="good" />
            <List title="Çfarë të vështirëson ende" items={r.report.struggles} tone="bad" />
            <List title="Gabimet më të shpeshta" items={r.report.frequentMistakes.map((m) => `${m.label} (${m.count}×)`)} />
          </div>
          <p><span className="font-medium">Krahasimi:</span> {r.report.comparison}</p>
          <List title="Plani për javën e ardhshme" items={r.report.nextWeekPlan} />
        </div>
      )}
    </Card>
  );
}

function List({ title, items, tone }: { title: string; items: string[]; tone?: "good" | "bad" }) {
  return (
    <div>
      <p className={`mb-1 font-medium ${tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : ""}`}>{title}</p>
      {items.length ? <ul className="list-disc space-y-0.5 pl-5 text-muted">{items.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p className="text-muted">–</p>}
    </div>
  );
}

