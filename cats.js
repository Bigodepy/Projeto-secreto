/* ==========================================================
   PROJETO SECRETO — cats.js
   Gatinhos animados que guiam o jogo: ficam em cada fase, falam num balão
   e reagem ao carinho (toque). A cor de cada gato vem do atributo
   data-cat (orange, gray, white, black) no HTML.
   ========================================================== */
(function (global) {
  'use strict';

  const Bia = (global.Bia = global.Bia || {});
  const doc = global.document;

  const PET_LINES = [
    'Miau! 😺',
    'Purrrr... 💜',
    'Hmm, continua! Tô de olho em você. 🐾',
    'Miau miau! Você tá indo bem! ✨',
    'Mais carinho, por favor! 😽'
  ];
  const PET_HEARTS = ['💜', '🐾', '✨', '💗'];
  const PET_ANIMATION_MS = 650;

  /** Desenho do gato (SVG inline, para as animações poderem mexer em cada parte). */
  const CAT_SVG = [
    '<svg class="cat" viewBox="0 0 120 124" aria-hidden="true" focusable="false">',
    '<ellipse cx="60" cy="119" rx="38" ry="5" fill="#443A50" opacity=".12"/>',
    '<g class="cat-tail">',
    '<path class="cat-tail-out" d="M88 104 C114 104 118 74 104 64"/>',
    '<path class="cat-tail-fur" d="M88 104 C114 104 118 74 104 64"/>',
    '</g>',
    '<ellipse class="cat-fur cat-line" cx="60" cy="100" rx="32" ry="20"/>',
    '<ellipse class="cat-belly" cx="60" cy="106" rx="17" ry="12"/>',
    '<ellipse class="cat-fur cat-line" cx="44" cy="116" rx="10" ry="6"/>',
    '<ellipse class="cat-fur cat-line" cx="76" cy="116" rx="10" ry="6"/>',
    '<g class="cat-head">',
    '<path class="cat-fur cat-line" d="M25 50 L28 16 L52 32 Z"/>',
    '<path class="cat-fur cat-line" d="M95 50 L92 16 L68 32 Z"/>',
    '<path class="cat-ear-in" d="M31 40 L32 25 L44 32 Z"/>',
    '<path class="cat-ear-in" d="M89 40 L88 25 L76 32 Z"/>',
    '<ellipse class="cat-fur cat-line" cx="60" cy="54" rx="37" ry="30"/>',
    '<path class="cat-stripe" d="M60 26 v9 M50 28 l2 8 M70 28 l-2 8"/>',
    '<g class="cat-eye"><ellipse cx="46" cy="54" rx="5.5" ry="7"/><circle cx="48" cy="51" r="2"/></g>',
    '<g class="cat-eye"><ellipse cx="74" cy="54" rx="5.5" ry="7"/><circle cx="76" cy="51" r="2"/></g>',
    '<ellipse cx="35" cy="65" rx="6" ry="4" fill="#F58FA8" opacity=".55"/>',
    '<ellipse cx="85" cy="65" rx="6" ry="4" fill="#F58FA8" opacity=".55"/>',
    '<path d="M56 62 h8 l-4 5 z" fill="#F58FA8" stroke="#443A50" stroke-width="2" stroke-linejoin="round"/>',
    '<path class="cat-mouth" d="M60 67 q-4 6 -9 2 M60 67 q4 6 9 2"/>',
    '<path class="cat-whisk" d="M30 62 l-16 -3 M30 67 l-16 3 M90 62 l16 -3 M90 67 l16 3"/>',
    '</g>',
    '</svg>'
  ].join('');

  let lastPetLine = -1;

  function guides() {
    return Array.prototype.slice.call(doc.querySelectorAll('.cat-guide'));
  }

  /** Acha o gato de uma tela: 'intro', 1, 2, 3, 4 ou 5. */
  function guideOf(screen) {
    return doc.querySelector('#screen-' + screen + ' .cat-guide');
  }

  /** Faz o gato falar uma frase nova no balão (com um "pulinho" de animação). */
  function say(screen, text) {
    const guide = guideOf(screen);
    const bubble = guide && guide.querySelector('.bubble');
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.remove('pop');
    void bubble.offsetWidth; // reinicia a animação
    bubble.classList.add('pop');
  }

  /** Volta o balão de cada gato para a frase original. */
  function resetAll() {
    guides().forEach(function (guide) {
      const bubble = guide.querySelector('.bubble');
      if (bubble && guide.hasAttribute('data-default')) {
        bubble.innerHTML = guide.getAttribute('data-default');
      }
    });
  }

  function pickPetLine() {
    let index = Math.floor(Math.random() * PET_LINES.length);
    if (index === lastPetLine) index = (index + 1) % PET_LINES.length;
    lastPetLine = index;
    return PET_LINES[index];
  }

  /** Carinho no gato: pulinho, olhinhos fechados, coraçõezinhos e miau. */
  function pet(slot) {
    const guide = slot.closest('.cat-guide');
    const bubble = guide && guide.querySelector('.bubble');
    slot.classList.remove('is-petted');
    void slot.offsetWidth;
    slot.classList.add('is-petted');
    global.setTimeout(function () { slot.classList.remove('is-petted'); }, PET_ANIMATION_MS);

    if (bubble) {
      bubble.textContent = pickPetLine();
      bubble.classList.remove('pop');
      void bubble.offsetWidth;
      bubble.classList.add('pop');
    }
    if (Bia.Effects) {
      Bia.Effects.celebrate(slot, 8, PET_HEARTS);
      Bia.Effects.playSound('meow');
    }
  }

  /** Desenha os gatos e guarda a frase original de cada balão. */
  function mount() {
    guides().forEach(function (guide) {
      const slot = guide.querySelector('.cat-slot');
      const bubble = guide.querySelector('.bubble');
      if (slot && !slot.firstChild) slot.innerHTML = CAT_SVG;
      if (bubble) guide.setAttribute('data-default', bubble.innerHTML);
    });
    doc.addEventListener('click', function (event) {
      const slot = event.target.closest('.cat-slot');
      if (slot) pet(slot);
    });
  }

  Bia.Cats = {
    mount: mount,
    say: say,
    resetAll: resetAll
  };
})(window);
