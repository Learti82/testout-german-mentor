"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AiSetup } from "@/components/AiSetup";
import { useData, useUpdateProfile } from "@/components/providers/DataProvider";
import { Badge, Button, Card, CardTitle, Notice, PageHeader } from "@/components/ui";
import { TABLE_NAMES } from "@/lib/db/tables";
import { speak, speechRecognitionSupported, ttsSupported } from "@/lib/speech";
import type { DB, Profile } from "@/lib/types";

const input = "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-accent";

export default function SettingsPage() {
  const { profile, db, replaceAll, resetAll, persisted } = useData();
  const update = useUpdateProfile();
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [caps, setCaps] = useState({ tts: false, sr: false });
  const [usage, setUsage] = useState<string | null>(null);

  useEffect(() => {
    setCaps({ tts: ttsSupported(), sr: speechRecognitionSupported() });
    try {
      let bytes = 0;
      for (const k of Object.keys(localStorage)) if (k.startsWith("german-mentor")) bytes += (localStorage.getItem(k) ?? "").length * 2;
      setUsage(`${(bytes / 1024 / 1024).toFixed(2)} MB`);
    } catch {}
  }, [db]);

  function exportData() {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), db }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `deutsch-mentor-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    try {
      localStorage.setItem("german-mentor:last-backup", new Date().toISOString());
    } catch {}
  }

  async function importData(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as { db?: DB };
      if (!parsed.db?.profile) throw new Error("Ky nuk është një skedar rezervë i Deutsch Mentor");
      if (!confirm("Kjo zëvendëson të gjitha të dhënat aktuale me kopjen rezervë. Vazhdo?")) return;
      await replaceAll(parsed.db);
      setMsg("Të dhënat u rikthyen.");
    } catch (e) {
      setMsg(`Importi dështoi: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Einstellungen" sq="Cilësimet" />
      {msg && <Notice tone="info">{msg}</Notice>}

      <Card>
        <CardTitle sub="Pa API, pa pagesë: AI punon në pajisjen tënde.">Mentori AI falas</CardTitle>
        <AiSetup />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Profili dhe mësimi</CardTitle>
          <div className="space-y-4 text-sm">
            <label className="block">
              <span className="mb-1 block text-muted">Emri</span>
              <input className={input} defaultValue={profile.displayName} onBlur={(e) => update({ displayName: e.target.value.trim() })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-muted">Minuta në ditë</span>
              <select className={input} value={profile.dailyMinutes} onChange={(e) => update({ dailyMinutes: Number(e.target.value) })}>
                {[20, 30, 35, 45, 60].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-muted">Përkthimet në shqip</span>
              <select className={input} value={profile.translationMode} onChange={(e) => update({ translationMode: e.target.value as Profile["translationMode"] })}>
                <option value="auto">Automatike — pakësohen me rritjen e nivelit</option>
                <option value="full">Gjithmonë të dukshme</option>
                <option value="partial">Kliko për t'i parë</option>
                <option value="minimal">Minimale (vetëm sipas kërkesës)</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-muted">Shpejtësia e zërit gjerman: {profile.ttsRate.toFixed(2)}</span>
              <div className="flex items-center gap-3">
                <input type="range" min={0.6} max={1.2} step={0.05} value={profile.ttsRate} onChange={(e) => update({ ttsRate: Number(e.target.value) })} className="flex-1 accent-[var(--accent)]" />
                <Button size="sm" variant="secondary" onClick={() => speak("Guten Tag, wie kann ich Ihnen helfen?", { rate: profile.ttsRate })}>Test</Button>
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block text-muted">Pamja</span>
              <select className={input} value={profile.theme} onChange={(e) => update({ theme: e.target.value as Profile["theme"] })}>
                <option value="system">Sipas sistemit</option>
                <option value="light">E çelët</option>
                <option value="dark">E errët</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge tone={caps.tts ? "good" : "warn"}>Zëri (TTS): {caps.tts ? "po" : "jo"}</Badge>
              <Badge tone={caps.sr ? "good" : "warn"}>Mikrofoni: {caps.sr ? "po" : "jo — përdor Chrome/Edge/Safari"}</Badge>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle sub="Gjithçka ruhet vetëm në këtë shfletues — pa bazë të dhënash, pa llogari.">Të dhënat e mia</CardTitle>
          <div className="space-y-3 text-sm">
            <p>
              Përdorimi: <span className="font-medium">{usage ?? "…"}</span> · Ruajtje e përhershme:{" "}
              <Badge tone={persisted ? "good" : "warn"}>{persisted ? "po" : "jo e garantuar"}</Badge>
            </p>
            <Notice tone="warn">
              Nëse fshin "cookies/të dhënat e faqeve" ose përdor dritare private, progresi humbet. Bëj një kopje rezervë herë pas here (p.sh. çdo javë) — mund ta rikthesh edhe në një kompjuter tjetër.
            </Notice>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={exportData}>Ruaj kopje rezervë (JSON)</Button>
              <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-border px-4 font-medium hover:bg-surface-2">
                Rikthe nga kopja
                <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
              </label>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              <Button variant="secondary" onClick={() => { void update({ onboardingCompleted: false }); router.push("/onboarding"); }}>Përsërit vlerësimin fillestar</Button>
              <Button variant="danger" onClick={async () => { if (confirm("Fshi TË GJITHA të dhënat e mësimit? Kjo nuk kthehet mbrapsht.")) { await resetAll(); router.push("/onboarding"); } }}>Fshi gjithçka</Button>
            </div>
            <p className="text-xs text-muted">{TABLE_NAMES.map((t) => `${t}: ${(db[t] as unknown[]).length}`).join(" · ")}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
