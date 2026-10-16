/* MPS · APRESENTAÇÃO · Fila ao vivo: mesma lista, três critérios de ordenação */
;(function (g) {
  const { ref, reactive, computed, inject } = Vue
  const MPS = g.MPS
  const { heap: H, scoring: S } = MPS
  const LIMIT = 9

  MPS.ui.LiveQueue = {
    components: { WeightPanel: MPS.ui.WeightPanel },
    setup() {
      const store = inject('store')
      const clock = ref(0), mode = ref('mps')
      let nextId = 1
      const orders = reactive([])
      const seed = () => { orders.splice(0); clock.value = 0; nextId = 1; for (let i = 0; i < 8; i++) orders.push(S.makeOrder(nextId++, 0)) }
      seed()

      const ranked = computed(() => {
        const now = clock.value, w = store.weights, strat = S.STRATEGIES[mode.value]
        const scored = orders.map((o) => { const c = { ...o }; c.score = strat.key(c, now, w); c.parts = S.breakdown(c, now, w); return c })
        return H.drain(scored, S.higher) // heapify + n × extract-max
      })
      const add = () => { if (orders.length < LIMIT) orders.push(S.makeOrder(nextId++, clock.value)) }
      const advance = () => { clock.value += 10 }
      const dispatch = () => { const t = ranked.value[0]; if (t) orders.splice(orders.findIndex((o) => o.id === t.id), 1) }
      const win = (o) => o.deadline - clock.value
      const winTxt = (o) => (win(o) > 0 ? win(o) + ' min' : 'atrasado ' + -win(o) + ' min')
      const show = (o) => S.STRATEGIES[mode.value].show(o)
      const announce = computed(() => {
        const t = ranked.value[0]
        return t ? 'Próximo a despachar: pedido ' + t.id + ', tamanho ' + t.size + ', prazo ' + winTxt(t) : 'Fila vazia'
      })
      const modes = Object.keys(S.STRATEGIES).map((k) => ({ k, label: S.STRATEGIES[k].label }))
      return { ranked, clock, mode, modes, add, advance, dispatch, seed, win, winTxt, show, announce, LIMIT, n: computed(() => orders.length), long: computed(() => S.STRATEGIES[mode.value].long), SIZE: S.SIZE }
    },
    template: `
      <div class="slide queue">
        <header class="slide-head">
          <p class="eyebrow">Pergunta I · Como ordenar com múltiplos critérios?</p>
          <h2>Mesmos pedidos,<br/><span class="dim">ordens diferentes.</span></h2>
        </header>
        <div class="queue-grid">
          <section class="glass list-card">
            <div class="toolbar tight">
              <div class="seg" role="group" aria-label="Critério de ordenação"><button v-for="m in modes" :key="m.k" :class="{ on: mode === m.k }" @click="mode = m.k">{{ m.label }}</button></div>
              <button class="btn primary" :disabled="n >= LIMIT" @click="add">+ Pedido</button>
              <button class="btn" @click="advance">+10 min</button>
              <button class="btn" :disabled="!n" @click="dispatch">Despachar topo</button>
              <button class="btn ghost" @click="seed">Reiniciar</button>
              <span class="chip clock">T+ {{ clock }} min</span>
            </div>
            <p class="mini mode-note">{{ long }}<span v-if="mode !== 'mps'"> · os sliders só afetam o OrderMind</span></p>
            <p class="analogy">Analogia: mesma lista de pedidos, três jeitos de ordenar. Veja quem passa na frente em cada um.</p>
            <TransitionGroup name="rank" tag="ol" class="rows">
              <li v-for="(o, i) in ranked" :key="o.id" class="row" :class="{ first: i === 0 }">
                <span class="rank">{{ i + 1 }}</span>
                <span class="chip sz" :class="'sz-' + o.size" :title="SIZE[o.size].label + ' · ' + SIZE[o.size].units + ' bancada(s)'">{{ o.size }}</span>
                <div class="who"><b>Pedido #{{ o.id }}</b><small :class="{ late: win(o) <= 10 }">IA {{ o.priorityScore }} · {{ winTxt(o) }} · doca {{ SIZE[o.size].units }}</small></div>
                <div class="stack" :class="{ off: mode !== 'mps' }"><i class="ia" :style="{ width: o.parts.ia + '%' }"></i><i class="u" :style="{ width: o.parts.urgency + '%' }"></i><i class="s" :style="{ width: o.parts.size + '%' }"></i></div>
                <span class="score">{{ show(o) }}</span>
              </li>
            </TransitionGroup>
            <p v-if="!n" class="empty">Fila vazia.</p>
            <div class="legend"><span><i class="ia"></i>priorityScore (IA)</span><span><i class="u"></i>Urgência</span><span><i class="s"></i>Doca</span></div>
            <p class="sr-only" aria-live="polite">{{ announce }}</p>
          </section>
          <div class="side-panel">
            <weight-panel />
            <div class="glass prose">
              <h4>Passo a passo para ver a fila funcionando</h4>
              <ol class="tight-list">
                <li>Clique em <b>+ Pedido</b> para adicionar um novo pedido e veja quem fica no topo em cada modo.</li>
                <li>Use o seletor <b>FIFO / Composto / OrderMind</b> para comparar a ordem.</li>
                <li>Clique em <b>+10 min</b> para encurtar os prazos e observar a reordenação.</li>
                <li>Clique em <b>Despachar topo</b> para remover o próximo pedido.</li>
                <li>Use <b>Reiniciar</b> para voltar à lista inicial.</li>
              </ol>
              <p class="mini">Os sliders de pesos (α e β) afetam apenas o modo OrderMind.</p>
            </div>
          </div>
        </div>
      </div>`,
  }
})(typeof globalThis !== 'undefined' ? globalThis : window)
