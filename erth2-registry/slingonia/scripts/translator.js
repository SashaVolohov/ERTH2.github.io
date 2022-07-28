// ==UserScript==
// @name         Slingonian translator for vk
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Translator for Slingonian language in vk (ctrl+q Ru to Sli, alt+q Sli to Ru)
// @author       Artemy Egorov
// @match        https://*vk.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mozilla.org
// @grant        none
// ==/UserScript==

window.addEventListener("load", () => {
  setInterval(addTranslate, 1000);

  let input = document.querySelector(".im-chat-input--text");

  setInterval(() => {
    let toChange = document.querySelector(".im-chat-input--text");
    if (toChange) input = toChange;
  }, 2500);

  document.addEventListener("keyup", (e) => {
    if (e.code === "KeyQ" && e.ctrlKey) {
      let text = input.innerText;
      input.innerText = RuToSli(text);
    }

    if (e.code === "KeyQ" && e.altKey) {
      let text = input.innerText;
      input.innerText = SliToRu(text);
    }
  });

  function addTranslate() {
    let messages = document.querySelectorAll(".im-mess--text");
    for (let message of messages) {
      let text = message.innerHTML.replace(/<.*>/gi, "");
      message.title = `${RuToSli(text)} / ${SliToRu(text)}`;
    }
  }
});

function SliToRu(str, reverse) {
  let total = "";
  for (let char of str) {
    let upper = isUpper(char);
    let norm = false;
    let initchar = char;
    char = char.toLowerCase();
    for (let item of alphabet) {
      if (item[reverse ? 0 : 1] === char) {
        if (upper) total += item[reverse ? 1 : 0].toUpperCase();
        else total += item[reverse ? 1 : 0];
        norm = true;
      }
    }
    if (!norm) total += initchar;
  }
  return total;
}

function RuToSli(str) {
  return SliToRu(str, true);
}

function isUpper(char) {
  return char.toLowerCase() !== char;
}

let alphabet = [
  ["а", "э"],
  ["б", "ш"],
  ["в", "щ"],
  ["г", "ч"],
  ["д", "ц"],
  ["е", "е"],
  ["ё", "ё"],
  ["ж", "й"],
  ["з", "х"],
  ["и", "у"],
  ["й", "л"],
  ["к", "ф"],
  ["л", "т"],
  ["м", "с"],
  ["н", "р"],
  ["о", "ы"],
  ["п", "к"],
  ["р", "п"],
  ["с", "н"],
  ["т", "м"],
  ["у", "о"],
  ["ф", "з"],
  ["х", "ж"],
  ["ц", "д"],
  ["ч", "г"],
  ["ш", "в"],
  ["щ", "б"],
  ["ъ", "ъ"],
  ["ы", "ю"],
  ["ь", "ь"],
  ["э", "я"],
  ["ю", "а"],
  ["я", "и"],
];
