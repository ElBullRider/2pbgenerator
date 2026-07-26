/*
 * Schémas visuels par catégorie Vergnaud — un seul générateur de spec par
 * famille de catégories, rendu en SVG (utilisé à l'écran et à l'impression,
 * fiche-eleve.html / corrige.html). Les valeurs viennent de
 * `schema.known`/`schema.unknown` (dérivées du premier pas de calcul) : le
 * diagramme est une aide visuelle générique, la méthode complète et exacte
 * reste toujours affichée en texte à côté (colonne "Calcul").
 */
(function (global) {
  'use strict';

  var FAMILY_BY_CAT = {
    T: 'partpart', P: 'partpart',
    'EF+': 'transform', 'EF-': 'transform', 'EI+': 'transform', 'EI-': 'transform',
    'TR+': 'transform', 'TR-': 'transform', TT: 'transform',
    C: 'compare', CE: 'compare', 'C+': 'compare', 'C-': 'compare', 'CE+': 'compare', 'CE-': 'compare',
    'CE+*': 'compare', 'CE-*': 'compare', CEx: 'compare', 'CEx*': 'compare',
    'Cx+': 'compare', 'Cx-': 'compare',
    MA: 'multdiv', MR: 'multdiv', DN: 'multdiv', DV: 'multdiv',
    Pro: 'prop', 'Pro+': 'prop', ProX: 'prop', ProU: 'prop',
  };

  // Palette IEP1 (mêmes valeurs que app/css/iep1.css, dupliquées ici car
  // docx.js/pdfmake ne peuvent pas lire des variables CSS).
  var COLOR = {
    navy: '0F2942', blueDeep: '005E86', blueMid: '509ED5', teal: '39B2C5',
    orange: 'F47A4B', green: '52BB94', greenDark: '24952E', gray: '8A97A3',
    grayLight: 'C7D0D8', white: 'FFFFFF', paper: 'F7F9FB',
  };

  function family(cat) { return FAMILY_BY_CAT[cat] || 'partpart'; }

  function num(v) { return (v === undefined || v === null) ? '?' : String(v); }

  // ---- construit une spec neutre (indépendante du rendu) -----------------
  function buildSpec(problem) {
    var cat = problem.cat;
    var fam = family(cat);
    var known = (problem.schema && problem.schema.known) || [];
    var unknown = (problem.schema && problem.schema.unknown);
    var isDecrease = /-/.test(cat) && !/\+/.test(cat);

    if (fam === 'partpart') {
      var parts = known.length ? known.slice() : ['?'];
      return { fam: fam, parts: parts, whole: cat === 'T' ? num(unknown) : null, missing: cat === 'P' ? num(unknown) : null };
    }
    if (fam === 'transform') {
      return {
        fam: fam,
        start: num(known[0]),
        op: (isDecrease ? '−' : '+') + ' ' + num(known[1] !== undefined ? known[1] : unknown),
        end: known[1] !== undefined ? num(unknown) : num(unknown),
      };
    }
    if (fam === 'compare') {
      return {
        fam: fam,
        a: num(known[0]),
        b: num(known[1] !== undefined ? known[1] : unknown),
        diff: num(unknown),
        more: !isDecrease,
      };
    }
    if (fam === 'multdiv') {
      var isDiv = cat === 'DN' || cat === 'DV';
      return {
        fam: fam,
        a: num(known[0]),
        b: num(known[1]),
        result: num(unknown),
        op: isDiv ? '÷' : '×',
      };
    }
    // prop
    var k0 = known[0], k1 = known[1];
    var factor = '?';
    if (k0 && k1 && !isNaN(parseFloat(k0)) && !isNaN(parseFloat(k1))) {
      var a = parseFloat(String(k0).replace(',', '.')), b = parseFloat(String(k1).replace(',', '.'));
      if (a && b) {
        var r = b / a;
        factor = (r >= 1 ? '×' : '÷') + ' ' + (r >= 1 ? round2(r) : round2(1 / r));
      }
    }
    return { fam: fam, colA1: num(k0), colB1: num(k1), colA2: '?', colB2: num(unknown), factor: factor };
  }

  function round2(n) {
    var r = Math.round(n * 100) / 100;
    return (r % 1 === 0) ? String(r) : String(r).replace('.', ',');
  }

  // ================= Rendu écran : SVG ====================================
  function svgTag(children, w, h) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" width="100%" height="auto">' + children + '</svg>';
  }
  function rect(x, y, w, h, fill, stroke) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#' + fill + '"' +
      (stroke ? ' stroke="#' + stroke + '" stroke-width="1.5"' : '') + ' rx="4"/>';
  }
  function text(x, y, s, opts) {
    opts = opts || {};
    var esc = String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return '<text x="' + x + '" y="' + y + '" font-family="Roboto,Arial,sans-serif" font-size="' + (opts.size || 13) +
      '" font-weight="' + (opts.bold ? '700' : '400') + '" fill="#' + (opts.color || COLOR.navy) +
      '" text-anchor="' + (opts.anchor || 'middle') + '">' + esc + '</text>';
  }
  function arrowLine(x1, y1, x2, y2, color) {
    var id = 'a' + Math.round(x1 + y1 + x2 + y2);
    return '<defs><marker id="' + id + '" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="#' + color + '"/></marker></defs>' +
      '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#' + color + '" stroke-width="2" marker-end="url(#' + id + ')"/>';
  }

  function svgPartPart(spec) {
    var w = 280, h = 100, boxW = Math.min(70, (w - 20) / (spec.parts.length + 1));
    var x = 10, y = 30, gap = 6, s = '';
    spec.parts.forEach(function (p, i) {
      s += rect(x, y, boxW, 40, COLOR.blueMid, COLOR.blueDeep) + text(x + boxW / 2, y + 25, p, { color: COLOR.white, bold: true });
      x += boxW + gap;
    });
    s += rect(x, y, boxW, 40, COLOR.orange, COLOR.orange) + text(x + boxW / 2, y + 25, spec.whole ? spec.whole : (spec.missing || '?'), { color: COLOR.white, bold: true });
    s += text((10 + x + boxW) / 2, 18, spec.whole ? 'le tout ?' : 'partie manquante ?', { size: 11, color: COLOR.gray });
    return svgTag(s, w, h);
  }
  function svgTransform(spec) {
    var w = 280, h = 90;
    var s = rect(10, 25, 80, 40, COLOR.blueMid, COLOR.blueDeep) + text(50, 50, spec.start, { color: COLOR.white, bold: true });
    s += rect(190, 25, 80, 40, COLOR.orange, COLOR.orange) + text(230, 50, spec.end, { color: COLOR.white, bold: true });
    s += arrowLine(92, 45, 188, 45, COLOR.navy);
    s += text(140, 30, spec.op, { bold: true, size: 14 });
    return svgTag(s, w, h);
  }
  function svgCompare(spec) {
    var w = 280, h = 110;
    var hA = 55, hB = spec.more ? 30 : 75;
    var yA = 90 - hA, yB = 90 - hB;
    var s = rect(30, yA, 60, hA, COLOR.blueMid, COLOR.blueDeep) + text(60, yA - 6, spec.a, { bold: true });
    s += rect(150, yB, 60, hB, COLOR.orange, COLOR.orange) + text(180, yB - 6, spec.b, { bold: true });
    s += '<line x1="95" y1="' + Math.min(yA, yB) + '" x2="145" y2="' + Math.min(yA, yB) + '" stroke="#' + COLOR.navy + '" stroke-width="1.5" stroke-dasharray="3,2"/>';
    s += text(220, Math.min(yA, yB) + 12, 'écart : ' + spec.diff, { size: 12, color: COLOR.greenDark, bold: true, anchor: 'start' });
    return svgTag(s, w, h);
  }
  function svgMultdiv(spec) {
    var w = 280, h = 100;
    var cols = Math.max(1, Math.min(8, parseInt(spec.b) || 4));
    var rows = Math.max(1, Math.min(4, parseInt(spec.a) || 3));
    var cell = 16, ox = 15, oy = 15, s = '';
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        s += rect(ox + c * (cell + 3), oy + r * (cell + 3), cell, cell, COLOR.blueMid, COLOR.blueDeep);
      }
    }
    s += text(ox + (cols * (cell + 3)) / 2, oy + rows * (cell + 3) + 16, spec.a + ' ' + spec.op + ' ' + spec.b + ' = ' + spec.result, { bold: true, size: 13 });
    return svgTag(s, w, h);
  }
  function svgProp(spec) {
    var w = 280, h = 110, x0 = 30, colW = 90, rowH = 34, y0 = 15;
    var s = rect(x0, y0, colW, rowH, COLOR.paper, COLOR.grayLight) + rect(x0 + colW, y0, colW, rowH, COLOR.paper, COLOR.grayLight);
    s += rect(x0, y0 + rowH, colW, rowH, COLOR.paper, COLOR.grayLight) + rect(x0 + colW, y0 + rowH, colW, rowH, COLOR.orange, COLOR.orange);
    s += text(x0 + colW / 2, y0 + 22, spec.colA1) + text(x0 + colW * 1.5, y0 + 22, spec.colB1);
    s += text(x0 + colW / 2, y0 + rowH + 22, spec.colA2) + text(x0 + colW * 1.5, y0 + rowH + 22, spec.colB2, { color: COLOR.white, bold: true });
    s += arrowLine(x0 - 8, y0 + rowH / 2, x0 - 8, y0 + rowH + rowH / 2, COLOR.blueDeep);
    s += text(x0 - 12, y0 + rowH + 4, spec.factor, { bold: true, color: COLOR.blueDeep, anchor: 'end' });
    return svgTag(s, w, h);
  }

  function buildSchemaSVG(problem) {
    var spec = buildSpec(problem);
    switch (spec.fam) {
      case 'partpart': return svgPartPart(spec);
      case 'transform': return svgTransform(spec);
      case 'compare': return svgCompare(spec);
      case 'multdiv': return svgMultdiv(spec);
      default: return svgProp(spec);
    }
  }

  global.IEP1Schemas = {
    FAMILY_BY_CAT: FAMILY_BY_CAT,
    buildSpec: buildSpec,
    buildSchemaSVG: buildSchemaSVG,
    COLOR: COLOR,
  };
})(window);
