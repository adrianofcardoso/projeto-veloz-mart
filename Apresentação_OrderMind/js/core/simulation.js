/* MPS · NÚCLEO · Simulação discreta (1 tick = 1 min) da doca de embalagem.
   Mesmo fluxo de pedidos alimenta 3 motores com a MESMA doca (4 bancadas) e a mesma regra de
   encaixe (melhor ranqueado que caiba, olhando até LOOKAHEAD candidatos). Só a ordenação muda. */
;(function (g) {
  const MPS = (g.MPS = g.MPS || {})
  const { SIZE, DOCK_CAPACITY: CAP, STRATEGIES, rescore, higher, makeOrder } = MPS.scoring
  const H = MPS.heap
  const LOOKAHEAD = 8
  const KINDS = ['fifo', 'composite', 'mps']

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0
      let t = Math.imul(a ^ (a >>> 15), 1 | a)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }
  function poisson(rnd, lambda) { const L = Math.exp(-lambda); let k = 0, p = 1; do { k++; p *= rnd() } while (p > L); return k - 1 }

  const engine = (kind) => ({ kind, queue: [], running: [], slots: new Array(CAP).fill(0), done: 0, onTime: 0, tardSum: 0, busy: 0, log: [] })

  function create(opts = {}) {
    const seed = opts.seed == null ? 42 : opts.seed
    return { t: 0, seed, lambda: opts.lambda == null ? 0.7 : opts.lambda, nextId: 1, _rng: mulberry32(seed),
      fifo: engine('fifo'), composite: engine('composite'), mps: engine('mps'), history: [] }
  }

  function findRun(slots, units) {
    for (let i = 0; i + units <= slots.length; i++) {
      let ok = true
      for (let k = 0; k < units; k++) if (slots[i + k]) { ok = false; break }
      if (ok) return i
    }
    return -1
  }

  /** inicia o melhor pedido que caiba na doca; devolve true se iniciou algum */
  function startOne(e, now) {
    const q = e.queue, skipped = []
    let started = false
    while (q.length && skipped.length < LOOKAHEAD) {
      const o = H.runSync(H.extractMax(q, higher))           // O(log n)
      const sz = SIZE[o.size], lane = findRun(e.slots, sz.units)
      if (lane >= 0) {
        for (let k = 0; k < sz.units; k++) e.slots[lane + k] = o.id
        e.running.push({ o, lane, units: sz.units, remaining: sz.service })
        const end = now + sz.service
        e.log.push({ id: o.id, size: o.size, units: sz.units, lane, start: now, end, late: end > o.deadline })
        if (e.log.length > 150) e.log.shift()
        started = true
        break
      }
      skipped.push(o)
    }
    for (const s of skipped) H.runSync(H.insert(q, s, higher)) // devolve os que não couberam
    return started
  }

  function stepEngine(e, now, w) {
    rescore(e.queue, now, w, e.kind)                 // time decay: dispatchWindow encolheu
    H.runSync(H.heapify(e.queue, higher))            // O(n)
    while (startOne(e, now)) { /* preenche a doca */ }
    const still = []
    for (const r of e.running) {
      e.busy += r.units
      if (--r.remaining === 0) {
        const tard = Math.max(0, now + 1 - r.o.deadline)
        e.done++; e.tardSum += tard; if (tard === 0) e.onTime++
        for (let k = 0; k < r.units; k++) e.slots[r.lane + k] = 0
      } else still.push(r)
    }
    e.running = still
  }

  const avgDelay = (e) => (e.done ? e.tardSum / e.done : 0)
  const throughput = (e, t) => (t > 0 ? (e.done / t) * 60 : 0)
  const onTimePct = (e) => (e.done ? (100 * e.onTime) / e.done : 100)
  const utilization = (e, t) => (t > 0 ? (100 * e.busy) / (CAP * t) : 0)

  function step(s, w) {
    const now = s.t
    const n = poisson(s._rng, s.lambda)
    for (let i = 0; i < n; i++) {
      const o = makeOrder(s.nextId++, now, s._rng)
      for (const k of KINDS) { const c = { ...o }; c.score = STRATEGIES[k].key(c, now, w); H.runSync(H.insert(s[k].queue, c, higher)) }
    }
    for (const k of KINDS) stepEngine(s[k], now, w)
    s.t = now + 1
    if (s.t % 4 === 0) {
      s.history.push({ t: s.t, f: avgDelay(s.fifo), c: avgDelay(s.composite), m: avgDelay(s.mps) })
      if (s.history.length > 160) s.history.shift()
    }
  }

  MPS.sim = { KINDS, create, step, avgDelay, throughput, onTimePct, utilization }
})(typeof globalThis !== 'undefined' ? globalThis : window)
