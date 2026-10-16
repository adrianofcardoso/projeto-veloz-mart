/* MPS · NÚCLEO · Modelo de dados e estratégias de ordenação (VelozMart)
   Pedido: { id, priorityScore 0–100 (IA), arrival, deadline, size: 'P'|'M'|'G' }
   dispatchWindow(t) = deadline − t  → minutos restantes até o prazo expirar
   sizeCategory ocupa espaço na doca de embalagem (units) por `service` minutos. */
;(function (g) {
  const MPS = (g.MPS = g.MPS || {})

  const DOCK_CAPACITY = 4 // bancadas de embalagem
  const SIZE = {
    P: { key: 'P', label: 'Pequeno', units: 1, service: 2, weight: 1.0 },
    M: { key: 'M', label: 'Médio', units: 2, service: 3, weight: 0.6 },
    G: { key: 'G', label: 'Grande', units: 4, service: 5, weight: 0.3 },
  }
  const TAU = 15 // min: escala da urgência  U = 1 / (1 + janela/TAU)
  const DEFAULT_WEIGHTS = { alpha: 0.3, beta: 0.4 } // γ = 1 − α − β

  const window_ = (o, now) => o.deadline - now
  function gamma(w) { return Math.max(0, 1 - w.alpha - w.beta) }

  function components(o, now) {
    const win = window_(o, now)
    return {
      ia: o.priorityScore / 100,                                  // valor/SLA/distância/reputação (IA)
      urgency: win <= 0 ? 1 : 1 / (1 + win / TAU),                // dispatchWindow → hiperbólica
      size: SIZE[o.size].weight,                                  // cabe melhor na doca (pequeno primeiro)
    }
  }
  function breakdown(o, now, w) {
    const c = components(o, now)
    return { ia: 100 * w.alpha * c.ia, urgency: 100 * w.beta * c.urgency, size: 100 * gamma(w) * c.size }
  }

  /** Estratégias comparadas. key maior = sai primeiro. */
  const STRATEGIES = {
    fifo: {
      label: 'FIFO', long: 'Ordenação simples por tempo de chegada',
      key: (o) => -o.arrival,
      show: (o) => 'chegou T+' + o.arrival,
    },
    composite: {
      label: 'Composto', long: 'Peso composto: priorityScore × 1/dispatchWindow',
      key: (o, now) => o.priorityScore / Math.max(1, window_(o, now)),
      show: (o) => o.score.toFixed(2),
    },
    mps: {
      label: 'OrderMind', long: 'Heap multi-chave: α·IA + β·urgência + γ·doca',
      key: (o, now, w) => { const b = breakdown(o, now, w); return b.ia + b.urgency + b.size },
      show: (o) => o.score.toFixed(1),
    },
  }

  function rescore(list, now, w, strat) { const k = STRATEGIES[strat].key; for (const o of list) o.score = k(o, now, w) }

  /** comparador do heap: maior key; empate → chegou antes → menor id */
  function higher(a, b) {
    if (a.score !== b.score) return a.score > b.score
    if (a.arrival !== b.arrival) return a.arrival < b.arrival
    return a.id < b.id
  }

  function makeOrder(id, now, rnd) {
    const r = rnd || Math.random
    const roll = r()
    const size = roll < 0.5 ? 'P' : roll < 0.85 ? 'M' : 'G'
    const express = r() < 0.3
    const win = express ? 15 + Math.floor(r() * 16) : 40 + Math.floor(r() * 81) // 15–30 | 40–120 min
    return { id, arrival: now, deadline: now + win, priorityScore: Math.floor(r() * 101), size, score: 0 }
  }

  MPS.scoring = { DOCK_CAPACITY, SIZE, TAU, DEFAULT_WEIGHTS, STRATEGIES, window: window_, components, breakdown, gamma, rescore, higher, makeOrder }
})(typeof globalThis !== 'undefined' ? globalThis : window)
