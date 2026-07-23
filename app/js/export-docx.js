/*
 * Export Word (.docx) — réutilise le bundle docx.js/FileSaver.js déjà
 * validé par Vincent en conditions réelles (lib/docx-bundle.js), avec les
 * couleurs/polices IEP1 et les schémas de app/js/schemas.js.
 *
 * Fiche élève  : portrait, 2 jours par page (calqué sur documents de
 *                base/P3 S6 CM1.pdf).
 * Corrigé      : paysage, 4 jours sur une page (calqué sur
 *                correction CM1/CM2 P3 S6.png).
 */
(function (global) {
  'use strict';
  var docx = global.docx;
  var buildSchemaDocx = global.IEP1Schemas.buildSchemaDocx;

  var JOUR_HEX = ['005E86', '24952E', 'DC472F', '0F2942']; // blue-deep / green-700 / orange-700 / navy-900
  var JOUR_HEX_LIGHT = ['E3F0F7', 'E7F5EA', 'FDEAE6', 'E5E9EC'];
  var FONT = 'Roboto';

  function run(text, opts) {
    opts = opts || {};
    return new docx.TextRun({ text: String(text), bold: !!opts.bold, italics: !!opts.italics, color: opts.color, size: opts.size || 20, font: FONT });
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
      verticalAlign: docx.VerticalAlign.CENTER,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: Array.isArray(children) ? children : [children],
    });
  }

  function headerBanner(meta) {
    return [
      new docx.Paragraph({
        shading: { fill: JOUR_HEX[3] },
        spacing: { after: 200 },
        children: [run('DEUX CHALLENGES PAR JOUR — ' + meta.niveau + ' — ' + meta.periodeLabel + ' — ' + meta.semaineLabel, { color: 'FFFFFF', bold: true, size: 28 })],
      }),
      new docx.Paragraph({ spacing: { after: 200 }, children: [run(meta.ref || '', { italics: true, color: '3E5468', size: 20 })] }),
    ];
  }

  // ---------------- Fiche élève : portrait, 2 jours / page ---------------
  function buildJourTableEleve(jourIdx, problems) {
    var rows = [];
    rows.push(new docx.TableRow({
      tableHeader: true,
      children: [cell([para([run('JOUR ' + (jourIdx + 1), { color: 'FFFFFF', bold: true })])], { fill: JOUR_HEX[jourIdx], span: 4, width: 100 })],
    }));
    rows.push(new docx.TableRow({
      children: [
        cell([para(run('N°', { bold: true }))], { fill: JOUR_HEX_LIGHT[jourIdx], width: 34 }),
        cell([para(run('Schéma / modélisation', { bold: true }))], { fill: JOUR_HEX_LIGHT[jourIdx], width: 22 }),
        cell([para(run('Calcul', { bold: true }))], { fill: JOUR_HEX_LIGHT[jourIdx], width: 22 }),
        cell([para(run('Réponse', { bold: true }))], { fill: JOUR_HEX_LIGHT[jourIdx], width: 22 }),
      ],
    }));
    problems.forEach(function (p, i) {
      rows.push(new docx.TableRow({
        children: [
          cell([para(run(String(i + 1), { bold: true })), para(run(p.enonce, { size: 18 }), { after: 0 })], { width: 34 }),
          cell([para(''), para(''), para('')], { width: 22 }),
          cell([para(''), para(''), para('')], { width: 22 }),
          cell([para(''), para(''), para('')], { width: 22 }),
        ],
      }));
    });
    return new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, rows: rows });
  }

  function evalGridTable(meta) {
    var header = new docx.TableRow({
      children: [cell(para(run('Jour', { bold: true })), { fill: 'F7F9FB' }), cell(para(run('Problème 1', { bold: true })), { fill: 'F7F9FB' }), cell(para(run('Problème 2', { bold: true })), { fill: 'F7F9FB' })],
    });
    var rows = [header];
    for (var j = 1; j <= 4; j++) {
      rows.push(new docx.TableRow({ children: [cell(para(run('Jour ' + j))), cell(para('')), cell(para(''))] }));
    }
    return new docx.Table({ width: { size: 60, type: docx.WidthType.PERCENTAGE }, rows: rows });
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
    children.push(para(run('Ma grille d’évaluation (à cocher avec la maîtresse/le maître)', { bold: true }), { after: 100 }));
    children.push(evalGridTable(meta));

    return new docx.Document({
      sections: [{
        properties: { page: { size: { orientation: docx.PageOrientation.PORTRAIT }, margin: { top: 500, bottom: 500, left: 500, right: 500 } } },
        children: children,
      }],
      styles: { default: { document: { run: { font: FONT, size: 20 } } } },
    });
  }

  // ---------------- Corrigé : paysage, 4 jours sur une page --------------
  function jourHeaderRow(jourIdx) {
    return new docx.Paragraph({ shading: { fill: JOUR_HEX[jourIdx] }, spacing: { after: 120 }, children: [run('JOUR ' + (jourIdx + 1), { color: 'FFFFFF', bold: true })] });
  }

  function buildCorrigeDocx(joursProblems, meta) {
    var cells = [0, 1, 2, 3].map(function (jourIdx) {
      var content = [jourHeaderRow(jourIdx)];
      joursProblems[jourIdx].forEach(function (p, i) {
        content.push(para(run((i + 1) + '. ' + p.enonce, { bold: true, size: 16 })));
        content.push(buildSchemaDocx(p, docx));
        content.push(para(run('Calcul : ' + p.calcul, { size: 15 })));
        content.push(para(run('Réponse : ' + p.reponse, { bold: true, color: JOUR_HEX[jourIdx], size: 17 })));
        content.push(para(run(p.explication || '', { italics: true, size: 14, color: '3E5468' }), { after: 160 }));
      });
      return new docx.TableCell({
        width: { size: 25, type: docx.WidthType.PERCENTAGE },
        shading: { fill: JOUR_HEX_LIGHT[jourIdx] },
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
        children: content,
      });
    });
    var mainTable = new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, rows: [new docx.TableRow({ children: cells })] });

    var footerRow = new docx.TableRow({
      children: [
        cell([para(run('Méthode', { bold: true, color: '005E86' })), para(run('1. Repérer les grandeurs. 2. Choisir l’opération. 3. Calculer. 4. Vérifier la cohérence du résultat.', { size: 15 }))], { fill: 'F7F9FB', width: 50 }),
        cell([para(run('À retenir', { bold: true, color: 'DC472F' })), para(run('Toujours vérifier les unités et l’ordre de grandeur de la réponse.', { size: 15 }))], { fill: 'FDEAE6', width: 50 }),
      ],
    });
    var footerTable = new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, rows: [footerRow] });

    return new docx.Document({
      sections: [{
        properties: { page: { size: { orientation: docx.PageOrientation.LANDSCAPE }, margin: { top: 400, bottom: 400, left: 400, right: 400 } } },
        children: headerBanner(meta).concat([mainTable, para('', { after: 200 }), footerTable]),
      }],
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
