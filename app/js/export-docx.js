/*
 * Export Word (.docx) — réutilise le bundle docx.js/FileSaver.js déjà
 * validé par Vincent en conditions réelles (lib/docx-bundle.js), avec les
 * couleurs/polices IEP1 et les schémas de app/js/schemas.js.
 *
 * Les deux documents (fiche élève et corrigé) sont en paysage, marges
 * étroites, pour que les tableaux occupent toute la largeur de la page.
 */
(function (global) {
  'use strict';
  var docx = global.docx;
  var buildSchemaDocx = global.IEP1Schemas.buildSchemaDocx;

  var JOUR_HEX = ['005E86', '24952E', 'DC472F', '0F2942']; // blue-deep / green-700 / orange-700 / navy-900
  var JOUR_HEX_LIGHT = ['E3F0F7', 'E7F5EA', 'FDEAE6', 'E5E9EC'];
  var FONT = 'Roboto';
  var NARROW_MARGIN = 400; // ~0,28 in
  var TALL_ROW = { value: 1500, rule: docx.HeightRule.ATLEAST }; // ~1,05 in — espace à remplir

  function run(text, opts) {
    opts = opts || {};
    return new docx.TextRun({ text: String(text), bold: !!opts.bold, italics: !!opts.italics, color: opts.color, size: opts.size || 22, font: FONT });
  }
  function para(children, opts) {
    opts = opts || {};
    return new docx.Paragraph({ children: Array.isArray(children) ? children : [children], alignment: opts.align, spacing: { after: opts.after !== undefined ? opts.after : 60 } });
  }
  function cell(children, opts) {
    opts = opts || {};
    return new docx.TableCell({
      width: opts.width ? { size: opts.width, type: docx.WidthType.PERCENTAGE } : undefined,
      columnSpan: opts.span,
      shading: opts.fill ? { fill: opts.fill } : undefined,
      verticalAlign: opts.valign || docx.VerticalAlign.TOP,
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      children: Array.isArray(children) ? children : [children],
    });
  }

  function landscapeSection(children) {
    return {
      properties: { page: { size: { orientation: docx.PageOrientation.LANDSCAPE }, margin: { top: NARROW_MARGIN, bottom: NARROW_MARGIN, left: NARROW_MARGIN, right: NARROW_MARGIN } } },
      children: children,
    };
  }

  function headerBanner(meta) {
    return [
      new docx.Paragraph({
        shading: { fill: JOUR_HEX[3] },
        spacing: { after: 160 },
        children: [run('DEUX CHALLENGES PAR JOUR — ' + meta.niveau + ' — ' + meta.periodeLabel + ' — ' + meta.semaineLabel, { color: 'FFFFFF', bold: true, size: 30 })],
      }),
      new docx.Paragraph({ spacing: { after: 160 }, children: [run(meta.ref || '', { italics: true, color: '3E5468', size: 20 })] }),
    ];
  }

  // ---------------- Fiche élève : paysage, 2 jours / page, cellules larges
  function buildJourTableEleve(jourIdx, problems) {
    var rows = [];
    rows.push(new docx.TableRow({
      tableHeader: true,
      children: [cell([para([run('JOUR ' + (jourIdx + 1), { color: 'FFFFFF', bold: true, size: 24 })])], { fill: JOUR_HEX[jourIdx], span: 4, width: 100, valign: docx.VerticalAlign.CENTER })],
    }));
    rows.push(new docx.TableRow({
      children: [
        cell([para(run('N° / Énoncé', { bold: true }))], { fill: JOUR_HEX_LIGHT[jourIdx], width: 26 }),
        cell([para(run('Schéma / modélisation', { bold: true }))], { fill: JOUR_HEX_LIGHT[jourIdx], width: 25 }),
        cell([para(run('Calcul', { bold: true }))], { fill: JOUR_HEX_LIGHT[jourIdx], width: 25 }),
        cell([para(run('Réponse', { bold: true }))], { fill: JOUR_HEX_LIGHT[jourIdx], width: 24 }),
      ],
    }));
    problems.forEach(function (p, i) {
      rows.push(new docx.TableRow({
        height: TALL_ROW,
        children: [
          cell([para(run(String(i + 1) + '.', { bold: true, size: 24 })), para(run(p.enonce, { size: 21 }), { after: 0 })], { width: 26, valign: docx.VerticalAlign.TOP }),
          cell([para('')], { width: 25 }),
          cell([para('')], { width: 25 }),
          cell([para('')], { width: 24 }),
        ],
      }));
    });
    return new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, rows: rows });
  }

  function evalGridTable() {
    var rows = [];
    rows.push(new docx.TableRow({
      children: [
        cell(para(run('Jour', { color: 'FFFFFF', bold: true, size: 22 })), { fill: JOUR_HEX[3], width: 20, valign: docx.VerticalAlign.CENTER }),
        cell(para(run('Problème 1', { color: 'FFFFFF', bold: true, size: 22 })), { fill: JOUR_HEX[3], width: 40, valign: docx.VerticalAlign.CENTER }),
        cell(para(run('Problème 2', { color: 'FFFFFF', bold: true, size: 22 })), { fill: JOUR_HEX[3], width: 40, valign: docx.VerticalAlign.CENTER }),
      ],
    }));
    for (var j = 0; j < 4; j++) {
      rows.push(new docx.TableRow({
        height: { value: 700, rule: docx.HeightRule.ATLEAST },
        children: [
          cell(para(run('Jour ' + (j + 1), { bold: true })), { fill: JOUR_HEX_LIGHT[j], width: 20, valign: docx.VerticalAlign.CENTER }),
          cell(para(run('☆ ☆ ☆', { size: 26, color: 'C7D0D8' }), { align: docx.AlignmentType.CENTER }), { width: 40, valign: docx.VerticalAlign.CENTER }),
          cell(para(run('☆ ☆ ☆', { size: 26, color: 'C7D0D8' }), { align: docx.AlignmentType.CENTER }), { width: 40, valign: docx.VerticalAlign.CENTER }),
        ],
      }));
    }
    var table = new docx.Table({ width: { size: 60, type: docx.WidthType.PERCENTAGE }, rows: rows });
    var legend = [
      para([run('★ ', { color: 'E3A429' }), run('Réponse juste ')]),
      para([run('★★ ', { color: 'E3A429' }), run('Réponse juste + démarche correcte ')]),
      para([run('★★★ ', { color: 'E3A429' }), run('Réponse juste + démarche + vérification ')]),
    ];
    return { table: table, legend: legend };
  }

  function buildFicheEleveDocx(joursProblems, meta) {
    var children = headerBanner(meta);
    [0, 1].forEach(function (i) {
      children.push(buildJourTableEleve(i, joursProblems[i]));
      children.push(para('', { after: 200 }));
    });
    children.push(new docx.Paragraph({ pageBreakBefore: true, children: [] }));
    children.push.apply(children, headerBanner(meta));
    [2, 3].forEach(function (i) {
      children.push(buildJourTableEleve(i, joursProblems[i]));
      children.push(para('', { after: 200 }));
    });
    children.push(para(run('Ma grille d’évaluation (à cocher avec la maîtresse/le maître)', { bold: true, size: 24 }), { after: 120 }));
    var evalGrid = evalGridTable();
    children.push(evalGrid.table);
    children.push(para('', { after: 100 }));
    children.push.apply(children, evalGrid.legend);

    return new docx.Document({
      sections: [landscapeSection(children)],
      styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    });
  }

  // ---------------- Corrigé : paysage, une bande pleine largeur par jour --
  function problemCellCorrige(p, jourIdx, num) {
    return [
      para(run(num + '. ' + p.enonce, { bold: true, size: 20 })),
      buildSchemaDocx(p, docx),
      para(run('Calcul : ' + p.calcul, { size: 19 })),
      para(run('Réponse : ' + p.reponse, { bold: true, color: JOUR_HEX[jourIdx], size: 22 })),
      para(run(p.explication || '', { italics: true, size: 17, color: '3E5468' }), { after: 0 }),
    ];
  }

  function buildCorrigeDocx(joursProblems, meta) {
    var rows = [];
    for (var j = 0; j < 4; j++) {
      rows.push(new docx.TableRow({
        children: [cell([para([run('JOUR ' + (j + 1), { color: 'FFFFFF', bold: true, size: 24 })])], { fill: JOUR_HEX[j], span: 2, width: 100, valign: docx.VerticalAlign.CENTER })],
      }));
      rows.push(new docx.TableRow({
        children: [
          cell(problemCellCorrige(joursProblems[j][0], j, 1), { fill: JOUR_HEX_LIGHT[j], width: 50 }),
          cell(problemCellCorrige(joursProblems[j][1], j, 2), { fill: JOUR_HEX_LIGHT[j], width: 50 }),
        ],
      }));
    }
    var mainTable = new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, rows: rows });

    var footerRow = new docx.TableRow({
      children: [
        cell([para(run('Méthode', { bold: true, color: '005E86', size: 22 })), para(run('1. Repérer les grandeurs. 2. Choisir l’opération. 3. Calculer. 4. Vérifier la cohérence du résultat.', { size: 18 }))], { fill: 'F7F9FB', width: 50 }),
        cell([para(run('À retenir', { bold: true, color: 'DC472F', size: 22 })), para(run('Toujours vérifier les unités et l’ordre de grandeur de la réponse.', { size: 18 }))], { fill: 'FDEAE6', width: 50 }),
      ],
    });
    var footerTable = new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, rows: [footerRow] });

    return new docx.Document({
      sections: [landscapeSection(headerBanner(meta).concat([mainTable, para('', { after: 160 }), footerTable]))],
      styles: { default: { document: { run: { font: FONT, size: 20 } } } },
    });
  }

  function downloadDocx(doc, filename) {
    docx.Packer.toBlob(doc).then(function (blob) {
      global.saveAs(blob, filename);
    });
  }

  global.IEP1ExportDocx = {
    buildFicheEleveDocx: buildFicheEleveDocx,
    buildCorrigeDocx: buildCorrigeDocx,
    downloadDocx: downloadDocx,
  };
})(window);
