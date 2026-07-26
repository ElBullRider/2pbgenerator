/*
 * Vue imprimable de la fiche élève, pilotée par l'URL :
 *   fiche-eleve.html?niveau=CM1&periode=P1&semaine=S2&sel=0,1,2,3,4,5,6,7
 * Sans "sel", on prend les 8 problèmes de base (non-bonus) par défaut.
 * Recto-verso : page 1 = Jour 1-2, page 2 = Jour 3-4 + grille d'évaluation.
 */
(function () {
  'use strict';
  var catLabel = window.IEP1CatLabels.catLabel;
  var DATA = { CM1: DATA_CM1, CM2: DATA_CM2, CP: DATA_CP, CE1: DATA_CE1, CE2: DATA_CE2 };

  function escapeHtml(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function parseParams() {
    var qs = new URLSearchParams(location.search);
    return { niveau: qs.get('niveau') || 'CM1', periode: qs.get('periode'), semaine: qs.get('semaine'), sel: qs.get('sel') };
  }

  function resolveWeek(p) {
    var data = DATA[p.niveau];
    if (!data) return null;
    var periode = p.periode && data[p.periode] ? p.periode : Object.keys(data).sort()[0];
    var weeks = data[periode];
    var semaine = p.semaine && weeks[p.semaine] ? p.semaine : Object.keys(weeks).sort(function (a, b) {
      return parseInt(a.replace('S', '')) - parseInt(b.replace('S', ''));
    })[0];
    return { niveau: p.niveau, periode: periode, semaine: semaine, week: weeks[semaine], problems: weeks[semaine][p.niveau] };
  }

  function selectedInJours(problems, selParam) {
    var indices;
    if (selParam) {
      indices = selParam.split(',').map(function (s) { return parseInt(s, 10); }).filter(function (n) { return !isNaN(n); });
    } else {
      indices = [];
      problems.forEach(function (p, i) { if (!p.bonus) indices.push(i); });
    }
    indices.sort(function (a, b) { return a - b; });
    var jours = [[], [], [], []];
    indices.forEach(function (idx, pos) { jours[Math.floor(pos / 2)].push(problems[idx]); });
    return jours;
  }

  function bannerHtml(meta) {
    return '<div class="iep1-banner" style="text-align:center">' +
      '<h1 style="color:#fff;font-size:26px">DEUX CHALLENGES PAR JOUR — ' + escapeHtml(meta.niveau) + ' — ' +
      escapeHtml(meta.periodeLabel) + ' — ' + escapeHtml(meta.semaineLabel) + '</h1>' +
      '<p>' + escapeHtml(meta.ref) + '</p></div>';
  }

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
    var cols = [1, 2, 3, 4].map(function (j) {
      return '<th>Jour ' + j + '</th>';
    }).join('');
    var data = [1, 2, 3, 4].map(function () {
      return '<td><div class="eleve-evalgrid__stars">P1 ☆☆☆</div><div class="eleve-evalgrid__stars">P2 ☆☆☆</div></td>';
    }).join('');
    return '<table class="eleve-evalgrid"><thead><tr><th class="bilan">Bilan</th>' + cols + '</tr></thead>' +
      '<tbody><tr><td></td>' + data + '</tr></tbody></table>' +
      '<p class="eleve-evalgrid__legend">★ Réponse juste &nbsp;&nbsp; ★★ + démarche correcte &nbsp;&nbsp; ★★★ + vérification</p>';
  }

  function render() {
    var params = parseParams();
    var resolved = resolveWeek(params);
    var el = document.getElementById('content');
    if (!resolved) { el.innerHTML = '<p>Niveau introuvable.</p>'; return; }
    var jours = selectedInJours(resolved.problems, params.sel);
    var meta = {
      niveau: resolved.niveau,
      periodeLabel: 'Période ' + resolved.periode.replace('P', ''),
      semaineLabel: 'Semaine ' + resolved.semaine.replace('S', ''),
      ref: resolved.week.ref,
    };

    var page1 = '<div class="print-sheet">' + bannerHtml(meta) + jourTableHtml(0, jours[0]) + jourTableHtml(1, jours[1]) + '</div>';
    var page2 = '<div class="print-sheet">' + jourTableHtml(2, jours[2]) + jourTableHtml(3, jours[3]) + evalGridHtml() + '</div>';
    el.innerHTML = page1 + page2;
    document.title = 'Fiche élève — ' + meta.niveau + ' ' + meta.periodeLabel + ' ' + meta.semaineLabel;
  }

  document.getElementById('btn-print').addEventListener('click', function () { window.print(); });
  render();
})();
