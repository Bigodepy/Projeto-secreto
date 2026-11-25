/* ==========================================================
   PROJETO SECRETO — game.js
   Estado do jogo, progresso (sessionStorage), cabeçalho, botões gerais,
   música, reinício e easter eggs. Este é o arquivo que "liga" todos os outros.
   ========================================================== */
(function (global) {
  'use strict';

  const Bia = (global.Bia = global.Bia || {});
  const doc = global.document;

  /* ---------- Configurações ---------- */
  const STORAGE_KEY = 'projetoSecreto.v1';
  const TOTAL_PHASES = 5;
  const PHASE_TITLES = [
    'O Chamado',
    'O Mapa Perdido',
    'Os Objetos Suspeitos',
    'O Último Segredo',
    'O Verdadeiro Objetivo'
  ];
  const LOGO_TAPS_FOR_EGG = 5;
  const LOGO_TAP_WINDOW_MS = 3000;
  const UNLOCK_SOUND_DELAY_MS = 450;

  const TEXTS = {
    locked: 'Essa fase ainda está bloqueada. Resolva a anterior primeiro! 🔒',
    restarted: 'Missão reiniciada. Boa sorte, investigadora! 🔎',
    logoEgg: '🌸 Easter egg: a investigadora-chefe chegou!',
    chipEgg: 'Psiu... esse número me parece importante. 👀',
    soundOn: 'Efeitos sonoros ligados 🔊',
    soundOff: 'Efeitos sonoros desligados 🔇',
    musicOn: 'Música ligada 🎵',
    musicOff: 'Música desligada',
    musicUnavailable: 'Seu navegador não conseguiu tocar a música. 🙈'
  };

  /* ---------- Estado ---------- */
  function defaultState() {
    return { started: false, current: 0, completed: [false, false, false, false, false] };
  }

  function isValidState(data) {
    return !!data &&
      typeof data.started === 'boolean' &&
      typeof data.current === 'number' &&
      Array.isArray(data.completed) &&
      data.completed.length === TOTAL_PHASES;
  }

  function loadState() {
    try {
      const raw = global.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return isValidState(parsed) ? parsed : defaultState();
    } catch (e) {
      return defaultState();
    }
  }

  let state = loadState();

  function saveState() {
    try {
      global.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* sem sessionStorage o jogo continua, só não lembra o progresso */ }
  }

  function clearSavedState() {
    try { global.sessionStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignora */ }
  }

  /* ---------- Regras de progressão ---------- */
  function isCompleted(phase) {
    return !!state.completed[phase - 1];
  }

  function completedCount() {
    return state.completed.filter(Boolean).length;
  }

  /** Maior fase liberada: a primeira não concluída (ou a última). */
  function highestUnlockedPhase() {
    let phase = 1;
    while (phase < TOTAL_PHASES && isCompleted(phase)) phase += 1;
    return phase;
  }

  /** Índice 0 (tela inicial) sempre pode; fases só depois de iniciar e concluir as anteriores. */
  function canAccess(index) {
    if (index === 0) return true;
    return state.started && index >= 1 && index <= highestUnlockedPhase();
  }

  /* ---------- Cabeçalho e progresso ---------- */
  function updateProgressUi() {
    const fill = doc.getElementById('progress-fill');
    if (fill) fill.style.width = (completedCount() / TOTAL_PHASES * 100) + '%';

    const current = Bia.Navigation.current();
    doc.querySelectorAll('.dot').forEach(function (dot) {
      const phase = Number(dot.getAttribute('data-phase'));
      const done = isCompleted(phase);
      const locked = !canAccess(phase);
      dot.classList.toggle('is-done', done);
      dot.classList.toggle('is-current', phase === current);
      dot.classList.toggle('is-locked', locked);
      dot.disabled = locked;
      let label = 'Fase ' + phase + ': ' + PHASE_TITLES[phase - 1];
      label += done ? ' (concluída)' : locked ? ' (bloqueada)' : '';
      dot.setAttribute('aria-label', label);
      if (phase === current) dot.setAttribute('aria-current', 'step');
      else dot.removeAttribute('aria-current');
    });

    const label = doc.getElementById('phase-label');
    if (label) {
      label.textContent = current >= 1
        ? 'Fase ' + current + ' de ' + TOTAL_PHASES + ' · ' + PHASE_TITLES[current - 1]
        : '';
    }
  }

  /* ---------- Navegação ---------- */
  function goTo(index, options) {
    if (!canAccess(index)) {
      Bia.Effects.toast(TEXTS.locked);
      return false;
    }
    state.current = index;
    saveState();
    Bia.Navigation.show(index, options);
    return true;
  }

  function onScreenShown(index) {
    updateProgressUi();
    if (index === 5) Bia.Puzzles.startReveal();
    else Bia.Puzzles.stopReveal();
  }

  /** Chamado pelos enigmas quando uma fase é concluída. */
  function completePhase(phase) {
    if (isCompleted(phase)) return;
    state.completed[phase - 1] = true;
    saveState();
    updateProgressUi();
    global.setTimeout(function () { Bia.Effects.playSound('unlock'); }, UNLOCK_SOUND_DELAY_MS);
  }

  /* ---------- Botões gerais ---------- */
  function startGame() {
    state.started = true;
    saveState();
    Bia.Music.startIfAllowed(); // este toque libera o áudio no celular
    Bia.Effects.playSound('click');
    Bia.Effects.celebrate(doc.getElementById('btn-start'), 22);
    goTo(1);
  }

  function setupSoundButton() {
    const button = doc.getElementById('btn-sound');
    function refresh() {
      const on = Bia.Effects.isSoundEnabled();
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      button.setAttribute('aria-label', on ? 'Desativar efeitos sonoros' : 'Ativar efeitos sonoros');
      button.firstElementChild.textContent = on ? '🔊' : '🔇';
    }
    button.addEventListener('click', function () {
      const on = Bia.Effects.setSoundEnabled(!Bia.Effects.isSoundEnabled());
      refresh();
      Bia.Effects.toast(on ? TEXTS.soundOn : TEXTS.soundOff, 1800);
    });
    refresh();
  }

  function setupMusicButton() {
    const button = doc.getElementById('btn-music');
    function refresh(playing) {
      button.setAttribute('aria-pressed', playing ? 'true' : 'false');
      button.setAttribute('aria-label', playing ? 'Desligar música de fundo' : 'Ligar música de fundo');
      button.classList.toggle('is-playing', !!playing);
    }
    Bia.Music.init(refresh);
    button.addEventListener('click', function () {
      const playing = Bia.Music.toggle();
      refresh(playing);
      if (!playing && !Bia.Effects.getAudioContext()) {
        Bia.Effects.toast(TEXTS.musicUnavailable, 2400);
      } else {
        Bia.Effects.toast(playing ? TEXTS.musicOn : TEXTS.musicOff, 1600);
      }
    });
    refresh(Bia.Music.isPlaying());
  }

  /* ---------- Reiniciar (com confirmação) ---------- */
  function setupRestart() {
    const modal = doc.getElementById('modal-restart');
    const openButton = doc.getElementById('btn-restart');
    const cancelButton = doc.getElementById('restart-cancel');
    const confirmButton = doc.getElementById('restart-confirm');

    function open() {
      modal.hidden = false;
      cancelButton.focus();
    }
    function close() {
      modal.hidden = true;
      openButton.focus();
    }
    function confirmRestart() {
      state = defaultState();
      clearSavedState();
      Bia.Puzzles.resetAll();
      modal.hidden = true;
      goTo(0, { instant: true });
      updateProgressUi();
      Bia.Effects.toast(TEXTS.restarted);
    }

    openButton.addEventListener('click', function () {
      Bia.Effects.playSound('click');
      open();
    });
    cancelButton.addEventListener('click', close);
    confirmButton.addEventListener('click', confirmRestart);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) close(); // clicou fora do cartão
    });
    doc.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hidden) close();
    });
  }

  /* ---------- Easter eggs ---------- */
  function setupEasterEggs() {
    let taps = [];
    const logo = doc.getElementById('logo');
    logo.addEventListener('click', function () {
      const now = Date.now();
      taps = taps.filter(function (t) { return now - t < LOGO_TAP_WINDOW_MS; });
      taps.push(now);
      Bia.Effects.playSound('click');
      if (taps.length >= LOGO_TAPS_FOR_EGG) {
        taps = [];
        logo.classList.remove('is-egg');
        void logo.offsetWidth;
        logo.classList.add('is-egg');
        Bia.Effects.celebrate(logo, 30, ['🐾', '😺', '✨', '💜']);
        Bia.Effects.playSound('meow');
        Bia.Effects.toast(TEXTS.logoEgg);
      }
    });

    doc.getElementById('chip-op').addEventListener('click', function () {
      Bia.Effects.playSound('discover');
      Bia.Effects.toast(TEXTS.chipEgg, 2400);
    });
  }

  /* ---------- Ligações de eventos ---------- */
  function setupNavigationButtons() {
    doc.getElementById('btn-start').addEventListener('click', startGame);

    // Botões "PRÓXIMA FASE" (data-goto)
    doc.querySelectorAll('[data-goto]').forEach(function (button) {
      button.addEventListener('click', function () {
        Bia.Effects.playSound('click');
        goTo(Number(button.getAttribute('data-goto')));
      });
    });

    // Bolinhas de progresso: só levam a fases já liberadas
    doc.querySelectorAll('.dot').forEach(function (dot) {
      dot.addEventListener('click', function () {
        Bia.Effects.playSound('click');
        goTo(Number(dot.getAttribute('data-phase')));
      });
    });
  }

  function setupWhatsappButtons() {
    doc.getElementById('btn-accept').addEventListener('click', function () {
      Bia.Effects.playSound('success');
      Bia.WhatsApp.openAcceptMessage();
    });
    doc.getElementById('btn-more').addEventListener('click', function () {
      Bia.Effects.playSound('click');
      Bia.WhatsApp.openAlternativeMessage();
    });
  }

  /* ---------- Início ---------- */
  function init() {
    Bia.Effects.createAmbientStars(14);
    Bia.Cats.mount();
    Bia.Navigation.setOnShow(onScreenShown);

    Bia.Puzzles.init({
      complete: completePhase,
      isCompleted: isCompleted
    });
    Bia.Puzzles.syncAll(state.completed);

    setupNavigationButtons();
    setupWhatsappButtons();
    setupSoundButton();
    setupMusicButton();
    setupRestart();
    setupEasterEggs();

    // Retoma de onde parou (na mesma aba); senão, começa na tela inicial.
    const startIndex = canAccess(state.current) ? state.current : 0;
    state.current = startIndex;
    Bia.Navigation.show(startIndex, { instant: true });
  }

  Bia.Game = {
    getState: function () { return JSON.parse(JSON.stringify(state)); },
    canAccess: canAccess,
    goTo: goTo
  };

  init();
})(window);
