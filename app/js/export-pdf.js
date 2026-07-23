/*
 * Export PDF — pdfmake (lib/pdfmake.min.js + lib/vfs_fonts.js, Roboto
 * embarqué par défaut, aucune dépendance internet). Mêmes mises en page que
 * export-docx.js : fiche élève portrait 2 jours/page, corrigé paysage
 * 4 jours/page.
 */
(function (global) {
  'use strict';
  var pdfMake = global.pdfMake;
  pdfMake.fonts = {
    Roboto: { normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf', italics: 'Roboto-Italic.ttf', bolditalics: 'Roboto-MediumItalic.ttf' },
  };
  var buildSchemaPdf = global.IEP1Schemas.buildSchemaPdf;

  var JOUR_HEX = ['#005E86', '#24952E', '#DC472F', '#0F2942'];
  var JOUR_HEX_LIGHT = ['#E3F0F7', '#E7F5EA', '#FDEAE6', '#E5E9EC'];

  function bannerBlock(meta) {
    return [
      { text: 'DEUX CHALLENGES PAR JOUR — ' + meta.niveau + ' — ' + meta.periodeLabel + ' — ' + meta.semaineLabel,
        bold: true, fontSize: 15, color: 'white', fillColor: '#0F2942', margin: [8, 6, 8, 6] },
      { text: meta.ref || '', italics: true, fontSize: 9, color: '#3E5468', margin: [0, 4, 0, 8] },
    ];
  }

  // ---------------- Fiche élève : portrait, 2 jours / page ---------------
  function jourTableEleve(jourIdx, problems) {
    var body = [[
      { text: 'N°', bold: true, fillColor: JOUR_HEX_LIGHT[jourIdx] },
      { text: 'Schéma / modélisation', bold: true, fillColor: JOUR_HEX_LIGHT[jourIdx] },
      { text: 'Calcul', bold: true, fillColor: JOUR_HEX_LIGHT[jourIdx] },
      { text: 'Réponse', bold: true, fillColor: JOUR_HEX_LIGHT[jourIdx] },
    ]];
    problems.forEach(function (p, i) {
      body.push([
        { text: (i + 1) + '. ' + p.enonce, fontSize: 9 },
        { text: '' }, { text: '' }, { text: '' },
      ]);
    });
    return [
      { text: 'JOUR ' + (jourIdx + 1), bold: true, color: 'white', fillColor: JOUR_HEX[jourIdx], fontSize: 12, margin: [4, 3, 4, 3] },
      { table: { widths: [90, '*', 70, 70], body: body }, layout: { hLineColor: '#C7D0D8', vLineColor: '#C7D0D8' }, margin: [0, 0, 0, 10] },
    ];
  }

  function evalGridTable() {
    var body = [[{ text: 'Jour', bold: true }, { text: 'Problème 1', bold: true }, { text: 'Problème 2', bold: true }]];
    for (var j = 1; j <= 4; j++) body.push(['Jour ' + j, '', '']);
    return { table: { widths: [60, 80, 80], body: body }, layout: { hLineColor: '#C7D0D8', vLineColor: '#C7D0D8' } };
  }

  function buildFicheElevePdf(joursProblems, meta) {
    var content = bannerBlock(meta)
      .concat(jourTableEleve(0, joursProblems[0]))
      .concat(jourTableEleve(1, joursProblems[1]))
      .concat([{ text: '', pageBreak: 'after' }])
      .concat(bannerBlock(meta))
      .concat(jourTableEleve(2, joursProblems[2]))
      .concat(jourTableEleve(3, joursProblems[3]))
      .concat([{ text: 'Ma grille d’évaluation', bold: true, margin: [0, 6, 0, 4] }, evalGridTable()]);
    return { pageOrientation: 'portrait', pageSize: 'A4', content: content, defaultStyle: { font: 'Roboto', fontSize: 10 } };
  }

  // ---------------- Corrigé : paysage, 4 jours sur une page --------------
  function jourColumnCorrige(jourIdx, problems) {
    var stack = [{ text: 'JOUR ' + (jourIdx + 1), bold: true, color: 'white', fillColor: JOUR_HEX[jourIdx], fontSize: 11, margin: [3, 2, 3, 2] }];
    problems.forEach(function (p, i) {
      stack.push({ text: (i + 1) + '. ' + p.enonce, bold: true, fontSize: 8, margin: [0, 4, 0, 2] });
      stack.push(buildSchemaPdf(p));
      stack.push({ text: 'Calcul : ' + p.calcul, fontSize: 7.5, margin: [0, 2, 0, 0] });
      stack.push({ text: 'Réponse : ' + p.reponse, bold: true, color: JOUR_HEX[jourIdx], fontSize: 8.5 });
      stack.push({ text: p.explication || '', italics: true, fontSize: 7, color: '#3E5468', margin: [0, 1, 0, 4] });
    });
    return { stack: stack, fillColor: JOUR_HEX_LIGHT[jourIdx], margin: [2, 2, 2, 2] };
  }

  function buildCorrigePdf(joursProblems, meta) {
    var cols = [0, 1, 2, 3].map(function (i) { return jourColumnCorrige(i, joursProblems[i]); });
    var content = bannerBlock(meta).concat([
      { columns: cols, columnGap: 6 },
      {
        columns: [
          { text: [{ text: 'Méthode\n', bold: true, color: '#005E86' }, { text: 'Repérer les grandeurs, choisir l’opération, calculer, vérifier la cohérence du résultat.', fontSize: 8 }], fillColor: '#F7F9FB', margin: [6, 6, 6, 6] },
          { text: [{ text: 'À retenir\n', bold: true, color: '#DC472F' }, { text: 'Toujours vérifier les unités et l’ordre de grandeur de la réponse.', fontSize: 8 }], fillColor: '#FDEAE6', margin: [6, 6, 6, 6] },
        ],
        columnGap: 6, margin: [0, 10, 0, 0],
      },
    ]);
    return { pageOrientation: 'landscape', pageSize: 'A4', content: content, defaultStyle: { font: 'Roboto', fontSize: 9 } };
  }

  function downloadPdf(docDefinition, filename) {
    pdfMake.createPdf(docDefinition).download(filename);
  }

  global.IEP1ExportPdf = { buildFicheElevePdf: buildFicheElevePdf, buildCorrigePdf: buildCorrigePdf, downloadPdf: downloadPdf };
})(window);
