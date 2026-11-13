"use client";

import Link from "next/link";
import { TOPIC_BY_ID } from "@/content/grammar";
import { BarChart } from "@/components/charts";
import { useDailyGoal, useWeeklyDue } from "@/components/hooks";
import { Icon } from "@/components/icons";
import { useData } from "@/components/providers/DataProvider";
import { Badge, Card, CardTitle, LinkButton, Notice, PageHeader, Progress, Stat } from "@/components/ui";
import { statusCounts } from "@/lib/grammar-progress";
import { estimateLevel, SKILL_LABEL } from "@/lib/level";
import { dueQueue } from "@/lib/srs";
import { minutesToday, speakingSeconds, streak, vocabCounts, weeklySeries } from "@/lib/stats";
import { formatMinutes } from "@/lib/utils";

const BLOCK_HREF: Record<string, string> = {
  vocabulary: "/session?block=vocab",
  grammar: "/session?block=grammar",
  questions: "/session?block=grammar",
  sentences: "/session?block=sentences",
  conversation: "/session?block=conversation",
  quiz: "/session?block=quiz",
};

export default function Dashboard() {
  const { db, profile } = useData();
  const goal = useDailyGoal();
  const weekly = useWeeklyDue();
  const est = estimateLevel(db);
  const vc = vocabCounts(db);
  const gs = statusCounts(db);
  const due = dueQueue(db.srs_cards).length;
  const series = weeklySeries(db, 8);
  const today = minutesToday(db);
  const rec = goal?.recommendation;
  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";

  return (
    <div className="space-y-6">
      <PageHeader title={`${greeting}${profile.displayName ? `, ${profile.displayName}` : ""}!`} sq="Ja çfarë ka përgatitur mentori për ty sot.">
        <LinkButton href="/session">
          Fillo mësimin e sotëm <Icon.arrow />
        </LinkButton>
      </PageHeader>

      {weekly.due && (
        <Notice tone="warn" className="flex flex-wrap items-center justify-between gap-3">
          <span>Kanë kaluar {weekly.daysSince} ditë — është koha për vlerësimin javor.</span>
          <LinkButton href="/assessment" size="sm">Fillo vlerësimin</LinkButton>
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardTitle sub={goal?.generatedBy === "ai" ? "Mentori (AI)" : "Mentori"}>Mesazhi i ditës</CardTitle>
          <p className="text-[15px] leading-relaxed">{goal?.mentorMessage || rec?.mentorNote || "Mirë se erdhe! Fillo me mësimin e sotëm."}</p>
          {rec?.dailyGoal && (
            <p className="mt-4 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent">
              <span className="font-medium">Qëllimi i sotëm:</span> {rec.dailyGoal}
            </p>
          )}
          <div className="mt-5">
            <div className="mb-1 flex justify-between text-xs text-muted">
              <span>Sot: {today} min</span>
              <span>Qëllimi: {goal?.minutesTarget ?? profile.dailyMinutes} min</span>
            </div>
            <Progress value={today / (goal?.minutesTarget ?? profile.dailyMinutes)} />
          </div>
        </Card>

        <Card>
          <CardTitle sub="30–45 minuta, të përshtatura me dobësitë e tua">Plani i sotëm</CardTitle>
          <ol className="space-y-1">
            {goal?.tasks.map((t) => {
              const done = goal.completedTaskIds.includes(t.id);
              return (
                <li key={t.id}>
                  <Link href={BLOCK_HREF[t.block] ?? "/session"} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2">
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs ${done ? "border-good bg-good text-white" : "border-border text-muted"}`}>
                      {done ? <Icon.check width={14} height={14} /> : t.minutes}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm font-medium ${done ? "text-muted line-through" : ""}`}>{t.titleSq}</span>
                      <span className="block truncate text-xs text-muted">{t.reason}</span>
                    </span>
                    <span className="text-xs tabular-nums text-muted">{t.minutes}′</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="p-4"><Stat label="Niveli" value={est.overall ?? "A1"} hint={est.provisional ? "provizor — duhen më shumë të dhëna" : est.label} /></Card>
        <Card className="p-4"><Stat label="Seria" value={`${streak(db)}`} hint="ditë radhazi" /></Card>
        <Card className="p-4"><Stat label="Seanca" value={db.learning_sessions.length} hint="gjithsej" /></Card>
        <Card className="p-4"><Stat label="Fjalë" value={vc.learning + vc.difficult + vc.known + vc.mastered} hint={`${vc.mastered} të zotëruara · ${due} për sot`} /></Card>
        <Card className="p-4"><Stat label="Gramatikë" value={`${gs.demonstrated + gs.mastered}`} hint={`tema të provuara · ${gs.mastered} zotëruar`} /></Card>
        <Card className="p-4"><Stat label="Të folurit" value={formatMinutes(speakingSeconds(db))} hint="kohë praktike" /></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardTitle>Duhet përsëritur</CardTitle>
          {rec?.reviewTopics.length ? (
            <ul className="space-y-2 text-sm">
              {rec.reviewTopics.map((r) => (
                <li key={r.topicId}>
                  <Link href={`/grammar/${r.topicId}`} className="flex justify-between gap-2 hover:underline">
                    <span>{TOPIC_BY_ID[r.topicId]?.titleSq}</span>
                    <span className="text-xs text-muted">{r.reason}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Asnjë temë nuk është e vonuar.</p>
          )}
          {rec?.nextToLearn && (
            <div className="mt-4 border-t border-border pt-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted">Tema e radhës</p>
              <Link href={`/grammar/${rec.nextToLearn.topicId}`} className="font-medium hover:underline">
                {TOPIC_BY_ID[rec.nextToLearn.topicId]?.titleSq}
              </Link>
              <p className="text-xs text-muted">{rec.nextToLearn.reason}</p>
            </div>
          )}
        </Card>
        <Card>
          <CardTitle action={<Link href="/mistakes" className="text-xs text-muted hover:text-text">Të gjitha →</Link>}>Gabime që përsëriten</CardTitle>
          {rec?.repeatedMistakes.length ? (
            <ul className="space-y-2 text-sm">
              {rec.repeatedMistakes.map((m) => (
                <li key={m.label} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate">{m.label}</span>
                  <Badge tone="bad">{m.count}×</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Ende nuk ka gabime të përsëritura. Mentori i regjistron automatikisht.</p>
          )}
          {rec?.improved.length ? (
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-1 text-xs uppercase tracking-wide text-good">Çfarë është përmirësuar</p>
              <ul className="space-y-1 text-sm">{rec.improved.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          ) : null}
        </Card>
        <Card>
          <CardTitle sub="minuta mësimi në javë">8 javët e fundit</CardTitle>
          <BarChart data={series.map((s) => ({ label: s.week.slice(5), value: s.minutes }))} format={(v) => `${v} min`} />
        </Card>
      </div>

      <Card>
        <CardTitle sub="Vlerësim i ndershëm nga rezultatet e tua — jo nga numri i orëve" action={<Link href="/progress" className="text-xs text-muted hover:text-text">Detajet →</Link>}>
          Aftësitë
        </CardTitle>
        <div className="grid gap-4 sm:grid-cols-5">
          {est.skills.map((s) => (
            <div key={s.skill}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span>{SKILL_LABEL[s.skill].sq}</span>
                <span className="font-medium">{s.level ?? "–"}</span>
              </div>
              <Progress value={s.progress} tone={s.evidenceCount ? "accent" : "warn"} />
              <p className="mt-1 text-xs text-muted">
                {s.evidenceCount ? `drejt ${s.working}: ${Math.round(s.progress * 100)}%` : "pa të dhëna ende"}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
