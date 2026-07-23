/* Aperçu écran du corrigé illustré : 4 jours + schémas SVG par catégorie. */
(function () {
  'use strict';
  var catLabel = window.IEP1CatLabels.catLabel;
  var buildSchemaSVG = window.IEP1Schemas.buildSchemaSVG;

  var NIVEAUX = [
    { code: 'CM1', label: 'CM1', data: DATA_CM1, key: 'CM1', available: true },
    { code: 'CM2', label: 'CM2', data: DATA_CM2, key: 'CM2', available: true },
    { code: 'CE2', label: 'CE2', data: null, key: 'CE2', available: false },
    { code: 'CE1', label: 'CE1', data: null, key: 'CE1', available: false },
    { code: 'CP', label: 'CP', data: null, key: 'CP', available: false },
  ];
  var state = { niveau: NIVEAUX[0], periode: null, semaine: null };

  var elNiveau = document.getElementById('sel-niveau');
  var elPeriode = document.getElementById('sel-periode');
  var elSemaine = document.getElementById('sel-semaine');
  var elRefBox = document.getElementById('ref-box');
  var elJours = document.getElementById('jours');

  function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function currentWeek() {
    if (!state.niveau.data || !state.periode || !state.semaine) return null;
    var p = state.niveau.data[state.periode];
    return p ? p[state.semaine] : null;
  }

  function populateNiveau() {
    elNiveau.innerHTML = '';
    NIVEAUX.forEach(function (n) {
      var opt = document.createElement('option');
      opt.value = n.code;
      opt.textContent = n.available ? n.label : n.label + ' (bientôt disponible)';
      opt.disabled = !n.available;
      elNiveau.appendChild(opt);
    });
    elNiveau.value = state.niveau.code;
  }
  function populatePeriode() {
    elPeriode.innerHTML = '';
    var data = state.niveau.data || {};
    Object.keys(data).sort().forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = p; opt.textContent = 'Période ' + p.replace('P', '');
      elPeriode.appendChild(opt);
    });
    state.periode = elPeriode.value || Object.keys(data)[0];
  }
  function populateSemaine() {
    elSemaine.innerHTML = '';
    var data = state.niveau.data || {};
    var weeks = Object.keys(data[state.periode] || {}).sort(function (a, b) {
      return parseInt(a.replace('S', '')) - parseInt(b.replace('S', ''));
    });
    weeks.forEach(function (s) {
      var opt = document.createElement('option');
      opt.value = s; opt.textContent = 'Semaine ' + s.replace('S', '');
      elSemaine.appendChild(opt);
    });
    state.semaine = elSemaine.value || weeks[0];
  }

  function problemBlock(p) {
    return '<div class="fiche-probleme">' +
      '<div class="fiche-probleme__enonce"><strong>' + escapeHtml(catLabel(p.cat)) + '</strong><br>' + escapeHtml(p.enonce) + '</div>' +
      '<div class="fiche-probleme__schema">' + buildSchemaSVG(p) + '</div>' +
      '<div>' + escapeHtml(p.calcul) + '</div>' +
      '<div><strong>' + escapeHtml(p.reponse) + '</strong></div>' +
      '</div>';
  }

  function render() {
    var week = currentWeek();
    elRefBox.innerHTML = week ? '<p style="margin-top:12px"><span class="tag tone-navy">Semaine</span> &nbsp;' + escapeHtml(week.ref) + '</p>' : '';
    elJours.innerHTML = '';
    if (!week) return;
    var problems = week[state.niveau.key];
    for (var j = 0; j < 4; j++) {
      var div = document.createElement('div');
      div.className = 'fiche-jour fiche-jour--' + (j + 1);
      var html = '<div class="fiche-jour__header">JOUR ' + (j + 1) + '</div>';
      html += problemBlock(problems[j * 2]) + problemBlock(problems[j * 2 + 1]);
      div.innerHTML = html;
      elJours.appendChild(div);
    }
    var bonus = problems.filter(function (p) { return p.bonus; });
    if (bonus.length) {
      var bdiv = document.createElement('div');
      bdiv.className = 'fiche-jour fiche-jour--4';
      bdiv.innerHTML = '<div class="fiche-jour__header">BONUS</div>' + bonus.map(problemBlock).join('');
      elJours.appendChild(bdiv);
    }
  }

  function wire() {
    elNiveau.addEventListener('change', function () {
      state.niveau = NIVEAUX.filter(function (n) { return n.code === elNiveau.value; })[0];
      populatePeriode(); populateSemaine(); render();
    });
    elPeriode.addEventListener('change', function () { state.periode = elPeriode.value; populateSemaine(); render(); });
    elSemaine.addEventListener('change', function () { state.semaine = elSemaine.value; render(); });
  }

  populateNiveau(); populatePeriode(); populateSemaine(); wire(); render();
})();
