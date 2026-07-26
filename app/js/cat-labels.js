/* Libellés des catégories Vergnaud (repris de Generateur_CM1.html) */
(function (global) {
  'use strict';
  var CAT_LABELS = {
    'T': "Partie/Tout — recherche du Tout",
    'P': "Partie/Tout — recherche de la Partie",
    'EF+': "Transformation — état final (+)",
    'EF-': "Transformation — état final (−)",
    'EF+/EF-': "Transformation — état final (+ ou −)",
    'EI+': "Transformation — état initial (+)",
    'EI-': "Transformation — état initial (−)",
    'TR+': "Transformation — recherche de la transformation (+)",
    'TR-': "Transformation — recherche de la transformation (−)",
    'TT': "Transformation — transformations composées",
    'C': "Comparaison — connaissant les 2 états",
    'CE': "Comparaison — recherche d'un état",
    'C+': "Comparaison (+)",
    'C-': "Comparaison (−)",
    'CE+': "Comparaison — recherche d'un état (+)",
    'CE-': "Comparaison — recherche d'un état (−)",
    'CE+*': "Comparaison à traduire (+)",
    'CE-*': "Comparaison à traduire (−)",
    'CEx*': "Comparaison multiplicative à traduire",
    'CEx': "Comparaison multiplicative — recherche d'un état",
    'Cx+': "Comparaison multiplicative (fois plus)",
    'Cx-': "Comparaison multiplicative (fois moins)",
    'MA': "Multiplication — addition réitérée",
    'MR': "Multiplication — disposition rectangulaire",
    'DV': "Division — recherche de la valeur de la part",
    'DN': "Division — recherche du nombre de parts",
    'Pro': "Proportionnalité",
    'Pro+': "Proportionnalité — linéarité additive",
    'ProX': "Proportionnalité — linéarité multiplicative",
    'ProU': "Proportionnalité — retour à l'unité",
  };

  function catLabel(code) {
    if (CAT_LABELS[code]) return CAT_LABELS[code];
    var prefix = Object.keys(CAT_LABELS).find(function (k) { return code && code.indexOf(k) === 0; });
    return prefix ? CAT_LABELS[prefix] + ' (' + code + ')' : code;
  }

  global.IEP1CatLabels = { CAT_LABELS: CAT_LABELS, catLabel: catLabel };
})(window);
