/* ==========================================================
   PROJETO SECRETO — music.js
   Toquezinho de fundo, bem suave, gerado pelo próprio navegador
   (Web Audio). Não usa arquivos de áudio e só começa depois de um toque.
   ========================================================== */
(function (global) {
  'use strict';

  const Bia = (global.Bia = global.Bia || {});
  const doc = global.document;

  /* ---------- Configurações ---------- */
  const STORAGE_KEY = 'projetoSecreto.music'; // 'on' | 'off'
  const BPM = 92;
  const STEP_SECONDS = 60 / BPM / 2;   // cada passo = colcheia
  const STEPS_PER_BAR = 8;
  const SCHEDULE_TICK_MS = 100;
  const LOOKAHEAD_SECONDS = 0.3;
  const FADE_IN_SECONDS = 1.2;
  const FADE_OUT_SECONDS = 0.35;
  const MASTER_LEVEL = 0.9;
  const GAIN = { arp: 0.05, melody: 0.045, bass: 0.07 };
  const ARP_ORDER = [0, 1, 2, 3, 2, 1, 2, 1]; // qual nota do acorde em cada passo

  // Frequências (Hz)
  const N = {
    C3: 130.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0,
    B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99
  };

  // Dó – Lá menor – Fá – Sol: uma progressão alegrinha e fofa (4 compassos em loop)
  const BARS = [
    { bass: N.C3, chord: [N.C4, N.E4, N.G4, N.C5], melody: [null, null, N.E5, null, N.G5, null, N.E5, null] },
    { bass: N.A3, chord: [N.A3, N.C4, N.E4, N.A4], melody: [null, null, N.C5, null, N.E5, null, N.D5, null] },
    { bass: N.F3, chord: [N.F3, N.A3, N.C4, N.F4], melody: [null, null, N.A4, null, N.C5, null, N.A4, null] },
    { bass: N.G3, chord: [N.G3, N.B3, N.D4, N.G4], melody: [null, null, N.B4, null, N.D5, null, N.G4, null] }
  ];

  /* ---------- Estado ---------- */
  let preference = readPreference(); // 'on' | 'off' | null
  let playing = false;
  let timer = null;
  let master = null;
  let nextTime = 0;
  let step = 0;
  let listener = null;
  let armed = false;

  function readPreference() {
    try { return global.sessionStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function savePreference(value) {
    preference = value;
    try { global.sessionStorage.setItem(STORAGE_KEY, value); } catch (e) { /* ignora */ }
  }

  function notify() {
    if (listener) listener(playing);
  }

  /* ---------- Som ---------- */
  function playNote(ctx, freq, time, duration, level, type) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(level, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  /** Agenda as notas que caem dentro da janela de "lookahead". */
  function schedule() {
    const ctx = Bia.Effects.getAudioContext();
    if (!ctx || !master) return;
    while (nextTime < ctx.currentTime + LOOKAHEAD_SECONDS) {
      const bar = BARS[Math.floor(step / STEPS_PER_BAR) % BARS.length];
      const s = step % STEPS_PER_BAR;
      playNote(ctx, bar.chord[ARP_ORDER[s]], nextTime, 0.55, GAIN.arp, 'sine');
      if (s === 0) playNote(ctx, bar.bass, nextTime, 1.7, GAIN.bass, 'sine');
      if (bar.melody[s]) playNote(ctx, bar.melody[s], nextTime, 0.9, GAIN.melody, 'triangle');
      nextTime += STEP_SECONDS;
      step += 1;
    }
  }

  function start() {
    const ctx = Bia.Effects.getAudioContext();
    if (!ctx || playing) return false;
    try {
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(MASTER_LEVEL, ctx.currentTime + FADE_IN_SECONDS);
      master.connect(ctx.destination);
      nextTime = ctx.currentTime + 0.1;
      step = 0;
      timer = global.setInterval(schedule, SCHEDULE_TICK_MS);
      playing = true;
    } catch (e) {
      playing = false;
    }
    notify();
    return playing;
  }

  function stop() {
    if (!playing) return;
    global.clearInterval(timer);
    timer = null;
    playing = false;
    const ctx = Bia.Effects.getAudioContext();
    const node = master;
    master = null;
    if (ctx && node) {
      try {
        node.gain.cancelScheduledValues(ctx.currentTime);
        node.gain.setValueAtTime(Math.max(node.gain.value, 0.0001), ctx.currentTime);
        node.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + FADE_OUT_SECONDS);
      } catch (e) { /* ignora */ }
      global.setTimeout(function () { try { node.disconnect(); } catch (e) { /* ignora */ } }, FADE_OUT_SECONDS * 1000 + 100);
    }
    notify();
  }

  /* ---------- API pública ---------- */
  function isPlaying() { return playing; }

  /** Liga/desliga por escolha da pessoa (lembra a escolha nesta aba). */
  function setEnabled(value) {
    savePreference(value ? 'on' : 'off');
    if (value) start(); else stop();
    return playing;
  }

  function toggle() { return setEnabled(!playing); }

  /** Chamado quando o jogo começa: toca, a menos que a pessoa tenha desligado antes. */
  function startIfAllowed() {
    if (preference === 'off') return;
    savePreference('on');
    start();
  }

  /**
   * Se a música estava ligada e a página foi recarregada, o navegador exige
   * um toque antes de tocar áudio: espera o primeiro toque e começa.
   */
  function armOnFirstTouch() {
    if (armed || preference !== 'on' || playing) return;
    armed = true;
    function go() {
      doc.removeEventListener('pointerdown', go, true);
      armed = false;
      if (preference === 'on') start();
    }
    doc.addEventListener('pointerdown', go, true);
  }

  /** Pausa quando a aba fica escondida e volta quando ela reaparece. */
  function setupVisibility() {
    doc.addEventListener('visibilitychange', function () {
      const ctx = Bia.Effects.getAudioContext();
      if (!ctx || !playing) return;
      if (doc.hidden && ctx.suspend) ctx.suspend();
      else if (ctx.resume) ctx.resume();
    });
  }

  function init(onChange) {
    listener = onChange || null;
    setupVisibility();
    armOnFirstTouch();
    notify();
  }

  Bia.Music = {
    init: init,
    isPlaying: isPlaying,
    setEnabled: setEnabled,
    toggle: toggle,
    startIfAllowed: startIfAllowed
  };
})(window);
