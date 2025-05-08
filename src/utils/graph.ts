import type { FsmState } from "@/types/fsm";

/**
 * Returns the cheapest‑cost (sum of transition.price) path from start to **any** end node.
 * If no reachable end node, returns null.
 */
export function cheapestPath(
  states: Record<string, FsmState>,
  startId: string | null
): { cost: number; path: string[] } | null {
  if (!startId || !states[startId]) return null;

  /** Tiny binary heap queue – local impl to avoid pulling a lib */
  class Q {
    arr: [string, number][] = [];
    push(v: [string, number]) {
      this.arr.push(v);
      this.arr.sort((a, b) => a[1] - b[1]);
    }
    pop() {
      return this.arr.shift();
    }
    get size() {
      return this.arr.length;
    }
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const q = new Q();

  dist.set(startId, 0);
  q.push([startId, 0]);

  while (q.size) {
    const [sid, d] = q.pop()!;
    const s = states[sid];
    if (s.isEndState) {
      // retrace path
      const path: string[] = [sid];
      let cur = sid;
      while (prev.has(cur)) {
        cur = prev.get(cur)!;
        path.unshift(cur);
      }
      return { cost: d, path };
    }
    if (d !== dist.get(sid)) continue; // outdated entry
    for (const t of s.transitions) {
      if (!t.targetStateId || !states[t.targetStateId]) continue;
      const nd = d + (t.price ?? 0);
      if (nd < (dist.get(t.targetStateId) ?? Infinity)) {
        dist.set(t.targetStateId, nd);
        prev.set(t.targetStateId, sid);
        q.push([t.targetStateId, nd]);
      }
    }
  }
  return null;
}