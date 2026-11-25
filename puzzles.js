/* ==========================================================
   PROJETO SECRETO — puzzles.js
   Conteúdo (textos e respostas) e lógica dos enigmas das 5 fases.
   Para trocar uma resposta ou mensagem, edite o objeto CONTENT.
   ========================================================== */
(function (global) {
  'use strict';

  const Bia = (global.Bia = global.Bia || {});
  const doc = global.document;

  /* ---------- CONTEÚDO (textos e respostas) ---------- */
  const CONTENT = {
    phase1: {
      answer: 'SEGREDO',
      scrambled: ['D', 'O', 'R', 'E', 'G', 'S', 'E'], // letras embaralhadas de SEGREDO
      emptyMessage: 'Digite uma palavra primeiro. 😉',
      wrongOrder: [
        'Quase! Essa ordem não deu certo. Tenta de novo! 🔍',
        'Hmm, não é essa. As letras voltaram pra você tentar outra vez. 🕵️',
        'Ainda não, mas você está pertinho! ✨'
      ],
      assist: 'Te dei a primeira letra de presente! 🎁',
      errors: [
        'Hmm, essa não é a palavra escondida. Tenta de novo! 🔍',
        'Quase lá... ou não! Mas investigadora de verdade não desiste. 🕵️',
        'Ainda não, mas as letras estão todas aí na sua frente. ✨'
      ],
      eggs: {
        bia: 'Eita! A investigadora-chefe é você, mas o nome não é a palavra. 😄'
      },
      assistAfterWrong: 2 // depois de quantos erros o jogo coloca a 1ª letra sozinho
    },
    phase2: {
      correct: 'livro',
      paths: {
        montanha: 'Você subiu, subiu, subiu... e só encontrou uma vista linda e muita falta de ar! 🏔️ Nenhuma história começa por aqui. Escolha outro caminho!',
        rio: 'Splash! 🐸 Os sapos juram que não sabem de nada. Que tal tentar outro caminho?'
      }
    },
    phase3: {
      correct: 'chave',
      nudgeAfterWrong: 2, // depois de quantos erros a chave começa a brilhar
      objects: {
        lupa: 'Pela lupa dá pra ver tudo de pertinho... Lá no topo da tela tem um número bem pequenininho: o número deste projeto. Vale guardar! 🔍 Mas aqui não tem nada de metal.',
        envelope: 'O envelope está vazio... só tem cheirinho de mistério. Procure algo de metal que abre portas! ✉️'
      }
    },
    phase4: {
      code: '023',
      shortMessage: 'O código tem três números. 😉',
      error: 'O baú nem se mexeu... esse não é o código. Olha o número lá em cima, no topo da tela! 🔒',
      eggs: {
        '123': 'Clássico! Mas nem o baú acreditou nessa. 😅',
        '000': 'Três zeros? Quase... mas tem um número diferente escondido aí. 👀',
        '007': 'Agente 007 não faz parte desta missão. 🕶️'
      },
      openedLabel: 'Um baú misterioso, aberto e brilhando'
    },
    // Frases dos gatinhos quando algo acontece
    cat: {
      1: {
        right: 'Miau! Você descobriu a palavra! 😺',
        wrong: ['Quase! Toca nas letras com calma. 🐾', 'Miau... tenta outra ordem! 😸'],
        assist: 'Olha, eu coloquei a primeira letra pra você! 🎁'
      },
      2: {
        right: 'Miau! Era esse caminho mesmo! 📖',
        wrong: 'Hmm, onde as histórias começam? Pensa em páginas e capas... 📖'
      },
      3: {
        right: 'Miau! A chave! Eu sabia que você ia achar! 🔑',
        wrong: 'Algo pequeno, de metal, que abre portas... 🤔',
        nudge: 'Psiu! Olha como a chave tá brilhando... ✨'
      },
      4: {
        right: 'Miau! O baú abriu! ✨',
        wrong: 'Olha lá em cima, no topo da tela! O número tá piscando! 👆'
      }
    },
    hints: {
      1: [
        'São 7 letras, e a letra E aparece duas vezes.',
        'Começa com S e termina com O.',
        'É aquilo que as pessoas guardam quando dizem "não conta pra ninguém".'
      ],
      2: [
        'Releia a charada: onde as histórias começam?',
        'Pense onde existem páginas, capas e capítulos. É o caminho do LIVRO!'
      ],
      3: [
        'Releia a pista anterior: algo pequeno, de metal, que abre portas.',
        'Entre lupa, chave e envelope... qual deles abre portas (e baús)? A chave!'
      ],
      4: [
        'O número do projeto aparece o tempo todo no topo da tela. Olhe lá!',
        'São três dígitos, e o primeiro é zero.',
        'Começa com 0 e termina com 3.'
      ]
    }
  };

  /* ---------- Estado interno ---------- */
  const REVEAL_DELAYS = [300, 1300, 2700, 4100, 5300, 6400, 7800, 8700, 9400]; // ms, um por .reveal-item
  const CHEST_OPEN_DELAY = 1200; // ms até mostrar a mensagem depois que o baú abre
  const WALK_DURATION = 1400; // ms da caminhada no mapa
  const WRONG_ORDER_RESET_MS = 750; // tempo até as letras errôneas voltarem

  let game = null; // { complete(n), isCompleted(n) } — entregue pelo game.js
  const hintLevel = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const wrongCount = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let picked = [];          // fase 1: índices das letras escolhidas, na ordem
  let checkingWord = false; // fase 1: true enquanto a palavra errada "volta"
  let mapBusy = false;
  let chestTimer = null;
  let wordTimer = null;
  let revealTimers = [];
  let revealRunning = false;
  let revealFinished = false;

  /* ---------- Utilidades ---------- */
  function $(id) { return doc.getElementById(id); }
  function Fx() { return Bia.Effects; }

  function catSay(screen, text) {
    if (Bia.Cats && text) Bia.Cats.say(screen, text);
  }

  /** Minúsculas, sem acentos e sem espaços: "  Segredo " -> "segredo". */
  function normalizeText(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '');
  }

  function setFeedback(phase, text, type) {
    const el = $('feedback-' + phase);
    if (!el) return;
    el.textContent = text || '';
    el.className = 'feedback' + (type ? ' is-' + type : '');
  }

  function revealHint(phase) {
    const list = CONTENT.hints[phase];
    const box = $('hint-' + phase);
    if (!list || !box) return;
    const index = Math.min(hintLevel[phase], list.length - 1);
    hintLevel[phase] = Math.min(hintLevel[phase] + 1, list.length);
    box.hidden = false;
    box.textContent = '💡 Dica ' + (index + 1) + '/' + list.length + ': ' + list[index];
  }

  function hideHint(phase) {
    const box = $('hint-' + phase);
    if (box) { box.hidden = true; box.textContent = ''; }
  }

  /** Mostra (ou esconde) o painel de sucesso da fase e deixa a área do enigma "resolvida". */
  function setSolvedView(phase, solved, scrollToSuccess) {
    const area = $('area-' + phase);
    const success = $('success-' + phase);
    if (area) area.classList.toggle('is-solved', solved);
    if (success) {
      success.hidden = !solved;
      if (solved && scrollToSuccess && success.scrollIntoView) {
        success.scrollIntoView({ behavior: Fx().prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
      }
    }
  }

  function wrongAttempt(phase) {
    wrongCount[phase] += 1;
    Fx().playSound('error');
    return wrongCount[phase];
  }

  /* ---------- FASE 1 — letras embaralhadas (toque nas letras) ---------- */
  function renderPhase1() {
    const slots = $('slots-1');
    const tiles = $('tiles-1');
    if (!slots || !tiles) return;
    slots.innerHTML = '';
    tiles.innerHTML = '';

    for (let position = 0; position < CONTENT.phase1.answer.length; position++) {
      const slot = doc.createElement('button');
      slot.type = 'button';
      slot.className = 'slot';
      slot.setAttribute('data-slot', String(position));
      slots.appendChild(slot);
    }
    CONTENT.phase1.scrambled.forEach(function (letter, index) {
      const tile = doc.createElement('button');
      tile.type = 'button';
      tile.className = 'tile';
      tile.setAttribute('data-tile', String(index));
      tile.setAttribute('aria-label', 'Letra ' + letter);
      tile.textContent = letter;
      tiles.appendChild(tile);
    });
    refreshPhase1();
  }

  /** Atualiza as letras nos espaços e escurece as letras já usadas. */
  function refreshPhase1() {
    const letters = CONTENT.phase1.scrambled;
    $('slots-1').querySelectorAll('.slot').forEach(function (slot, position) {
      const has = picked[position] !== undefined;
      slot.textContent = has ? letters[picked[position]] : '';
      slot.classList.toggle('is-filled', has);
      slot.setAttribute('aria-label', has
        ? 'Letra ' + letters[picked[position]] + ' no espaço ' + (position + 1) + '. Toque para remover.'
        : 'Espaço ' + (position + 1) + ' vazio');
    });
    $('tiles-1').querySelectorAll('.tile').forEach(function (tile, index) {
      tile.disabled = picked.indexOf(index) !== -1;
    });
  }

  /** Posição das letras de SEGREDO dentro das letras embaralhadas (trata letras repetidas). */
  function solvedOrder() {
    const used = [];
    CONTENT.phase1.answer.split('').forEach(function (char) {
      const index = CONTENT.phase1.scrambled.findIndex(function (letter, i) {
        return letter === char && used.indexOf(i) === -1;
      });
      used.push(index);
    });
    return used;
  }

  function solvePhase1() {
    global.clearTimeout(wordTimer);
    checkingWord = false;
    picked = solvedOrder();
    refreshPhase1();
    setFeedback(1, '', '');
    $('input-1').blur();
    Fx().playSound('success');
    Fx().celebrate($('slots-1'), 30);
    catSay(1, CONTENT.cat[1].right);
    game.complete(1);
    setSolvedView(1, true, true);
  }

  /** A palavra montada está errada: balança, avisa e devolve as letras. */
  function failWord() {
    checkingWord = true;
    const data = CONTENT.phase1;
    const count = wrongAttempt(1);
    setFeedback(1, data.wrongOrder[(count - 1) % data.wrongOrder.length], 'error');
    Fx().shake($('slots-1'));
    catSay(1, CONTENT.cat[1].wrong[(count - 1) % CONTENT.cat[1].wrong.length]);
    revealHint(1);

    wordTimer = global.setTimeout(function () {
      picked = [];
      // Depois de alguns erros, o jogo dá a primeira letra de presente
      if (count >= data.assistAfterWrong) {
        const first = solvedOrder()[0];
        picked = [first];
        setFeedback(1, data.assist, 'info');
        catSay(1, CONTENT.cat[1].assist);
      }
      checkingWord = false;
      refreshPhase1();
    }, WRONG_ORDER_RESET_MS);
  }

  function checkPickedWord() {
    const word = picked.map(function (index) { return CONTENT.phase1.scrambled[index]; }).join('');
    if (normalizeText(word) === normalizeText(CONTENT.phase1.answer)) solvePhase1();
    else failWord();
  }

  function onTileTap(index) {
    if (game.isCompleted(1) || checkingWord) return;
    if (picked.length >= CONTENT.phase1.answer.length || picked.indexOf(index) !== -1) return;
    picked.push(index);
    Fx().playSound('click');
    setFeedback(1, '', '');
    refreshPhase1();
    if (picked.length === CONTENT.phase1.answer.length) checkPickedWord();
  }

  function onSlotTap(position) {
    if (game.isCompleted(1) || checkingWord || picked[position] === undefined) return;
    picked.splice(position, 1);
    Fx().playSound('click');
    setFeedback(1, '', '');
    refreshPhase1();
  }

  function onClearPhase1() {
    if (game.isCompleted(1) || checkingWord) return;
    picked = [];
    setFeedback(1, '', '');
    Fx().playSound('click');
    refreshPhase1();
  }

  function onPhase1Click(event) {
    const tile = event.target.closest('[data-tile]');
    if (tile) { onTileTap(Number(tile.getAttribute('data-tile'))); return; }
    const slot = event.target.closest('[data-slot]');
    if (slot) onSlotTap(Number(slot.getAttribute('data-slot')));
  }

  /** Resposta digitada (alternativa para quem prefere o teclado). */
  function onSubmitPhase1(event) {
    event.preventDefault();
    if (game.isCompleted(1)) return;
    const input = $('input-1');
    const typed = normalizeText(input.value);
    const data = CONTENT.phase1;

    if (!typed) {
      setFeedback(1, data.emptyMessage, 'info');
      input.focus();
      return;
    }
    if (typed === normalizeText(data.answer)) {
      solvePhase1();
      return;
    }

    const count = wrongAttempt(1);
    const egg = data.eggs[typed];
    setFeedback(1, egg || data.errors[(count - 1) % data.errors.length], 'error');
    Fx().shake($('form-1'));
    catSay(1, CONTENT.cat[1].wrong[(count - 1) % CONTENT.cat[1].wrong.length]);
    revealHint(1); // errou: mostra a próxima dica
  }

  /* ---------- FASE 2 — mapa com três caminhos ---------- */
  function animateWalker(pathEl, done) {
    const walker = $('map-walker');
    const length = pathEl.getTotalLength ? pathEl.getTotalLength() : 0;
    if (Fx().prefersReducedMotion() || !length || !walker || !global.requestAnimationFrame) {
      done();
      return;
    }
    pathEl.style.setProperty('--len', length.toFixed(0));
    pathEl.classList.add('is-drawing');
    walker.setAttribute('opacity', '1');
    const startTime = global.performance.now();
    function step(now) {
      const progress = Math.min(1, (now - startTime) / WALK_DURATION);
      const point = pathEl.getPointAtLength(length * progress);
      walker.setAttribute('cx', point.x.toFixed(1));
      walker.setAttribute('cy', point.y.toFixed(1));
      if (progress < 1) {
        global.requestAnimationFrame(step);
      } else {
        done();
      }
    }
    global.requestAnimationFrame(step);
  }

  function markPathAsRight() {
    const key = CONTENT.phase2.correct;
    const path = $('path-' + key);
    if (path) path.classList.add('is-right');
    doc.querySelectorAll('#screen-2 [data-path="' + key + '"]').forEach(function (el) {
      el.classList.add('is-right');
    });
  }

  function choosePath(key) {
    if (game.isCompleted(2) || mapBusy) return;
    const data = CONTENT.phase2;
    const targets = doc.querySelectorAll('#screen-2 [data-path="' + key + '"]');

    if (key === data.correct) {
      mapBusy = true;
      setFeedback(2, 'Boa escolha! Seguindo o caminho... 👣', 'ok');
      Fx().playSound('discover');
      markPathAsRight();
      animateWalker($('path-' + key), function () {
        mapBusy = false;
        setFeedback(2, '', '');
        Fx().playSound('success');
        Fx().celebrate($('treasure-map'), 30);
        catSay(2, CONTENT.cat[2].right);
        game.complete(2);
        setSolvedView(2, true, true);
      });
      return;
    }

    targets.forEach(function (el) { el.classList.add('is-tried'); });
    wrongAttempt(2);
    setFeedback(2, data.paths[key], 'info');
    catSay(2, CONTENT.cat[2].wrong);
    revealHint(2); // já na primeira tentativa errada aparece uma dica
    const card = doc.querySelector('#path-list [data-path="' + key + '"]');
    Fx().shake(card, 'wiggle');
  }

  function onMapInteraction(event) {
    const el = event.target.closest('[data-path]');
    if (!el || !$('screen-2').contains(el)) return;
    if (event.type === 'keydown') {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
    }
    Fx().playSound('click');
    choosePath(el.getAttribute('data-path'));
  }

  /* ---------- FASE 3 — objetos suspeitos ---------- */
  function nudgeCorrectObject() {
    const key = doc.querySelector('#desk [data-object="' + CONTENT.phase3.correct + '"]');
    if (key) key.classList.add('is-nudged');
  }

  function chooseObject(key, button) {
    if (game.isCompleted(3)) return;
    const data = CONTENT.phase3;
    const note = $('note-3');

    if (key === data.correct) {
      button.classList.remove('is-nudged');
      button.classList.add('is-right');
      note.textContent = '🔑 Isso aí! Você encontrou o objeto certo!';
      Fx().playSound('discover');
      Fx().celebrate(button, 28);
      catSay(3, CONTENT.cat[3].right);
      game.complete(3);
      setSolvedView(3, true, true);
      return;
    }
    button.classList.add('is-checked');
    Fx().playSound('click');
    Fx().shake(button, 'wiggle');
    note.textContent = data.objects[key];
    const count = wrongAttempt(3);
    if (count >= data.nudgeAfterWrong) {
      nudgeCorrectObject();
      catSay(3, CONTENT.cat[3].nudge);
      revealHint(3);
    } else {
      catSay(3, CONTENT.cat[3].wrong);
    }
  }

  function onDeskClick(event) {
    const button = event.target.closest('[data-object]');
    if (button) chooseObject(button.getAttribute('data-object'), button);
  }

  /* ---------- FASE 4 — baú com código ---------- */
  function setChestOpen(open) {
    const stage = $('chest-stage');
    const chest = $('chest');
    if (stage) stage.classList.toggle('is-open', open);
    if (chest) chest.setAttribute('aria-label', open ? CONTENT.phase4.openedLabel : 'Um baú misterioso, fechado');
  }

  function onSubmitPhase4(event) {
    event.preventDefault();
    if (game.isCompleted(4)) return;
    const input = $('input-4');
    const data = CONTENT.phase4;
    const digits = input.value.replace(/\D/g, '');

    if (digits.length !== data.code.length) {
      setFeedback(4, data.shortMessage, 'info');
      input.focus();
      return;
    }
    if (digits === data.code) {
      setFeedback(4, 'Clique... o baú está abrindo! ✨', 'ok');
      input.blur();
      input.disabled = true;
      setChestOpen(true);
      Fx().playSound('success');
      catSay(4, CONTENT.cat[4].right);
      global.setTimeout(function () { Fx().celebrate($('chest'), 36); }, 350);
      game.complete(4);
      const delay = Fx().prefersReducedMotion() ? 0 : CHEST_OPEN_DELAY;
      chestTimer = global.setTimeout(function () {
        setFeedback(4, '', '');
        setSolvedView(4, true, true);
      }, delay);
      return;
    }

    wrongAttempt(4);
    setFeedback(4, data.eggs[digits] || data.error, 'error');
    catSay(4, CONTENT.cat[4].wrong);
    const stage = $('chest-stage');
    stage.classList.add('is-shaking');
    global.setTimeout(function () { stage.classList.remove('is-shaking'); }, 500);
    revealHint(4); // já na primeira tentativa errada aparece uma dica
  }

  /* ---------- FASE 5 — revelação ---------- */
  function revealItems() {
    return Array.prototype.slice.call(doc.querySelectorAll('#reveal-stage .reveal-item'));
  }

  function finishReveal() {
    revealRunning = false;
    const skip = $('skip-hint');
    if (skip) skip.hidden = true;
    if (!revealFinished) {
      revealFinished = true;
      game.complete(5);
    }
  }

  function stopReveal() {
    revealTimers.forEach(function (id) { global.clearTimeout(id); });
    revealTimers = [];
    revealRunning = false;
  }

  function showAllRevealItems() {
    stopReveal();
    revealItems().forEach(function (item) { item.classList.add('in'); });
    finishReveal();
  }

  function startReveal() {
    stopReveal();
    const stage = $('reveal-stage');
    const items = revealItems();
    if (!stage || !items.length) return;

    // Já viu a revelação, ou prefere menos movimento: mostra tudo de uma vez.
    if (game.isCompleted(5) || Fx().prefersReducedMotion()) {
      stage.classList.remove('is-revealing');
      showAllRevealItems();
      return;
    }

    stage.classList.add('is-revealing');
    items.forEach(function (item) { item.classList.remove('in'); });
    const skip = $('skip-hint');
    if (skip) skip.hidden = false;
    revealRunning = true;

    items.forEach(function (item, index) {
      const id = global.setTimeout(function () {
        item.classList.add('in');
        if (item.classList.contains('big-question')) {
          Fx().playSound('discover');
          Fx().celebrate(item, 34);
        }
        if (index === items.length - 1) finishReveal();
      }, REVEAL_DELAYS[Math.min(index, REVEAL_DELAYS.length - 1)]);
      revealTimers.push(id);
    });
  }

  function onFinalScreenTap(event) {
    if (!revealRunning) return;
    if (event.target.closest('button')) return;
    showAllRevealItems();
  }

  /* ---------- Sincronização com o progresso salvo ---------- */
  function syncPhase(phase, solved) {
    if (phase === 1) {
      picked = solved ? solvedOrder() : [];
      refreshPhase1();
      setSolvedView(1, solved, false);
    } else if (phase === 2) {
      if (solved) markPathAsRight();
      setSolvedView(2, solved, false);
    } else if (phase === 3) {
      if (solved) {
        const key = doc.querySelector('#desk [data-object="' + CONTENT.phase3.correct + '"]');
        if (key) key.classList.add('is-right');
      }
      setSolvedView(3, solved, false);
    } else if (phase === 4) {
      setChestOpen(solved);
      const input = $('input-4');
      if (input) input.disabled = solved;
      setSolvedView(4, solved, false);
    }
  }

  function syncAll(completed) {
    for (let phase = 1; phase <= 4; phase++) {
      syncPhase(phase, !!completed[phase - 1]);
    }
  }

  /** Volta tudo ao estado inicial (usado ao reiniciar o jogo). */
  function resetAll() {
    stopReveal();
    global.clearTimeout(chestTimer);
    global.clearTimeout(wordTimer);
    mapBusy = false;
    checkingWord = false;
    revealFinished = false;
    picked = [];
    for (let phase = 1; phase <= 4; phase++) {
      hintLevel[phase] = 0;
      wrongCount[phase] = 0;
      hideHint(phase);
      setFeedback(phase, '', '');
      setSolvedView(phase, false, false);
    }
    refreshPhase1();
    const details = $('details-1');
    if (details) details.open = false;
    ['input-1', 'input-4'].forEach(function (id) {
      const input = $(id);
      if (input) { input.value = ''; input.disabled = false; }
    });
    // fase 2
    doc.querySelectorAll('#screen-2 .is-right, #screen-2 .is-tried').forEach(function (el) {
      el.classList.remove('is-right', 'is-tried');
    });
    const path = $('path-' + CONTENT.phase2.correct);
    if (path) { path.classList.remove('is-drawing', 'is-right'); path.style.removeProperty('--len'); }
    const walker = $('map-walker');
    if (walker) { walker.setAttribute('opacity', '0'); walker.setAttribute('cx', '160'); walker.setAttribute('cy', '252'); }
    // fase 3
    doc.querySelectorAll('#desk .obj').forEach(function (el) { el.classList.remove('is-right', 'is-checked', 'is-nudged'); });
    const note = $('note-3');
    if (note) note.textContent = 'Qual desses objetos esconde a próxima pista?';
    // fase 4
    setChestOpen(false);
    // fase 5
    revealItems().forEach(function (item) { item.classList.remove('in'); });
    const stage = $('reveal-stage');
    if (stage) stage.classList.add('is-revealing');
    // gatinhos voltam a falar as frases do começo
    if (Bia.Cats) Bia.Cats.resetAll();
  }

  /* ---------- Inicialização ---------- */
  function init(gameApi) {
    game = gameApi;
    renderPhase1();

    $('area-1').addEventListener('click', onPhase1Click);
    $('clear-1').addEventListener('click', onClearPhase1);
    $('form-1').addEventListener('submit', onSubmitPhase1);
    $('form-4').addEventListener('submit', onSubmitPhase4);

    const screen2 = $('screen-2');
    screen2.addEventListener('click', onMapInteraction);
    screen2.addEventListener('keydown', onMapInteraction);
    $('desk').addEventListener('click', onDeskClick);
    $('screen-5').addEventListener('click', onFinalScreenTap);

    // Botões "Pedir uma dica" (todas as fases)
    doc.querySelectorAll('[data-hint]').forEach(function (button) {
      button.addEventListener('click', function () {
        Fx().playSound('click');
        revealHint(Number(button.getAttribute('data-hint')));
      });
    });

    // O código do baú só aceita números
    $('input-4').addEventListener('input', function (event) {
      event.target.value = event.target.value.replace(/\D/g, '').slice(0, 3);
    });
  }

  Bia.Puzzles = {
    CONTENT: CONTENT,
    normalizeText: normalizeText,
    init: init,
    syncPhase: syncPhase,
    syncAll: syncAll,
    resetAll: resetAll,
    startReveal: startReveal,
    stopReveal: stopReveal
  };
})(window);
