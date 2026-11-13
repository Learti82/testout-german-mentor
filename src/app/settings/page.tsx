"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useData, useUpdateProfile } from "@/components/providers/DataProvider";
import { Badge, Button, Card, CardTitle, Notice, PageHeader } from "@/components/ui";
import { MODEL_KEY, PASSCODE_KEY } from "@/lib/ai/client";
import { LocalStore } from "@/lib/db/local-store";
import { SupabaseStore } from "@/lib/db/supabase-store";
import { TABLE_NAMES } from "@/lib/db/tables";
import { speak, speechRecognitionSupported, ttsSupported } from "@/lib/speech";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import type { DB, Profile, TableName } from "@/lib/types";

const input = "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-accent";

export default function SettingsPage() {
  const { profile, ai, refreshAi, db, mode, session, replaceAll, resetAll } = useData();
  const update = useUpdateProfile();
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [model, setModel] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [caps, setCaps] = useState({ tts: false, sr: false });

  useEffect(() => {
    try {
      setPasscode(localStorage.getItem(PASSCODE_KEY) ?? "");
      setModel(localStorage.getItem(MODEL_KEY) ?? "");
    } catch {}
    setCaps({ tts: ttsSupported(), sr: speechRecognitionSupported() });
  }, []);

  function exportData() {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), db }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `german-mentor-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importData(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as { db?: DB };
      if (!parsed.db?.profile) throw new Error("Not a German Mentor backup file");
      if (!confirm("Kjo zëvendëson të gjitha të dhënat aktuale me kopjen rezervë. Vazhdo?")) return;
      await replaceAll(parsed.db);
      setMsg("Të dhënat u importuan.");
    } catch (e) {
      setMsg(`Importi dështoi: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Einstellungen" sq="Cilësimet" />
      {msg && <Notice tone="info">{msg}</Notice>}

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
              <Badge tone={caps.sr ? "good" : "warn"}>Mikrofoni (njohja e zërit): {caps.sr ? "po" : "jo — përdor Chrome/Edge/Safari"}</Badge>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle sub="Çelësat API ruhen vetëm në server (variabla mjedisi), kurrë në shfletues.">Mentori AI</CardTitle>
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={ai?.available ? "good" : "warn"}>{ai?.available ? "aktiv" : "jo i konfiguruar"}</Badge>
              {ai?.available && <span className="text-muted">{ai.provider} · {ai.model}</span>}
              <Button size="sm" variant="ghost" onClick={refreshAi}>Rifresko</Button>
            </div>
            {!ai?.available && (
              <Notice tone="info">
                Vendos <code>ANTHROPIC_API_KEY</code> (ose <code>OPENAI_COMPATIBLE_BASE_URL</code>) në <code>.env.local</code> / në serverin e hostimit dhe rinis aplikacionin. Shiko README. Pa AI funksionojnë: gramatika, fjalori, pyetjet, frazat, gabimet, progresi dhe skenarët e paracaktuar.
              </Notice>
            )}
            {ai?.passcodeRequired && (
              <label className="block">
                <span className="mb-1 block text-muted">Kodi i aksesit (APP_PASSCODE)</span>
                <input type="password" className={input} value={passcode} onChange={(e) => setPasscode(e.target.value)} onBlur={() => { try { localStorage.setItem(PASSCODE_KEY, passcode); } catch {} }} />
              </label>
            )}
            {ai?.allowModelOverride && (
              <label className="block">
                <span className="mb-1 block text-muted">Modeli (bosh = parazgjedhja e serverit)</span>
                <input
                  className={input}
                  placeholder={ai?.model}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  onBlur={() => {
                    try {
                      if (model.trim()) localStorage.setItem(MODEL_KEY, model.trim());
                      else localStorage.removeItem(MODEL_KEY);
                    } catch {}
                    void update({ aiModelOverride: model.trim() });
                  }}
                />
              </label>
            )}
          </div>
        </Card>

        <AccountCard />

        <Card>
          <CardTitle sub={`Ruajtja: ${mode === "supabase" ? "Supabase (cloud)" : "vetëm në këtë shfletues"}`}>Të dhënat</CardTitle>
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={exportData}>Eksporto (JSON)</Button>
              <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-border px-4 font-medium hover:bg-surface-2">
                Importo
                <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
              </label>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              <Button variant="secondary" onClick={() => { void update({ onboardingCompleted: false }); router.push("/onboarding"); }}>Përsërit vlerësimin fillestar</Button>
              <Button variant="danger" onClick={async () => { if (confirm("Fshi TË GJITHA të dhënat e mësimit? Kjo nuk kthehet mbrapsht.")) { await resetAll(); router.push("/onboarding"); } }}>Fshi gjithçka</Button>
            </div>
            <p className="text-xs text-muted">{TABLE_NAMES.map((t) => `${t}: ${(db[t] as unknown[]).length}`).join(" · ")}</p>
            {session && <p className="text-xs text-muted">I identifikuar si {session.user.email}</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function AccountCard() {
  const { session, mode, reload } = useData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const sb = getSupabase();

  if (!supabaseConfigured || !sb) {
    return (
      <Card>
        <CardTitle>Llogaria (Supabase)</CardTitle>
        <p className="text-sm text-muted">
          Supabase nuk është konfiguruar. Të dhënat ruhen në këtë shfletues. Për ruajtje të përhershme në cloud dhe në disa pajisje, vendos <code>NEXT_PUBLIC_SUPABASE_URL</code> dhe <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dhe ekzekuto migrimin SQL (shiko README).
        </p>
      </Card>
    );
  }

  async function auth(kind: "in" | "up") {
    setBusy(true);
    setMsg(null);
    const { error } = kind === "in" ? await sb!.auth.signInWithPassword({ email, password }) : await sb!.auth.signUp({ email, password });
    setBusy(false);
    if (error) setMsg(error.message);
    else if (kind === "up") setMsg("Llogaria u krijua. Nëse kërkohet, konfirmo email-in, pastaj hyr.");
  }

  async function uploadLocal() {
    if (!confirm("Ngarko të dhënat e këtij shfletuesi në llogarinë cloud? Rreshtat me të njëjtin ID mbishkruhen.")) return;
    setBusy(true);
    try {
      const local = await new LocalStore().loadAll();
      const remote = new SupabaseStore(sb!);
      for (const t of TABLE_NAMES) {
        const rows = (local[t] as object[]) ?? [];
        if (rows.length) await remote.upsert(t as TableName, rows);
      }
      await reload();
      setMsg("Të dhënat lokale u ngarkuan.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardTitle sub="Vetëm për përdorimin tënd personal — të dhënat mbrohen me Row Level Security.">Llogaria (Supabase)</CardTitle>
      {session ? (
        <div className="space-y-3 text-sm">
          <p>I identifikuar: <span className="font-medium">{session.user.email}</span> · ruajtja: {mode}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={busy} onClick={uploadLocal}>Ngarko të dhënat e shfletuesit</Button>
            <Button variant="ghost" onClick={() => sb.auth.signOut()}>Dil</Button>
          </div>
        </div>
      ) : (
        <form className="space-y-3 text-sm" onSubmit={(e) => { e.preventDefault(); void auth("in"); }}>
          <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <input className={input} type="password" placeholder="Fjalëkalimi" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || !email || !password}>Hyr</Button>
            <Button type="button" variant="secondary" disabled={busy || !email || password.length < 6} onClick={() => auth("up")}>Krijo llogari</Button>
          </div>
        </form>
      )}
      {msg && <p className="mt-3 text-sm text-muted">{msg}</p>}
    </Card>
  );
}
