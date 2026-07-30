/* Logique de la page générateur : sélection niveau/période/semaine,
 * verrouillage à 8 problèmes, et rendu direct (sans changer de page) de la
 * fiche élève et du corrigé enseignant dans deux onglets de la même page. */
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
  var initialNiveau = NIVEAUX.filter(function (n) { return n.code === urlParams.get('niveau'); })[0] || NIVEAUX[0];
  var state = { niveau: initialNiveau, periode: null, semaine: null, selected: new Set() };

  var elNiveauPills = document.getElementById('niveau-pills');
  var elPeriode = document.getElementById('sel-periode');
  var elSemaine = document.getElementById('sel-semaine');
  var elRefBox = document.getElementById('ref-box');
  var elTbody = document.querySelector('#tbl-problemes tbody');
  var elLockMsg = document.getElementById('lock-msg');
  var elEleveContent = document.getElementById('eleve-content');
  var elCorrigeBanner = document.getElementById('corrige-banner');
  var elCorrigeContent = document.getElementById('corrige-content');

  function escapeHtml(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function currentWeek() {
    if (!state.niveau.data || !state.periode || !state.semaine) return null;
    var p = state.niveau.data[state.periode];
    return p ? p[state.semaine] : null;
  }
  function currentProblems() {
    var week = currentWeek();
    return week ? week[state.niveau.key] : [];
  }

  // Les 8 problèmes cochés, regroupés par jour (2 par jour), dans l'ordre.
  function selectedJours(problems) {
    var indices = Array.from(state.selected).sort(function (a, b) { return a - b; });
    var jours = [[], [], [], []];
    indices.forEach(function (idx, pos) { jours[Math.floor(pos / 2)].push(problems[idx]); });
    return jours;
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
        populatePeriode(); populateSemaine(); renderWeek();
      });
      elNiveauPills.appendChild(btn);
    });
  }

  function populatePeriode() {
    elPeriode.innerHTML = '';
    var data = state.niveau.data || {};
    var wanted = urlParams.get('periode');
    Object.keys(data).sort().forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = p;
      opt.textContent = 'Période ' + p.replace('P', '');
      elPeriode.appendChild(opt);
    });
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
    var wanted = urlParams.get('semaine');
    weeks.forEach(function (s) {
      var opt = document.createElement('option');
      opt.value = s;
      opt.textContent = 'Semaine ' + s.replace('S', '');
      elSemaine.appendChild(opt);
    });
    state.semaine = (wanted && weeks.indexOf(wanted) !== -1) ? wanted : (elSemaine.value || weeks[0]);
    elSemaine.value = state.semaine;
    urlParams.delete('semaine');
  }

  function defaultSelection(problems) {
    state.selected = new Set();
    problems.forEach(function (p, i) { if (!p.bonus) state.selected.add(i); });
  }

  function jourLabel(index) {
    return index < 8 ? 'Jour ' + (Math.floor(index / 2) + 1) : 'Bonus';
  }

  function renderWeek() {
    var week = currentWeek();
    var problems = currentProblems();
    elRefBox.innerHTML = week ? '<p style="margin-top:12px"><span class="tag tone-navy">Semaine</span> &nbsp;' + escapeHtml(week.ref) + '</p>' : '';
    defaultSelection(problems);
    refreshAll();
  }

  function refreshAll() {
    renderTable(currentProblems());
    renderLockState();
    renderFicheEleve();
    renderCorrige();
  }

  function renderTable(problems) {
    elTbody.innerHTML = '';
    problems.forEach(function (p, i) {
      var tr = document.createElement('tr');
      var tdCheck = document.createElement('td');
      var chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.checked = state.selected.has(i);
      chk.addEventListener('change', function () {
        if (chk.checked) state.selected.add(i); else state.selected.delete(i);
        renderLockState();
        renderFicheEleve();
        renderCorrige();
      });
      tdCheck.appendChild(chk);
      tr.appendChild(tdCheck);

      var tdNum = document.createElement('td'); tdNum.textContent = i + 1; tr.appendChild(tdNum);
      var tdCat = document.createElement('td');
      tdCat.innerHTML = '<strong>' + escapeHtml(catLabel(p.cat)) + '</strong>';
      tr.appendChild(tdCat);
      var tdEnonce = document.createElement('td'); tdEnonce.textContent = p.enonce; tr.appendChild(tdEnonce);
      var tdJour = document.createElement('td'); tdJour.textContent = jourLabel(i) + (p.bonus ? ' (bonus)' : ''); tr.appendChild(tdJour);
      elTbody.appendChild(tr);
    });
  }

  function renderLockState() {
    var n = state.selected.size;
    var ok = n === 8;
    elLockMsg.innerHTML = ok
      ? '<span class="tag tone-green">8 problèmes sélectionnés</span> — la fiche élève et le corrigé sont prêts dans les onglets ci-dessus.'
      : '<span class="tag tone-orange">' + n + ' / 8 sélectionnés</span> — coche/décoche pour arriver exactement à 8.';
  }

  // ===================== Onglet Fiche élève ===============================
  function jourTableHtml(jourIdx, problems) {
    var rows = problems.map(function (p, i) {
      return '<tr>' +
        '<td class="col-num"><span class="n">' + (i + 1) + '.</span>' + escapeHtml(p.enonce) + '</td>' +
        '<td class="col-write"></td>' +
        '<td class="col-write write-area"></td>' +
        '<td class="col-write write-area"></td>' +
        '</tr>';
    }).join('');
    return '<table class="eleve-jour eleve-jour--' + (jourIdx + 1) + '">' +
      '<thead>' +
      '<tr class="jourhead"><th colspan="4">JOUR ' + (jourIdx + 1) + '</th></tr>' +
      '<tr class="subhead"><th>N° / Énoncé</th><th>Schéma / modélisation</th><th>Calcul</th><th>Réponse</th></tr>' +
      '</thead><tbody>' + rows + '</tbody></table>';
  }

  function evalGridHtml() {
    var cols = [1, 2, 3, 4].map(function (j) { return '<th>Jour ' + j + '</th>'; }).join('');
    var data = [1, 2, 3, 4].map(function () {
      return '<td><div class="eleve-evalgrid__stars">P1 ☆☆☆</div><div class="eleve-evalgrid__stars">P2 ☆☆☆</div></td>';
    }).join('');
    return '<table class="eleve-evalgrid"><thead><tr><th class="bilan">Bilan</th>' + cols + '</tr></thead>' +
      '<tbody><tr><td></td>' + data + '</tr></tbody></table>' +
      '<p class="eleve-evalgrid__legend">★ Réponse juste &nbsp;&nbsp; ★★ + démarche correcte &nbsp;&nbsp; ★★★ + vérification</p>';
  }

  function ficheEleveBanner(week) {
    return '<div class="iep1-banner" style="text-align:center">' +
      '<h1 style="color:#fff;font-size:26px">DEUX CHALLENGES PAR JOUR — ' + escapeHtml(state.niveau.label) + ' — ' +
      'Période ' + escapeHtml(state.periode.replace('P', '')) + ' — Semaine ' + escapeHtml(state.semaine.replace('S', '')) + '</h1>' +
      '<p>' + escapeHtml(week.ref) + '</p></div>';
  }

  function renderFicheEleve() {
    var week = currentWeek();
    if (!week || state.selected.size !== 8) {
      elEleveContent.innerHTML = '<p class="no-print" style="color:var(--text-secondary)">Sélectionnez exactement 8 problèmes dans l\'onglet « Sélection des problèmes » pour afficher la fiche élève.</p>';
      return;
    }
    var jours = selectedJours(currentProblems());
    var page1 = '<div class="print-sheet">' + ficheEleveBanner(week) + jourTableHtml(0, jours[0]) + jourTableHtml(1, jours[1]) + '</div>';
    var page2 = '<div class="print-sheet">' + jourTableHtml(2, jours[2]) + jourTableHtml(3, jours[3]) + evalGridHtml() + '</div>';
    elEleveContent.innerHTML = page1 + page2;
  }

  // ===================== Onglet Corrigé enseignant =========================
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

  function corrigeBanner(week) {
    return '<div class="iep1-banner corrige-print-banner" style="text-align:center">' +
      '<h1 style="color:#fff;font-size:22px">CORRIGÉ ENSEIGNANT — ' + escapeHtml(state.niveau.label) + ' — ' +
      'Période ' + escapeHtml(state.periode.replace('P', '')) + ' — Semaine ' + escapeHtml(state.semaine.replace('S', '')) + '</h1>' +
      '<p>' + escapeHtml(week.ref) + '</p></div>';
  }

  function renderCorrige() {
    var week = currentWeek();
    if (!week || state.selected.size !== 8) {
      elCorrigeBanner.innerHTML = '';
      elCorrigeContent.innerHTML = '<p class="no-print" style="color:var(--text-secondary)">Sélectionnez exactement 8 problèmes dans l\'onglet « Sélection des problèmes » pour afficher le corrigé.</p>';
      return;
    }
    elCorrigeBanner.innerHTML = corrigeBanner(week);
    var jours = selectedJours(currentProblems());
    var html = '';
    for (var j = 0; j < 4; j++) {
      html += '<div class="corrige-daylabel corrige-daylabel--' + (j + 1) + '">JOUR ' + (j + 1) + '</div>';
      html += problemBand(jours[j][0], j + 1, 1) + problemBand(jours[j][1], j + 1, 2);
    }
    elCorrigeContent.innerHTML = '<div class="print-sheet">' + html + '</div>';
  }

  // ===================== Onglets (navigation) ===============================
  document.querySelectorAll('.suivi-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.suivi-tab').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.suivi-panel').forEach(function (p) { p.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById('panel-' + btn.getAttribute('data-tab')).classList.add('active');
    });
  });

  document.getElementById('btn-print-eleve').addEventListener('click', function () { window.print(); });
  document.getElementById('btn-print-corrige').addEventListener('click', function () { window.print(); });

  function wire() {
    elPeriode.addEventListener('change', function () { state.periode = elPeriode.value; populateSemaine(); renderWeek(); });
    elSemaine.addEventListener('change', function () { state.semaine = elSemaine.value; renderWeek(); });
  }

  populateNiveau();
  populatePeriode();
  populateSemaine();
  wire();
  renderWeek();
})();
