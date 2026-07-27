/*
 * Stockage et calculs du suivi des élèves — localStorage uniquement (pas de
 * serveur). Un "résultat" = une semaine pour un élève : soit une note /8,
 * soit le détail problème par problème (avec la catégorie Vergnaud de
 * chaque problème, ce qui permet le suivi par type de problème).
 */
(function (global) {
  'use strict';
  var KEY = 'iep1_suivi_v1';

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      var d = raw ? JSON.parse(raw) : {};
      d.eleves = d.eleves || [];
      d.groupes = d.groupes || [];
      d.resultats = d.resultats || {};
      return d;
    } catch (e) {
      return { eleves: [], groupes: [], resultats: {} };
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function uid(prefix) {
    return (prefix || 'id') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function addEleve(data, nom) {
    var e = { id: uid('e'), nom: nom };
    data.eleves.push(e);
    save(data);
    return e;
  }

  function removeEleve(data, id) {
    data.eleves = data.eleves.filter(function (e) { return e.id !== id; });
    data.groupes.forEach(function (g) { g.eleveIds = g.eleveIds.filter(function (i) { return i !== id; }); });
    save(data);
  }

  function addGroupe(data, nom) {
    var g = { id: uid('g'), nom: nom, eleveIds: [] };
    data.groupes.push(g);
    save(data);
    return g;
  }

  function removeGroupe(data, id) {
    data.groupes = data.groupes.filter(function (g) { return g.id !== id; });
    save(data);
  }

  function setGroupeEleves(data, groupeId, eleveIds) {
    var g = data.groupes.filter(function (g) { return g.id === groupeId; })[0];
    if (g) { g.eleveIds = eleveIds; save(data); }
  }

  function resultKey(eleveId, niveau, periode, semaine) {
    return eleveId + '|' + niveau + '|' + periode + '|' + semaine;
  }

  function setResultat(data, eleveId, niveau, periode, semaine, resultat) {
    data.resultats[resultKey(eleveId, niveau, periode, semaine)] = resultat;
    save(data);
  }

  function getResultat(data, eleveId, niveau, periode, semaine) {
    return data.resultats[resultKey(eleveId, niveau, periode, semaine)] || null;
  }

  function periodeNum(p) { return parseInt(String(p).replace('P', ''), 10); }
  function semaineNum(s) { return parseInt(String(s).replace('S', ''), 10); }

  function resultatsForEleve(data, eleveId, niveau) {
    var out = [];
    Object.keys(data.resultats).forEach(function (k) {
      var parts = k.split('|');
      if (parts[0] === eleveId && (!niveau || parts[1] === niveau)) {
        out.push({ eleveId: parts[0], niveau: parts[1], periode: parts[2], semaine: parts[3], data: data.resultats[k] });
      }
    });
    out.sort(function (a, b) {
      var pa = periodeNum(a.periode), pb = periodeNum(b.periode);
      return pa !== pb ? pa - pb : semaineNum(a.semaine) - semaineNum(b.semaine);
    });
    return out;
  }

  function resultatsForEleves(data, eleveIds, niveau) {
    var out = [];
    eleveIds.forEach(function (id) { out = out.concat(resultatsForEleve(data, id, niveau)); });
    return out;
  }

  function categoryBreakdown(entries) {
    var byCat = {};
    entries.forEach(function (entry) {
      if (!entry.data.detail) return;
      entry.data.detail.forEach(function (d) {
        byCat[d.cat] = byCat[d.cat] || { correct: 0, total: 0 };
        byCat[d.cat].total++;
        if (d.correct) byCat[d.cat].correct++;
      });
    });
    var list = Object.keys(byCat).map(function (cat) {
      var c = byCat[cat];
      return { cat: cat, correct: c.correct, total: c.total, pct: Math.round(100 * c.correct / c.total) };
    });
    list.sort(function (a, b) { return a.pct - b.pct; });
    return list;
  }

  function weekBreakdown(entries) {
    var byWeek = {};
    entries.forEach(function (e) {
      var key = e.periode + '|' + e.semaine;
      byWeek[key] = byWeek[key] || { periode: e.periode, semaine: e.semaine, sum: 0, count: 0, anyDetail: false };
      byWeek[key].sum += e.data.score;
      byWeek[key].count++;
      if (e.data.detail) byWeek[key].anyDetail = true;
    });
    var list = Object.keys(byWeek).map(function (k) {
      var w = byWeek[k];
      return { periode: w.periode, semaine: w.semaine, score: w.sum / w.count, hasDetail: w.anyDetail };
    });
    list.sort(function (a, b) {
      var pa = periodeNum(a.periode), pb = periodeNum(b.periode);
      return pa !== pb ? pa - pb : semaineNum(a.semaine) - semaineNum(b.semaine);
    });
    return list;
  }

  function allCategoriesSeen(data, eleveIds, niveau) {
    var entries = resultatsForEleves(data, eleveIds, niveau);
    var cats = {};
    entries.forEach(function (e) {
      if (!e.data.detail) return;
      e.data.detail.forEach(function (d) { cats[d.cat] = true; });
    });
    return Object.keys(cats).sort();
  }

  function successRateByCategory(data, eleveIds, niveau, cat) {
    return eleveIds.map(function (id) {
      var entries = resultatsForEleve(data, id, niveau);
      var pct = null;
      if (cat === 'GLOBAL') {
        var sum = 0, total = 0;
        entries.forEach(function (e) { sum += e.data.score; total += 8; });
        if (total > 0) pct = Math.round(100 * sum / total);
      } else {
        var correct = 0, count = 0;
        entries.forEach(function (e) {
          if (!e.data.detail) return;
          e.data.detail.forEach(function (d) { if (d.cat === cat) { count++; if (d.correct) correct++; } });
        });
        if (count > 0) pct = Math.round(100 * correct / count);
      }
      return { eleveId: id, pct: pct };
    });
  }

  function proposeGroups(data, eleveIds, niveau, cat) {
    var rates = successRateByCategory(data, eleveIds, niveau, cat);
    var withData = rates.filter(function (r) { return r.pct !== null; });
    var sansDonnees = rates.filter(function (r) { return r.pct === null; });
    withData.sort(function (a, b) { return b.pct - a.pct; });
    var n = withData.length;
    var third = Math.ceil(n / 3);
    return {
      autonomie: withData.slice(0, third),
      consolidation: withData.slice(third, 2 * third),
      renforcement: withData.slice(2 * third),
      sansDonnees: sansDonnees,
    };
  }

  global.IEP1Suivi = {
    load: load, save: save,
    addEleve: addEleve, removeEleve: removeEleve,
    addGroupe: addGroupe, removeGroupe: removeGroupe, setGroupeEleves: setGroupeEleves,
    setResultat: setResultat, getResultat: getResultat,
    resultatsForEleve: resultatsForEleve, resultatsForEleves: resultatsForEleves,
    categoryBreakdown: categoryBreakdown, weekBreakdown: weekBreakdown,
    allCategoriesSeen: allCategoriesSeen,
    successRateByCategory: successRateByCategory, proposeGroups: proposeGroups,
  };
})(window);
