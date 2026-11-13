import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { checkAccess } from "./guard";
import { describeError } from "./provider";

export async function handle<B extends z.ZodType>(req: Request, bodySchema: B, fn: (body: z.infer<B>) => Promise<unknown>) {
  const access = await checkAccess(req);
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });
  let body: z.infer<B>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  try {
    return NextResponse.json(await fn(body));
  } catch (err) {
    const { status, message } = describeError(err);
    console.error("[ai]", message, err);
    return NextResponse.json({ error: message }, { status });
  }
}
