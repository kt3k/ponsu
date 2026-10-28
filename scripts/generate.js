// Generates data.json: every monoid of order 2..MAX up to isomorphism, with duals and common names.
// Usage: node scripts/generate.js
import { writeFileSync } from "node:fs";
import { analyze, canonical, enumerateTables, identityFixingPerms, sortKey, transpose } from "../monoids.js";
import { namedConstructions, namedPresentations } from "./named.js";

const MAX = 6;
const constructions = namedConstructions();
const out = {};

for (let n = 2; n <= MAX; n++) {
  const started = Date.now();
  const perms = identityFixingPerms(n);
  const list = enumerateTables(n).map((key) => {
    const table = key.split("").map(Number);
    const m = analyze(table, n);
    return { key, table, m, sort: sortKey(m, key) };
  });
  list.sort((a, b) => a.sort.localeCompare(b.sort));
  const indexOf = new Map(list.map((x, i) => [x.key, i]));

  const names = new Map();
  const addName = (key, name) => {
    if (!indexOf.has(key)) throw new Error(`${name} is not a monoid of order ${n}`);
    const cur = names.get(key) ?? [];
    if (!cur.includes(name)) names.set(key, [...cur, name]);
  };
  for (const [size, table, name] of constructions) if (size === n) addName(canonical(table, n, perms), name);
  for (const p of namedPresentations.filter((p) => p.n === n)) {
    const match = list.find(({ table }) => {
      const op = (x, y) => table[x * n + y];
      for (let a = 1; a < n; a++)
        for (let b = 1; b < n; b++) {
          if (!p.holds(op, a, b)) continue;
          const s = new Set([0]);
          const queue = [0];
          while (queue.length) {
            const x = queue.pop();
            for (const g of [a, b]) {
              const y = op(x, g);
              if (!s.has(y)) s.add(y), queue.push(y);
            }
          }
          if (s.size === n) return true;
        }
      return false;
    });
    if (!match) throw new Error(`no monoid of order ${n} matches ${p.name}`);
    addName(match.key, p.name);
  }

  out[n] = list.map(({ key }) => {
    const entry = { t: key, dual: indexOf.get(canonical(transpose(key.split("").map(Number), n), n, perms)) };
    if (names.has(key)) entry.names = names.get(key);
    return entry;
  });
  console.error(`order ${n}: ${list.length} monoids, ${names.size} named (${Date.now() - started} ms)`);
}

writeFileSync(new URL("../data.json", import.meta.url), JSON.stringify(out));
