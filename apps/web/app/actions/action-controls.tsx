"use client";

import { useState } from "react";

export function ActionControls({ actionId }: { actionId: string }) {
  const [state, setState] = useState<"idle"|"working"|"done"|"error">("idle");
  async function transition(value: "approve"|"reject") {
    setState("working");
    const response = await fetch(`/api/actions/${actionId}/transition`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transition: value })
    });
    setState(response.ok ? "done" : "error");
    if (response.ok) window.location.reload();
  }
  return <div className="controls">
    <button disabled={state==="working"} onClick={()=>transition("approve")}>Approve</button>
    <button className="secondary" disabled={state==="working"} onClick={()=>transition("reject")}>Reject</button>
    {state==="error" ? <small>Transition rejected. Check permissions and action state.</small> : null}
  </div>;
}
