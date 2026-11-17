# V3.2 — phase 3 : confort et optimisation

17 novembre 2026. Base : V3.1 publiée, `c6d1b70`. Branche de développement : `v3.2-phase-3`.

## Changements

- Mode débutant par défaut : navigation essentielle, outils complémentaires regroupés, options de fiches et contexte repliables, liste verticale des états de tâches non vides.
- Mode avancé : tous les outils directement accessibles, options déployées, tableau de tâches et tableau de bord détaillé. Les fonctions et données sont identiques entre les modes.
- Préférence globale persistante incluse dans la sauvegarde complète, sans changer la clé de stockage, le schéma 3 ou la base des fichiers. Les sauvegardes anciennes s’ouvrent en mode débutant sans perte de contenu.
- Navigation « Aller à » et retour à l’accueil sur toutes les pages du projet ; lien actif et groupe complémentaire ouvert pour les accès directs ; focus du contenu lors d’un changement de page.
- Nouvelle page Bilans des IA, par projet/poste/IA : seules les missions avec résultat, état de réussite et date valide alimentent les résultats. Moyennes sur les seules missions évaluées et notées ; dénominateurs et missions exclues visibles, faible échantillon signalé.
- Évaluations modifiables et consignes consultables. Les missions en attente et anciennes notes sans évaluation datée restent conservées et accessibles par filtre. Retour en attente : retrait du bilan, contenu conservé.
- Export Markdown du bilan évalué filtré avec identifiants, dates, résultats et commentaires pour permettre sa vérification. Même règle appliquée aux bilans des postes. Aucune recommandation ou hiérarchie automatique entre les IA.
- Enregistrement d’une appréciation Réussi/Partiel/Non satisfaisant refusé si aucun résultat n’est décrit. Une note seule ne devient pas une preuve de réussite.

## Tests et vérifications

- **43 tests réussis**, dont les 38 contrôles V3.1 conservés.
- Nouveaux contrôles : normalisation des préférences et données anciennes, exclusion des missions non évaluées et dates invalides, moyennes et dénominateurs, filtre poste/IA et export vérifiable, changement de mode avec valeurs repliées conservées, navigation vers tous les outils, sauvegarde/restauration du mode, création/correction/retrait d’une évaluation.
- Syntaxe de core.js, app.js et github.js ; `git diff --check`.
- Navigateur réel sur aperçu local : changement Débutant → Avancé → Débutant, navigation rapide vers Transmissions et Bilans, contexte déployé en mode avancé, archivage et évaluation d’une mission fictive.
- Bilan observé : ChatGPT 1 mission évaluée/1 archivée, 1 réussite, 4/5 sur 1 avis ; Claude 0 mission évaluée et aucune note exploitable. Vérification visuelle de la navigation et de l’écran de bilan sur ordinateur.

## Limites

Les bilans décrivent les avis saisis par l’utilisateur sur le projet actif. Ils ne mesurent pas objectivement les capacités d’une IA, ne compensent pas la difficulté différente des missions et ne justifient pas un classement global. Les recommandations statiques des postes restent inchangées.

Les anciennes notes sans résultat, état de réussite ou date valide restent hors calcul jusqu’à leur relecture et nouvel enregistrement. Une évaluation de mission ne valide pas automatiquement la tâche correspondante.

Le mode est global à l’atelier ; les ouvertures manuelles de volets ne sont pas mémorisées indépendamment du mode. La préparation de livraison et les fonctions GitHub restent celles de V3.1. Les bilans et préférences ne sont partagés que par les sauvegardes complètes, pas par le dossier commun de référence.

Les essais réels ont utilisé des données fictives locales. Téléphone, Firefox/Edge, lecteur d’écran et dossier Windows réel non testés. Les parcours automatisés utilisent Happy DOM ; ils ne remplacent pas tous les essais d’accessibilité et de mise en page.

## Fichiers modifiés

core.js : version, préférences, critères d’évaluation, filtres, statistiques et export de bilan.
app.js : modes, volets, navigation, affichage des tâches, page de bilan et formulaire d’évaluation.
index.html, styles.css : sélecteur de mode, version et présentation.
tests/core.test.cjs, tests/parcours.test.cjs : cinq nouveaux tests V3.2.
README.md et ce rapport : prise en main et limites.
