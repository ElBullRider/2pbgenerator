/* Logique des 3 onglets de suivi.html : Saisie / Élève / Classe & groupes. */
(function () {
  'use strict';
  var store = window.IEP1Suivi;
  var catLabel = window.IEP1CatLabels.catLabel;
  var data = store.load();

  var NIVEAUX = [
    { code: 'CM1', label: 'CM1', data: DATA_CM1, key: 'CM1' },
    { code: 'CM2', label: 'CM2', data: DATA_CM2, key: 'CM2' },
    { code: 'CP', label: 'CP', data: DATA_CP, key: 'CP' },
    { code: 'CE1', label: 'CE1', data: DATA_CE1, key: 'CE1' },
    { code: 'CE2', label: 'CE2', data: DATA_CE2, key: 'CE2' },
  ];

  function escapeHtml(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function niveauByCode(code) { return NIVEAUX.filter(function (n) { return n.code === code; })[0] || NIVEAUX[0]; }

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

  // ===================== Onglet : gestion des élèves (partagé) ==========
  function renderListeEleves() {
    var el = document.getElementById('liste-eleves');
    el.innerHTML = data.eleves.map(function (e) {
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
    store.addEleve(data, nom);
    inp.value = '';
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
    if (!data.eleves.length) {
      container.innerHTML = '<p style="color:var(--text-secondary);font-size:var(--fs-small)">Ajoutez des élèves ci-dessus pour commencer la saisie.</p>';
      return;
    }
    if (!problems.length) {
      container.innerHTML = '<p style="color:var(--text-secondary);font-size:var(--fs-small)">Aucune donnée pour cette semaine.</p>';
      return;
    }
    var rows = data.eleves.map(function (e) {
      var existing = store.getResultat(data, e.id, saisieState.niveau.code, saisieState.periode, saisieState.semaine);
      var score = existing ? existing.score : '';
      var checks = problems.map(function (p, i) {
        var checked = existing && existing.detail ? existing.detail[i].correct : true;
        return '<label class="suivi-detail-item"><input type="checkbox" data-idx="' + i + '"' + (checked ? ' checked' : '') + '>' +
          '<span>J' + (Math.floor(i / 2) + 1) + '.' + (i % 2 + 1) + '</span><span title="' + escapeHtml(catLabel(p.cat)) + '">' + escapeHtml(p.cat) + '</span></label>';
      }).join('');
      return '<tr data-eleve-id="' + e.id + '">' +
        '<td>' + escapeHtml(e.nom) + '</td>' +
        '<td><input type="number" class="note-input" min="0" max="8" value="' + score + '"></td>' +
        '<td><button type="button" class="suivi-detail-toggle' + (existing && existing.detail ? ' has-detail' : '') + '">Détail ▾</button></td>' +
        '</tr>' +
        '<tr class="suivi-detail-row" style="display:none"><td colspan="3"><div class="suivi-detail-grid">' + checks + '</div></td></tr>';
    }).join('');
    container.innerHTML = '<p style="margin-bottom:10px;color:var(--text-secondary);font-size:var(--fs-small)">' +
      'Basé sur les 8 problèmes de base de la semaine (hors bonus). Note /8 rapide, ou "Détail" pour cocher/décocher chaque problème.</p>' +
      '<table class="suivi-grid"><thead><tr><th>Élève</th><th>Note /8</th><th>Détail par problème</th></tr></thead><tbody>' + rows + '</tbody></table>';

    container.querySelectorAll('.suivi-detail-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var detailRow = btn.closest('tr').nextElementSibling;
        var open = detailRow.style.display !== 'none';
        detailRow.style.display = open ? 'none' : '';
        btn.classList.toggle('open', !open);
      });
    });
    container.querySelectorAll('.suivi-detail-row input[type=checkbox]').forEach(function (chk) {
      chk.addEventListener('change', function () {
        var tr = chk.closest('tr').previousElementSibling;
        var checks = chk.closest('.suivi-detail-grid').querySelectorAll('input[type=checkbox]');
        var count = 0; checks.forEach(function (c) { if (c.checked) count++; });
        tr.querySelector('.note-input').value = count;
        tr.querySelector('.suivi-detail-toggle').classList.add('has-detail');
      });
    });
  }

  document.getElementById('btn-enregistrer-saisie').addEventListener('click', function () {
    var problems = huit(saisieState.niveau, saisieState.periode, saisieState.semaine);
    var container = document.getElementById('saisie-grid-container');
    container.querySelectorAll('tbody tr[data-eleve-id]').forEach(function (tr) {
      var eleveId = tr.getAttribute('data-eleve-id');
      var noteInput = tr.querySelector('.note-input');
      var toggle = tr.querySelector('.suivi-detail-toggle');
      var score = parseInt(noteInput.value, 10);
      if (isNaN(score)) return;
      var resultat = { score: score, detail: null };
      if (toggle.classList.contains('has-detail')) {
        var detailRow = tr.nextElementSibling;
        var checks = detailRow.querySelectorAll('input[type=checkbox]');
        resultat.detail = problems.map(function (p, i) {
          return { cat: p.cat, correct: checks[i].checked };
        });
      }
      store.setResultat(data, eleveId, saisieState.niveau.code, saisieState.periode, saisieState.semaine, resultat);
    });
    document.getElementById('saisie-status').textContent = 'Résultats enregistrés — ' + new Date().toLocaleTimeString('fr-FR');
  });

  // ===================== Onglet Élève =====================================
  var elEE = document.getElementById('ev-eleve'), elEN = document.getElementById('ev-niveau');

  function populateEleveSelectors() {
    elEE.innerHTML = data.eleves.map(function (e) { return '<option value="' + e.id + '">' + escapeHtml(e.nom) + '</option>'; }).join('');
  }
  fillNiveauSelect(elEN);
  elEE.addEventListener('change', renderEleveTab);
  elEN.addEventListener('change', renderEleveTab);

  function barRow(label, pct, valueText) {
    return '<div class="bar-row"><div class="bar-label">' + escapeHtml(label) + '</div>' +
      '<div class="bar-track"><div class="bar-fill ' + pctClass(pct) + '" style="width:' + Math.max(0, Math.min(100, pct)) + '%"></div></div>' +
      '<div class="bar-value">' + escapeHtml(valueText) + '</div></div>';
  }

  function renderEleveTab() {
    var elSemaines = document.getElementById('ev-semaines'), elCategories = document.getElementById('ev-categories');
    if (!data.eleves.length) {
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
      return barRow('Période ' + w.periode.replace('P', '') + ' — Semaine ' + w.semaine.replace('S', '') + (w.hasDetail ? '' : ' (note globale)'), pct, w.score.toFixed(1) + '/8');
    }).join('');
    var cats = store.categoryBreakdown(entries);
    elCategories.innerHTML = cats.length ? cats.map(function (c) {
      return barRow(catLabel(c.cat), c.pct, c.correct + '/' + c.total);
    }).join('') : '<p style="color:var(--text-secondary);font-size:var(--fs-small)">Pas encore de saisie en mode détail pour ce niveau — le suivi par catégorie apparaîtra dès qu\'une semaine sera saisie en détail.</p>';
  }

  // ===================== Onglet Classe & groupes ==========================
  var elCS = document.getElementById('cl-selection'), elCN = document.getElementById('cl-niveau'), elCC = document.getElementById('cl-groupes-cat');
  fillNiveauSelect(elCN);

  function renderGestionGroupes() {
    var el = document.getElementById('gestion-groupes');
    if (!data.groupes.length) {
      el.innerHTML = '<p style="color:var(--text-secondary);font-size:var(--fs-small)">Aucun groupe créé pour le moment (facultatif — vous pouvez aussi utiliser "Classe entière").</p>';
      return;
    }
    el.innerHTML = data.groupes.map(function (g) {
      var checks = data.eleves.map(function (e) {
        var checked = g.eleveIds.indexOf(e.id) !== -1;
        return '<label style="margin-right:12px"><input type="checkbox" data-groupe="' + g.id + '" data-eleve="' + e.id + '"' + (checked ? ' checked' : '') + '> ' + escapeHtml(e.nom) + '</label>';
      }).join('');
      return '<div class="card" style="background:var(--paper);box-shadow:none;margin-bottom:10px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
        '<strong>' + escapeHtml(g.nom) + '</strong>' +
        '<button type="button" class="btn outline" data-supprimer-groupe="' + g.id + '" style="padding:4px 10px">Supprimer</button></div>' +
        '<div>' + (checks || '<em style="font-size:var(--fs-small)">Ajoutez des élèves d\'abord.</em>') + '</div></div>';
    }).join('');
    el.querySelectorAll('input[data-groupe]').forEach(function (chk) {
      chk.addEventListener('change', function () {
        var gid = chk.getAttribute('data-groupe');
        var g = data.groupes.filter(function (g) { return g.id === gid; })[0];
        var ids = Array.from(el.querySelectorAll('input[data-groupe="' + gid + '"]:checked')).map(function (c) { return c.getAttribute('data-eleve'); });
        store.setGroupeEleves(data, gid, ids);
        populateClasseSelection();
      });
    });
    el.querySelectorAll('[data-supprimer-groupe]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        store.removeGroupe(data, btn.getAttribute('data-supprimer-groupe'));
        renderGestionGroupes();
        populateClasseSelection();
      });
    });
  }

  document.getElementById('btn-ajouter-groupe').addEventListener('click', function () {
    var inp = document.getElementById('inp-nouveau-groupe');
    var nom = inp.value.trim();
    if (!nom) return;
    store.addGroupe(data, nom);
    inp.value = '';
    renderGestionGroupes();
    populateClasseSelection();
  });

  function populateClasseSelection() {
    var current = elCS.value;
    elCS.innerHTML = '<option value="ALL">Classe entière</option>' +
      data.groupes.map(function (g) { return '<option value="' + g.id + '">' + escapeHtml(g.nom) + '</option>'; }).join('');
    if (Array.from(elCS.options).some(function (o) { return o.value === current; })) elCS.value = current;
  }

  function currentEleveIds() {
    if (elCS.value === 'ALL') return data.eleves.map(function (e) { return e.id; });
    var g = data.groupes.filter(function (g) { return g.id === elCS.value; })[0];
    return g ? g.eleveIds : [];
  }

  elCS.addEventListener('change', renderClasseTab);
  elCN.addEventListener('change', renderClasseTab);
  elCC.addEventListener('change', renderGroupesTravail);

  function renderClasseTab() {
    var elSemaines = document.getElementById('cl-semaines'), elCategories = document.getElementById('cl-categories');
    var eleveIds = currentEleveIds();
    if (!eleveIds.length) {
      elSemaines.innerHTML = elCategories.innerHTML = '<p style="color:var(--text-secondary);font-size:var(--fs-small)">Aucun élève dans cette sélection.</p>';
      renderGroupesCatOptions([]);
      return;
    }
    var entries = store.resultatsForEleves(data, eleveIds, elCN.value);
    if (!entries.length) {
      elSemaines.innerHTML = elCategories.innerHTML = '<p style="color:var(--text-secondary);font-size:var(--fs-small)">Aucun résultat saisi pour ce niveau.</p>';
      renderGroupesCatOptions([]);
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
    renderGroupesCatOptions(store.allCategoriesSeen(data, eleveIds, elCN.value));
  }

  function renderGroupesCatOptions(cats) {
    elCC.innerHTML = '<option value="GLOBAL">Note globale (toutes catégories)</option>' +
      cats.map(function (c) { return '<option value="' + c + '">' + escapeHtml(catLabel(c)) + '</option>'; }).join('');
    renderGroupesTravail();
  }

  function groupeCard(titre, cls, items) {
    var names = items.map(function (r) {
      var e = data.eleves.filter(function (e) { return e.id === r.eleveId; })[0];
      return '<li>' + escapeHtml(e ? e.nom : '?') + ' — ' + r.pct + '%</li>';
    }).join('');
    return '<div class="groupe-card ' + cls + '"><h4>' + titre + ' (' + items.length + ')</h4><ul>' + (names || '<li>—</li>') + '</ul></div>';
  }

  function renderGroupesTravail() {
    var el = document.getElementById('cl-groupes-resultat');
    var eleveIds = currentEleveIds();
    if (!eleveIds.length || !elCC.options.length) { el.innerHTML = ''; return; }
    var res = store.proposeGroups(data, eleveIds, elCN.value, elCC.value);
    var html = '<div class="groupes-row">' +
      groupeCard('À renforcer', 'renforcement', res.renforcement) +
      groupeCard('En consolidation', 'consolidation', res.consolidation) +
      groupeCard('Autonomie', 'autonomie', res.autonomie) +
      '</div>';
    if (res.sansDonnees.length) {
      html += '<p style="margin-top:10px;color:var(--text-secondary);font-size:var(--fs-small)">Pas encore de données pour : ' +
        res.sansDonnees.map(function (r) { var e = data.eleves.filter(function (e) { return e.id === r.eleveId; })[0]; return escapeHtml(e ? e.nom : '?'); }).join(', ') + '</p>';
    }
    el.innerHTML = html;
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
  renderListeEleves();
  initSaisieSelectors();
  renderSaisieGrid();
  populateEleveSelectors();
  renderGestionGroupes();
  populateClasseSelection();
})();
