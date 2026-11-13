"use client";

import { useMemo, useState } from "react";
import { TOPIC_BY_ID } from "@/content/grammar";
import { ConversationPanel } from "@/components/ConversationPanel";
import { useDailyGoal } from "@/components/hooks";
import { useData } from "@/components/providers/DataProvider";
import { Button, Card, CardTitle, PageHeader } from "@/components/ui";
import { buildMentorContext } from "@/lib/memory";
import { rankWeaknesses } from "@/lib/weakness";

export default function MentorPage() {
  const { db, ai, profile } = useData();
  const goal = useDailyGoal();
  const [session, setSession] = useState(0);
  const [injected, setInjected] = useState<{ text: string; id: number } | undefined>();
  const ctx = useMemo(() => buildMentorContext(db), [db]);
  const weak = rankWeaknesses(db).slice(0, 3);
  const top = weak[0] ? TOPIC_BY_ID[weak[0].topicId] : null;

  const opening = {
    german: `Hallo${profile.displayName ? ` ${profile.displayName}` : ""}! Ich bin dein Mentor. ${top ? `Heute üben wir zusammen „${top.title}“.` : "Was möchtest du heute üben?"} Bist du bereit?`,
    albanian: `Përshëndetje! Unë jam mentori yt. ${top ? `Sot ushtrojmë bashkë "${top.titleSq}".` : "Çfarë dëshiron të ushtrosh sot?"} A je gati? ${goal?.recommendation.repeatedMistakes[0] ? `(Kujdes: gabimi yt më i shpeshtë është te "${goal.recommendation.repeatedMistakes[0].label}".)` : ""}`,
  };

  const quick = [
    top ? `Shpjegomë shkurt "${top.titleSq}" dhe më jep një ushtrim.` : "Më jep një ushtrim të shkurtër.",
    "Bëj me mua një drill me pyetje W (një pyetje çdo herë).",
    "Pse gaboj shpesh? Shiko gabimet e mia dhe më jep 3 fjali për t'i korrigjuar.",
    "Ich möchte über meinen Tag sprechen.",
    "Si e them në gjermanisht: 'Do t'Ju telefonoj nesër'?",
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="AI Mentor" sq="Profesori yt personal — pyet, ushtro, fol. Të njeh nga të dhënat e tua të ruajtura.">
        <Button variant="secondary" onClick={() => setSession((s) => s + 1)}>Bisedë e re</Button>
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <ConversationPanel
            key={session}
            mode="mentor"
            scenarioId="mentor"
            title="Mentor"
            level={(ctx.workingLevel as "A1" | "A2" | "B1" | "B2") ?? "A1"}
            scenario={null}
            opening={opening}
            injected={injected}
            autoAudioDefault={false}
          />
        </div>
        <div className="space-y-4">
          <Card>
            <CardTitle sub="Kliko për ta dërguar">Ide të shpejta</CardTitle>
            <div className="flex flex-col gap-2">
              {quick.map((q, i) => (
                <button key={q} type="button" disabled={!ai?.available} onClick={() => setInjected({ text: q, id: Date.now() + i })} className="rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-surface-2 disabled:opacity-50">
                  {q}
                </button>
              ))}
            </div>
          </Card>
          <Card>
            <CardTitle sub="Kujtesa e strukturuar që i dërgohet mentorit">Çfarë di mentori për ty</CardTitle>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-xs text-muted">Niveli</dt><dd>{ctx.level}</dd></div>
              <div>
                <dt className="text-xs text-muted">Temat më të dobëta</dt>
                <dd>{weak.length ? weak.map((w) => TOPIC_BY_ID[w.topicId]?.titleSq).join(", ") : "–"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Gabimet e përsëritura</dt>
                <dd className="space-y-1">{ctx.topMistakes.slice(0, 4).map((m) => <p key={m} className="de text-[13px]">{m}</p>)}{!ctx.topMistakes.length && "–"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Shënimet e mentorit</dt>
                <dd className="space-y-1">{ctx.notes.slice(0, 5).map((n) => <p key={n} className="text-[13px]">• {n}</p>)}{!ctx.notes.length && "–"}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
