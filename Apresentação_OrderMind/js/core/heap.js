/* MPS · CORE · Binary Heap (max-heap) — funções puras sobre arrays, sem UI.
   Operações são generators: a UI pode "assistir" cada passo (compare/swap),
   enquanto a lógica de negócio roda de forma síncrona via runSync(). */
;(function (g) {
  const MPS = (g.MPS = g.MPS || {})
  const parent = (i) => (i - 1) >> 1
  const left = (i) => 2 * i + 1
  const right = (i) => 2 * i + 2
  const swap = (a, i, j) => { const t = a[i]; a[i] = a[j]; a[j] = t }

  function* siftUp(a, i, higher) {
    while (i > 0) {
      const p = parent(i)
      yield { type: 'compare', i, j: p }
      if (!higher(a[i], a[p])) break
      swap(a, i, p)
      yield { type: 'swap', i, j: p }
      i = p
    }
    return i
  }

  function* siftDown(a, i, n, higher) {
    for (;;) {
      const l = left(i), r = right(i)
      let m = i
      if (l < n) { yield { type: 'compare', i: l, j: m }; if (higher(a[l], a[m])) m = l }
      if (r < n) { yield { type: 'compare', i: r, j: m }; if (higher(a[r], a[m])) m = r }
      if (m === i) break
      swap(a, i, m)
      yield { type: 'swap', i, j: m }
      i = m
    }
    return i
  }

  /** O(log n) */
  function* insert(a, item, higher) {
    a.push(item)
    yield { type: 'place', i: a.length - 1 }
    yield* siftUp(a, a.length - 1, higher)
  }

  /** O(log n) — remove e retorna o topo */
  function* extractMax(a, higher) {
    if (!a.length) return undefined
    const top = a[0]
    const last = a.length - 1
    if (last > 0) { swap(a, 0, last); yield { type: 'swap', i: 0, j: last } }
    a.pop()
    yield { type: 'extract', item: top }
    if (a.length > 1) yield* siftDown(a, 0, a.length, higher)
    return top
  }

  /** O(log n) com posição conhecida — chave mudou (prazo alterado): sobe ou desce */
  function* update(a, i, higher) {
    const j = yield* siftUp(a, i, higher)
    if (j === i) yield* siftDown(a, i, a.length, higher)
  }

  /** O(n) — reconstrói o invariante depois de uma mudança em massa (time decay) */
  function* heapify(a, higher) {
    for (let i = (a.length >> 1) - 1; i >= 0; i--) yield* siftDown(a, i, a.length, higher)
  }

  function runSync(gen) {
    let r
    while (!(r = gen.next()).done) { /* consome os passos */ }
    return r.value
  }

  function isHeap(a, higher) {
    for (let i = 1; i < a.length; i++) if (higher(a[i], a[parent(i)])) return false
    return true
  }

  /** Ordem completa de despacho (cópia): heapify + n × extractMax */
  function drain(items, higher) {
    const a = items.slice()
    runSync(heapify(a, higher))
    const out = []
    while (a.length) out.push(runSync(extractMax(a, higher)))
    return out
  }

  MPS.heap = { parent, left, right, insert, extractMax, heapify, update, runSync, isHeap, drain }
})(typeof globalThis !== 'undefined' ? globalThis : window)
