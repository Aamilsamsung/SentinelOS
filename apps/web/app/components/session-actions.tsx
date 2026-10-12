import Link from "next/link";
import { cookies } from "next/headers";
import { LogoutButton } from "./logout-button";

export async function SessionActions() {
  const jar = await cookies();
  const hasSession = Boolean(jar.get("sentinelos_session")?.value && jar.get("sentinelos_organization")?.value);
  return hasSession
    ? <LogoutButton />
    : <Link className="back" href="/login">Sign in</Link>;
}
