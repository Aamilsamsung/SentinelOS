"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/browser-auth/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!response.ok) {
        setMessage("Unable to start sign-in. Please check the address and try again.");
        return;
      }
      setMessage("Sign-in verification is not yet enabled. No email was sent. Contact your administrator for access.");
    } catch {
      setMessage("The sign-in service is unavailable. Please try again later.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="loginShell">
      <section className="loginCard">
        <div className="eyebrow">SENTINELOS</div>
        <h1>Sign in to Command Center</h1>
        <p>Enter your work email address to begin secure verification.</p>
        <form onSubmit={requestLogin} className="loginForm">
          <label htmlFor="email">Work email</label>
          <input id="email" type="email" autoComplete="email" required maxLength={320}
            value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
          <button type="submit" disabled={busy}>{busy ? "Checking…" : "Continue"}</button>
        </form>
        {message && <p role="status" className="loginMessage">{message}</p>}
        <Link href="/" className="back">Back to Command Center</Link>
      </section>
    </main>
  );
}
