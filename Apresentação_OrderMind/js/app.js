/* MPS · SHELL · store global, navegação, tema */
;(function (g) {
  const { createApp, reactive, ref, computed, provide, onMounted, onBeforeUnmount } = Vue
  const MPS = g.MPS
  const ui = MPS.ui

  const slides = [
    { id: 'cover', title: 'Por que isso importa', comp: 'SlideCover', who: 1, notes: ['Mostre a dor: pedido com 8 min de prazo fica atras de pedidos folgados. Analogia: fila do caixa.', 'Adiante o final sem detalhar: cerca de 5x menos atraso medio (8,7 para 1,6 min).'] },
    { id: 'glossary', title: 'Apêndice: Glossário', comp: 'SlideGlossary', who: 0, notes: ['Termos em palavras simples: SLA, throughput, heap, FIFO, time decay e doca.', 'Use para alinhar vocabulário com o cliente final.'] },
    { id: 'scenario', title: 'Conheça o pedido', comp: 'SlideScenario', who: 1, notes: ['Todo pedido traz 3 etiquetas: importancia (nota IA), tempo que falta, tamanho P/M/G.', 'Analogia: pacote com 3 etiquetas coladas. Pergunta ao cliente: como ordenar, re-enfileirar e provar?'] },
    { id: 'criteria', title: 'Como decidimos', comp: 'SlideCriteria', who: 2, notes: ['Uma nota so combina importancia, urgencia e espaco: score = a.IA + beta.urgencia + gama.doca.', 'Exemplo direto ao ponto: Pedido A (IA 85, prazo 12 min, P) ~ 78; Pedido B (IA 50, prazo 90 min, G) ~ 30. A sai primeiro.'] },
    { id: 'strategy', title: 'Estratégia escolhida', comp: 'SlideAlgorithm', who: 2, notes: ['A fila e uma piramide: quem mais importa agora fica no topo; o resto fica abaixo.', 'Quatro eventos movem tudo: chegar, o tempo passar, o prazo mudar e a doca liberar. Analogia: podio de corrida.'] },
    { id: 'flow', title: 'Apêndice: Fluxo', comp: 'SlideFlow', who: 0, notes: ['Apêndice para quem quiser detalhe tecnico: operacoes, custos e diagrama completo.', 'Explique apenas se perguntarem: inclusao, re-priorizacao e remocao.'] },
    { id: 'heap-add', title: 'Entra na fila', comp: 'HeapLab', who: 2, notes: ['Clique Add Order e acompanhe o pedido subir comparando com o pai ate achar seu degrau.', 'Analogia: escadinha; o novo pedido sobe ate encontrar quem e mais importante que ele.'] },
    { id: 'queue', title: 'Fila ao vivo', comp: 'LiveQueue', who: 3, notes: ['Troque entre FIFO, Composto e OrderMind para ver a mesma lista em ordens diferentes.', 'Use +10 min e mostre as janelas encolhendo. Analogia: tres criterios diferentes de fila no parque de diversoes.'] },
    { id: 'gantt', title: 'A doca libera', comp: 'GanttSlide', who: 4, notes: ['A doca funciona como mesas do restaurante: blocos sao pedidos ocupando bancadas.', 'Topo do heap vira o proximo que cabe; se nao couber, tenta o proximo. Tracejado = perdeu o prazo.'] },
    { id: 'dash', title: 'Resultado de 8 horas', comp: 'Dashboard', who: 4, notes: ['Mesmos pedidos e mesma doca mudando so a ordem: compare atraso, no prazo e throughput.', 'Analogia: mesma corrida com carros diferentes; a ordem decide quem chega primeiro.'] },
    { id: 'tradeoffs', title: 'Por que essa solução', comp: 'SlideTradeoffs', who: 5, notes: ['FIFO e simples, otimizacao e teorica, heap equilibra desempenho e manutencao.', 'Analogia: carro basico, carro de F1 e SUV para o uso diario; escolhemos o que entrega mais sem complicar.'] },
    { id: 'big-o', title: 'Big O', comp: 'SlideBigO', who: 5, notes: ['Heap mexe so nos elos necessarios (log n); reordenar tudo a cada evento e desperdicio.', 'Com n=50.000, o custo explode em estrategias O(n) e O(n²), enquanto o heap se mantem eficiente.'] },
    { id: 'ab-test', title: 'Teste A/B', comp: 'SlideAB', who: 5, notes: ['Validar como receita nova: uma cozinha piloto por 2 semanas com 3 metricas e 3 criterios de leitura.', 'Medir melhoria, latencia aceitavel e preservar ou ampliar throughput.'] },
    { id: 'accessibility', title: 'Acessibilidade', comp: 'SlideAccessibility', who: 5, notes: ['Nao depender so de cor: usar icone e texto, teclado, aria-live e texto alternativo.', 'Analogia: placa de transito com símbodo e palavra, compreensivel por todos.'] },
    { id: 'closing', title: 'Como colocar em prática', comp: 'SlideClosing', who: 5, notes: ['Feche resumindo as 3 perguntas respondidas: ordenar, re-enfileirar e provar.', 'Seja honesto: e simulacao com semente fixa; proximos passos sao replay real e teste A/B.'] },
  ]
  const App = {
    setup() {
      const store = reactive({ weights: { ...MPS.scoring.DEFAULT_WEIGHTS } })
      provide('store', store)
      provide('runner', MPS.createRunner(store))
      const showNotes = ref(false)
      const index = ref(0)
      const dir = ref('next')
      const dark = ref(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches)
      const reduceMotionDefault = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches
      const a11y = reactive({ open: false, highContrast: false, largeText: false, reduceMotion: reduceMotionDefault })
  const speaking = ref(false)

      const go = (i) => {
        if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); speaking.value = false }
        const n = Math.max(0, Math.min(slides.length - 1, i))
        if (n === index.value) return
        dir.value = n > index.value ? 'next' : 'prev'
        index.value = n
        try { history.replaceState(null, '', '#' + slides[n].id) } catch (e) {}
      }
      const next = () => go(index.value + 1)
      const prev = () => go(index.value - 1)
      const applyTheme = () => document.documentElement.setAttribute('data-theme', dark.value ? 'dark' : 'light')
      const toggleTheme = () => { dark.value = !dark.value; applyTheme() }
      const applyA11y = () => {
        const el = document.documentElement
        el.classList.toggle('a11y-high-contrast', a11y.highContrast)
        el.classList.toggle('a11y-large-text', a11y.largeText)
        el.classList.toggle('a11y-reduce-motion', a11y.reduceMotion)
        try { localStorage.setItem('a11y', JSON.stringify({ highContrast: a11y.highContrast, largeText: a11y.largeText, reduceMotion: a11y.reduceMotion })) } catch (e) {}
      }
      const openA11y = () => { a11y.open = true }
      const openWave = () => {
        const target = encodeURIComponent(location.href)
        window.open('https://wave.webaim.org/report?url=' + target, '_blank', 'noopener,noreferrer')
      }
      const toggleSpeak = () => {
        if (!('speechSynthesis' in window)) { alert('Leitura de áudio não suportada neste navegador.'); return }
        if (speaking.value) { window.speechSynthesis.cancel(); speaking.value = false; return }
        const stage = document.getElementById('main-stage')
        const text = (stage ? stage.innerText : '') || ''
        const clean = text.replace(/\s+/g, ' ').trim()
        if (!clean) return
        const utter = new SpeechSynthesisUtterance(clean)
        utter.lang = 'pt-BR'
        utter.rate = 1
        utter.onend = () => { speaking.value = false }
        utter.onerror = () => { speaking.value = false }
        speaking.value = true
        window.speechSynthesis.speak(utter)
      }

      const onKey = (e) => {
        if (e.key === 'Escape' && a11y.open) { a11y.open = false; return }
        if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); next() }
        else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); prev() }
        else if (e.key === 'Home') go(0)
        else if (e.key === 'End') go(slides.length - 1)
        else if (e.key === 'n' || e.key === 'N') showNotes.value = !showNotes.value
        else if (/^[1-9]$/.test(e.key)) go(+e.key - 1)
      }
      onMounted(() => {
        applyTheme()
        try {
          const saved = JSON.parse(localStorage.getItem('a11y') || '{}')
          if (typeof saved.highContrast === 'boolean') a11y.highContrast = saved.highContrast
          if (typeof saved.largeText === 'boolean') a11y.largeText = saved.largeText
          if (typeof saved.reduceMotion === 'boolean') a11y.reduceMotion = saved.reduceMotion
        } catch (e) {}
        applyA11y()
        const h = location.hash.slice(1), i = slides.findIndex((s) => s.id === h)
        if (i > 0) index.value = i
        window.addEventListener('keydown', onKey)
      })
      onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

      return { slides, index, dir, dark, go, next, prev, toggleTheme, showNotes, a11y, applyA11y, speaking, toggleSpeak, current: computed(() => slides[index.value]) }
    },
    template: `
      <a class="skip-link" href="#main-stage">Pular para o conteúdo principal</a>
      <div class="deck">
        <div class="bg"><i class="b1"></i><i class="b2"></i><i class="b3"></i></div>
                        <header class="topbar glass">
          <button class="brand" @click="go(0)"><span class="logo">O</span> OrderMind</button>
          <nav class="dots"><button v-for="(s, i) in slides" :key="s.id" :class="{ on: i === index }" :title="s.title" @click="go(i)" :aria-current="i === index ? 'page' : null"><i></i><span>{{ s.title }}</span></button></nav>
          <button class="icon-btn" @click="toggleTheme" :title="dark ? 'Tema claro' : 'Tema escuro'" :aria-label="dark ? 'Mudar para tema claro' : 'Mudar para tema escuro'">{{ dark ? '☀︎' : '☾' }}</button>
        </header>
        <main id="main-stage" class="stage" tabindex="-1">
          <Transition :name="'slide-' + dir" mode="out-in">
            <KeepAlive>
              <component :is="current.comp" :key="current.id" />
            </KeepAlive>
          </Transition>
        </main>
        <Transition name="notes">
          <aside v-if="showNotes" class="glass notes" aria-live="polite">
            <header><span class="chip good">{{ current.who ? '🎤 Pessoa ' + current.who : '📚 Apêndice' }}</span><b>{{ current.title }}</b><button class="link" @click="showNotes = false">Fechar</button></header>
            <ul><li v-for="(n, i) in current.notes" :key="i">{{ n }}</li></ul>
          </aside>
        </Transition>
        <footer class="pager">
          <button class="icon-btn" :disabled="index === 0" @click="prev" aria-label="Anterior">←</button>
          <span>{{ index + 1 }} / {{ slides.length }} · {{ current.who ? 'Pessoa ' + current.who : 'Apêndice' }}</span>
          <button class="btn ghost small" @click="showNotes = !showNotes">{{ showNotes ? 'Ocultar painel' : 'Para o palestrante (N)' }}</button>
          <button class="icon-btn" :disabled="index === slides.length - 1" @click="next" aria-label="Próximo">→</button>
        </footer>
        <div class="a11y-dock">
          <div class="a11y-wrap">
            <button class="icon-btn" @click="a11y.open = !a11y.open" aria-haspopup="true" :aria-expanded="a11y.open" title="Opções de acessibilidade">♿</button>
            <div v-if="a11y.open" class="glass a11y-panel" role="dialog" aria-label="Opções de acessibilidade">
              <label class="a11y-option"><input type="checkbox" v-model="a11y.highContrast" @change="applyA11y" /> Alto contraste</label>
              <label class="a11y-option"><input type="checkbox" v-model="a11y.largeText" @change="applyA11y" /> Texto maior</label>
              <label class="a11y-option"><input type="checkbox" v-model="a11y.reduceMotion" @change="applyA11y" /> Reduzir animações</label>
              <button class="btn ghost small" @click="toggleSpeak">{{ speaking ? 'Parar leitura' : 'Ler conteúdo' }}</button>
              <button class="btn ghost small" @click="a11y.open = false">Fechar</button>
            </div>
          </div>
          <button class="icon-btn" @click="toggleSpeak" :title="speaking ? 'Parar leitura' : 'Ler conteúdo'">{{ speaking ? '⏹' : '🔊' }}</button>
        </div>
        <div class="progress"><i :style="{ width: ((index + 1) / slides.length) * 100 + '%' }"></i></div>
        <p class="sr-only" aria-live="polite" aria-atomic="true">Slide atual: {{ current.title }}</p>
      </div>`,
  }

  const app = createApp(App)
  for (const k of Object.keys(ui)) app.component(k, ui[k])
  app.mount('#app')
})(window)
