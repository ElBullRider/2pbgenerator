/*
 * Aperçu écran + impression du corrigé illustré : 4 jours + schémas SVG.
 * Paramètres d'URL optionnels (utilisés quand on arrive depuis le
 * générateur, pour afficher exactement la sélection de 8 problèmes) :
 *   corrige.html?niveau=CM1&periode=P1&semaine=S2&sel=0,1,2,3,4,5,6,7
 * Sans "sel" : mode navigation libre (les 8 de base + bonus à part).
 */
(function () {
  'use strict';
  var catLabel = window.IEP1CatLabels.catLabel;
  var buildSchemaSVG = window.IEP1Schemas.buildSchemaSVG;

  var NIVEAUX = [
    { code: 'CP', label: 'CP', data: DATA_CP, key: 'CP' },
    { code: 'CE1', label: 'CE1', data: DATA_CE1, key: 'CE1' },
    { code: 'CE2', label: 'CE2', data: DATA_CE2, key: 'CE2' },
    { code: 'CM1', label: 'CM1', data: DATA_CM1, key: 'CM1' },
    { code: 'CM2', label: 'CM2', data: DATA_CM2, key: 'CM2' },
  ];
  var urlParams = new URLSearchParams(location.search);
  var urlSel = urlParams.get('sel');
  var state = { niveau: NIVEAUX.filter(function (n) { return n.code === urlParams.get('niveau'); })[0] || NIVEAUX[0], periode: null, semaine: null };

  var elNiveauPills = document.getElementById('niveau-pills');
  var elPeriode = document.getElementById('sel-periode');
  var elSemaine = document.getElementById('sel-semaine');
  var elRefBox = document.getElementById('ref-box');
  var elJours = document.getElementById('jours');
  var elPrintBtn = document.getElementById('btn-print');
  var elPrintBanner = document.getElementById('print-banner');
  var elNavGenerateur = document.getElementById('nav-generateur');
  var elBtnRetour = document.getElementById('btn-retour-generateur');

  function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function currentWeek() {
    if (!state.niveau.data || !state.periode || !state.semaine) return null;
    var p = state.niveau.data[state.periode];
    return p ? p[state.semaine] : null;
  }

  function populateNiveau() {
    elNiveauPills.innerHTML = '';
    NIVEAUX.forEach(function (n) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'niveau-pill' + (n.code === state.niveau.code ? ' active' : '');
      btn.textContent = n.label;
      btn.addEventListener('click', function () {
        if (state.niveau.code === n.code) return;
        state.niveau = n;
        populateNiveau();
        populatePeriode(); populateSemaine(); render();
      });
      elNiveauPills.appendChild(btn);
    });
  }
  function populatePeriode() {
    elPeriode.innerHTML = '';
    var data = state.niveau.data || {};
    Object.keys(data).sort().forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = p; opt.textContent = 'Période ' + p.replace('P', '');
      elPeriode.appendChild(opt);
    });
    var wanted = urlParams.get('periode');
    state.periode = (wanted && data[wanted]) ? wanted : (elPeriode.value || Object.keys(data)[0]);
    elPeriode.value = state.periode;
    urlParams.delete('periode');
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
    var wanted = urlParams.get('semaine');
    state.semaine = (wanted && weeks.indexOf(wanted) !== -1) ? wanted : (elSemaine.value || weeks[0]);
    elSemaine.value = state.semaine;
    urlParams.delete('semaine');
  }

  // Garde les liens vers le générateur sur le même niveau/période/semaine.
  function updateNavGenerateur() {
    if (!state.periode || !state.semaine) return;
    var qs = new URLSearchParams();
    qs.set('niveau', state.niveau.code);
    qs.set('periode', state.periode);
    qs.set('semaine', state.semaine);
    var url = 'generateur.html?' + qs.toString();
    if (elNavGenerateur) elNavGenerateur.href = url;
    if (elBtnRetour) elBtnRetour.href = url;
  }

  function selectedInJours(problems, selParam) {
    var indices = selParam.split(',').map(function (s) { return parseInt(s, 10); }).filter(function (n) { return !isNaN(n); });
    indices.sort(function (a, b) { return a - b; });
    var jours = [[], [], [], []];
    indices.forEach(function (idx, pos) { jours[Math.floor(pos / 2)].push(problems[idx]); });
    return jours;
  }

  function problemBand(p, jourIdx, num) {
    return '<div class="corrige-band corrige-band--' + jourIdx + '">' +
      '<div class="corrige-band__badge"><span class="jour">JOUR ' + jourIdx + '</span><span class="num">' + num + '</span></div>' +
      '<div class="corrige-band__enonce"><span class="cat">' + escapeHtml(catLabel(p.cat)) + '</span>' + escapeHtml(p.enonce) + '</div>' +
      '<div class="corrige-band__schema">' + buildSchemaSVG(p) + '</div>' +
      '<div class="corrige-band__answer">' +
        '<div class="calc">' + escapeHtml(p.calcul) + '</div>' +
        '<div class="rep">' + escapeHtml(p.reponse) + '</div>' +
        '<div class="expl">' + escapeHtml(p.explication || '') + '</div>' +
      '</div>' +
    '</div>';
  }

  function bannerHtml(week) {
    return '<div class="iep1-banner corrige-print-banner" style="text-align:center">' +
      '<h1 style="color:#fff;font-size:22px">CORRIGÉ ENSEIGNANT — ' + escapeHtml(state.niveau.label) + ' — ' +
      'Période ' + escapeHtml(state.periode.replace('P', '')) + ' — Semaine ' + escapeHtml(state.semaine.replace('S', '')) + '</h1>' +
      '<p>' + escapeHtml(week.ref) + '</p></div>';
  }

  function render() {
    var week = currentWeek();
    elRefBox.innerHTML = week ? '<p style="margin-top:12px"><span class="tag tone-navy">Semaine</span> &nbsp;' + escapeHtml(week.ref) + '</p>' : '';
    elPrintBanner.innerHTML = week ? bannerHtml(week) : '';
    elJours.innerHTML = '';
    updateNavGenerateur();
    if (!week) return;
    var problems = week[state.niveau.key];
    var html = '';
    if (urlSel) {
      var jours = selectedInJours(problems, urlSel);
      for (var j = 0; j < 4; j++) {
        html += '<div class="corrige-daylabel corrige-daylabel--' + (j + 1) + '">JOUR ' + (j + 1) + '</div>';
        html += problemBand(jours[j][0], j + 1, 1) + problemBand(jours[j][1], j + 1, 2);
      }
    } else {
      for (var j2 = 0; j2 < 4; j2++) {
        html += '<div class="corrige-daylabel corrige-daylabel--' + (j2 + 1) + '">JOUR ' + (j2 + 1) + '</div>';
        html += problemBand(problems[j2 * 2], j2 + 1, 1) + problemBand(problems[j2 * 2 + 1], j2 + 1, 2);
      }
      var bonus = problems.filter(function (p) { return p.bonus; });
      if (bonus.length) {
        html += '<div class="corrige-daylabel corrige-daylabel--4">BONUS</div>';
        bonus.forEach(function (p, i) { html += problemBand(p, 4, i + 1); });
      }
    }
    elJours.innerHTML = '<div class="print-sheet">' + html + '</div>';
  }

  function wire() {
    elPeriode.addEventListener('change', function () { state.periode = elPeriode.value; populateSemaine(); render(); });
    elSemaine.addEventListener('change', function () { state.semaine = elSemaine.value; render(); });
    if (elPrintBtn) elPrintBtn.addEventListener('click', function () { window.print(); });
  }

  populateNiveau(); populatePeriode(); populateSemaine(); wire(); render();
})();
