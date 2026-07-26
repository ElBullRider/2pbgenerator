/* Logique UI de la page générateur : sélection niveau/période/semaine,
 * verrouillage à 8 problèmes, mise à jour des liens vers les vues
 * imprimables (fiche-eleve.html / corrige.html). */
(function () {
  'use strict';
  var catLabel = window.IEP1CatLabels.catLabel;

  var NIVEAUX = [
    { code: 'CM1', label: 'CM1', data: DATA_CM1, key: 'CM1', available: true },
    { code: 'CM2', label: 'CM2', data: DATA_CM2, key: 'CM2', available: true },
    { code: 'CE2', label: 'CE2', data: DATA_CE2, key: 'CE2', available: true },
    { code: 'CE1', label: 'CE1', data: DATA_CE1, key: 'CE1', available: true },
    { code: 'CP', label: 'CP', data: DATA_CP, key: 'CP', available: true },
  ];

  var state = { niveau: NIVEAUX[0], periode: null, semaine: null, selected: new Set() };

  var elNiveau = document.getElementById('sel-niveau');
  var elPeriode = document.getElementById('sel-periode');
  var elSemaine = document.getElementById('sel-semaine');
  var elRefBox = document.getElementById('ref-box');
  var elTbody = document.querySelector('#tbl-problemes tbody');
  var elLockMsg = document.getElementById('lock-msg');
  var elLnkEleve = document.getElementById('lnk-eleve');
  var elLnkCorrige = document.getElementById('lnk-corrige');

  function currentWeek() {
    if (!state.niveau.data || !state.periode || !state.semaine) return null;
    var p = state.niveau.data[state.periode];
    return p ? p[state.semaine] : null;
  }
  function currentProblems() {
    var week = currentWeek();
    return week ? week[state.niveau.key] : [];
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
      opt.value = p;
      opt.textContent = 'Période ' + p.replace('P', '');
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
      opt.value = s;
      opt.textContent = 'Semaine ' + s.replace('S', '');
      elSemaine.appendChild(opt);
    });
    state.semaine = elSemaine.value || weeks[0];
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
    renderTable(problems);
    renderLockState();
  }

  function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

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

  function viewUrl(page) {
    var indices = Array.from(state.selected).sort(function (a, b) { return a - b; });
    var qs = new URLSearchParams();
    qs.set('niveau', state.niveau.code);
    qs.set('periode', state.periode);
    qs.set('semaine', state.semaine);
    qs.set('sel', indices.join(','));
    return page + '?' + qs.toString();
  }

  function renderLockState() {
    var n = state.selected.size;
    var ok = n === 8;
    elLockMsg.innerHTML = ok
      ? '<span class="tag tone-green">8 problèmes sélectionnés</span> — vous pouvez ouvrir les fiches.'
      : '<span class="tag tone-orange">' + n + ' / 8 sélectionnés</span> — coche/décoche pour arriver exactement à 8.';
    [elLnkEleve, elLnkCorrige].forEach(function (el) { el.classList.toggle('disabled', !ok); });
    if (ok) {
      elLnkEleve.href = viewUrl('fiche-eleve.html');
      elLnkCorrige.href = viewUrl('corrige.html');
    }
  }

  function wire() {
    elNiveau.addEventListener('change', function () {
      state.niveau = NIVEAUX.filter(function (n) { return n.code === elNiveau.value; })[0];
      populatePeriode(); populateSemaine(); renderWeek();
    });
    elPeriode.addEventListener('change', function () { state.periode = elPeriode.value; populateSemaine(); renderWeek(); });
    elSemaine.addEventListener('change', function () { state.semaine = elSemaine.value; renderWeek(); });
  }

  populateNiveau();
  populatePeriode();
  populateSemaine();
  wire();
  renderWeek();
})();
