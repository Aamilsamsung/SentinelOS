export type Dependency = { upstream: string; downstream: string };

export function impactedServices(root: string, dependencies: Dependency[]): string[] {
  const outgoing = new Map<string, string[]>();
  for (const edge of dependencies) {
    const current = outgoing.get(edge.upstream) ?? [];
    current.push(edge.downstream);
    outgoing.set(edge.upstream, current);
  }

  const visited = new Set<string>();
  const queue = [root];
  while (queue.length) {
    const current = queue.shift()!;
    for (const next of outgoing.get(current) ?? []) {
      if (next === root || visited.has(next)) continue;
      visited.add(next);
      queue.push(next);
    }
  }
  return [...visited];
}
