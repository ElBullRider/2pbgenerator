# Brief de reprise — "Deux challenges par jour" (générateur de problèmes, tous cycles)

## 🎯 Objectif final (important — ne pas se limiter à ce qui existe déjà)
Ce qui a été construit jusqu'ici (CM1 seul, un fichier HTML unique) n'est qu'une **première
brique de test**. L'objectif réel du projet est plus large :

1. **Tous les cycles / niveaux** : CP, CE1, CE2, CM1, CM2 — pas seulement CM1.
2. **Une vraie petite application / site**, pas juste un fichier HTML isolé ni un prompt à
   relancer à chaque fois pour régénérer quelque chose. Préférence claire pour une
   architecture **site web ou application** avec plusieurs pages/écrans :
   - une **page de présentation** (accueil du projet, explique l'outil)
   - une **page générateur** (sélection niveau/période/semaine/problèmes — l'existant)
   - une **page de corrigé illustré** (le corrigé enseignant, avec de vrais schémas
     visuels soignés — pas juste des blocs de texte simplifiés comme dans la version
     actuelle, mais quelque chose qui se rapproche du modèle dessiné à la main d'origine)
   - une **page de suivi des évaluations** des élèves (au-delà d'un simple `localStorage`
     dans un fichier : réfléchir à un vrai stockage — base de données locale, fichiers
     JSON structurés dans le projet, ou autre solution robuste et pérenne)
3. **Logistique de stockage** : le besoin exprimé est d'avoir les données (problèmes,
   corrections, suivi élèves) stockées de façon fiable et réutilisable dans le projet
   lui-même (fichiers/BDD gérés par l'app), plutôt que de dépendre d'un prompt qu'il
   faudrait relancer à chaque fois pour reproduire le même résultat. Toujours viser un
   usage **hors-ligne** pour les enseignants (pas de dépendance à un serveur distant
   pour l'usage quotidien), même si l'outil de développement (Claude Code) travaille
   en ligne.

**En clair pour Claude Code** : ne pars pas du principe que "CM1 avec un fichier HTML
unique" est la cible. C'est un prototype validé sur un sous-ensemble. Le travail à
poursuivre est l'extension aux 5 niveaux + la restructuration en vraie petite application
multi-pages avec un stockage propre.

**Tu es libre de restructurer complètement le code existant si l'architecture cible le
justifie.** Ce qu'il faut récupérer et ne pas refaire de zéro, ce sont les *données*
(300 problèmes CM1 déjà extraits et vérifiés) et la *logique* qui fonctionne (génération
docx sans dépendance internet, structure pédagogique par catégorie Vergnaud) — pas
nécessairement le découpage technique en un seul fichier HTML avec tout inline.

---

## 🧰 Skills GitHub à mobiliser
Le dépôt officiel Anthropic **github.com/anthropics/skills** contient des "Agent Skills"
directement utilisables dans Claude Code pour ce projet. Pour les activer :
```
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
/plugin install example-skills@anthropic-agent-skills
```
Skills particulièrement pertinents ici :
- **`docx`** — génération/édition de fichiers Word en Python (`python-docx`), plus robuste
  et plus facile à maintenir que la bibliothèque `docx.js` embarquée à la main dans le
  prototype actuel. À utiliser si l'app finale génère les fichiers côté script/serveur
  plutôt que dans le navigateur.
- **`pdf`** — si on préfère finalement livrer un PDF directement plutôt qu'un `.docx`
  (pas de dépendance à Word pour l'enseignant).
- **`frontend-design`** — pour construire les pages du site/application (présentation,
  générateur, corrigé illustré, suivi) avec une vraie cohérence visuelle plutôt que du
  CSS assemblé à la main.
- **`web-artifacts-builder`** / **`webapp-testing`** — pour construire et surtout **tester
  réellement dans un navigateur** (justement ce qui a manqué ici) la partie interactive
  de l'application.
- **`canvas-design`** / **`theme-factory`** — utile pour la page de corrigé illustré, si
  on veut des schémas en barre vraiment soignés plutôt que les blocs simplifiés actuels.

Claude Code peut s'en inspirer ou les installer directement — je lui laisse juger ce qui
est le plus adapté une fois qu'il aura vu le code existant.

---

## Contexte du projet (détail de l'existant)
Outil pour un enseignant du primaire (France, cycle 3) : génère chaque semaine une fiche
de 8 problèmes de maths (2/jour × 4 jours) pour les élèves de CM1, + le corrigé enseignant,
au format Word (.docx), téléchargeable directement, **100% hors-ligne** (aucune dépendance
internet — les enseignants n'ont pas de connexion).

À terme : étendre à CP, CE1, CE2, CM2 (actuellement CM1 uniquement). Typologie de
problèmes basée sur Vergnaud (partie/tout, transformation, comparaison, proportionnalité...).

## Fichier principal
`Generateur_CM1.html` — fichier HTML unique, autonome, ~1,2 Mo. Contient :
1. Les données (300 problèmes CM1 : 30 semaines × 10 problèmes, en JSON inline)
2. La bibliothèque `docx.js` + `FileSaver.js` embarquée en dur (bundle IIFE, pas de CDN)
3. Toute la logique JS (sélection, verrouillage, génération du document)

Fichiers annexes fournis dans ce dossier :
- `donnees_CM1_30semaines.json` — les données brutes (même contenu que dans le HTML,
  utile pour les manipuler séparément)
- `Ancien_generateur_CM1-CM2.html` — une version antérieure (CM1+CM2, structure de base
  8 problèmes/semaine, sans les schémas/explications) gardée comme référence si besoin
  de retrouver du code ou des données déjà validées

## Structure des données (par problème)
```json
{
  "cat": "T",                     // code Vergnaud (T, P, EF+, EF-, TR+, CE+, Pro, ProX, ...)
  "enonce": "texte du problème...",
  "calcul": "65 + 80 = 145",
  "reponse": "145 euros",
  "explication": "On additionne les parties connues pour trouver le tout.",
  "schema": { "known": ["65","80"], "unknown": "145", "full_calcul": "65 + 80 = 145" },
  "bonus": true   // présent seulement sur les 2 problèmes "bonus" ajoutés pour arriver à 10
}
```
Organisation : `DATA[periode][semaine].CM1` = tableau de 10 objets ci-dessus.
`DATA[periode][semaine].ref` = texte de la typologie de référence de la semaine.

**Origine des données** : les 8 problèmes "de base"/semaine (240 au total) viennent d'une
session Claude antérieure et étaient déjà relus. Les 2 problèmes "bonus"/semaine (60 au
total, champ `bonus:true`) ont été extraits du PDF source `2pb_par_jour_C3.pdf` et leurs
calculs/réponses **calculés par Claude cette session, vérifiés arithmétiquement mais pas
relus par un enseignant** — à faire relire avant diffusion large si possible.

## Ce qui fonctionne (vérifié)
- Sélection Période/Semaine → affichage des 10 problèmes avec case à cocher, nom de
  catégorie en toutes lettres (ex. "Partie/Tout — recherche du Tout"), 8 cochés par défaut
- Verrouillage : les boutons de téléchargement restent désactivés tant que ce n'est pas
  exactement 8 problèmes cochés
- Génération du `Document` docx.js (mise en page paysage, 2 pages recto-verso : Jour1-2 /
  Jour3-4, couleurs par jour, cases vides pour l'élève, schéma+calcul+réponse+explication
  pour le corrigé, bandeau "Je vérifie mon travail" en bas) : **construction du document
  testée et validée sans erreur** via un script Node/jsdom
- Onglet "Suivi des élèves" : ajout d'élèves, saisie de résultats par semaine, tableau
  d'évolution, export/import JSON — basé sur `localStorage`

## ⚠️ Ce qui N'A PAS pu être vérifié (priorité n°1 pour Claude Code)
Le tout dernier maillon — `docx.Packer.toBlob()` / `saveAs()` déclenchant le vrai
téléchargement du fichier — **n'a pas pu être testé** car mon environnement sandbox n'a
qu'un simulateur de navigateur (jsdom) sans support complet des API navigateur (Blob/Worker)
dont dépend la compression zip interne du docx. La construction du `Document` fonctionne,
mais le clic réel sur "Télécharger" n'a jamais été essayé dans un vrai Chrome/Firefox/Edge.

→ **Premier réflexe dans Claude Code** : ouvrir le fichier dans un vrai navigateur (ou
demander à Claude Code de le faire via un outil headless réel s'il en a un), cliquer sur
les boutons de téléchargement, et vérifier que le `.docx` produit s'ouvre correctement
dans Word (mise en page paysage, couleurs, tableaux, texte lisible).

## Historique des demandes déjà traitées (pour ne pas revenir en arrière)
1. Génération de fiches par période/semaine, niveau CM1 ✅
2. Sélection 10 → 8 problèmes avec verrouillage ✅
3. Noms de catégories en toutes lettres (pas de code abrégé) ✅
4. Suivi des élèves intégré (pas de fichier Excel séparé) ✅
5. Format paysage + couleurs + téléchargement direct .docx (pas de boîte d'impression) ✅
6. Bloc auto-correction élève en bas de fiche ✅

## Pistes / demandes en attente (pas encore faites)
- Vérifier réellement le téléchargement `.docx` en navigateur (voir ci-dessus, urgent,
  à faire en tout premier pour ne pas construire la suite sur une base cassée)
- **Restructurer en vraie application multi-pages** (présentation / générateur / corrigé
  illustré / suivi) avec un stockage de données propre — voir section "Objectif final"
  en haut de ce document. C'est la priorité de fond du projet, au-delà des correctifs.
- **Étendre aux niveaux CP, CE1, CE2, CM2** (structure de données prête pour CM1, à
  reproduire) : extraire les problèmes des PDF `2pb_par_jour_C1.pdf` (cycle 1) et
  `2pb_par_jour_C2.pdf` (cycle 2, pour CP/CE1/CE2), et compléter CM2 pour le cycle 3 —
  le CM2 a déjà ses 8 problèmes/semaine de base dans l'ancien fichier, mais pas les 2
  bonus ni les schémas/explications
- Schémas encore simplifiés (blocs de nombres connu→inconnu) plutôt que les vraies barres
  proportionnelles dessinées à la main du modèle d'origine (`P3S3_CM1_correction.png`) —
  à retravailler pour la "page de corrigé illustré"
- Les 60 problèmes "bonus" CM1 à faire relire par un enseignant

## Fichiers sources originaux (dans le Project Claude.ai, pas forcément dans Claude Code)
Si tu relances ce travail dans Claude Code, pense à uploader aussi ces fichiers sources
dans le nouveau projet si tu veux qu'il puisse étendre aux autres niveaux :
- `2pb_par_jour_C1.pdf`, `2pb_par_jour_C2.pdf`, `2pb_par_jour_C3.pdf` (banques de
  problèmes officielles DSDEN38, par cycle)
- `P3_S3_CM1.pdf` / `P3_S3_CM2.pdf` + `P3S3_CM1_correction.png` / `P3_S3_CM2_correction.png`
  (modèles de mise en page cible, élève et corrigé)
- `Suivi_problemes_cycle3.xlsx` (ancien outil de suivi Excel, remplacé par l'onglet intégré)

## Suggestion de premier message à donner à Claude Code
> Voici un projet d'outil pour un enseignant du primaire : générer chaque semaine des
> fiches de problèmes de maths (élève + corrigé illustré) pour CP, CE1, CE2, CM1 et CM2,
> plus un suivi des évaluations des élèves. Lis `BRIEF_Claude_Code.md` pour le contexte
> complet — l'objectif final est une vraie petite application/site (page de présentation,
> générateur, corrigé illustré, suivi), pas juste le fichier HTML CM1 fourni qui n'est
> qu'un prototype validé sur un seul niveau. Étape 1 : vérifie que le téléchargement du
> fichier Word du prototype actuel fonctionne réellement dans un navigateur. Étape 2 :
> proposons ensemble une architecture pour la vraie application avant de coder la suite.
