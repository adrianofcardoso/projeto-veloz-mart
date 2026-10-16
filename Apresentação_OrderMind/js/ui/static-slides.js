/* MPS · APRESENTAÇÃO · Slides narrativos (conteúdo do projeto final) */
;(function (g) {
  const MPS = (g.MPS = g.MPS || {})
  const ui = MPS.ui

  ui.SlideCover = {
    template: `
      <div class="slide cover">
        <div class="cover-motion" aria-hidden="true">
          <span class="cm-card cm-c1">#12 · P</span>
          <span class="cm-card cm-c2">#07 · G</span>
          <span class="cm-card cm-c3">#03 · M</span>
          <i class="cm-dot d1"></i>
          <i class="cm-dot d2"></i>
          <i class="cm-dot d3"></i>
          <i class="cm-dot d4"></i>
          <svg class="heap-svg" viewBox="0 0 220 170" aria-hidden="true">
            <g stroke="rgba(120,180,255,.28)" stroke-width="1.6" fill="none">
              <line x1="110" y1="14" x2="58" y2="58" />
              <line x1="110" y1="14" x2="162" y2="58" />
              <line x1="58" y1="58" x2="34" y2="112" />
              <line x1="58" y1="58" x2="82" y2="112" />
              <line x1="162" y1="58" x2="138" y2="112" />
              <line x1="162" y1="58" x2="186" y2="112" />
            </g>
            <g class="heap-nodes">
              <circle cx="110" cy="14" r="7" />
              <circle cx="58" cy="58" r="6" />
              <circle cx="162" cy="58" r="6" />
              <circle cx="34" cy="112" r="5" />
              <circle cx="82" cy="112" r="5" />
              <circle cx="138" cy="112" r="5" />
              <circle cx="186" cy="112" r="5" />
            </g>
          </svg>
        </div>
        <div class="cover-wrap">
          <p class="eyebrow">Projeto final · Grupo 3 · Ordenação e Prioridade</p>
          <h1 class="cover-title"><span class="grad">Quem tem pressa espera.</span></h1>
          <p class="lead">Na fila comum, o pedido com 8 min de prazo fica atrás de pedidos folgados.</p>
          <p class="sub">Uma fila inteligente decide quem sai da doca primeiro — menos atraso, mais pedidos no prazo.</p>
          <div class="cover-kpis">
            <span class="chip good">~5× menos atraso</span>
            <span class="chip">Mesmos pedidos, mesma doca</span>
          </div>
          <p class="analogy">Analogia: fila do caixa. Quem tem o ônibus em 8 min não espera atrás de 3 carrinhos cheios.</p>
          <div class="team">
            <p class="eyebrow">Equipe</p>
            <div class="team-list">
              <span>Adriano Cardoso</span>
              <span>Julia Neves</span>
              <span>Lucas Augusto Vieira Leão</span>
              <span>Raniele Albertim Vieira da Silva Alves</span>
              <span>Wanderley Gonçalves</span>
            </div>
          </div>
          <p class="hint">Use <kbd>←</kbd> <kbd>→</kbd> ou <kbd>espaço</kbd> para navegar · <kbd>N</kbd> mostra o roteiro de fala</p>
        </div>
      </div>`,
  }

  ui.SlideScenario = {
    template: `
      <div class="slide scenario">
        <header class="slide-head">
          <p class="eyebrow">Cenário · VelozMart</p>
          <h2>Uma lista em tempo real<br/><span class="dim">na ordem ótima.</span></h2>
        </header>
        <div class="cards3">
          <article class="glass card"><span class="tag">priorityScore</span><h3>0 – 100</h3><p>Calculado por IA com base em distância, SLA, valor do item e reputação do vendedor.</p></article>
          <article class="glass card"><span class="tag">dispatchWindow</span><h3>minutos restantes</h3><p>Tempo até o prazo expirar. Diminui a cada minuto que o pedido espera.</p></article>
          <article class="glass card"><span class="tag">sizeCategory</span><h3>P · M · G</h3><p>Define o espaço que o pedido ocupa na doca de embalagem (neste protótipo: 1, 2 e 4 de 4 bancadas).</p></article>
        </div>
        <div class="cards3 qs">
          <article class="glass card q"><span class="num">I</span><h3>Como ordenar?</h3><p>Combinar múltiplos critérios numa única ordem de saída.</p></article>
          <article class="glass card q"><span class="num">II</span><h3>Como re-enfileirar?</h3><p>Novos pedidos chegam e os prazos mudam o tempo todo.</p></article>
          <article class="glass card q"><span class="num">III</span><h3>Como provar?</h3><p>Métricas que mostrem ganho sobre a ordenação simples por tempo.</p></article>
        </div>
        <p class="analogy">Analogia: cada pedido chega com três etiquetas coladas nele (importância, prazo e tamanho). A nota final é a pontuação que decide quem passa na frente.</p>
      </div>`,
  }

  ui.SlideAlgorithm = {
    template: `
      <div class="slide algo">
        <header class="slide-head">
          <p class="eyebrow">Estratégia escolhida</p>
          <h2>Heap multi-chave<br/><span class="dim">com encaixe na doca.</span></h2>
        </header>
        <div class="algo-grid">
          <div class="glass prose">
            <p>Os pedidos esperam num <b>max-heap</b> ordenado por um <b>score composto</b>. O topo é sempre o pedido mais valioso de despachar agora.</p>
            <ul>
              <li><b>Inclusão:</b> calcula o score e insere no heap (sift-up).</li>
              <li><b>Passagem do tempo:</b> a janela encolhe, então os scores são recalculados e o heap é reconstruído.</li>
              <li><b>Prazo alterado:</b> recalcula só aquele pedido e o reposiciona (update-key).</li>
              <li><b>Remoção:</b> retira o topo. Se não couber na doca, guarda e tenta o próximo (até 8 candidatos) e devolve os pulados ao heap.</li>
            </ul>
          </div>
          <pre class="glass code"><code>score(o, t) = 100 · ( α·IA + β·U + γ·S )     γ = 1 − α − β
  IA = priorityScore / 100
  U  = 1 / (1 + dispatchWindow / 15)    (1 se vencido)
  S  = 1.0 · 0.6 · 0.3                  (P · M · G)

ao_chegar(o):   insert(heap, o)                 // O(log n)
a_cada_minuto:  rescore(heap); heapify(heap)    // O(n)
prazo_mudou(o): rescore(o); update(heap, o)     // O(log n)*
doca_livre():
  pulados = []
  repita até 8 vezes:
    o = extractMax(heap)                         // O(log n)
    se cabe_na_doca(o): expedir(o); pare
    senão: pulados.add(o)
  reinsira(pulados)</code></pre>
        </div>
        <p class="note">* com índice de posições (hash id → posição); no protótipo a posição é achada por busca linear.</p>
      </div>`,
  }

  ui.SlideCriteria = {
    template: `
      <div class="slide criteria">
        <header class="slide-head">
          <p class="eyebrow">Como decidimos</p>
          <h2>Juntamos as três informações<br/><span class="dim">em uma nota só.</span></h2>
        </header>
        <div class="cards3">
          <article class="glass card ia"><span class="tag">α · priorityScore</span><h3>Valor e SLA</h3><p>Aproveita o que a IA já sabe: distância, SLA, valor e reputação. Protege receita e experiência do cliente.</p><code>afeta: custo logístico · % no prazo</code></article>
          <article class="glass card u"><span class="tag">β · dispatchWindow</span><h3>Urgência hiperbólica</h3><p>Sobe devagar quando há folga e dispara perto do prazo (generaliza 1/dispatchWindow). Também impede starvation: todo pedido eventualmente fica urgente.</p><code>afeta: atraso médio</code></article>
          <article class="glass card s"><span class="tag">γ · sizeCategory</span><h3>Espaço na doca</h3><p>Pedidos pequenos ocupam menos bancadas e liberam a doca mais cedo; vários cabem ao mesmo tempo.</p><code>afeta: throughput/hora · uso da doca</code></article>
        </div>
        <p class="note">Exemplo: Pedido A (IA 85, prazo 12 min, tamanho P) ≈ 78; Pedido B (IA 50, prazo 90 min, tamanho G) ≈ 30. O A sai primeiro. Os pesos α, β e γ são configuráveis: a operação decide o que priorizar sem mudar o código do heap.</p>
      </div>`,
  }

  ui.SlideFlow = {
    data: () => ({
      lanes: [
        { tag: 'Inclusão', big: 'O(log n)', steps: ['Novo pedido chega', 'Calcula score α·IA + β·U + γ·S', 'insert no heap (sift-up)'] },
        { tag: 'Re-priorização · tempo', big: 'O(n)', steps: ['Cada minuto: janelas encolhem', 'Recalcula todos os scores', 'heapify restaura o invariante'] },
        { tag: 'Re-priorização · prazo', big: 'O(log n)*', steps: ['Evento muda o prazo de um pedido', 'Recalcula o score dele', 'update-key: sobe ou desce na árvore'] },
        { tag: 'Remoção', big: 'O(K · log n)', steps: ['Doca tem bancada livre', 'extract-max (topo do heap)', 'Cabe? Sim: embala · Não: tenta o próximo', 'Devolve os pulados ao heap'] },
      ],
    }),
    template: `
      <div class="slide flow">
        <header class="slide-head">
          <p class="eyebrow">Diagrama · Fluxo das operações</p>
          <h2>Quatro eventos,<br/><span class="dim">um único heap.</span></h2>
        </header>
        <div class="lanes">
          <article v-for="l in lanes" :key="l.tag" class="glass lane-row">
            <div class="lane-tag"><b>{{ l.tag }}</b><span>{{ l.big }}</span></div>
            <ol class="steps"><li v-for="(s, i) in l.steps" :key="i">{{ s }}</li></ol>
          </article>
        </div>
        <p class="note">K = candidatos examinados ao procurar pedido que caiba (8 no protótipo). * com índice de posições.</p>
      </div>`,
  }

  ui.SlideTradeoffs = {
    template: `
      <div class="slide tradeoffs">
        <header class="slide-head">
          <p class="eyebrow">Mapa de trade-offs</p>
          <h2>Simplicidade × desempenho<br/><span class="dim">× manutenibilidade.</span></h2>
        </header>
        <div class="glass tbl-wrap">
          <table class="tbl">
            <thead><tr><th>Estratégia</th><th>Simplicidade</th><th>Desempenho</th><th>Manutenibilidade</th></tr></thead>
            <tbody>
              <tr><td><b>Lista simples</b></td><td>Alta</td><td>Baixo a moderado</td><td>Alta</td></tr>
              <tr><td><b>Reordenação completa</b></td><td>Moderada</td><td>Baixo em eventos frequentes</td><td>Moderada</td></tr>
              <tr><td><b>Heap binário indexado</b></td><td>Moderada</td><td>Alta para o próximo pedido</td><td>Alta, com mapa id→posição</td></tr>
            </tbody>
          </table>
        </div>
        <p class="note">A escolha do heap é justificada pelo equilíbrio entre desempenho, manutenibilidade e adequação a um fluxo dinâmico no qual apenas o próximo pedido importa.</p>
        <div class="glass tbl-wrap">
          <h4>Prós</h4>
          <ul class="tight-list">
            <li><b>Desempenho</b> — O(log n).</li>
            <li><b>Chave estável</b> — sem recalcular tudo.</li>
            <li><b>Disponibilidade</b> — estrutura clássica disponível em bibliotecas.</li>
          </ul>
          <h4>Contras</h4>
          <ul class="tight-list">
            <li><b>Complexidade estrutural</b> — heap indexado é mais complexo que uma lista.</li>
            <li><b>Calibração</b> — α exige calibração e justificativa de negócio.</li>
            <li><b>Visão da fila</b> — heap fornece diretamente apenas o próximo pedido e listar a fila completa em ordem custa O(n log n).</li>
          </ul>
        </div>
        <p class="note">O ganho operacional e a adequação ao fluxo dinâmico justificam a complexidade adicional.</p>
      </div>`,
  }

  ui.SlideBigO = {
    template: `
      <div class="slide bonus">
        <header class="slide-head">
          <p class="eyebrow">Análise Big O e comparação</p>
          <h2>Custo por evento para n = 50.000 pedidos.</h2>
        </header>
        <div class="glass tbl-wrap">
          <table class="tbl">
            <thead><tr><th>Estrutura ou estratégia</th><th>Complexidade e estimativa</th><th>Leitura</th></tr></thead>
            <tbody>
              <tr><td><b>Heap binário indexado</b></td><td>inserir O(log n) ≈ 16 passos; extrair O(log n); atualizar O(log n); consultar topo O(1); memória O(n).</td><td>Adequado para eventos dinâmicos e acesso direto ao próximo pedido.</td></tr>
              <tr><td><b>Lista ordenada com Insertion Sort/inserção</b></td><td>inserir O(n) ≈ 25.000 deslocamentos em média; extrair O(1) ou O(n).</td><td>Adequada apenas se a lista for pequena ou quase ordenada.</td></tr>
              <tr><td><b>Reordenar tudo a cada evento com Merge Sort</b></td><td>O(n log n) ≈ 780.000 comparações por evento.</td><td>Estável, mas exige O(n) de memória extra.</td></tr>
              <tr><td><b>Reordenar com Heap Sort</b></td><td>O(n log n) por evento.</td><td>In-place, porém não estável.</td></tr>
              <tr><td><b>Selection Sort</b></td><td>O(n²) ≈ 2,5 bilhões de operações.</td><td>Inviável.</td></tr>
              <tr><td><b>Ordenação simples por tempo, como linha de base</b></td><td>Mesma ordem de complexidade da manutenção da estrutura escolhida.</td><td>Ignora score e tamanho.</td></tr>
            </tbody>
          </table>
        </div>
        <p class="note">O fluxo é dinâmico, há muitas chegadas e mudanças e apenas o próximo pedido importa; manter tudo ordenado é desperdício, enquanto o heap faz apenas o trabalho necessário.</p>
        <p class="mini">Observação: valores são estimativas teóricas, não benchmark.</p>
      </div>`,
  }

  ui.SlideAB = {
    template: `
      <div class="slide bonus">
        <header class="slide-head">
          <p class="eyebrow">Simulação e teste A/B</p>
          <h2>Comparar linha de base e heap composto.</h2>
        </header>
        <div class="glass tbl-wrap">
          <table class="tbl">
            <thead><tr><th>Métrica</th><th>Como comparar</th><th>Objetivo de leitura</th></tr></thead>
            <tbody>
              <tr><td><b>atraso médio</b></td><td>Comparar a média entre ordenar por dispatchWindow e heap composto.</td><td>Buscar redução consistente.</td></tr>
              <tr><td><b>percentual de pedidos vencidos</b></td><td>Medir a parcela de pedidos que ultrapassa a janela.</td><td>Evitar aumento relevante.</td></tr>
              <tr><td><b>throughput/hora</b></td><td>Comparar pedidos processados por hora.</td><td>Preservar ou ampliar capacidade.</td></tr>
              <tr><td><b>atraso médio dos pedidos com score ≥ 80</b></td><td>Separar pedidos de alta prioridade.</td><td>Proteger pedidos prioritários.</td></tr>
              <tr><td><b>tempo de resposta por operação</b></td><td>Medir inserir, atualizar, retirar e consultar topo.</td><td>Manter latência operacional aceitável.</td></tr>
            </tbody>
          </table>
        </div>
        <div class="glass prose">
          <p>O teste A/B em produção deve dividir metade dos centros de distribuição para cada estratégia durante 2 semanas, com monitoramento de segurança operacional e calibração de α.</p>
          <h4>Critérios de leitura</h4>
          <ul class="tight-list">
            <li>melhoria consistente sem aumento relevante de pedidos vencidos</li>
            <li>latência operacional aceitável</li>
            <li>ganho ou neutralidade de throughput</li>
          </ul>
        </div>
      </div>`,
  }

  ui.SlideAccessibility = {
    template: `
      <div class="slide bonus">
        <header class="slide-head">
          <p class="eyebrow">Acessibilidade na UI</p>
          <h2>Uso por todos.</h2>
        </header>
        <div class="cards3">
          <article class="glass card">
            <h3>Diretrizes</h3>
            <ul class="tight-list">
              <li>contraste alto</li>
              <li>não depender apenas de cor para urgência, usando ícone e texto "Urgente"</li>
              <li>navegação por teclado</li>
              <li>atualizações em tempo real anunciadas por região aria-live sem excesso</li>
              <li>texto alternativo nos diagramas</li>
            </ul>
          </article>
          <article class="glass card">
            <h3>Amostra visual de status</h3>
            <table class="mini-tbl">
              <tr><td>✓ Normal</td><td>Status identificado por texto e ícone, não apenas por cor.</td></tr>
              <tr><td>⚠ Urgente</td><td>Urgência explicitamente anunciada por ícone e texto.</td></tr>
              <tr><td>⏸ Em espera</td><td>Estado compreensível mesmo sem percepção de cores.</td></tr>
            </table>
          </article>
        </div>
      </div>`,
  }

  ui.SlideClosing = {
    template: `
      <div class="slide closing">
        <header class="slide-head">
          <p class="eyebrow">Conclusão</p>
          <h2>Priorizar muda<br/><span class="dim">o que o cliente sente.</span></h2>
        </header>
        <div class="cards3">
          <article class="glass card"><span class="big-num">≈ 5×</span><h3>menos atraso médio</h3><p>8,7 → 1,6 min contra FIFO.</p></article>
          <article class="glass card"><span class="big-num">+17 pp</span><h3>de pedidos no prazo</h3><p>67% → 85% dentro do prazo.</p></article>
          <article class="glass card"><span class="big-num">+4%</span><h3>de throughput/hora</h3><p>34,5 → 36,0 pedidos por hora.</p></article>
        </div>
        <div class="glass next">
          <h4>Leitura honesta</h4>
          <ul>
            <li>Resultados da simulação com semente 42, turno de 8 h e carga alta, mesma doca para todos. Não são dados reais.</li>
            <li>O peso composto simples empata no atraso médio (1,5 min), mas o OrderMind entrega mais pedidos no prazo e mais throughput, e deixa a operação ajustar os pesos.</li>
            <li><b>Próximos passos:</b> heap indexado, replay com dados reais, teste A/B por centro de distribuição e calibração de α, β, γ.</li>
          </ul>
        </div>
      </div>`,
  }
  ui.SlideGlossary = {
    template: `
      <div class="slide glossary">
        <header class="slide-head">
          <p class="eyebrow">Glossário</p>
          <h2>Termos em palavras simples.</h2>
        </header>
        <div class="glass prose">
          <ul class="tight-list">
            <li><b>SLA</b>: prazo combinado com o cliente para entregar o pedido.</li>
            <li><b>Throughput</b>: quantos pedidos saem por hora.</li>
            <li><b>Heap</b>: fila em forma de pirâmide; o mais importante fica no topo.</li>
            <li><b>FIFO</b>: "primeiro a chegar, primeiro a sair".</li>
            <li><b>Time decay</b>: o tempo passa e o prazo fica mais perto.</li>
            <li><b>Doca</b>: bancadas de embalagem do galpão.</li>
          </ul>
        </div>
      </div>`,
  }

})(typeof globalThis !== 'undefined' ? globalThis : window)
