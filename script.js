/* =========================================================
   MyAsta Live — card signature "asta dal vivo"
   Vanilla JS, nessuna dipendenza. Anima timer ad arco,
   rilanci dell'importo e cambio leader, come nell'app reale.
   Rispetta prefers-reduced-motion.
   ========================================================= */
(function () {
  'use strict';

  var card = document.getElementById('auctionCard');
  if (!card) return;

  var arc = document.getElementById('timerArc');
  var valueEl = document.getElementById('timerValue');
  var amountEl = document.getElementById('bidAmount');
  var leaderEl = document.getElementById('leaderName');
  var timerEl = card.querySelector('.timer');

  var R = 90;
  var CIRCUMFERENCE = 2 * Math.PI * R; // ~565.49
  arc.style.strokeDasharray = CIRCUMFERENCE.toFixed(2);

  // Soglie colore identiche all'app (auction_page.dart -> _timerColor)
  var VIOLET = '#A78BFA';
  var GOLD = '#FBBF24';
  var SALMON = '#FC8181';

  var NAMES = ['Giulia', 'Marco', 'Luca', 'Sara', 'Dani', 'Elisa', 'Teo', 'Anna', 'Pietro', 'Bea'];

  var TOTAL = 8;          // secondi pieni del countdown
  var amount = 34;        // importo iniziale (€)
  var leader = 'Giulia';

  function colorFor(progress) {
    if (progress > 0.5) return VIOLET;
    if (progress > 0.25) return GOLD;
    return SALMON;
  }

  function render(progress, seconds) {
    progress = Math.max(0, Math.min(1, progress));
    arc.style.strokeDashoffset = (CIRCUMFERENCE * (1 - progress)).toFixed(2);
    arc.style.stroke = colorFor(progress);
    valueEl.textContent = String(seconds);
    if (progress <= 0.25) {
      timerEl.classList.add('is-urgent');
    } else {
      timerEl.classList.remove('is-urgent');
    }
  }

  // --- Stato statico per chi preferisce ridurre le animazioni ---
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    render(0.7, 6);
    amountEl.textContent = amount + ' €';
    leaderEl.textContent = leader;
    return;
  }

  // --- Loop animato ---
  var remaining = TOTAL;            // secondi rimanenti (float)
  var rebidAt = pickRebidPoint();   // soglia (in secondi) a cui scatta il rilancio
  var lastTs = null;

  function pickRebidPoint() {
    // A volte il rilancio arriva presto, a volte si lascia scendere il timer
    // fin quasi alla scadenza (arco rosso) per dare tensione.
    return 0.5 + Math.random() * 5.5;
  }

  function nextLeader() {
    var n;
    do { n = NAMES[Math.floor(Math.random() * NAMES.length)]; } while (n === leader);
    return n;
  }

  function doRebid() {
    amount += 1 + Math.floor(Math.random() * 4); // +1..+4 €
    leader = nextLeader();
    amountEl.textContent = amount + ' €';
    leaderEl.textContent = leader;
    // Effetto "pop" sull'importo
    amountEl.classList.add('bump');
    setTimeout(function () { amountEl.classList.remove('bump'); }, 180);
    // Reset del timer come fa l'app a ogni offerta
    remaining = TOTAL;
    rebidAt = pickRebidPoint();
  }

  function frame(ts) {
    if (lastTs === null) lastTs = ts;
    var dt = (ts - lastTs) / 1000;
    lastTs = ts;

    remaining -= dt;

    if (remaining <= rebidAt) {
      // Lascia che il numero/arco tocchino quasi lo zero prima di rilanciare,
      // così l'utente vede l'arco diventare rosso.
      if (remaining <= 0.15) {
        doRebid();
      } else if (remaining <= rebidAt && rebidAt > 0.6 && Math.random() < 0.02) {
        // Piccola probabilità di rilanciare "in anticipo" per varietà.
        doRebid();
      }
    }

    if (remaining < 0) remaining = 0;
    render(remaining / TOTAL, Math.max(0, Math.ceil(remaining)));
    requestAnimationFrame(frame);
  }

  // Stato iniziale coerente con l'HTML, poi avvio.
  amountEl.textContent = amount + ' €';
  leaderEl.textContent = leader;
  requestAnimationFrame(frame);
})();
