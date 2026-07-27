/* Logique de suivi.html : sélecteur de classe + 3 onglets (Saisie / Élève / Classe & classement). */
(function () {
  'use strict';
  var store = window.IEP1Suivi;
  var catLabel = window.IEP1CatLabels.catLabel;
  var data = store.load();

  var NIVEAUX = [
    { code: 'CP', label: 'CP', data: DATA_CP, key: 'CP' },
    { code: 'CE1', label: 'CE1', data: DATA_CE1, key: 'CE1' },
    { code: 'CE2', label: 'CE2', data: DATA_CE2, key: 'CE2' },
    { code: 'CM1', label: 'CM1', data: DATA_CM1, key: 'CM1' },
    { code: 'CM2', label: 'CM2', data: DATA_CM2, key: 'CM2' },
  ];

  function escapeHtml(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function niveauByCode(code) { return NIVEAUX.filter(function (n) { return n.code === code; })[0] || NIVEAUX[0]; }
  function currentEleves() { return store.elevesForClasse(data, data.classeActive); }
  function currentEleveIds() { return currentEleves().map(function (e) { return e.id; }); }
  function eleveName(id) { var e = data.eleves.filter(function (e) { return e.id === id; })[0]; return e ? e.nom : '?'; }

  function fillNiveauSelect(el) {
    el.innerHTML = '';
    NIVEAUX.forEach(function (n) {
      var opt = document.createElement('option');
      opt.value = n.code; opt.textContent = n.label;
      el.appendChild(opt);
    });
  }
  function fillPeriodeSelect(el, niveau) {
    el.innerHTML = '';
    Object.keys(niveau.data).sort().forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = p; opt.textContent = 'Période ' + p.replace('P', '');
      el.appendChild(opt);
    });
  }
  function fillSemaineSelect(el, niveau, periode) {
    el.innerHTML = '';
    var weeks = Object.keys(niveau.data[periode] || {}).sort(function (a, b) {
      return parseInt(a.replace('S', '')) - parseInt(b.replace('S', ''));
    });
    weeks.forEach(function (s) {
      var opt = document.createElement('option');
      opt.value = s; opt.textContent = 'Semaine ' + s.replace('S', '');
      el.appendChild(opt);
    });
  }

  function huit(niveau, periode, semaine) {
    var week = niveau.data[periode] && niveau.data[periode][semaine];
    if (!week) return [];
    return week[niveau.key].filter(function (p) { return !p.bonus; }).slice(0, 8);
  }

  function pctClass(pct) { return pct < 50 ? 'low' : pct < 80 ? 'mid' : 'high'; }

  function barRow(label, pct, valueText) {
    return '<div class="bar-row"><div class="bar-label">' + escapeHtml(label) + '</div>' +
      '<div class="bar-track"><div class="bar-fill ' + pctClass(pct) + '" style="width:' + Math.max(0, Math.min(100, pct)) + '%"></div></div>' +
      '<div class="bar-value">' + escapeHtml(valueText) + '</div></div>';
  }

  // ===================== Classe active (sélecteur global) ==================
  var elClasseSelect = document.getElementById('classe-select');

  function populateClasseSelect() {
    elClasseSelect.innerHTML = data.classes.map(function (c) {
      return '<option value="' + c.id + '"' + (c.id === data.classeActive ? ' selected' : '') + '>' + escapeHtml(c.nom) + '</option>';
    }).join('');
  }

  function refreshAllForClasse() {
    renderListeEleves();
    renderSaisieGrid();
    populateEleveSelectors();
    renderEleveTab();
    renderClasseTab();
  }

  elClasseSelect.addEventListener('change', function () {
    store.setClasseActive(data, elClasseSelect.value);
    refreshAllForClasse();
  });

  document.getElementById('btn-ajouter-classe').addEventListener('click', function () {
    var inp = document.getElementById('inp-nouvelle-classe');
    var nom = inp.value.trim();
    if (!nom) return;
    store.addClasse(data, nom);
    inp.value = '';
    populateClasseSelect();
    refreshAllForClasse();
  });

  document.getElementById('btn-supprimer-classe').addEventListener('click', function () {
    var c = data.classes.filter(function (c) { return c.id === data.classeActive; })[0];
    if (!c) return;
    if (!window.confirm('Supprimer la classe "' + c.nom + '" et tous ses élèves/résultats ?')) return;
    store.removeClasse(data, data.classeActive);
    populateClasseSelect();
    refreshAllForClasse();
  });

  // ===================== Gestion des élèves (onglet Saisie) ===============
  function renderListeEleves() {
    var el = document.getElementById('liste-eleves');
    var eleves = currentEleves();
    el.innerHTML = eleves.map(function (e) {
      return '<span class="eleve-chip">' + escapeHtml(e.nom) + '<button data-id="' + e.id + '" title="Supprimer">✕</button></span>';
    }).join('') || '<p style="color:var(--text-secondary);font-size:var(--fs-small)">Aucun élève pour le moment.</p>';
    el.querySelectorAll('button[data-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        store.removeEleve(data, btn.getAttribute('data-id'));
        renderListeEleves();
        renderSaisieGrid();
        populateEleveSelectors();
      });
    });
  }

  document.getElementById('btn-ajouter-eleve').addEventListener('click', function () {
    var inp = document.getElementById('inp-nouvel-eleve');
    var nom = inp.value.trim();
    if (!nom) return;
    store.addEleve(data, data.classeActive, nom);
    inp.value = '';
    renderListeEleves();
    renderSaisieGrid();
    populateEleveSelectors();
  });

  document.getElementById('btn-ajouter-liste').addEventListener('click', function () {
    var ta = document.getElementById('inp-liste-eleves');
    if (!ta.value.trim()) return;
    store.addElevesBulk(data, data.classeActive, ta.value);
    ta.value = '';
    renderListeEleves();
    renderSaisieGrid();
    populateEleveSelectors();
  });

  // ===================== Onglet Saisie ===================================
  var saisieState = { niveau: null, periode: null, semaine: null };
  var elSN = document.getElementById('saisie-niveau'), elSP = document.getElementById('saisie-periode'), elSS = document.getElementById('saisie-semaine');

  function initSaisieSelectors() {
    fillNiveauSelect(elSN);
    saisieState.niveau = niveauByCode(elSN.value);
    fillPeriodeSelect(elSP, saisieState.niveau);
    saisieState.periode = elSP.value;
    fillSemaineSelect(elSS, saisieState.niveau, saisieState.periode);
    saisieState.semaine = elSS.value;
  }
  elSN.addEventListener('change', function () {
    saisieState.niveau = niveauByCode(elSN.value);
    fillPeriodeSelect(elSP, saisieState.niveau); saisieState.periode = elSP.value;
    fillSemaineSelect(elSS, saisieState.niveau, saisieState.periode); saisieState.semaine = elSS.value;
    renderSaisieGrid();
  });
  elSP.addEventListener('change', function () {
    saisieState.periode = elSP.value;
    fillSemaineSelect(elSS, saisieState.niveau, saisieState.periode); saisieState.semaine = elSS.value;
    renderSaisieGrid();
  });
  elSS.addEventListener('change', function () { saisieState.semaine = elSS.value; renderSaisieGrid(); });

  function renderSaisieGrid() {
    var container = document.getElementById('saisie-grid-container');
    var problems = huit(saisieState.niveau, saisieState.periode, saisieState.semaine);
    var eleves = currentEleves();
    if (!eleves.length) {
      container.innerHTML = '<p style="color:var(--text-secondary);font-size:var(--fs-small)">Ajoutez des élèves ci-dessus pour commencer la saisie.</p>';
      return;
    }
    if (!problems.length) {
      container.innerHTML = '<p style="color:var(--text-secondary);font-size:var(--fs-small)">Aucune donnée pour cette semaine.</p>';
      return;
    }
    var rows = eleves.map(function (e) {
      var existing = store.getResultat(data, e.id, saisieState.niveau.code, saisieState.periode, saisieState.semaine);
      var score = existing ? existing.score : 8;
      var checks = problems.map(function (p, i) {
        var checked = existing && existing.detail ? existing.detail[i].correct : (i < score);
        return '<label class="suivi-detail-item"><input type="checkbox" data-idx="' + i + '"' + (checked ? ' checked' : '') + '>' +
          '<span>J' + (Math.floor(i / 2) + 1) + '.' + (i % 2 + 1) + '</span><span title="' + escapeHtml(catLabel(p.cat)) + '">' + escapeHtml(p.cat) + '</span></label>';
      }).join('');
      return '<tr data-eleve-id="' + e.id + '">' +
        '<td>' + escapeHtml(e.nom) + '</td>' +
        '<td><input type="number" class="note-input" min="0" max="8" value="' + score + '"></td>' +
        '<td><div class="suivi-detail-grid">' + checks + '</div></td>' +
        '</tr>';
    }).join('');
    container.innerHTML = '<p style="margin-bottom:10px;color:var(--text-secondary);font-size:var(--fs-small)">' +
      'Note /8 à gauche, détail par problème à droite — les deux se mettent à jour automatiquement l\'un l\'autre.</p>' +
      '<table class="suivi-grid"><thead><tr><th>Élève</th><th>Note /8</th><th>Détail par problème</th></tr></thead><tbody>' + rows + '</tbody></table>';

    container.querySelectorAll('tbody tr[data-eleve-id]').forEach(function (tr) {
      var noteInput = tr.querySelector('.note-input');
      var boxes = tr.querySelectorAll('.suivi-detail-grid input[type=checkbox]');
      noteInput.addEventListener('input', function () {
        var n = parseInt(noteInput.value, 10);
        if (isNaN(n)) return;
        n = Math.max(0, Math.min(8, n));
        boxes.forEach(function (c, i) { c.checked = i < n; });
      });
      boxes.forEach(function (chk) {
        chk.addEventListener('change', function () {
          var count = 0; boxes.forEach(function (c) { if (c.checked) count++; });
          noteInput.value = count;
        });
      });
    });
  }

  document.getElementById('btn-enregistrer-saisie').addEventListener('click', function () {
    var problems = huit(saisieState.niveau, saisieState.periode, saisieState.semaine);
    var container = document.getElementById('saisie-grid-container');
    container.querySelectorAll('tbody tr[data-eleve-id]').forEach(function (tr) {
      var eleveId = tr.getAttribute('data-eleve-id');
      var score = parseInt(tr.querySelector('.note-input').value, 10);
      if (isNaN(score)) return;
      var boxes = tr.querySelectorAll('.suivi-detail-grid input[type=checkbox]');
      var detail = problems.map(function (p, i) { return { cat: p.cat, correct: boxes[i].checked }; });
      store.setResultat(data, eleveId, saisieState.niveau.code, saisieState.periode, saisieState.semaine, { score: score, detail: detail });
    });
    document.getElementById('saisie-status').textContent = 'Résultats enregistrés — ' + new Date().toLocaleTimeString('fr-FR');
  });

  // ===================== Onglet Élève =====================================
  var elEE = document.getElementById('ev-eleve'), elEN = document.getElementById('ev-niveau');

  function populateEleveSelectors() {
    var current = elEE.value;
    elEE.innerHTML = currentEleves().map(function (e) { return '<option value="' + e.id + '">' + escapeHtml(e.nom) + '</option>'; }).join('');
    if (Array.from(elEE.options).some(function (o) { return o.value === current; })) elEE.value = current;
    renderEleveTab();
  }
  fillNiveauSelect(elEN);
  elEE.addEventListener('change', renderEleveTab);
  elEN.addEventListener('change', renderEleveTab);

  function renderEleveTab() {
    var elSemaines = document.getElementById('ev-semaines'), elCategories = document.getElementById('ev-categories');
    if (!currentEleves().length) {
      elSemaines.innerHTML = elCategories.innerHTML = '<p style="color:var(--text-secondary);font-size:var(--fs-small)">Ajoutez des élèves dans l\'onglet Saisie.</p>';
      return;
    }
    var eleveId = elEE.value, niveau = elEN.value;
    var entries = store.resultatsForEleve(data, eleveId, niveau);
    if (!entries.length) {
      elSemaines.innerHTML = elCategories.innerHTML = '<p style="color:var(--text-secondary);font-size:var(--fs-small)">Aucun résultat saisi pour ce niveau.</p>';
      return;
    }
    var weeks = store.weekBreakdown(entries);
    elSemaines.innerHTML = weeks.map(function (w) {
      var pct = Math.round(100 * w.score / 8);
      return barRow('Période ' + w.periode.replace('P', '') + ' — Semaine ' + w.semaine.replace('S', ''), pct, w.score.toFixed(1) + '/8');
    }).join('');
    var cats = store.categoryBreakdown(entries);
    elCategories.innerHTML = cats.length ? cats.map(function (c) {
      return barRow(catLabel(c.cat), c.pct, c.correct + '/' + c.total);
    }).join('') : '<p style="color:var(--text-secondary);font-size:var(--fs-small)">Pas encore de saisie en mode détail pour ce niveau.</p>';
  }

  // ===================== Onglet Classe & classement ========================
  var elCN = document.getElementById('cl-niveau'), elCC = document.getElementById('cl-classement-cat');
  var classementSortDesc = true;
  fillNiveauSelect(elCN);

  elCN.addEventListener('change', renderClasseTab);
  elCC.addEventListener('change', renderClassement);

  document.getElementById('btn-classement-sens').addEventListener('click', function () {
    classementSortDesc = !classementSortDesc;
    document.getElementById('btn-classement-sens').textContent = classementSortDesc ? '⇅ Meilleurs en premier' : '⇅ Moins bons en premier';
    renderClassement();
  });

  function renderClasseTab() {
    var elSemaines = document.getElementById('cl-semaines'), elCategories = document.getElementById('cl-categories');
    var eleveIds = currentEleveIds();
    if (!eleveIds.length) {
      elSemaines.innerHTML = elCategories.innerHTML = '<p style="color:var(--text-secondary);font-size:var(--fs-small)">Aucun élève dans cette classe.</p>';
      renderClassementCatOptions([]);
      return;
    }
    var entries = store.resultatsForEleves(data, eleveIds, elCN.value);
    if (!entries.length) {
      elSemaines.innerHTML = elCategories.innerHTML = '<p style="color:var(--text-secondary);font-size:var(--fs-small)">Aucun résultat saisi pour ce niveau.</p>';
      renderClassementCatOptions([]);
      return;
    }
    var weeks = store.weekBreakdown(entries);
    elSemaines.innerHTML = weeks.map(function (w) {
      var pct = Math.round(100 * w.score / 8);
      return barRow('Période ' + w.periode.replace('P', '') + ' — Semaine ' + w.semaine.replace('S', ''), pct, w.score.toFixed(1) + '/8');
    }).join('');
    var cats = store.categoryBreakdown(entries);
    elCategories.innerHTML = cats.length ? cats.map(function (c) {
      return barRow(catLabel(c.cat), c.pct, c.correct + '/' + c.total);
    }).join('') : '<p style="color:var(--text-secondary);font-size:var(--fs-small)">Pas encore de saisie en détail pour ce niveau.</p>';
    renderClassementCatOptions(store.allCategoriesSeen(data, eleveIds, elCN.value));
  }

  function renderClassementCatOptions(cats) {
    var current = elCC.value;
    elCC.innerHTML = '<option value="GLOBAL">Note globale (toutes catégories)</option>' +
      cats.map(function (c) { return '<option value="' + c + '">' + escapeHtml(catLabel(c)) + '</option>'; }).join('');
    if (Array.from(elCC.options).some(function (o) { return o.value === current; })) elCC.value = current;
    renderClassement();
  }

  function renderClassement() {
    var el = document.getElementById('cl-classement');
    var eleveIds = currentEleveIds();
    if (!eleveIds.length || !elCC.options.length) { el.innerHTML = ''; return; }
    var res = store.rankByCategory(data, eleveIds, elCN.value, elCC.value);
    var list = res.classement.slice();
    if (!classementSortDesc) list.reverse();
    var rows = list.map(function (r, i) {
      return '<div class="classement-row">' +
        '<span class="classement-rank">' + (i + 1) + '.</span>' +
        '<div class="bar-label">' + escapeHtml(eleveName(r.eleveId)) + '</div>' +
        '<div class="bar-track"><div class="bar-fill ' + pctClass(r.pct) + '" style="width:' + Math.max(0, Math.min(100, r.pct)) + '%"></div></div>' +
        '<div class="bar-value">' + r.pct + '%</div>' +
        '</div>';
    }).join('');
    var sansHtml = res.sansDonnees.length
      ? '<p style="margin-top:10px;color:var(--text-secondary);font-size:var(--fs-small)">Pas encore de données pour : ' +
        res.sansDonnees.map(function (r) { return escapeHtml(eleveName(r.eleveId)); }).join(', ') + '</p>'
      : '';
    el.innerHTML = (rows || '<p style="color:var(--text-secondary);font-size:var(--fs-small)">Pas encore de données pour cette catégorie.</p>') + sansHtml;
  }

  // ===================== Onglets (navigation) =============================
  document.querySelectorAll('.suivi-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.suivi-tab').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.suivi-panel').forEach(function (p) { p.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById('panel-' + btn.getAttribute('data-tab')).classList.add('active');
      if (btn.getAttribute('data-tab') === 'eleve') renderEleveTab();
      if (btn.getAttribute('data-tab') === 'classe') renderClasseTab();
    });
  });

  // ===================== Initialisation ====================================
  populateClasseSelect();
  renderListeEleves();
  initSaisieSelectors();
  renderSaisieGrid();
  populateEleveSelectors();
  renderClasseTab();
})();
