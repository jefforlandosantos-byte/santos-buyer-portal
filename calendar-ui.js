// Santos Buyer Portal — bilingual weekly date labels
// Loaded after the main portal script. Updates buyer and agent availability labels
// without changing the existing Supabase availability data model.
(function () {
  'use strict';

  const DAY_NAMES = {
    0: ['Sunday', 'Domingo'],
    1: ['Monday', 'Lunes'],
    2: ['Tuesday', 'Martes'],
    3: ['Wednesday', 'Miércoles'],
    4: ['Thursday', 'Jueves'],
    5: ['Friday', 'Viernes'],
    6: ['Saturday', 'Sábado']
  };

  function currentSunday() {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  function dateForDay(dayNumber) {
    const d = currentSunday();
    d.setDate(d.getDate() + Number(dayNumber));
    return d;
  }

  function formatDate(d) {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  function label(dayNumber) {
    const names = DAY_NAMES[Number(dayNumber)] || ['', ''];
    return names[0] + ' / ' + names[1] + ' · ' + formatDate(dateForDay(dayNumber));
  }

  function updateBuyerDays() {
    document.querySelectorAll('#availability .day[data-day]').forEach(function (card) {
      const heading = card.querySelector('b');
      if (heading) heading.textContent = label(card.dataset.day);
    });
  }

  function updateAgentAvailability() {
    const root = document.getElementById('agentAvail');
    if (!root) return;

    // Agent availability is rendered as text by the existing app. Replace only
    // recognizable day abbreviations, preserving the buyer's saved hours.
    const replacements = [
      ['Dom', label(0)], ['Lun', label(1)], ['Mar', label(2)],
      ['Mié', label(3)], ['Jue', label(4)], ['Vie', label(5)], ['Sáb', label(6)]
    ];

    root.querySelectorAll('b, strong').forEach(function (el) {
      const text = el.textContent.trim();
      replacements.forEach(function (pair) {
        if (text === pair[0]) el.textContent = pair[1];
      });
    });
  }

  function updateAll() {
    updateBuyerDays();
    updateAgentAvailability();
  }

  const observer = new MutationObserver(function () {
    updateAll();
  });

  function start() {
    updateAll();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();