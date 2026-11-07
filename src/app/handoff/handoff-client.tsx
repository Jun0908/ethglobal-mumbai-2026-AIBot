"use client";

import { useEffect, useRef, useState } from "react";
import { isAssertionMessage } from "@/lib/handoff";

export default function HandoffClient({ parentOrigin }: { parentOrigin: string | null }) {
  const [status, setStatus] = useState("Waiting for your matching app...");
  const [isReady, setIsReady] = useState(false);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const assertionRef = useRef<string | null>(null);

  async function continueToAibot(): Promise<void> {
    const assertion = assertionRef.current;
    if (!assertion || !adultConfirmed) return;
    assertionRef.current = null;
    setIsReady(false);
    setStatus("Verifying your identity...");
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adultConfirmed: true, assertion }),
      });
      if (!response.ok) throw new Error("Session rejected");
      window.location.replace("/");
    } catch {
      setStatus("Identity handoff failed. Return to Secret Tinder and try again.");
    }
  }

  useEffect(() => {
    if (!parentOrigin) {
      setStatus("Verified matching handoff is not configured. The standalone demo is separate.");
      return;
    }
    const opener = window.opener;
    if (!opener) {
      setStatus("Open this page from your verified match in Secret Tinder.");
      return;
    }
    let used = false;
    const receive = (event: MessageEvent) => {
      if (used || event.source !== opener || event.origin !== parentOrigin || !isAssertionMessage(event.data)) return;
      used = true;
      window.removeEventListener("message", receive);
      assertionRef.current = event.data.assertion;
      setStatus("Confirm that you are an adult before continuing.");
      setIsReady(true);
    };
    window.addEventListener("message", receive);
    opener.postMessage({ type: "secret-tinder:ready", version: 1 }, parentOrigin);
    return () => window.removeEventListener("message", receive);
  }, [parentOrigin]);

  return (
    <main style={{ maxWidth: 560, margin: "12vh auto", padding: 24 }}>
      <h1>Connect your verified match</h1>
      <p role="status">{status}</p>
      {isReady && (
        <>
          <label><input type="checkbox" checked={adultConfirmed} onChange={(event) => setAdultConfirmed(event.currentTarget.checked)} /> I confirm that I am an adult.</label>
          <button type="button" disabled={!adultConfirmed} onClick={() => void continueToAibot()}>Continue to AIBot</button>
        </>
      )}
      <p>Private matching preferences and wallet data stay in Secret Tinder. AIBot receives only your short-lived identity assertion, then checks your match and Persona permission before a conversation.</p>
    </main>
  );
}
