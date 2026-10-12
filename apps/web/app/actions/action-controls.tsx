"use client";

import { useState } from "react";

function readCsrfCookie(): string | null {
  const token = document.cookie.split(";").map((part) => part.trim())
    .find((part) => part.startsWith("sentinelos_csrf="))?.slice("sentinelos_csrf=".length);
  return token ? decodeURIComponent(token) : null;
}

export function ActionControls({ actionId }: { actionId: string }) {
  const [state, setState] = useState<"idle" | "working" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function transition(value: "approve" | "reject") {
    if (state === "working") return;
    const csrf = readCsrfCookie();
    if (!csrf) {
      setState("error");
      setErrorMessage("Session verification is unavailable. Sign in again before changing an action.");
      return;
    }
    setState("working");
    setErrorMessage("");
    try {
      const response = await fetch(`/api/actions/${encodeURIComponent(actionId)}/transition`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ transition: value }),
        cache: "no-store"
      });
      if (response.ok) {
        window.location.reload();
        return;
      }
      setErrorMessage(response.status === 401 || response.status === 403
        ? "Your session or permissions could not be verified. Please sign in again."
        : "The action could not be updated. Check its current status and try again.");
      setState("error");
    } catch {
      setErrorMessage("The server could not be reached. Please try again.");
      setState("error");
    }
  }

  return <div className="controls">
    <button type="button" disabled={state === "working"} onClick={() => transition("approve")}>Approve</button>
    <button type="button" className="secondary" disabled={state === "working"} onClick={() => transition("reject")}>Reject</button>
    {state === "error" ? <small role="alert">{errorMessage}</small> : null}
  </div>;
}
