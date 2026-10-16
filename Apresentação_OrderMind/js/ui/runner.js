/* MPS · APRESENTAÇÃO · Runner da simulação (estado compartilhado entre os slides) */
;(function (g) {
  const { reactive } = Vue
  const MPS = (g.MPS = g.MPS || {})
  const Sim = MPS.sim

  MPS.createRunner = function (store) {
    const fresh = () => Sim.create({ seed: 42 })
    const sim = reactive(fresh())
    const state = reactive({ playing: false, speed: 3, userPaused: false })
    let timer = null
    const tick = () => { for (let k = 0; k < state.speed; k++) Sim.step(sim, store.weights) }
    const start = () => { if (timer) return; state.playing = true; timer = setInterval(tick, 140) }
    const pause = () => { state.playing = false; clearInterval(timer); timer = null }
    return {
      sim, state,
      toggle() { if (state.playing) { state.userPaused = true; pause() } else { state.userPaused = false; start() } },
      reset() { pause(); Object.assign(sim, fresh()); state.userPaused = false; start() },
      enter() { if (!state.userPaused) start() },   // ao entrar num slide de simulação
      leave() { pause() },                          // ao sair, congela (economiza CPU)
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : window)
