"use client";

import { ChangeEvent, DragEvent, FormEvent, useState } from "react";
import type { InspectionReport } from "../../lib/source-inspection";

type Mode = "github" | "zip";

export function SourceWorkbench() {
  const [mode, setMode] = useState<Mode>("github");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<InspectionReport | null>(null);
  const [findingFilter, setFindingFilter] = useState<"all" | "attention" | "review" | "info">("all");

  function chooseFile(selected?: File | null) {
    setError("");
    setResult(null);
    if (!selected) { setFile(null); return; }
    if (!selected.name.toLowerCase().endsWith(".zip")) {
      setFile(null);
      setError("Please choose a .zip archive.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setFile(null);
      setError("The public preview accepts ZIP files up to 5 MB.");
      return;
    }
    setFile(selected);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files.item(0));
  }

  async function inspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setResult(null);
    setError("");
    if (mode === "zip" && !file) {
      setError("Select a ZIP archive to inspect.");
      return;
    }
    if (mode === "github" && !url.trim()) {
      setError("Paste the URL of a public GitHub repository.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/source-inspection", {
        method: "POST",
        headers: mode === "github"
          ? { "content-type": "application/json" }
          : { "content-type": "application/zip", "x-source-filename": file!.name },
        body: mode === "github" ? JSON.stringify({ url: url.trim() }) : file!,
        cache: "no-store"
      });
      const payload = await response.json() as { data?: InspectionReport; error?: string };
      if (!response.ok || !payload.data) throw new Error(payload.error || "Inspection could not be completed.");
      setFindingFilter("all");
      setResult(payload.data);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Inspection failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function downloadReport() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "sentinelos-inspection-report.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
  }

  function changeMode(next: Mode) {
    setMode(next);
    setResult(null);
    setError("");
  }

  return <div className="inspectorLayout">
    <section className="inspectorPanel">
      <div className="panelTop"><span className="sectionNumber">01</span><div>
        <h3>Choose your source</h3>
        <p>Start with a public repository or a local project archive.</p>
      </div></div>
      <div className="sourceTabs" role="tablist" aria-label="Source type">
        <button type="button" role="tab" aria-selected={mode === "github"} className={mode === "github" ? "selected" : ""}
          onClick={() => changeMode("github")}>◎ GitHub repository</button>
        <button type="button" role="tab" aria-selected={mode === "zip"} className={mode === "zip" ? "selected" : ""}
          onClick={() => changeMode("zip")}>↑ Upload ZIP</button>
      </div>

      <form className="inspectorForm" onSubmit={inspect}>
        {mode === "github" ? <div className="inputSection">
          <label htmlFor="repo-url">Public GitHub repository URL</label>
          <input id="repo-url" type="url" placeholder="https://github.com/owner/repository"
            autoComplete="url" value={url} maxLength={500} required
            onChange={event => { setUrl(event.target.value); setResult(null); }} />
          <small>Read-only scan of a public repository. Private repositories and GitHub account access aren't connected yet.</small>
          <button type="button" className="exampleRepoButton" onClick={() => { setUrl("https://github.com/vercel/next.js"); setResult(null); setError(""); }}>Try an example public repository ↗</button>
        </div> : <div className="inputSection">
          <label htmlFor="zip-file">Project archive</label>
          <label className={dragging ? "dropZone dragging" : "dropZone"}
            onDragEnter={e => { e.preventDefault(); setDragging(true); }}
            onDragOver={e => e.preventDefault()}
            onDragLeave={e => { e.preventDefault(); setDragging(false); }}
            onDrop={handleDrop}>
            <span className="uploadGlyph" aria-hidden="true">↑</span>
            <strong>{file ? file.name : "Drop a ZIP here or browse files"}</strong>
            <span>{file ? `${(file.size / 1024).toFixed(0)} KB · Ready to inspect` : "ZIP archives up to 5 MB"}</span>
            <input id="zip-file" type="file" accept=".zip,application/zip" onChange={(event: ChangeEvent<HTMLInputElement>) => chooseFile(event.target.files?.item(0))} />
          </label>
          <small>Your archive is sent to the SentinelOS preview server for an in-memory, read-only inspection. Avoid uploading secrets or private data.</small>
        </div>}
        {error && <div className="inspectError" role="alert">{error}</div>}
        <button className="inspectButton" type="submit" disabled={busy}>
          {busy ? "Inspecting source…" : "Run code health check"} <span aria-hidden="true">↗</span>
        </button>
        <p className="inspectorDisclaimer">Static checks only. Files aren't executed, deployed, saved or connected to an account. Results are indicative, not a security certification.</p>
      </form>
    </section>

    <aside className="inspectorInfo">
      <div className="inspectorInfoHeading"><span className="sectionNumber">02</span><h3>What gets checked?</h3></div>
      <div className="inspectionFeatures">
        <div><span className="featureMark">◇</span><div><strong>Project structure</strong><small>Languages, manifests, dependencies and documentation.</small></div></div>
        <div><span className="featureMark">✓</span><div><strong>Delivery readiness</strong><small>Test files, CI workflows and packaging signals.</small></div></div>
        <div><span className="featureMark">⌁</span><div><strong>Login &amp; Google OAuth</strong><small>Heuristic checks for token verification, auth secrets and session-flow concerns.</small></div></div>
        <div><span className="featureMark">⎇</span><div><strong>API integration health</strong><small>Flag suspicious credentials, insecure transport and missing error handling patterns.</small></div></div>
        <div><span className="featureMark">▧</span><div><strong>Actionable summary</strong><small>A transparent report with file counts, limitations and suggested reviews.</small></div></div>
      </div>
      <div className="inspectorInfoBottom"><span className="pulseDot" /> Preview engine <span>·</span> No code execution</div>
    </aside>

    {result && <section className="inspectionResults" aria-live="polite">
      <div className="resultsHeader">
        <div><div className="eyebrow">INSPECTION COMPLETE</div><h2>{result.name}</h2>
          <p>{result.kind === "github" ? "Public GitHub snapshot" : "Uploaded ZIP archive"} · Checked {new Date(result.inspectedAt).toLocaleString()}</p>
        </div>
        <div className="resultActions"><span className="resultState">✓ Static checks finished</span><button type="button" className="reportDownload" onClick={downloadReport}>↓ Download JSON report</button></div>
      </div>
      <div className="resultMetrics">
        <div><strong>{result.filesDiscovered}</strong><span>Files discovered</span></div>
        <div><strong>{result.filesInspected}</strong><span>Files sampled</span></div>
        <div><strong>{result.checks.filter(c => c.passed).length}/{result.checks.length}</strong><span>Project setup signals</span></div>
        <div><strong>{result.findings.filter(f => f.level !== "info").length}</strong><span>Items to review</span></div>
      </div>
      {result.partial && <p className="partialNotice">Some content couldn't be inspected because of size, access or preview sampling limits. Findings are incomplete.</p>}
      <div className="resultColumns">
        <div className="reportCard"><h3>Project readiness signals</h3>
          {result.checks.map(item => <div className="checkRow" key={item.label}>
            <span className={item.passed ? "checkIcon positive" : "checkIcon warning"}>{item.passed ? "✓" : "!"}</span>
            <span><strong>{item.label}</strong><small>{item.detail}</small></span>
          </div>)}
          <div className="languages"><strong>Detected languages</strong><div>{result.languages.length ? result.languages.map(lang => <span key={lang}>{lang}</span>) : <small>No supported source extensions detected</small>}</div></div>
        </div>
        <div className="reportCard"><h3>Findings to review</h3>
          <p className="findingsExplanation">Prioritized code signals, not confirmed runtime failures. Open each referenced file and verify the actual behavior.</p>
          <div className="findingFilters" aria-label="Filter findings">{(["all", "attention", "review", "info"] as const).map(level => <button key={level} type="button" aria-pressed={findingFilter === level} className={findingFilter === level ? "active" : ""} onClick={() => setFindingFilter(level)}>{level === "all" ? "All" : level === "attention" ? "Priority" : level === "review" ? "Review" : "Info"} <span>{level === "all" ? result.findings.length : result.findings.filter(item => item.level === level).length}</span></button>)}</div>
          {result.findings.filter(finding => findingFilter === "all" || finding.level === findingFilter).map((finding, index) => <div className="findingRow" key={`${finding.title}-${finding.file ?? index}`}>
            <span className={`findingLevel ${finding.level}`}>{finding.level === "attention" ? "Priority" : finding.level === "review" ? "Review" : "Info"}</span>
            <strong>{finding.title}</strong><p>{finding.detail}</p>
            {finding.file && <code>{finding.file}</code>}
          </div>)}
        </div>
      </div>
      <div className="inspectionFootnote"><strong>Inspection scope</strong>
        <p>This report covers file layout and a capped source-code sample; it does not run tests, install dependencies, monitor a live service, detect every security issue, or perform AI investigations.</p>
        <details><summary>See sampled file paths</summary><ul>{result.sampledPaths.map(path => <li key={path}><code>{path}</code></li>)}</ul></details>
      </div>
    </section>}
  </div>;
}
