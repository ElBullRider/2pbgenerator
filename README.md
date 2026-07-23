# 2 problèmes par jour — Générateur de fiches CM1

Outil pour enseignant du primaire (cycle 3) : génère chaque semaine une fiche de 8
problèmes de mathématiques (2 par jour, 4 jours) pour les élèves de CM1, ainsi que le
corrigé enseignant correspondant, au format Word (`.docx`).

L'outil fonctionne **100 % hors-ligne** : aucune connexion internet n'est nécessaire pour
l'utiliser au quotidien en classe.

## Fichiers principaux

- `Generateur_CM1.html` — l'application : à ouvrir directement dans un navigateur. Contient
  les 300 problèmes CM1 (30 semaines × 10 problèmes), la génération du document Word, et le
  suivi des évaluations des élèves.
- `donnees_CM1_30semaines.json` — les données brutes des problèmes (même contenu que dans le
  HTML), utile pour les consulter ou les modifier séparément.
- `Ancien_generateur_CM1-CM2.html` — une version antérieure (CM1 + CM2) conservée comme
  référence.
- `BRIEF_Claude_Code.md` — notes de contexte détaillées sur l'état du projet et les
  prochaines étapes envisagées.

## Utilisation

1. Ouvrir `Generateur_CM1.html` dans un navigateur (double-clic sur le fichier).
2. Choisir la période et la semaine.
3. Sélectionner 8 des 10 problèmes proposés.
4. Télécharger la fiche élève et le corrigé au format Word.

## Typologie des problèmes

Les problèmes sont classés selon la typologie de Vergnaud (partie/tout, transformation,
comparaison, proportionnalité...), avec les noms de catégories affichés en toutes lettres.
