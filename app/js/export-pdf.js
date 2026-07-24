/*
 * Export PDF — pdfmake (lib/pdfmake.min.js + lib/vfs_fonts.js, Roboto
 * embarqué par défaut, aucune dépendance internet). Paysage, marges
 * étroites, mêmes principes de mise en page que export-docx.js : bandes
 * pleine largeur pour le corrigé, cellules larges pour la fiche élève.
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
  var NARROW_MARGIN = 20; // points, ~0,28 in

  function bannerBlock(meta) {
    return [
      { text: 'DEUX CHALLENGES PAR JOUR — ' + meta.niveau + ' — ' + meta.periodeLabel + ' — ' + meta.semaineLabel,
        bold: true, fontSize: 18, color: 'white', fillColor: '#0F2942', margin: [10, 8, 10, 8] },
      { text: meta.ref || '', italics: true, fontSize: 10, color: '#3E5468', margin: [0, 5, 0, 10] },
    ];
  }

  // ---------------- Fiche élève : paysage, cellules larges ----------------
  function jourTableEleve(jourIdx, problems) {
    var body = [[
      { text: 'N° / Énoncé', bold: true, fillColor: JOUR_HEX_LIGHT[jourIdx], fontSize: 11 },
      { text: 'Schéma / modélisation', bold: true, fillColor: JOUR_HEX_LIGHT[jourIdx], fontSize: 11 },
      { text: 'Calcul', bold: true, fillColor: JOUR_HEX_LIGHT[jourIdx], fontSize: 11 },
      { text: 'Réponse', bold: true, fillColor: JOUR_HEX_LIGHT[jourIdx], fontSize: 11 },
    ]];
    problems.forEach(function (p, i) {
      body.push([
        { text: (i + 1) + '. ' + p.enonce, fontSize: 11, margin: [0, 14, 0, 14] },
        { text: '', margin: [0, 14, 0, 14] }, { text: '', margin: [0, 14, 0, 14] }, { text: '', margin: [0, 14, 0, 14] },
      ]);
    });
    return [
      { text: 'JOUR ' + (jourIdx + 1), bold: true, color: 'white', fillColor: JOUR_HEX[jourIdx], fontSize: 14, margin: [6, 4, 6, 4] },
      { table: { widths: ['26%', '25%', '25%', '24%'], body: body }, layout: { hLineColor: '#C7D0D8', vLineColor: '#C7D0D8' }, margin: [0, 0, 0, 12] },
    ];
  }

  function evalGridTable() {
    var body = [[
      { text: 'Jour', bold: true, color: 'white', fillColor: '#0F2942' },
      { text: 'Problème 1', bold: true, color: 'white', fillColor: '#0F2942', alignment: 'center' },
      { text: 'Problème 2', bold: true, color: 'white', fillColor: '#0F2942', alignment: 'center' },
    ]];
    for (var j = 0; j < 4; j++) {
      body.push([
        { text: 'Jour ' + (j + 1), bold: true, fillColor: JOUR_HEX_LIGHT[j], margin: [0, 8, 0, 8] },
        { text: '☆ ☆ ☆', alignment: 'center', fontSize: 16, color: '#C7D0D8', margin: [0, 8, 0, 8] },
        { text: '☆ ☆ ☆', alignment: 'center', fontSize: 16, color: '#C7D0D8', margin: [0, 8, 0, 8] },
      ]);
    }
    return {
      columns: [
        { width: '50%', table: { widths: [70, '*', '*'], body: body }, layout: { hLineColor: '#C7D0D8', vLineColor: '#C7D0D8' } },
        { width: '50%', margin: [16, 4, 0, 0], fontSize: 10, stack: [
          { text: [{ text: '★ ', color: '#E3A429' }, 'Réponse juste'] },
          { text: [{ text: '★★ ', color: '#E3A429' }, 'Réponse juste + démarche correcte'] },
          { text: [{ text: '★★★ ', color: '#E3A429' }, 'Réponse juste + démarche + vérification'] },
        ] },
      ],
    };
  }

  function buildFicheElevePdf(joursProblems, meta) {
    var content = bannerBlock(meta)
      .concat(jourTableEleve(0, joursProblems[0]))
      .concat(jourTableEleve(1, joursProblems[1]))
      .concat([{ text: '', pageBreak: 'after' }])
      .concat(bannerBlock(meta))
      .concat(jourTableEleve(2, joursProblems[2]))
      .concat(jourTableEleve(3, joursProblems[3]))
      .concat([{ text: 'Ma grille d’évaluation', bold: true, fontSize: 13, margin: [0, 8, 0, 6] }, evalGridTable()]);
    return { pageOrientation: 'landscape', pageSize: 'A4', pageMargins: [NARROW_MARGIN, NARROW_MARGIN, NARROW_MARGIN, NARROW_MARGIN], content: content, defaultStyle: { font: 'Roboto', fontSize: 11 } };
  }

  // ---------------- Corrigé : paysage, une bande pleine largeur par jour --
  function problemCellCorrige(p, jourIdx, num) {
    return {
      stack: [
        { text: num + '. ' + p.enonce, bold: true, fontSize: 10.5, margin: [0, 4, 0, 3] },
        buildSchemaPdf(p),
        { text: 'Calcul : ' + p.calcul, fontSize: 10, margin: [0, 3, 0, 0] },
        { text: 'Réponse : ' + p.reponse, bold: true, color: JOUR_HEX[jourIdx], fontSize: 11.5 },
        { text: p.explication || '', italics: true, fontSize: 9, color: '#3E5468', margin: [0, 1, 0, 4] },
      ],
    };
  }

  function jourBandCorrige(jourIdx, problems) {
    var col1 = Object.assign({ width: '50%', fillColor: JOUR_HEX_LIGHT[jourIdx], margin: [8, 6, 8, 6] }, problemCellCorrige(problems[0], jourIdx, 1));
    var col2 = Object.assign({ width: '50%', fillColor: JOUR_HEX_LIGHT[jourIdx], margin: [8, 6, 8, 6] }, problemCellCorrige(problems[1], jourIdx, 2));
    return [
      { text: 'JOUR ' + (jourIdx + 1), bold: true, color: 'white', fillColor: JOUR_HEX[jourIdx], fontSize: 13, margin: [8, 4, 8, 4] },
      { columns: [col1, col2], columnGap: 4, margin: [0, 0, 0, 10] },
    ];
  }

  function buildCorrigePdf(joursProblems, meta) {
    var content = bannerBlock(meta);
    for (var j = 0; j < 4; j++) content = content.concat(jourBandCorrige(j, joursProblems[j]));
    content = content.concat([
      {
        columns: [
          { text: [{ text: 'Méthode\n', bold: true, color: '#005E86' }, { text: 'Repérer les grandeurs, choisir l’opération, calculer, vérifier la cohérence du résultat.', fontSize: 9.5 }], fillColor: '#F7F9FB', margin: [8, 8, 8, 8] },
          { text: [{ text: 'À retenir\n', bold: true, color: '#DC472F' }, { text: 'Toujours vérifier les unités et l’ordre de grandeur de la réponse.', fontSize: 9.5 }], fillColor: '#FDEAE6', margin: [8, 8, 8, 8] },
        ],
        columnGap: 8, margin: [0, 6, 0, 0],
      },
    ]);
    return { pageOrientation: 'landscape', pageSize: 'A4', pageMargins: [NARROW_MARGIN, NARROW_MARGIN, NARROW_MARGIN, NARROW_MARGIN], content: content, defaultStyle: { font: 'Roboto', fontSize: 10 } };
  }

  function downloadPdf(docDefinition, filename) {
    pdfMake.createPdf(docDefinition).download(filename);
  }

  global.IEP1ExportPdf = { buildFicheElevePdf: buildFicheElevePdf, buildCorrigePdf: buildCorrigePdf, downloadPdf: downloadPdf };
})(window);
