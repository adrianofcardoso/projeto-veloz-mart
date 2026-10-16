/* MPS · APRESENTAÇÃO · Primitivos (sem lógica de negócio) */
;(function (g) {
  const { computed, inject, onActivated, onDeactivated } = Vue
  const MPS = (g.MPS = g.MPS || {})
  const ui = (MPS.ui = MPS.ui || {})

  /** Slider estilo iOS */
  ui.IosSlider = {
    props: {
      modelValue: { type: Number, required: true }, min: { type: Number, default: 0 }, max: { type: Number, default: 1 },
      step: { type: Number, default: 0.05 }, label: String, hint: String, color: { type: String, default: '#0A84FF' },
    },
    emits: ['update:modelValue'],
    setup(props) {
      const pct = computed(() => (props.max === props.min ? 0 : ((props.modelValue - props.min) / (props.max - props.min)) * 100))
      return { pct }
    },
    template: `
      <label class="ios-slider" :style="{ '--pct': pct + '%', '--c': color }">
        <span class="ios-head"><span>{{ label }}</span><b>{{ modelValue.toFixed(2) }}</b></span>
        <input type="range" :min="min" :max="max" :step="step" :value="modelValue" @input="$emit('update:modelValue', +$event.target.value)" />
        <small v-if="hint">{{ hint }}</small>
      </label>`,
  }

  /** Painel α / β (γ derivado) ligado ao store global */
  ui.WeightPanel = {
    components: { IosSlider: ui.IosSlider },
    setup() {
      const w = inject('store').weights
      const r2 = (x) => Math.round(x * 100) / 100
      const alpha = computed({ get: () => w.alpha, set: (v) => { w.alpha = v; if (w.beta > r2(1 - v)) w.beta = r2(1 - v) } })
      const beta = computed({ get: () => w.beta, set: (v) => (w.beta = Math.min(v, r2(1 - w.alpha))) })
      const betaMax = computed(() => r2(1 - w.alpha))
      const gamma = computed(() => Math.max(0, r2(1 - w.alpha - w.beta)))
      const reset = () => { w.alpha = MPS.scoring.DEFAULT_WEIGHTS.alpha; w.beta = MPS.scoring.DEFAULT_WEIGHTS.beta }
      return { alpha, beta, betaMax, gamma, reset }
    },
    template: `
      <section class="glass weights">
        <header><h4>Pesos do score (OrderMind)</h4><button class="link" @click="reset">Restaurar</button></header>
        <ios-slider v-model="alpha" label="α · priorityScore (IA)" hint="Valor, SLA, distância e reputação" color="#BF5AF2" />
        <ios-slider v-model="beta" :max="betaMax" label="β · Urgência (dispatchWindow)" hint="Quanto o prazo restante pesa" color="#FF453A" />
        <div class="gamma"><span>γ · Espaço na doca (tamanho) <em>= 1 − α − β</em></span><b>{{ gamma.toFixed(2) }}</b></div>
        <div class="gamma-bar"><i :style="{ width: gamma * 100 + '%' }"></i></div>
      </section>`,
  }

  ui.Metric = {
    props: { label: String, value: String, unit: String, tone: String },
    template: `<div class="metric" :class="tone"><span class="m-label">{{ label }}</span><span class="m-value">{{ value }}<small>{{ unit }}</small></span></div>`,
  }

  /** Atraso médio acumulado: FIFO, Composto, MPS */
  ui.Sparkline = {
    props: { history: { type: Array, required: true } },
    setup(props) {
      const W = 520, H = 120, pad = 6
      const paths = computed(() => {
        const h = props.history
        if (h.length < 2) return { f: '', c: '', m: '' }
        const max = Math.max(1, ...h.map((p) => Math.max(p.f, p.c, p.m))) * 1.15
        const t0 = h[0].t, t1 = h[h.length - 1].t
        const x = (t) => pad + ((t - t0) / Math.max(1, t1 - t0)) * (W - pad * 2)
        const y = (v) => H - pad - (v / max) * (H - pad * 2)
        const line = (k) => h.map((p, i) => (i ? 'L' : 'M') + x(p.t).toFixed(1) + ' ' + y(p[k]).toFixed(1)).join(' ')
        return { f: line('f'), c: line('c'), m: line('m') }
      })
      return { paths, W, H }
    },
    template: `
      <svg class="spark" :viewBox="'0 0 ' + W + ' ' + H" preserveAspectRatio="none" role="img" aria-label="Atraso médio acumulado ao longo do turno: FIFO, Composto e OrderMind">
        <line v-for="n in 3" :key="n" x1="0" :x2="W" :y1="n * H / 4" :y2="n * H / 4" class="grid" vector-effect="non-scaling-stroke" />
        <path :d="paths.f" class="l-fifo" vector-effect="non-scaling-stroke" />
        <path :d="paths.c" class="l-comp" vector-effect="non-scaling-stroke" />
        <path :d="paths.m" class="l-mps" vector-effect="non-scaling-stroke" />
      </svg>`,
  }

  /** Gantt da doca: eixo X = tempo (últimos 48 min), eixo Y = bancadas */
  ui.GanttChart = {
    props: { engine: { type: Object, required: true }, now: { type: Number, required: true } },
    setup(props) {
      const W = 600, LANE = 26, SPAN = 48, CAP = MPS.scoring.DOCK_CAPACITY
      const H = CAP * LANE
      const rects = computed(() => {
        const t0 = props.now - SPAN, out = []
        for (const b of props.engine.log) {
          if (b.end <= t0) continue
          const s = Math.max(b.start, t0)
          out.push({ id: b.id, size: b.size, late: b.late,
            x: ((s - t0) / SPAN) * W, w: ((Math.min(b.end, props.now) - s) / SPAN) * W - 2,
            y: b.lane * LANE + 2, h: b.units * LANE - 4 })
        }
        return out
      })
      const ticks = computed(() => {
        const t0 = props.now - SPAN, out = []
        for (let t = Math.ceil(t0 / 10) * 10; t <= props.now; t += 10) out.push({ t, x: ((t - t0) / SPAN) * W })
        return out
      })
      return { W, H, LANE, CAP, rects, ticks }
    },
    template: `
      <svg class="gantt" :viewBox="'0 0 ' + W + ' ' + (H + 18)" role="img" aria-label="Gráfico de Gantt da doca de embalagem">
        <g v-for="n in CAP" :key="'l' + n"><rect class="lane" :x="0" :y="(n - 1) * LANE" :width="W" :height="LANE" /><text class="lane-t" x="4" :y="(n - 1) * LANE + 17">B{{ n }}</text></g>
        <g v-for="k in ticks" :key="k.t"><line class="tick" :x1="k.x" :x2="k.x" y1="0" :y2="H" /><text class="tick-t" :x="k.x" :y="H + 13">{{ k.t }}</text></g>
        <g v-for="r in rects" :key="r.id" class="blk" :class="['g-' + r.size, { late: r.late }]">
          <rect :x="r.x" :y="r.y" :width="Math.max(2, r.w)" :height="r.h" rx="5" />
          <text v-if="r.w > 30" :x="r.x + 6" :y="r.y + r.h / 2 + 4">#{{ r.id }} {{ r.size }}</text>
        </g>
      </svg>`,
  }

  /** Barra de controle da simulação compartilhada (MPS × FIFO × Composto) */
  ui.SimBar = {
    setup() {
      const r = inject('runner')
      onActivated(() => r.enter())
      onDeactivated(() => r.leave())
      const clock = computed(() => String(Math.floor(r.sim.t / 60)).padStart(2, '0') + 'h' + String(r.sim.t % 60).padStart(2, '0'))
      const gain = computed(() => {
        const f = MPS.sim.avgDelay(r.sim.fifo), m = MPS.sim.avgDelay(r.sim.mps)
        return f > 0.05 ? Math.round(((f - m) / f) * 100) : null
      })
      return { r, clock, gain }
    },
    template: `
      <div class="toolbar">
        <button class="btn primary" @click="r.toggle()">{{ r.state.playing ? '❚❚ Pausar' : '▶ Continuar' }}</button>
        <div class="seg" role="group" aria-label="Velocidade"><button v-for="s in [1, 3, 10]" :key="s" :class="{ on: r.state.speed === s }" @click="r.state.speed = s">{{ s }}×</button></div>
        <button class="btn ghost" @click="r.reset()">Reiniciar</button>
        <span class="chip clock">Turno {{ clock }}</span>
        <span class="chip" v-if="gain !== null" :class="gain > 0 ? 'good' : 'bad'">{{ gain > 0 ? '−' : '+' }}{{ Math.abs(gain) }}% atraso médio (OrderMind vs FIFO)</span>
      </div>`,
  }
})(typeof globalThis !== 'undefined' ? globalThis : window)
