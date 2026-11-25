/* ==========================================================
   PROJETO SECRETO — effects.js
   Efeitos visuais (estrelas, confete, tremida, aviso) e sons opcionais.
   ========================================================== */
(function (global) {
  'use strict';

  const Bia = (global.Bia = global.Bia || {});
  const doc = global.document;

  const COLORS = ['#7957B5', '#F58FA8', '#FFCB69', '#8CCEB1'];
  const CONFETTI_SHAPES = ['★', '✿', '●', '✦', '🐾'];
  const MAX_CONFETTI_ON_SCREEN = 70;
  const SOUND_STORAGE_KEY = 'projetoSecreto.sound';

  /* ---------- Utilidades ---------- */
  function prefersReducedMotion() {
    return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  /* ---------- Aviso (toast) ---------- */
  let toastTimer = null;

  function toast(message, duration) {
    const el = doc.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    global.clearTimeout(toastTimer);
    toastTimer = global.setTimeout(function () {
      el.classList.remove('is-visible');
    }, duration || 3200);
  }

  /* ---------- Estrelas de fundo ---------- */
  function createAmbientStars(count) {
    const layer = doc.getElementById('stars');
    if (!layer || prefersReducedMotion()) return;
    const total = count || 14;
    for (let i = 0; i < total; i++) {
      const star = doc.createElement('span');
      star.className = 'star';
      star.style.left = rand(2, 96).toFixed(1) + '%';
      star.style.top = rand(2, 96).toFixed(1) + '%';
      star.style.setProperty('--size', Math.round(rand(10, 22)) + 'px');
      star.style.setProperty('--c', pick(COLORS));
      star.style.setProperty('--dur', rand(3, 6).toFixed(1) + 's');
      star.style.setProperty('--delay', (-rand(0, 5)).toFixed(1) + 's');
      star.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-star"/></svg>';
      layer.appendChild(star);
    }
  }

  /* ---------- Confete / estrelinhas de comemoração ---------- */
  /**
   * Solta confete a partir de um ponto.
   * @param {Element|null} originEl elemento de origem (se vazio, usa o centro da tela)
   * @param {number} count quantidade de pecinhas
   * @param {string[]} [shapes] símbolos usados (padrão: estrelas, flores e patinhas)
   */
  function celebrate(originEl, count, shapes) {
    const layer = doc.getElementById('fx');
    if (!layer || prefersReducedMotion()) return;

    let x = global.innerWidth / 2;
    let y = global.innerHeight * 0.45;
    if (originEl && originEl.getBoundingClientRect) {
      const r = originEl.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }

    const list = shapes && shapes.length ? shapes : CONFETTI_SHAPES;
    const room = MAX_CONFETTI_ON_SCREEN - layer.childElementCount;
    const total = Math.max(0, Math.min(count || 26, room));
    for (let i = 0; i < total; i++) {
      const piece = doc.createElement('span');
      piece.className = 'confetti';
      piece.textContent = pick(list);
      piece.style.setProperty('--x', x + 'px');
      piece.style.setProperty('--y', y + 'px');
      piece.style.setProperty('--dx', rand(-170, 170).toFixed(0) + 'px');
      piece.style.setProperty('--dy', rand(-40, 260).toFixed(0) + 'px');
      piece.style.setProperty('--r', rand(-260, 260).toFixed(0) + 'deg');
      piece.style.setProperty('--s', Math.round(rand(14, 28)) + 'px');
      piece.style.setProperty('--t', rand(0.9, 1.5).toFixed(2) + 's');
      piece.style.setProperty('--c', pick(COLORS));
      layer.appendChild(piece);
      global.setTimeout(function () {
        if (piece.parentNode) piece.parentNode.removeChild(piece);
      }, 1700);
    }
  }

  /* ---------- Tremidinha de erro ---------- */
  function shake(el, className) {
    if (!el) return;
    const cls = className || 'shake';
    el.classList.remove(cls);
    void el.offsetWidth; // reinicia a animação
    el.classList.add(cls);
    global.setTimeout(function () { el.classList.remove(cls); }, 600);
  }

  /* ---------- Sons (opcionais) ---------- */
  /*
   * Os sons são sintetizados pelo navegador (Web Audio), então o jogo
   * funciona sem nenhum arquivo de áudio.
   * Quer usar seus próprios sons? Coloque os arquivos em assets/sounds/
   * e preencha os caminhos abaixo, por exemplo: click: 'assets/sounds/click.mp3'
   */
  const SOUND_FILES = {
    click: '',
    success: '',
    unlock: '',
    discover: '',
    meow: ''
  };

  // Notas de cada som: [frequência em Hz, duração em segundos]
  const SYNTH_NOTES = {
    click: [[700, 0.06]],
    success: [[523, 0.1], [659, 0.1], [784, 0.2]],
    unlock: [[392, 0.09], [523, 0.09], [659, 0.09], [880, 0.24]],
    discover: [[880, 0.08], [1175, 0.18]],
    error: [[240, 0.16]]
  };

  let soundEnabled = false;
  let audioCtx = null;

  try {
    soundEnabled = global.sessionStorage.getItem(SOUND_STORAGE_KEY) === 'on';
  } catch (e) { /* sessionStorage indisponível: segue sem lembrar */ }

  /** Contexto de áudio compartilhado (também usado pela música). Pode ser null. */
  function getAudioContext() {
    if (audioCtx) return audioCtx;
    const Ctx = global.AudioContext || global.webkitAudioContext;
    if (!Ctx) return null;
    try { audioCtx = new Ctx(); } catch (e) { audioCtx = null; }
    return audioCtx;
  }

  function playSynth(name) {
    const notes = SYNTH_NOTES[name];
    const ctx = getAudioContext();
    if (!notes || !ctx) return;
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    let t = ctx.currentTime;
    notes.forEach(function (note) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = note[0];
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + note[1]);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + note[1] + 0.02);
      t += note[1] * 0.9;
    });
  }

  /** Miauzinho sintetizado: o tom sobe e desce rapidinho. */
  function playMeow() {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.13);
    osc.frequency.exponentialRampToValueAtTime(560, t + 0.4);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.13, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.44);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.48);
  }

  /** Toca um som ('click', 'success', 'unlock', 'discover', 'meow' ou 'error') se estiver ativado. */
  function playSound(name) {
    if (!soundEnabled) return;
    try {
      const file = SOUND_FILES[name];
      if (file) {
        const audio = new global.Audio(file);
        audio.volume = 0.6;
        const result = audio.play();
        if (result && result.catch) {
          result.catch(function () { name === 'meow' ? playMeow() : playSynth(name); });
        }
      } else if (name === 'meow') {
        playMeow();
      } else {
        playSynth(name);
      }
    } catch (e) { /* som nunca pode quebrar o jogo */ }
  }

  function isSoundEnabled() {
    return soundEnabled;
  }

  function setSoundEnabled(value) {
    soundEnabled = !!value;
    try {
      global.sessionStorage.setItem(SOUND_STORAGE_KEY, soundEnabled ? 'on' : 'off');
    } catch (e) { /* ignora */ }
    if (soundEnabled) playSound('click'); // este toque do usuário libera o áudio no iOS
    return soundEnabled;
  }

  Bia.Effects = {
    prefersReducedMotion: prefersReducedMotion,
    toast: toast,
    createAmbientStars: createAmbientStars,
    celebrate: celebrate,
    shake: shake,
    getAudioContext: getAudioContext,
    playSound: playSound,
    isSoundEnabled: isSoundEnabled,
    setSoundEnabled: setSoundEnabled
  };
})(window);
