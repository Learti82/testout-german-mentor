"use client";

import Link from "next/link";
import { GRAMMAR_TOPICS } from "@/content/grammar";
import { ReportCard } from "@/components/ReportCard";
import { BarChart, LineChart } from "@/components/charts";
import { useWeeklyDue } from "@/components/hooks";
import { PlanCard } from "@/components/PlanCard";
import { useData } from "@/components/providers/DataProvider";
import { Badge, Card, CardTitle, LinkButton, PageHeader, Progress, Stat } from "@/components/ui";
import { STATUS_LABEL, computeStatus, needsRevision, statusCounts } from "@/lib/grammar-progress";
import { SKILL_LABEL, estimateLevel } from "@/lib/level";
import { groupMistakes } from "@/lib/mistakes";
import { speakingSeconds, streak, vocabCounts, weeklySeries } from "@/lib/stats";
import type { GrammarStatus } from "@/lib/types";
import { formatMinutes, pct } from "@/lib/utils";


export default function ProgressPage() {
  const { db } = useData();
  const est = estimateLevel(db);
  const gs = statusCounts(db);
  const vc = vocabCounts(db);
  const series = weeklySeries(db, 10);
  const weekly = useWeeklyDue();
  const revision = GRAMMAR_TOPICS.filter((t) => needsRevision(db, t.id));
  const scored = db.learning_sessions.filter((s) => s.score !== null && s.itemsTotal >= 3).sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 12);
  const reports = [...db.weekly_assessments].sort((a, b) => b.takenAt.localeCompare(a.takenAt));
  const plan = [...db.study_plans].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const groups = groupMistakes(db).slice(0, 6);
  const ladder: GrammarStatus[] = ["studied", "practiced", "demonstrated", "mastered"];

  return (
    <div className="space-y-6">
      <PageHeader title="Fortschritt & Berichte" sq="Pasqyrë e ndershme — niveli llogaritet nga rezultatet, jo nga koha e kaluar.">
        <LinkButton href="/assessment" variant={weekly.due ? "primary" : "secondary"}>Vlerësimi javor{weekly.due ? " (i radhës)" : ""}</LinkButton>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardTitle sub={est.provisional ? "Provizor: disa aftësi kanë ende pak të dhëna" : "Bazuar në 120 ditët e fundit"}>Niveli CEFR i vlerësuar</CardTitle>
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-semibold tracking-tight">{est.overall ?? "A1"}</span>
            <span className="text-muted">{est.overall ? `→ duke punuar për ${est.working}` : "A1 ende në proces"}</span>
          </div>
          <p className="mt-3 text-sm text-muted">
            Një nivel quhet i arritur për një aftësi vetëm me mjaft ushtrime NË atë nivel dhe ≥70% saktësi. Niveli i përgjithshëm përcaktohet nga aftësia e dytë më e dobët — pra nuk fryhet nga një aftësi e fortë.
          </p>
        </Card>
        <Card>
          <CardTitle>Sipas aftësisë</CardTitle>
          <div className="space-y-3">
            {est.skills.map((s) => (
              <div key={s.skill} className="grid grid-cols-[110px_50px_1fr_120px] items-center gap-3 text-sm">
                <span>{SKILL_LABEL[s.skill].sq}</span>
                <span className="font-medium">{s.level ?? "–"}</span>
                <Progress value={s.progress} tone={s.evidenceCount ? "accent" : "warn"} />
                <span className="text-right text-xs text-muted">{s.evidenceCount} ushtr. · {pct(s.accuracy)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4"><Stat label="Seria" value={`${streak(db)} ditë`} /></Card>
        <Card className="p-4"><Stat label="Seanca" value={db.learning_sessions.length} /></Card>
        <Card className="p-4"><Stat label="Të folurit" value={formatMinutes(speakingSeconds(db))} /></Card>
        <Card className="p-4"><Stat label="Gabime aktive" value={db.mistakes.filter((m) => !m.resolved).length} hint={`${db.mistakes.filter((m) => m.resolved).length} të zgjidhura`} /></Card>
      </div>

      <Card>
        <CardTitle sub="Dallimi mes 'e kam parë' dhe 'e di'">Studiuar → Ushtruar → Provuar → Zotëruar</CardTitle>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Gramatika ({GRAMMAR_TOPICS.length} tema)</p>
            <div className="grid grid-cols-4 gap-2">
              {ladder.map((s) => (
                <div key={s} className="rounded-lg bg-surface-2 p-3 text-center">
                  <p className="text-2xl font-semibold tabular-nums">{gs[s]}</p>
                  <p className="text-xs text-muted">{STATUS_LABEL[s].sq}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Fjalori ({db.vocabulary.length} fjalë)</p>
            <div className="grid grid-cols-4 gap-2">
              {([["Parë", vc.new], ["Në mësim", vc.learning + vc.difficult], ["Njohur", vc.known], ["Zotëruar", vc.mastered]] as [string, number][]).map(([l, v]) => (
                <div key={l} className="rounded-lg bg-surface-2 p-3 text-center">
                  <p className="text-2xl font-semibold tabular-nums">{v}</p>
                  <p className="text-xs text-muted">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card><CardTitle sub="minuta në javë">Koha e mësimit</CardTitle><BarChart data={series.map((s) => ({ label: s.week.slice(5), value: s.minutes }))} format={(v) => `${v} min`} /></Card>
        <Card><CardTitle sub="saktësia mesatare e ushtrimeve në javë">Saktësia</CardTitle><LineChart data={series.map((s) => ({ label: s.week.slice(5), value: s.accuracy }))} /></Card>
        <Card><CardTitle sub="gabime të regjistruara në javë">Gabimet</CardTitle><BarChart data={series.map((s) => ({ label: s.week.slice(5), value: s.mistakes }))} tone="var(--bad)" /></Card>
        <Card><CardTitle sub="fjalë të reja në javë">Fjalori</CardTitle><BarChart data={series.map((s) => ({ label: s.week.slice(5), value: s.wordsAdded }))} tone="var(--info)" /></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardTitle>Tema që duhen përsëritur</CardTitle>
          {revision.length ? (
            <ul className="space-y-2 text-sm">
              {revision.map((t) => (
                <li key={t.id} className="flex justify-between gap-2">
                  <Link href={`/grammar/${t.id}`} className="hover:underline">{t.titleSq}</Link>
                  <Badge>{STATUS_LABEL[computeStatus(db, t.id)].sq}</Badge>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">Asnjë.</p>}
        </Card>
        <Card>
          <CardTitle>Gabimet që përsëriten</CardTitle>
          {groups.length ? (
            <ul className="space-y-2 text-sm">
              {groups.map((g) => (
                <li key={g.key} className="flex justify-between gap-2"><span className="truncate">{g.label}</span><Badge tone="bad">{g.total}×</Badge></li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">Asnjë ende.</p>}
        </Card>
        <Card>
          <CardTitle>Rezultatet e fundit</CardTitle>
          {scored.length ? (
            <ul className="space-y-2 text-sm">
              {scored.map((s) => (
                <li key={s.id} className="flex justify-between gap-2">
                  <span className="truncate">{s.summary || s.type} <span className="text-xs text-muted">{s.startedAt.slice(5, 10)}</span></span>
                  <Badge tone={(s.score ?? 0) >= 0.8 ? "good" : (s.score ?? 0) >= 0.6 ? "warn" : "bad"}>{pct(s.score)}</Badge>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">Ende asnjë.</p>}
        </Card>
      </div>

      {plan && <PlanCard plan={plan} />}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Raportet javore</h2>
        {reports.length ? reports.map((r, i) => <ReportCard key={r.id} r={r} prev={reports[i + 1]} defaultOpen={i === 0} />) : <p className="text-sm text-muted">Raporti i parë krijohet pas vlerësimit javor (7 ditë pas vlerësimit fillestar).</p>}
      </section>
    </div>
  );
}
