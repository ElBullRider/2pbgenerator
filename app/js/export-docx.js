/*
 * Export Word (.docx) — réutilise le bundle docx.js/FileSaver.js déjà
 * validé par Vincent en conditions réelles (lib/docx-bundle.js), avec les
 * couleurs/polices IEP1 et les schémas de app/js/schemas.js.
 *
 * Fiche élève  : paysage, marges de 1 cm, recto-verso (2 pages : Jour1-2 /
 *                Jour3-4), lignes Seyès (image) dans les zones Calcul et
 *                Réponse pour aider les élèves à écrire.
 * Corrigé      : paysage, marges de 1 cm, compact pour tenir sur UNE page.
 */
(function (global) {
  'use strict';
  var docx = global.docx;
  var buildSchemaDocx = global.IEP1Schemas.buildSchemaDocx;
  var linedPaper = global.IEP1LinedPaper;

  var JOUR_HEX = ['005E86', '24952E', 'DC472F', '0F2942']; // blue-deep / green-700 / orange-700 / navy-900
  var JOUR_HEX_LIGHT = ['E3F0F7', 'E7F5EA', 'FDEAE6', 'E5E9EC'];
  var FONT = 'Roboto';
  var MARGIN_1CM = 567;
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
      margins: { top: 60, bottom: 60, left: 90, right: 90 },
      children: Array.isArray(children) ? children : [children],
    });
  }
  function linedCell() {
    return new docx.Paragraph({
      alignment: docx.AlignmentType.CENTER,
      children: [new docx.ImageRun({ type: 'png', data: linedPaper.bytes(), transformation: { width: 220, height: 78 } })],
    });
  }

  function landscapeSection(children) {
    return {
      properties: { page: { size: { orientation: docx.PageOrientation.LANDSCAPE }, margin: { top: MARGIN_1CM, bottom: MARGIN_1CM, left: MARGIN_1CM, right: MARGIN_1CM } } },
      children: children,
    };
  }

  function headerBanner(meta, compact) {
    return [
      new docx.Paragraph({
        shading: { fill: JOUR_HEX[3] },
        alignment: docx.AlignmentType.CENTER,
        spacing: { after: compact ? 80 : 160 },
        children: [run('DEUX CHALLENGES PAR JOUR — ' + meta.niveau + ' — ' + meta.periodeLabel + ' — ' + meta.semaineLabel, { color: 'FFFFFF', bold: true, size: compact ? 24 : 30 })],
      }),
      new docx.Paragraph({
        alignment: docx.AlignmentType.CENTER,
        spacing: { after: compact ? 80 : 160 },
        children: [run(meta.ref || '', { italics: true, color: '3E5468', size: compact ? 16 : 20 })],
      }),
    ];
  }

  // ---------------- Fiche élève : paysage, 2 jours / page ----------------
  function buildJourTableEleve(jourIdx, problems) {
    var rows = [];
    rows.push(new docx.TableRow({
      tableHeader: true,
      children: [cell([para([run('JOUR ' + (jourIdx + 1), { color: 'FFFFFF', bold: true, size: 24 })], { align: docx.AlignmentType.CENTER })], { fill: JOUR_HEX[jourIdx], span: 4, width: 100, valign: docx.VerticalAlign.CENTER })],
    }));
    rows.push(new docx.TableRow({
      children: [
        cell([para(run('N° / Énoncé', { bold: true }))], { fill: JOUR_HEX_LIGHT[jourIdx], width: 20 }),
        cell([para(run('Schéma / modélisation', { bold: true }))], { fill: JOUR_HEX_LIGHT[jourIdx], width: 27 }),
        cell([para(run('Calcul', { bold: true }))], { fill: JOUR_HEX_LIGHT[jourIdx], width: 27 }),
        cell([para(run('Réponse', { bold: true }))], { fill: JOUR_HEX_LIGHT[jourIdx], width: 26 }),
      ],
    }));
    problems.forEach(function (p, i) {
      rows.push(new docx.TableRow({
        height: TALL_ROW,
        children: [
          cell([para(run(String(i + 1) + '.', { bold: true, size: 22 })), para(run(p.enonce, { size: 19 }), { after: 0 })], { width: 20, valign: docx.VerticalAlign.TOP }),
          cell([para('')], { width: 27 }),
          cell([linedCell()], { width: 27 }),
          cell([linedCell()], { width: 26 }),
        ],
      }));
    });
    return new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, rows: rows });
  }

  // Grille d'évaluation "linéaire" : une seule ligne, 4 jours côte à côte.
  function evalGridTable() {
    var headerCells = [cell(para(run('', {})), { fill: JOUR_HEX[3], width: 8 })];
    var dataCells = [cell(para(run('Bilan', { bold: true, color: 'FFFFFF' })), { fill: JOUR_HEX[3], width: 8, valign: docx.VerticalAlign.CENTER })];
    for (var j = 0; j < 4; j++) {
      headerCells.push(cell(para(run('Jour ' + (j + 1), { bold: true, color: 'FFFFFF' }), { align: docx.AlignmentType.CENTER }), { fill: JOUR_HEX[j], width: 23 }));
      dataCells.push(cell([
        para([run('P1 ', { bold: true }), run('☆☆☆', { color: 'C7D0D8', size: 20 })], { align: docx.AlignmentType.CENTER, after: 0 }),
        para([run('P2 ', { bold: true }), run('☆☆☆', { color: 'C7D0D8', size: 20 })], { align: docx.AlignmentType.CENTER }),
      ], { fill: JOUR_HEX_LIGHT[j], width: 23, valign: docx.VerticalAlign.CENTER }));
    }
    var table = new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, rows: [new docx.TableRow({ children: headerCells }), new docx.TableRow({ children: dataCells })] });
    var legend = para([
      run('★ Réponse juste   ', { size: 16 }), run('★★ + démarche correcte   ', { size: 16 }), run('★★★ + vérification', { size: 16 }),
    ], { align: docx.AlignmentType.CENTER, after: 0 });
    return { table: table, legend: legend };
  }

  function buildFicheEleveDocx(joursProblems, meta) {
    var children = headerBanner(meta);
    [0, 1].forEach(function (i) {
      children.push(buildJourTableEleve(i, joursProblems[i]));
      children.push(para('', { after: 160 }));
    });
    children.push(new docx.Paragraph({ pageBreakBefore: true, children: [] }));
    children.push.apply(children, headerBanner(meta));
    [2, 3].forEach(function (i) {
      children.push(buildJourTableEleve(i, joursProblems[i]));
      children.push(para('', { after: 160 }));
    });
    var evalGrid = evalGridTable();
    children.push(evalGrid.table);
    children.push(para('', { after: 40 }));
    children.push(evalGrid.legend);

    return new docx.Document({
      sections: [landscapeSection(children)],
      styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    });
  }

  // ---------------- Corrigé : paysage, compact, tient sur une page -------
  function problemCellCorrige(p, jourIdx, num) {
    return [
      para(run(num + '. ' + p.enonce, { bold: true, size: 17 }), { after: 30 }),
      buildSchemaDocx(p, docx),
      para(run('Calcul : ' + p.calcul, { size: 16 }), { after: 20 }),
      para(run('Réponse : ' + p.reponse, { bold: true, color: JOUR_HEX[jourIdx], size: 19 }), { after: 0 }),
    ];
  }

  function buildCorrigeDocx(joursProblems, meta) {
    var rows = [];
    for (var j = 0; j < 4; j++) {
      rows.push(new docx.TableRow({
        children: [cell([para([run('JOUR ' + (j + 1), { color: 'FFFFFF', bold: true, size: 19 })], { align: docx.AlignmentType.CENTER })], { fill: JOUR_HEX[j], span: 2, width: 100, valign: docx.VerticalAlign.CENTER })],
      }));
      rows.push(new docx.TableRow({
        children: [
          cell(problemCellCorrige(joursProblems[j][0], j, 1), { fill: JOUR_HEX_LIGHT[j], width: 50 }),
          cell(problemCellCorrige(joursProblems[j][1], j, 2), { fill: JOUR_HEX_LIGHT[j], width: 50 }),
        ],
      }));
    }
    var mainTable = new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, rows: rows });

    return new docx.Document({
      sections: [landscapeSection(headerBanner(meta, true).concat([mainTable]))],
      styles: { default: { document: { run: { font: FONT, size: 18 } } } },
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
