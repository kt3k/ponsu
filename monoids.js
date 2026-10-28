// Enumerate monoids of a given order up to isomorphism.
// Element 0 is always the identity; the remaining n-1 elements are relabeled freely.
export function permutations(arr) {
  if (arr.length <= 1) return [arr.slice()];
  const out = [];
  arr.forEach((x, i) => {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    for (const p of permutations(rest)) out.push([x, ...p]);
  });
  return out;
}

function isAssociative(t, n) {
  for (let x = 0; x < n; x++)
    for (let y = 0; y < n; y++)
      for (let z = 0; z < n; z++)
        if (t[t[x * n + y] * n + z] !== t[x * n + t[y * n + z]]) return false;
  return true;
}

// perm maps old label -> new label
function relabel(t, n, perm) {
  const r = new Array(n * n);
  for (let x = 0; x < n; x++)
    for (let y = 0; y < n; y++) r[perm[x] * n + perm[y]] = perm[t[x * n + y]];
  return r;
}

function canonical(t, n, perms) {
  let best = null;
  for (const p of perms) {
    const s = relabel(t, n, p).join("");
    if (best === null || s < best) best = s;
  }
  return best;
}

function transpose(t, n) {
  const r = new Array(n * n);
  for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) r[y * n + x] = t[x * n + y];
  return r;
}

export function enumerateMonoids(n) {
  const perms = permutations([...Array(n - 1)].map((_, i) => i + 1)).map((p) => [0, ...p]);
  const m = n - 1;
  const cells = m * m;
  const seen = new Map();
  const total = n ** cells;
  for (let code = 0; code < total; code++) {
    const t = new Array(n * n);
    for (let x = 0; x < n; x++) {
      t[x] = x;
      t[x * n] = x;
    }
    let c = code;
    for (let i = 0; i < cells; i++) {
      t[(1 + Math.floor(i / m)) * n + 1 + (i % m)] = c % n;
      c = Math.floor(c / n);
    }
    if (!isAssociative(t, n)) continue;
    const key = canonical(t, n, perms);
    if (!seen.has(key)) seen.set(key, key.split("").map(Number));
  }
  const list = [...seen.entries()].map(([key, table]) => analyze(table, n, key, perms));
  list.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  list.forEach((mon, i) => (mon.index = i + 1));
  const byKey = new Map(list.map((mon) => [mon.key, mon]));
  for (const mon of list) {
    const dual = byKey.get(mon.dualKey);
    mon.dualIndex = dual.index;
  }
  const names = namedMonoids(n, perms);
  for (const mon of list) mon.names = names.get(mon.key) ?? [];
  return list;
}

// Well-known monoids, built from their definitions and matched by canonical form.
// Element 0 is the identity in every construction.
function fromOp(n, op) {
  const t = new Array(n * n);
  for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) t[x * n + y] = op(x, y);
  return t;
}
const cyclicGroup = (n) => fromOp(n, (x, y) => (x + y) % n);
// <g | g^(i+p) = g^i>, elements g^0 .. g^(i+p-1)
const monogenic = (i, p) => fromOp(i + p, (x, y) => (x + y < i + p ? x + y : i + ((x + y - i) % p)));
// Chain semilattice 1 > ... > 0 under meet
const chain = (n) => fromOp(n, (x, y) => Math.max(x, y));
const product = (a, na, b, nb) =>
  fromOp(na * nb, (x, y) => {
    const u = a[Math.floor(x / nb) * na + Math.floor(y / nb)];
    const v = b[(x % nb) * nb + (y % nb)];
    return u * nb + v;
  });
const withZero = (t, n) => fromOp(n + 1, (x, y) => (x === n || y === n ? n : t[x * n + y]));
// S¹: adjoin an identity to a semigroup S of order k given by sop on 0..k-1
const withIdentity = (k, sop) => fromOp(k + 1, (x, y) => (x === 0 ? y : y === 0 ? x : 1 + sop(x - 1, y - 1)));

function namedMonoids(n, perms) {
  const sub = (k) => String(k).replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[d]);
  const sup = (k) => String(k).replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]);
  const candidates = [];
  const add = (size, table, name) => size === n && candidates.push([table, name]);
  for (let k = 2; k <= 4; k++) add(k, cyclicGroup(k), `Z${sub(k)}`);
  add(4, product(cyclicGroup(2), 2, cyclicGroup(2), 2), "Z₂×Z₂ (Klein)");
  add(2, chain(2), "U₁ = {1, 0}");
  for (let k = 3; k <= 4; k++) add(k, chain(k), `C${sub(k)} (chain)`);
  add(4, product(chain(2), 2, chain(2), 2), "U₁×U₁");
  add(4, product(cyclicGroup(2), 2, chain(2), 2), "Z₂×U₁");
  for (let k = 2; k <= 3; k++) add(k + 1, withZero(cyclicGroup(k), k), `Z${sub(k)}⁰`);
  add(3, withIdentity(2, (x, y) => y), "R₂¹ = U₂ (flip-flop)");
  add(3, withIdentity(2, (x) => x), "L₂¹");
  add(4, withIdentity(3, (x, y) => y), "R₃¹");
  add(4, withIdentity(3, (x) => x), "L₃¹");
  add(4, withIdentity(3, () => 0), "O₃¹ (null)");
  for (let i = 1; i < n; i++) add(n, monogenic(i, n - i), `⟨g | g${sup(n)} = g${i === 1 ? "" : sup(i)}⟩`);
  const names = new Map();
  for (const [table, name] of candidates) {
    const key = canonical(table, n, perms);
    names.set(key, [...(names.get(key) ?? []), name]);
  }
  return names;
}

function analyze(t, n, key, perms) {
  const op = (x, y) => t[x * n + y];
  const els = [...Array(n).keys()];
  const commutative = els.every((x) => els.every((y) => op(x, y) === op(y, x)));
  const idempotents = els.filter((x) => op(x, x) === x);
  const units = els.filter((x) => els.some((y) => op(x, y) === 0 && op(y, x) === 0));
  const zero = els.find((z) => els.every((x) => op(z, x) === z && op(x, z) === z));
  const leftCancel = els.every((a) => new Set(els.map((x) => op(a, x))).size === n);
  const rightCancel = els.every((a) => new Set(els.map((x) => op(x, a))).size === n);
  const isGroup = units.length === n;
  const isBand = idempotents.length === n;
  const dualKey = canonical(transpose(t, n), n, perms);
  // Cyclic: generated by a single element
  const generated = (g) => {
    const s = new Set([0]);
    let x = g;
    while (!s.has(x)) {
      s.add(x);
      x = op(x, g);
    }
    return s;
  };
  const cyclic = els.some((g) => generated(g).size === n);
  const tags = [];
  if (isGroup) tags.push("group");
  if (commutative) tags.push("commutative");
  if (isBand) tags.push("band");
  if (zero !== undefined && n > 1) tags.push("zero");
  if (cyclic) tags.push("cyclic");
  if (!isGroup && leftCancel !== rightCancel) tags.push(leftCancel ? "leftCancel" : "rightCancel");
  if (dualKey === key) tags.push("selfDual");
  return {
    key,
    table: t,
    n,
    commutative,
    isGroup,
    isBand,
    idempotents,
    units,
    zero,
    cyclic,
    dualKey,
    selfDual: dualKey === key,
    tags,
    sortKey: [isGroup ? 0 : 1, commutative ? 0 : 1, String(9 - units.length), String(9 - idempotents.length), key].join("|"),
  };
}
