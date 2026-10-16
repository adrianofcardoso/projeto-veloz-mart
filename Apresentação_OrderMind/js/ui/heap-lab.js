/* MPS · APRESENTAÇÃO · Diagrama interativo do heap: inclusão, remoção e re-priorização */
;(function (g) {
  const { ref, reactive, computed, inject, onMounted } = Vue
  const MPS = g.MPS
  const { heap: H, scoring: S } = MPS
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const MAX = 15
  const slot = (i) => { const lvl = Math.floor(Math.log2(i + 1)), n = 2 ** lvl; return { x: ((i + 1 - n + 0.5) / n) * 100, y: 44 + lvl * 86 } }

  MPS.ui.HeapLab = {
    setup() {
      const store = inject('store')
      const items = reactive([])
      const clock = ref(0), busy = ref(false), fast = ref(false), manual = ref(false), stepPending = ref(false), manualActive = ref(false), manualSteps = ref([]), manualIndex = ref(0), hl = ref({}), log = ref([])
      let nextId = 1, logId = 0
      const say = (msg) => { log.value = [{ id: ++logId, msg }, ...log.value].slice(0, 6) }
      const key = (o) => S.STRATEGIES.mps.key(o, clock.value, store.weights)
      const mk = () => { const o = S.makeOrder(nextId++, clock.value); o.score = key(o); return o }
      const t = (ms) => sleep(fast.value ? ms * 0.35 : ms)
let resolveStep = null
const nextStep = () => {
  if (resolveStep) {
    const r = resolveStep
    resolveStep = null
    stepPending.value = false
    r()
  }
}
const waitStep = () => new Promise((res) => { resolveStep = res; stepPending.value = true })

      async function play(gen) {
        busy.value = true
        try {
          for (;;) {
            const r = gen.next()
            if (r.done) return r.value
            const s = r.value
            if (s.type === 'compare' || s.type === 'swap') {
              const a = items[s.i], b = items[s.j]
              if (a && b) { hl.value = { [a.id]: s.type, [b.id]: s.type }; if (s.type === 'swap') say('swap  #' + a.id + ' ⇄ #' + b.id) }
              await (manual.value ? waitStep() : t(s.type === 'swap' ? 620 : 320))
            } else if (s.type === 'place') { hl.value = { [items[s.i].id]: 'compare' }; await (manual.value ? waitStep() : t(520)) }
            else if (s.type === 'extract') { say('despachado  #' + s.item.id + '  (score ' + s.item.score.toFixed(0) + ')'); await (manual.value ? waitStep() : t(420)) }
          }
        } finally { if (resolveStep) { resolveStep(); resolveStep = null }; stepPending.value = false; hl.value = {}; busy.value = false }
      }

      async function add() {
        if (busy.value || items.length >= MAX) return
        if (manual.value) {
          const o = S.makeOrder(nextId++, clock.value)
          o.score = S.STRATEGIES.mps.key(o, clock.value, store.weights)
          startManual((simItems) => H.insert(simItems, o, S.higher), 'Inclusão', items, clock.value)
          return
        }
        const o = mk()
        say('INCLUSÃO  #' + o.id + ' (score ' + o.score.toFixed(0) + ') → sift-up · O(log n)')
        await play(H.insert(items, o, S.higher))
      }
      async function decay() {
        if (busy.value || !items.length) return
        if (manual.value) {
          const oldClock = clock.value
          clock.value += 10
          startManual((simItems) => { S.rescore(simItems, clock.value, store.weights, 'mps'); return H.heapify(simItems, S.higher) }, 'Re-priorização', items, oldClock)
          return
        }
        clock.value += 10
        S.rescore(items, clock.value, store.weights, 'mps')
        say('RE-PRIORIZAÇÃO  +10 min: janelas encolheram → heapify · O(n)')
        await play(H.heapify(items, S.higher))
      }
      async function deadlineChange() {
        if (busy.value || items.length < 2) return
        let i = 1
        for (let k = 2; k < items.length; k++) if (items[k].score < items[i].score) i = k
        const o = items[i]
        o.deadline = clock.value + 3
        o.score = key(o)
        say('PRAZO MUDOU  #' + o.id + ' → 3 min restantes → update-key · O(log n)')
        await play(H.update(items, i, S.higher))
      }
      async function dispatch() {
        if (busy.value || !items.length) return
        if (manual.value) {
          startManual((simItems) => H.extractMax(simItems, S.higher), 'Remoção', items, clock.value)
          return
        }
        say('REMOÇÃO  extract-max → último vai à raiz → sift-down · O(log n)')
        await play(H.extractMax(items, S.higher))
      }
      function reset() {
        if (busy.value) return
        items.splice(0); clock.value = 0; nextId = 1; log.value = []
        for (let i = 0; i < 7; i++) H.runSync(H.insert(items, mk(), S.higher))
        say('heap inicial com 7 pedidos')
      }
      onMounted(reset)

      const pos = (i) => { const s = slot(i); return { left: s.x + '%', top: s.y + 'px' } }
      const edges = computed(() => items.slice(1).map((_, k) => { const i = k + 1, a = slot(H.parent(i)), b = slot(i); return { i, x1: a.x, y1: a.y, x2: b.x, y2: b.y } }))
      const cls = (o, i) => ({ compare: hl.value[o.id] === 'compare', swap: hl.value[o.id] === 'swap', overdue: o.deadline < clock.value, root: i === 0 })
      const fmt = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0')
      const top = computed(() => items[0])
      const win = (o) => o.deadline - clock.value
      const cloneItems = (arr) => arr.map((o) => ({ ...o }))
      const applyManualStep = (idx) => {
        if (!manualSteps.value.length) return
        const st = manualSteps.value[idx]
        items.splice(0, items.length, ...st.items.map((o) => ({ ...o })))
        hl.value = { ...st.hl }
        clock.value = st.clock
        log.value = [{ id: idx, msg: st.msg }]
        manualIndex.value = idx
      }
      const finishManual = () => {
        manualActive.value = false
        manualSteps.value = []
        stepPending.value = false
        if (resolveStep) { resolveStep(); resolveStep = null }
        hl.value = {}
      }
      const prevManual = () => {
        if (manualIndex.value > 0) applyManualStep(manualIndex.value - 1)
      }
      const nextManual = () => {
        if (manualIndex.value < manualSteps.value.length - 1) applyManualStep(manualIndex.value + 1)
        else finishManual()
      }
      const startManual = (genFactory, label, initialItems, initialClock) => {
        manualSteps.value = []
        manualIndex.value = 0
        busy.value = true
        try {
          const baseItems = (initialItems ? (Array.isArray(initialItems) ? initialItems : Array.from(initialItems)) : items).map((o) => ({ ...o }))
          const baseClock = (typeof initialClock === 'number') ? initialClock : clock.value
          const simItems = baseItems.map((o) => ({ ...o }))
          const gen = genFactory(simItems)
          const steps = [{ items: baseItems.map((o) => ({ ...o })), hl: {}, clock: baseClock, msg: 'Estado inicial' }]
          let hlState = {}
          for (;;) {
            const r = gen.next()
            const step = r.value
            if (step) {
              if (step.type === 'compare' || step.type === 'swap') {
                const a = simItems[step.i], b = simItems[step.j]
                if (a && b) hlState = { [a.id]: step.type, [b.id]: step.type }
              } else if (step.type === 'place') {
                hlState = { [simItems[step.i].id]: 'compare' }
              } else if (step.type === 'extract') {
                hlState = {}
              }
            }
            steps.push({ items: simItems.map((o) => ({ ...o })), hl: { ...hlState }, clock: clock.value, msg: label })
            if (r.done) break
          }
          manualSteps.value = steps
          manualActive.value = true
          applyManualStep(0)
        } finally {
          busy.value = false
        }
      }
      const onManualToggle = () => { if (!manual.value && manualActive.value) finishManual() }
      return { items, clock, busy, fast, manual, stepPending, manualActive, manualSteps, manualIndex, log, add, decay, deadlineChange, dispatch, reset, pos, edges, cls, fmt, top, win, MAX, nextManual, prevManual, finishManual, onManualToggle, nextStep, SIZE: S.SIZE }
    },
    template: `
      <div class="slide lab">
        <header class="slide-head">
          <p class="eyebrow">Diagrama interativo · Heap</p>
          <h2>Inclusão, remoção e re-priorização<br/><span class="dim">na mesma árvore.</span></h2>
        </header>
        <div class="toolbar">
          <button class="btn primary" :disabled="busy || manualActive || items.length >= MAX" @click="add">+ Add Order</button>
          <button class="btn" :disabled="busy || manualActive || !items.length" @click="decay">⏱ Simulate Time Decay</button>
          <button class="btn" :disabled="busy || manualActive || items.length < 2" @click="deadlineChange">⚡ Prazo mudou</button>
          <button class="btn" :disabled="busy || !items.length" @click="dispatch">Despachar topo</button>
          <button class="btn ghost" :disabled="busy" @click="reset">Reiniciar</button>
          <label class="toggle"><input type="checkbox" v-model="fast" /><i></i><span>Rápido</span></label>
          <span class="chip clock">T+ {{ fmt(clock) }}</span>
        </div>
        <p class="analogy">Analogia: a fila é uma pirâmide de troféus. O pedido "mais importante agora" fica no topo e o novo pedido sobe comparando com o "pai".</p>
        <div class="legend color-map">
          <span><i class="dot p"></i>Verde / P - pequeno · prioridade alta (peso 1.0) · 1 bancada</span>
          <span><i class="dot m"></i>Azul / M - médio · prioridade média (peso 0.6) · 2 bancadas</span>
          <span><i class="dot g"></i>Laranja / G - grande · prioridade baixa (peso 0.3) · 4 bancadas</span>
          <span><i class="dot r"></i>Vermelho - prazo vencido/atrasado · urgência máxima</span>
        </div>
        <div class="lab-grid">
          <div class="glass tree" role="img" aria-label="Max-heap de pedidos: o maior score fica na raiz">
            <svg class="edges" viewBox="0 0 100 380" preserveAspectRatio="none">
              <line v-for="e in edges" :key="e.i" :x1="e.x1" :y1="e.y1" :x2="e.x2" :y2="e.y2" vector-effect="non-scaling-stroke" />
            </svg>
            <TransitionGroup name="pop" tag="div" class="nodes">
              <div v-for="(o, i) in items" :key="o.id" class="node" :class="[cls(o, i), 'sz-' + o.size]" :style="pos(i)">
                <b>{{ Math.round(o.score) }}</b><span>#{{ o.id }} · {{ o.size }}</span>
              </div>
            </TransitionGroup>
            <p v-if="!items.length" class="empty">Heap vazio — adicione um pedido.</p>
          </div>
          <aside class="side">
            <div class="glass info">
              <h4>Topo da fila (próximo a despachar)</h4>
              <template v-if="top">
                <p class="big">Pedido #{{ top.id }} · {{ top.size }}</p>
                <p class="dim">priorityScore (IA): <b>{{ top.priorityScore }}</b><br/>
                  dispatchWindow: <b :class="{ late: win(top) <= 10 }">{{ win(top) > 0 ? win(top) + ' min' : 'vencida há ' + -win(top) + ' min' }}</b><br/>
                  doca: <b>{{ SIZE[top.size].units }}</b> bancada(s) · score OrderMind <b>{{ top.score.toFixed(1) }}</b></p>
              </template>
              <p v-else class="dim">—</p>
            </div>
            <div class="glass logbox">
              <h4>Log de operações</h4>
              <TransitionGroup name="list" tag="ul"><li v-for="(l, i) in log" :key="l.id" :class="{ first: i === 0 }">{{ l.msg }}</li></TransitionGroup>
            </div>
          </aside>
        </div>
        <div class="array-wrap">
          <span class="mini">Mesma árvore como array — filhos de i: 2i+1 e 2i+2 · máximo no índice 0</span>
          <TransitionGroup name="flip" tag="div" class="array">
            <div v-for="(o, i) in items" :key="o.id" class="cell" :class="['sz-' + o.size, { root: i === 0 }]"><em>{{ i }}</em><b>{{ Math.round(o.score) }}</b></div>
          </TransitionGroup>
        </div>
        <div class="toolbar manual-toolbar">
          <label class="toggle"><input type="checkbox" v-model="manual" @change="onManualToggle" /><i></i><span>Manual</span></label>
          <button class="btn" :disabled="!manualActive || manualIndex === 0" @click="prevManual">◀ Anterior</button>
          <button class="btn primary" :disabled="!manualActive" @click="nextManual">{{ manualIndex === manualSteps.length - 1 ? 'Concluir' : 'Próximo ▶' }}</button>
          <span class="chip" v-if="manualActive">Passo {{ manualIndex + 1 }} / {{ manualSteps.length }}</span>
        </div>
      </div>`,
  }
})(typeof globalThis !== 'undefined' ? globalThis : window)
