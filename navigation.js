/* ==========================================================
   PROJETO SECRETO — navigation.js
   Troca de telas sem recarregar a página (com transição animada).
   Índice 0 = tela inicial; 1 a 5 = fases.
   ========================================================== */
(function (global) {
  'use strict';

  const Bia = (global.Bia = global.Bia || {});
  const doc = global.document;

  const SCREEN_IDS = ['intro', '1', '2', '3', '4', '5'];
  const LEAVE_MS = 220;

  let currentIndex = null;
  let transitionTimer = null;
  let onShow = null;

  function screenEl(index) {
    return doc.getElementById('screen-' + SCREEN_IDS[index]);
  }

  function reduced() {
    return Bia.Effects ? Bia.Effects.prefersReducedMotion() : false;
  }

  function enter(index, direction) {
    const next = screenEl(index);
    next.hidden = false;
    next.setAttribute('data-dir', direction);
    next.classList.remove('is-leaving', 'is-entering');
    void next.offsetWidth; // reinicia a animação de entrada
    next.classList.add('is-entering');

    currentIndex = index;
    doc.body.setAttribute('data-screen', SCREEN_IDS[index]);
    global.scrollTo(0, 0);

    const heading = next.querySelector('h1, h2');
    if (heading && heading.focus) heading.focus({ preventScroll: true });

    if (onShow) onShow(index);
  }

  /**
   * Mostra uma tela. Quem decide se a fase está liberada é o game.js
   * (a navegação só executa a troca).
   */
  function show(index, options) {
    if (!screenEl(index) || index === currentIndex) return;
    const instant = !!(options && options.instant);
    const direction = currentIndex === null || index > currentIndex ? 'forward' : 'back';
    const previous = currentIndex === null ? null : screenEl(currentIndex);

    global.clearTimeout(transitionTimer);
    // Garante que só a tela de destino fique visível
    SCREEN_IDS.forEach(function (_, i) {
      const el = screenEl(i);
      if (el !== previous && el !== screenEl(index)) {
        el.hidden = true;
        el.classList.remove('is-entering', 'is-leaving');
      }
    });

    if (!previous || instant || reduced()) {
      if (previous) {
        previous.hidden = true;
        previous.classList.remove('is-entering', 'is-leaving');
      }
      enter(index, direction);
      return;
    }

    previous.classList.remove('is-entering');
    previous.classList.add('is-leaving');
    transitionTimer = global.setTimeout(function () {
      previous.hidden = true;
      previous.classList.remove('is-leaving');
      enter(index, direction);
    }, LEAVE_MS);
  }

  Bia.Navigation = {
    show: show,
    current: function () { return currentIndex; },
    setOnShow: function (callback) { onShow = callback; },
    SCREEN_IDS: SCREEN_IDS
  };
})(window);
