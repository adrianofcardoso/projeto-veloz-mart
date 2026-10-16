/* MPS · APRESENTAÇÃO · Gantt da doca + dashboard de métricas (Pergunta III) */
;(function (g) {
  const { computed, inject } = Vue
  const MPS = g.MPS
  const Sim = MPS.sim

  MPS.ui.GanttSlide = {
    components: { SimBar: MPS.ui.SimBar, GanttChart: MPS.ui.GanttChart },
    setup() {
      const r = inject('runner')
      return { sim: r.sim }
    },
    template: `
      <div class="slide gantt-slide">
        <header class="slide-head">
          <p class="eyebrow">Diagrama · Gantt da doca de embalagem</p>
          <h2>Quem ocupa a doca,<br/><span class="dim">e quando.</span></h2>
        </header>
        <sim-bar />
        <p class="analogy">Analogia: cada bloco é um pedido ocupando mesas (bancadas) da doca. O contorno tracejado mostra quem perdeu o prazo.</p>
        <div class="gantt-grid">
          <article class="glass gcard"><header><h3>FIFO</h3><small>ordem de chegada</small></header><gantt-chart :engine="sim.fifo" :now="sim.t" /></article>
          <article class="glass gcard mps"><header><h3>OrderMind</h3><small>heap multi-chave</small></header><gantt-chart :engine="sim.mps" :now="sim.t" /></article>
        </div>
        <div class="legend big">
          <span><i class="g P"></i>P · prioridade alta (1.0) · 1 bancada · 2 min</span><span><i class="g M"></i>M · prioridade média (0.6) · 2 bancadas · 3 min</span><span><i class="g G"></i>G · prioridade baixa (0.3) · 4 bancadas · 5 min</span>
          <span><i class="g lateKey"></i>contorno tracejado = expedido depois do prazo</span>
        </div>
      </div>`,
  }

  MPS.ui.Dashboard = {
    components: { SimBar: MPS.ui.SimBar, Metric: MPS.ui.Metric, Sparkline: MPS.ui.Sparkline, WeightPanel: MPS.ui.WeightPanel },
    setup() {
      const sim = inject('runner').sim
      const cols = [
        { k: 'fifo', name: 'FIFO', sub: 'Ordenação simples por tempo', tone: 'neutral' },
        { k: 'composite', name: 'Composto', sub: 'priorityScore × 1/dispatchWindow', tone: 'neutral' },
        { k: 'mps', name: 'OrderMind', sub: 'Heap multi-chave (α, β, γ)', tone: 'accent' },
      ]
      const stats = computed(() => {
        const o = {}
        for (const c of cols) { const e = sim[c.k]; o[c.k] = { delay: Sim.avgDelay(e), thr: Sim.throughput(e, sim.t), ontime: Sim.onTimePct(e), util: Sim.utilization(e, sim.t), queue: e.queue.length } }
        return o
      })
      return { sim, cols, stats }
    },
    template: `
      <div class="slide dash">
        <header class="slide-head">
          <p class="eyebrow">Pergunta III · Quais métricas provam que é melhor?</p>
          <h2>Atraso médio e throughput/hora.<br/><span class="dim">Mesmos pedidos, mesma doca.</span></h2>
        </header>
        <sim-bar />
        <p class="analogy">Analogia: mesmos pedidos e mesma doca; só muda a ordem da fila para ver quem entrega mais no prazo.</p>
        <div class="dash-grid">
          <article v-for="c in cols" :key="c.k" class="glass col" :class="{ mps: c.k === 'mps' }">
            <header><h3>{{ c.name }}</h3><small>{{ c.sub }}</small></header>
            <div class="metrics">
              <metric label="Atraso Médio" :value="stats[c.k].delay.toFixed(1)" unit=" min" :tone="c.tone" />
              <metric label="Throughput" :value="stats[c.k].thr.toFixed(1)" unit=" ped/h" :tone="c.tone" />
              <metric label="Dentro do prazo" :value="stats[c.k].ontime.toFixed(0)" unit="%" :tone="c.tone" />
              <metric label="Uso da doca" :value="stats[c.k].util.toFixed(0)" unit="%" :tone="c.tone" />
            </div>
            <p class="mini">Na fila agora: {{ stats[c.k].queue }} pedidos</p>
          </article>
          <section class="glass chart">
            <header><h4>Atraso médio acumulado (min)</h4>
              <span class="legend"><span><i class="f"></i>FIFO</span><span><i class="c"></i>Composto</span><span><i class="m"></i>OrderMind</span></span></header>
            <sparkline :history="sim.history" />
          </section>
          <weight-panel />
        </div>
      </div>`,
  }
})(typeof globalThis !== 'undefined' ? globalThis : window)
