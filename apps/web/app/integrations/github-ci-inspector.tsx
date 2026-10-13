"use client";
import { FormEvent, useState } from "react";
type Run={id:number;workflow:string;commit:string;event:string;status:string;conclusion:string|null;createdAt:string;updatedAt:string;url:string;message:string;author:string};
export function GithubCiInspector(){
 const [repo,setRepo]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [runs,setRuns]=useState<Run[]|null>(null);const [note,setNote]=useState("");
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");setRuns(null);
 try{const response=await fetch("/api/github-ci?repo="+encodeURIComponent(repo),{cache:"no-store"});const payload=await response.json() as {data?:{runs:Run[];note:string};error?:string};if(!response.ok||!payload.data)throw new Error(payload.error||"Unable to read CI status");setRuns(payload.data.runs);setNote(payload.data.note)}catch(e){setError(e instanceof Error?e.message:"Unable to read CI status")}finally{setBusy(false)}}
 return <section className="integrationFormPanel"><div className="eyebrow">GITHUB CI INSPECTOR</div><h2>Find failed builds after a push</h2>
 <p>Inspect the ten most recent GitHub Actions runs from a public repository. Failed tests and builds appear with the commit, workflow timestamp, and a link to the actual error logs. Private repositories and automatic push alerts require a connected GitHub App.</p>
 <form className="integrationForm" onSubmit={submit}><label htmlFor="ci-repository">Public repository</label><input id="ci-repository" placeholder="owner/repository" value={repo} onChange={e=>setRepo(e.target.value)} required maxLength={160}/><button className="inspectButton" disabled={busy}>{busy?"Checking…":"Check recent builds"}</button></form>
 {error&&<p role="alert" className="inspectError">{error}</p>}
 {runs&&<div aria-live="polite"><p>{note}</p>{runs.length===0?<p>No public workflow runs found.</p>:runs.map(run=><div className="connectionItem" key={run.id} style={{marginBottom:12,padding:12}}><strong>{run.conclusion==="failure"?"✕ FAILED":run.conclusion==="success"?"✓ PASSED":run.status.toUpperCase()} · {run.workflow}</strong><small>{run.commit} · {run.author||"Unknown author"} · {new Date(run.createdAt).toLocaleString()}</small><p>{run.message||"No commit message available"}</p><a href={run.url} target="_blank" rel="noopener noreferrer">Open GitHub run and error logs ↗</a></div>)}</div>}
 </section>;
}
