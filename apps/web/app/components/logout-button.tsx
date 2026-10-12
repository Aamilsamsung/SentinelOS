"use client";

import { useState } from "react";

export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    if (busy) return;
    const csrf = document.cookie.split(";").map((part) => part.trim())
      .find((part) => part.startsWith("sentinelos_csrf="))?.slice("sentinelos_csrf=".length);
    if (!csrf) {
      setError("Session verification is missing. Sign in again or clear your browser session.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/browser-auth/logout", {
        method: "POST",
        headers: { "x-csrf-token": decodeURIComponent(csrf) },
        cache: "no-store"
      });
      if (!response.ok) {
        setError("Could not end the session. Please try again.");
        return;
      }
      window.location.assign("/login");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="logoutControl">
    <button type="button" className="secondaryButton" disabled={busy} onClick={logout}>
      {busy ? "Signing out…" : "Sign out"}
    </button>
    {error && <small role="alert">{error}</small>}
  </div>;
}
