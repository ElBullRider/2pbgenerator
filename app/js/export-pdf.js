/*
 * Export PDF — pdfmake (lib/pdfmake.min.js + lib/vfs_fonts.js, Roboto
 * embarqué par défaut, aucune dépendance internet). Paysage, marges de
 * 1 cm, mêmes principes que export-docx.js (lignes Seyès en image, grille
 * d'évaluation linéaire, corrigé compact tenant sur une page).
 */
(function (global) {
  'use strict';
  var pdfMake = global.pdfMake;
  pdfMake.fonts = {
    Roboto: { normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf', italics: 'Roboto-Italic.ttf', bolditalics: 'Roboto-MediumItalic.ttf' },
  };
  var buildSchemaPdf = global.IEP1Schemas.buildSchemaPdf;
  var linedPaper = global.IEP1LinedPaper;

  var JOUR_HEX = ['#005E86', '#24952E', '#DC472F', '#0F2942'];
  var JOUR_HEX_LIGHT = ['#E3F0F7', '#E7F5EA', '#FDEAE6', '#E5E9EC'];
  var MARGIN_1CM = 28.35; // points

  function linedImage() {
    return { image: linedPaper.dataURL(), width: 150, height: 150 * linedPaper.NATIVE_HEIGHT / linedPaper.NATIVE_WIDTH, alignment: 'center' };
  }

  function bannerBlock(meta, compact) {
    return [
      { text: 'DEUX CHALLENGES PAR JOUR — ' + meta.niveau + ' — ' + meta.periodeLabel + ' — ' + meta.semaineLabel,
        bold: true, fontSize: compact ? 13 : 18, color: 'white', fillColor: '#0F2942', alignment: 'center', margin: [10, compact ? 5 : 8, 10, compact ? 5 : 8] },
      { text: meta.ref || '', italics: true, fontSize: compact ? 8 : 10, color: '#3E5468', alignment: 'center', margin: [0, 4, 0, compact ? 4 : 10] },
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
        { text: '', margin: [0, 14, 0, 14] },
        linedImage(),
        linedImage(),
      ]);
    });
    return [
      { text: 'JOUR ' + (jourIdx + 1), bold: true, color: 'white', fillColor: JOUR_HEX[jourIdx], fontSize: 14, alignment: 'center', margin: [6, 4, 6, 4] },
      { table: { widths: ['20%', '27%', '27%', '26%'], body: body }, layout: { hLineColor: '#C7D0D8', vLineColor: '#C7D0D8' }, margin: [0, 0, 0, 10] },
    ];
  }

  // Grille d'évaluation "linéaire" : une seule ligne, 4 jours côte à côte.
  function evalGridTable() {
    var header = [{ text: 'Bilan', bold: true, color: 'white', fillColor: '#0F2942', alignment: 'center' }];
    var data = [{ text: '', fillColor: '#0F2942' }];
    for (var j = 0; j < 4; j++) {
      header.push({ text: 'Jour ' + (j + 1), bold: true, color: 'white', fillColor: JOUR_HEX[j], alignment: 'center' });
      data.push({ text: 'P1 ☆☆☆\nP2 ☆☆☆', alignment: 'center', fontSize: 10, color: '#C7D0D8', fillColor: JOUR_HEX_LIGHT[j], margin: [0, 4, 0, 4] });
    }
    return {
      table: { widths: [50, '*', '*', '*', '*'], body: [header, data] },
      layout: { hLineColor: '#C7D0D8', vLineColor: '#C7D0D8' },
      margin: [0, 4, 0, 4],
    };
  }
  function evalLegend() {
    return { text: '★ Réponse juste     ★★ + démarche correcte     ★★★ + vérification', alignment: 'center', fontSize: 9, color: '#3E5468' };
  }

  function buildFicheElevePdf(joursProblems, meta) {
    var content = bannerBlock(meta)
      .concat(jourTableEleve(0, joursProblems[0]))
      .concat(jourTableEleve(1, joursProblems[1]))
      .concat([{ text: '', pageBreak: 'after' }])
      .concat(bannerBlock(meta))
      .concat(jourTableEleve(2, joursProblems[2]))
      .concat(jourTableEleve(3, joursProblems[3]))
      .concat([evalGridTable(), evalLegend()]);
    return { pageOrientation: 'landscape', pageSize: 'A4', pageMargins: [MARGIN_1CM, MARGIN_1CM, MARGIN_1CM, MARGIN_1CM], content: content, defaultStyle: { font: 'Roboto', fontSize: 11 } };
  }

  // ---------------- Corrigé : paysage, compact, tient sur une page -------
  function problemCellCorrige(p, jourIdx, num) {
    return {
      stack: [
        { text: num + '. ' + p.enonce, bold: true, fontSize: 9.5, margin: [0, 3, 0, 2] },
        buildSchemaPdf(p),
        { text: 'Calcul : ' + p.calcul, fontSize: 9, margin: [0, 2, 0, 0] },
        { text: 'Réponse : ' + p.reponse, bold: true, color: JOUR_HEX[jourIdx], fontSize: 10.5 },
      ],
    };
  }

  function jourBandCorrige(jourIdx, problems) {
    var col1 = Object.assign({ width: '50%', fillColor: JOUR_HEX_LIGHT[jourIdx], margin: [6, 4, 6, 4] }, problemCellCorrige(problems[0], jourIdx, 1));
    var col2 = Object.assign({ width: '50%', fillColor: JOUR_HEX_LIGHT[jourIdx], margin: [6, 4, 6, 4] }, problemCellCorrige(problems[1], jourIdx, 2));
    return [
      { text: 'JOUR ' + (jourIdx + 1), bold: true, color: 'white', fillColor: JOUR_HEX[jourIdx], fontSize: 11, alignment: 'center', margin: [6, 2, 6, 2] },
      { columns: [col1, col2], columnGap: 3, margin: [0, 0, 0, 4] },
    ];
  }

  function buildCorrigePdf(joursProblems, meta) {
    var content = bannerBlock(meta, true);
    for (var j = 0; j < 4; j++) content = content.concat(jourBandCorrige(j, joursProblems[j]));
    return { pageOrientation: 'landscape', pageSize: 'A4', pageMargins: [MARGIN_1CM, MARGIN_1CM, MARGIN_1CM, MARGIN_1CM], content: content, defaultStyle: { font: 'Roboto', fontSize: 9 } };
  }

  function downloadPdf(docDefinition, filename) {
    pdfMake.createPdf(docDefinition).download(filename);
  }

  global.IEP1ExportPdf = { buildFicheElevePdf: buildFicheElevePdf, buildCorrigePdf: buildCorrigePdf, downloadPdf: downloadPdf };
})(window);
