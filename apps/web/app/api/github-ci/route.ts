import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const value = new URL(request.url).searchParams.get("repo") ?? "";
  const match = /^(?:https:\/\/github\.com\/)?([a-zA-Z0-9-]{1,39})\/([a-zA-Z0-9_.-]{1,100})(?:\.git)?\/?$/.exec(value.trim());
  if (!match || match[2] === "." || match[2] === "..") {
    return NextResponse.json({ error: "Enter a public GitHub repository as owner/repo." }, { status: 400 });
  }
  const [, owner, name] = match;
  try {
    const upstream = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/actions/runs?per_page=10`, {
      headers: { accept: "application/vnd.github+json", "user-agent": "SentinelOS-CI-Inspector" },
      cache: "no-store", signal: AbortSignal.timeout(8000)
    });
    if (!upstream.ok) return NextResponse.json({ error: upstream.status === 404 ? "Repository or public Actions history not found." : "GitHub Actions history unavailable." }, { status: upstream.status === 404 ? 404 : 502 });
    const data = await upstream.json() as { workflow_runs?: Array<{id:number;name:string;head_sha:string;event:string;status:string;conclusion:string|null;created_at:string;run_started_at:string|null;updated_at:string;html_url:string;head_commit?:{message?:string;author?:{name?:string}}}> };
    const runs = (data.workflow_runs ?? []).map(x => ({
      id:x.id, workflow:x.name, commit:x.head_sha.slice(0,12), event:x.event, status:x.status,
      conclusion:x.conclusion, createdAt:x.created_at, startedAt:x.run_started_at, updatedAt:x.updated_at,
      url:x.html_url, message:x.head_commit?.message?.slice(0,160) ?? "", author:x.head_commit?.author?.name ?? ""
    }));
    return NextResponse.json({ data: { repository:`${owner}/${name}`, runs, note:"GitHub workflow times are not necessarily push times. A failed run confirms a CI failure, not necessarily a production error." } }, { headers:{"cache-control":"no-store"} });
  } catch { return NextResponse.json({error:"Could not reach GitHub."},{status:502}); }
}
