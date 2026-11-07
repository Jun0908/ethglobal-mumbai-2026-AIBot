import { isDemo } from "@/lib/server/config";
import HandoffClient from "./handoff-client";

export const dynamic = "force-dynamic";

function trustedParentOrigin(): string | null {
  const configured = process.env.MATCHING_FRONTEND_ORIGIN ?? "https://ethglobal-mumbai-2026.vercel.app";
  try {
    const url = new URL(configured);
    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if ((url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) || url.pathname !== "/" || url.search || url.hash || url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export default function HandoffPage() {
  const parentOrigin = trustedParentOrigin();
  return <HandoffClient parentOrigin={!isDemo() ? parentOrigin : null} />;
}
