/* ==========================================================
   PROJETO SECRETO — whatsapp.js
   Abre o WhatsApp com uma mensagem já preenchida.
   NÃO envia nada automaticamente: a pessoa decide se manda ou não.
   ========================================================== */
(function (global) {
  'use strict';

  const Bia = (global.Bia = global.Bia || {});

  // ┌──────────────────────────────────────────────────────────────┐
  // │  ✏️  TROQUE O NÚMERO ABAIXO PELO SEU NÚMERO DE WHATSAPP      │
  // │  Formato: código do país (55) + DDD + número, SÓ NÚMEROS.    │
  // │  Exemplo (SP, celular):  "5511999998888"                     │
  // │  Sem espaços, sem "+", sem parênteses e sem traços.          │
  // └──────────────────────────────────────────────────────────────┘
  const WHATSAPP_NUMBER = "5587998189757";

  // Mensagens (podem ser editadas à vontade)
  const MESSAGES = {
    accept: "Oii! KKKKK, missão concluída. Aceito o convite! ❤️",
    more: "KKKKKK, quero saber mais sobre esse convite!"
  };

  const WHATSAPP_BASE_URL = "https://wa.me/";

  /** O número só é válido se tiver 12 ou 13 dígitos (55 + DDD + 8 ou 9 dígitos). */
  function isNumberConfigured() {
    return /^55\d{10,11}$/.test(WHATSAPP_NUMBER);
  }

  /** Codifica o texto para ir na URL (acentos, emojis, espaços, quebras de linha...). */
  function encodeMessage(text) {
    return encodeURIComponent(text);
  }

  /** Monta o link: https://wa.me/55NUMERO?text=MENSAGEM_CODIFICADA */
  function buildLink(message) {
    return WHATSAPP_BASE_URL + WHATSAPP_NUMBER + "?text=" + encodeMessage(message);
  }

  /** Abre o link numa nova aba/app. Se o navegador bloquear, navega na mesma aba. */
  function openChat(message) {
    if (!isNumberConfigured()) {
      // Só aparece se o criador esquecer de configurar o número.
      console.warn("[Projeto Secreto] Configure WHATSAPP_NUMBER em js/whatsapp.js (ex.: 5511999998888).");
      if (Bia.Effects) {
        Bia.Effects.toast("O número do WhatsApp ainda não foi configurado no jogo. 🙈");
      }
      return false;
    }
    const url = buildLink(message);
    const opened = global.open(url, "_blank", "noopener");
    if (!opened) {
      global.location.href = url;
    }
    return true;
  }

  function openAcceptMessage() {
    return openChat(MESSAGES.accept);
  }

  function openAlternativeMessage() {
    return openChat(MESSAGES.more);
  }

  Bia.WhatsApp = {
    MESSAGES: MESSAGES,
    isNumberConfigured: isNumberConfigured,
    encodeMessage: encodeMessage,
    buildLink: buildLink,
    openAcceptMessage: openAcceptMessage,
    openAlternativeMessage: openAlternativeMessage
  };
})(window);
