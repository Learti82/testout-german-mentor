"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { useData } from "@/components/providers/DataProvider";
import { Notice, Spinner } from "@/components/ui";
import { estimateLevel } from "@/lib/level";
import { streak } from "@/lib/stats";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", sq: "Paneli", icon: Icon.dashboard },
  { href: "/mentor", label: "AI Mentor", sq: "Mentori", icon: Icon.mentor },
  { href: "/speaking", label: "Sprechen", sq: "Të folurit", icon: Icon.mic },
  { href: "/grammar", label: "Grammatik", sq: "Gramatika", icon: Icon.grammar },
  { href: "/vocabulary", label: "Wortschatz", sq: "Fjalori", icon: Icon.vocab },
  { href: "/questions", label: "Fragen-Trainer", sq: "Pyetjet", icon: Icon.question },
  { href: "/callcenter", label: "Callcenter", sq: "Call center", icon: Icon.headset },
  { href: "/mistakes", label: "Meine Fehler", sq: "Gabimet e mia", icon: Icon.mistakes },
  { href: "/progress", label: "Fortschritt", sq: "Progresi & raportet", icon: Icon.chart },
  { href: "/settings", label: "Einstellungen", sq: "Cilësimet", icon: Icon.settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((n) => {
        const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors",
              active ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-surface-2 hover:text-text",
            )}
          >
            <n.icon />
            <span className="flex-1">{n.label}</span>
            <span className="hidden text-[11px] opacity-70 xl:inline">{n.sq}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, db, profile, error, mode, ai } = useData();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ready && db.profile.length && !profile.onboardingCompleted && !path.startsWith("/onboarding") && !path.startsWith("/settings")) {
      router.replace("/onboarding");
    }
  }, [ready, db.profile.length, profile.onboardingCompleted, path, router]);

  const est = ready ? estimateLevel(db) : null;
  const days = ready ? streak(db) : 0;

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/" className="flex items-center gap-2.5 px-2 pt-1">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent font-serif text-[17px] font-semibold text-accent-fg">D</span>
        <span className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight">Deutsch Mentor</span>
          <span className="block text-xs text-muted">Profesori yt personal</span>
        </span>
      </Link>
      <Link
        href="/session"
        onClick={() => setOpen(false)}
        className="flex items-center justify-between rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-accent-fg hover:opacity-90"
      >
        Heutige Lektion <Icon.arrow />
      </Link>
      <NavLinks onNavigate={() => setOpen(false)} />
      <div className="mt-auto space-y-2 rounded-lg border border-border p-3 text-xs text-muted">
        <div className="flex justify-between">
          <span>Niveau</span>
          <span className="font-medium text-text">{est?.label ?? "…"}</span>
        </div>
        <div className="flex justify-between">
          <span>Serie</span>
          <span className="font-medium text-text">{days} {days === 1 ? "Tag" : "Tage"}</span>
        </div>
        <div className="flex justify-between">
          <span>Speicher</span>
          <span className="font-medium text-text">{mode === "supabase" ? "Cloud" : "Browser"}</span>
        </div>
        <div className="flex justify-between">
          <span>KI</span>
          <span className={cn("font-medium", ai?.available ? "text-good" : "text-warn")}>{ai ? (ai.available ? "aktiv" : "offline") : "…"}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="sticky top-0 hidden h-dvh border-r border-border bg-surface lg:block">{sidebar}</aside>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/" className="font-semibold tracking-tight">Deutsch Mentor</Link>
        <button type="button" onClick={() => setOpen(true)} className="rounded-md p-2 hover:bg-surface-2" aria-label="Open menu">
          <Icon.menu />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] overflow-y-auto border-r border-border bg-surface">{sidebar}</aside>
        </div>
      )}
      <main className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {error && (
          <Notice tone="bad" className="mb-4">
            {error}
          </Notice>
        )}
        {ready ? children : (
          <div className="flex items-center gap-3 py-20 text-muted">
            <Spinner /> Lade deine Lerndaten …
          </div>
        )}
      </main>
    </div>
  );
}
