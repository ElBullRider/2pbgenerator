/* Logique UI de la page générateur : sélection niveau/période/semaine,
 * verrouillage à 8 problèmes, mise à jour des liens vers les vues
 * imprimables (fiche-eleve.html / corrige.html) et vers le corrigé. */
(function () {
  'use strict';
  var catLabel = window.IEP1CatLabels.catLabel;

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
  var elLnkEleve = document.getElementById('lnk-eleve');
  var elLnkCorrige = document.getElementById('lnk-corrige');
  var elNavCorrige = document.getElementById('nav-corrige');

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
    renderTable(problems);
    renderLockState();
    updateNavCorrige();
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

  // Garde le lien de nav "Corrigé illustré" sur le même niveau/période/semaine.
  function updateNavCorrige() {
    if (!elNavCorrige || !state.periode || !state.semaine) return;
    var qs = new URLSearchParams();
    qs.set('niveau', state.niveau.code);
    qs.set('periode', state.periode);
    qs.set('semaine', state.semaine);
    elNavCorrige.href = 'corrige.html?' + qs.toString();
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
    elPeriode.addEventListener('change', function () { state.periode = elPeriode.value; populateSemaine(); renderWeek(); });
    elSemaine.addEventListener('change', function () { state.semaine = elSemaine.value; renderWeek(); });
  }

  populateNiveau();
  populatePeriode();
  populateSemaine();
  wire();
  renderWeek();
})();
