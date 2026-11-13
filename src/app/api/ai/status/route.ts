import { NextResponse } from "next/server";
import { aiConfig } from "@/lib/ai/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = aiConfig();
  return NextResponse.json({
    available: cfg.provider !== "none",
    provider: cfg.provider,
    model: cfg.model,
    allowModelOverride: cfg.allowModelOverride,
    passcodeRequired: Boolean(process.env.APP_PASSCODE),
    loginRequired: process.env.AI_REQUIRE_LOGIN === "true" || Boolean(process.env.ALLOWED_EMAILS),
  });
}
