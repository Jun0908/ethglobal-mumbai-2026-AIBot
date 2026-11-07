import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthorizedParent, personaMetadata } from "@/lib/persona-metadata";
import { loadCapsule } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status: number) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ personaId: string }> },
) {
  const secret = process.env.PARENT_METADATA_TOKEN;
  if (!secret || secret.length < 32) return json({ error: "Metadata service unavailable" }, 503);
  if (!isAuthorizedParent(request.headers.get("authorization"), secret)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const { personaId } = await context.params;
  if (!z.string().uuid().safeParse(personaId).success) {
    return json({ error: "Persona unavailable" }, 404);
  }

  try {
    const metadata = personaMetadata(await loadCapsule(personaId));
    if (!metadata) return json({ error: "Persona unavailable" }, 404);
    return json(metadata, 200);
  } catch {
    return json({ error: "Persona unavailable" }, 404);
  }
}
