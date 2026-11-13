"use client";

import Link from "next/link";
import { topicsByLevel } from "@/content/grammar";
import { Icon } from "@/components/icons";
import { useData } from "@/components/providers/DataProvider";
import { Badge, Card, PageHeader, Progress } from "@/components/ui";
import { STATUS_LABEL, STATUS_TONE as statusTone, computeStatus, levelUnlockProgress, needsRevision, unlockedLevels } from "@/lib/grammar-progress";
import { CEFR_LEVELS, type GrammarStatus } from "@/lib/types";
import { cn } from "@/lib/utils";


export default function GrammarPage() {
  const { db } = useData();
  const open = unlockedLevels(db);
  return (
    <div className="space-y-8">
      <PageHeader title="Grammatik-Akademie" sq="Nga A1 deri B2. Niveli tjetër hapet vetëm kur ke provuar se e kupton nivelin aktual (60% e temave me test ≥ 80%)." />
      <div className="flex flex-wrap gap-2 text-xs">
        {(["studied", "practiced", "demonstrated", "mastered"] as GrammarStatus[]).map((s) => (
          <Badge key={s} tone={statusTone[s]}>{STATUS_LABEL[s].sq}</Badge>
        ))}
        <span className="self-center text-muted">E studiuar = lexove mësimin · E ushtruar = ≥5 ushtrime · E provuar = test ≥80% · E zotëruar = e provuar sërish pas disa ditësh</span>
      </div>
      {CEFR_LEVELS.map((level) => {
        const topics = topicsByLevel(level);
        const unlocked = open.includes(level);
        const up = levelUnlockProgress(db, level);
        return (
          <section key={level} className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{level}</h2>
                {!unlocked && <Badge><Icon.lock width={12} height={12} className="mr-1" /> e kyçur</Badge>}
              </div>
              <div className="w-56">
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span>Të provuara</span>
                  <span className="tabular-nums">{up.demonstrated}/{up.total}</span>
                </div>
                <Progress value={up.demonstrated / up.total} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((t) => {
                const st = computeStatus(db, t.id);
                const rev = needsRevision(db, t.id);
                const content = (
                  <Card className={cn("h-full transition-colors", unlocked ? "hover:border-accent" : "opacity-60")}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge tone={statusTone[st]}>{STATUS_LABEL[st].sq}</Badge>
                      {rev && <Badge tone="bad">përsërit</Badge>}
                    </div>
                    <p className="font-medium">{t.titleSq}</p>
                    <p className="de text-sm text-muted">{t.title}</p>
                    <p className="mt-2 text-sm text-muted">{t.summarySq}</p>
                  </Card>
                );
                return unlocked ? (
                  <Link key={t.id} href={`/grammar/${t.id}`}>{content}</Link>
                ) : (
                  <div key={t.id} title="Hapet kur ke provuar nivelin e mëparshëm">{content}</div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
