/*
 * Génère une image "lignes Seyès" (grille d'aide à l'écriture) pour les
 * zones vierges Calcul / Réponse des fiches élève — utilisée en image
 * (docx.js et pdfmake n'ont pas de motif de fond répétable dans une
 * cellule de tableau).
 */
(function (global) {
  'use strict';

  function buildLinedPaperCanvas(w, h) {
    var canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    var step = Math.max(10, Math.round(h / 14)); // ~ interligne
    var col = 0;
    for (var y = step; y < h; y += step) {
      col++;
      ctx.strokeStyle = (col % 4 === 0) ? '#8FB3D6' : '#CFE0F0';
      ctx.lineWidth = (col % 4 === 0) ? 1.4 : 0.8;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
      ctx.stroke();
    }
    var vstep = step * 4;
    ctx.strokeStyle = '#E3EDF7';
    ctx.lineWidth = 0.7;
    for (var x = vstep; x < w; x += vstep) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
      ctx.stroke();
    }
    return canvas;
  }

  function dataURLToUint8Array(dataURL) {
    var base64 = dataURL.split(',')[1];
    var binary = atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  var W = 900, H = 260;
  var _dataURL = null;
  function linedPaperDataURL() {
    if (!_dataURL) _dataURL = buildLinedPaperCanvas(W, H).toDataURL('image/png');
    return _dataURL;
  }
  function linedPaperBytes() {
    return dataURLToUint8Array(linedPaperDataURL());
  }

  global.IEP1LinedPaper = {
    dataURL: linedPaperDataURL,
    bytes: linedPaperBytes,
    NATIVE_WIDTH: W,
    NATIVE_HEIGHT: H,
  };
})(window);
