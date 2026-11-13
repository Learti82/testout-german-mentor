import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Protects the AI routes (they spend money on the API key):
 * - APP_PASSCODE set → requests must send header `x-app-passcode` (or a valid Supabase session).
 * - Supabase configured and AI_REQUIRE_LOGIN=true → a valid Supabase access token is required.
 * - ALLOWED_EMAILS (comma separated) → only these signed-in users may use AI.
 */
export async function checkAccess(req: Request): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const passcode = process.env.APP_PASSCODE;
  const allowed = (process.env.ALLOWED_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const requireLogin = process.env.AI_REQUIRE_LOGIN === "true" || allowed.length > 0;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  let email: string | null = null;
  if (token && url && anon) {
    const sb = createClient(url, anon, { auth: { persistSession: false } });
    const { data } = await sb.auth.getUser(token);
    email = data.user?.email?.toLowerCase() ?? null;
  }
  if (email && (!allowed.length || allowed.includes(email))) return { ok: true };
  if (email && allowed.length) return { ok: false, status: 403, message: "This account may not use the AI mentor." };
  if (passcode && req.headers.get("x-app-passcode") === passcode) return { ok: true };
  if (passcode) return { ok: false, status: 401, message: "Passcode required for AI features (Settings → AI access)." };
  if (requireLogin) return { ok: false, status: 401, message: "Please sign in to use the AI mentor." };
  return { ok: true };
}
