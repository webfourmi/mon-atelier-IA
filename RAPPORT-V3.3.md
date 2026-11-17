# Mon Atelier IA V3.3 — mémoire et vérifications

17 novembre 2026. Base : V3.2.1 publiée, `4541a64`. Branche dédiée : `v3.3-project-memory`.

## Changements réalisés

A. Mémoire en cinq rubriques : cahier des charges initialisé depuis le contexte historique, décisions validées existantes, registre des fonctionnalités, problèmes connus et travaux à venir reliés aux tâches. Édition des fonctions/zones/contrôles et des problèmes ouverts ou résolus.

B. Plans de régression préparés localement pour les tâches de modification, selon modèle, mots-clés et fonctions liées. États À vérifier/Réussi/Échec/Non réalisé avec observations. Les preuves deviennent périmées après changement du résultat ou du registre ; les confirmations de préparation prennent aussi en compte ces preuves.

C. Import par collage, fichier texte/Markdown/JSON ou dépôt de fichier : extraction par rubriques, aperçu éditable, confirmation obligatoire et tâches suivantes facultatives, dédoublonnées et liées à leur source. La réponse source est conservée lorsqu’elle diffère du résultat. Aucun résultat ni test n’est déclaré validé automatiquement.

D. Quatre modèles spécialisés et un modèle général, postes recommandés, critères de nouvelles tâches et repères de prompt adaptés. Tous les postes et tâches antérieurs sont conservés. La consigne reste centrée sur la tâche : pas d’ajout automatique de toute la mémoire.

E. Historique déclaré des versions publiées : nouveautés, fichiers, tests, problèmes, date, lien GitHub et instantané des textes/références sans récursion d’historique. Comparaison des versions postérieures à la référence choisie, export de l’état et lien vers le commit/tag/version. Confirmation de publication effective avant enregistrement et refus des doublons de numéro.

F. Tableau de cohérence relié à la préparation de livraison : tâches/prérequis, régressions sans preuves, références de fichiers absentes, originaux manquants, intégration GitHub non confirmée et problèmes connus. Lecture des originaux dans IndexedDB et consultation des PR du dépôt associé, sans écriture GitHub. Les problèmes non bloquants restent visibles ; les éléments bloquants empêchent l’indication « Dossier prêt ».

## Préservation et échanges

Clé de stockage, schéma 3, originaux, sauvegardes, modes et fonctions précédentes conservés. Les nouvelles données sont additionnelles. Les anciens documents/contextes ne sont pas supprimés. Les références de fonctions ne sont pas inventées à partir de tâches terminées ou de réponses IA.

La mémoire et les données de régression des livrables validés accompagnent le partage du dossier commun. Les entrées locales existantes gardent la priorité lors d’une reprise portant le même identifiant. Les historiques/instantanés et réponses sources restent dans les sauvegardes complètes. La présence des originaux doit être relue dans chaque nouvelle session ; une ancienne preuve de présence reste datée et ne suffit pas seule.

## Vérifications

**59 tests réussis** : les 45 contrôles précédents conservés (le scénario de préparation utilise désormais des preuves de régression et d’intégration explicites), neuf tests de logique et cinq nouveaux parcours V3.3.

Contrôles : migration/idempotence, mémoire partagée sans écrasement local, modèles sans réécriture des tâches, correspondance mots-clés/fonctions, remise à faire des preuves, prompt de tâche limité, extraction texte et JSON, import confirmé sans validation implicite, dédoublonnage, fichiers manquants, intégration GitHub, snapshots et comparaison depuis V0.10, sauvegarde/restauration de l’historique et persistance/réinitialisation des preuves.

Syntaxe de core.js, planning.js, github.js et app.js ; `git diff --check`.

Navigateur réel sur aperçu local avec données fictives : sélection du modèle pédagogique, ajout d’une fonction du carnet, création d’une mission, collage et aperçu d’une réponse, correction des champs extraits, confirmation d’un résultat et d’une seule tâche suivante. Observation du statut Travail rendu et des contrôles encore à faire. Plan du carnet : recherche, sauvegarde, révisions, navigation et deux vérifications propres à la fonction. Pages Mémoire, Historique et préparation examinées visuellement sur ordinateur.

## Limites précises

- Régression : préparation de listes et suivi de preuves personnelles, pas exécution automatique des tests ni analyse du code distant. Les correspondances par mots-clés doivent être relues.
- Import : extraction locale par titres de rubriques ou clés JSON ; pas de compréhension sémantique garantie. Formats .txt/.md/.json uniquement, 2 Mo maximum ; PDF/Word non pris en charge. L’utilisateur corrige l’aperçu. Les tests déclarés par une IA ne deviennent pas des contrôles réussis.
- Modèles : conseils de postes/critères, sans remplacement des dix postes ni migration automatique des tâches anciennes.
- Historique : versions consignées à partir de publications réelles, sans reconstitution rétroactive automatique des versions GitHub. Un instantané contient les textes et références, pas une ancienne copie des fichiers binaires ou du code. Pas de restauration/déploiement automatique.
- GitHub : métadonnées de 30 PR maximum du dépôt associé ; fusion vers sa branche par défaut. Les branches sans PR et erreurs de lecture restent non confirmées. Une PR fusionnée ne prouve pas que la description du livrable correspond exactement au code.
- Les anciens originaux ne sont pas téléchargés à partir de liens. Les fichiers introuvables sont signalés. Les historiques consomment du stockage local ; les exports complets conservent les données disponibles et les erreurs de quota restent signalées.
- Mobile, autres navigateurs, sélection réelle d’un dossier Windows et dépôt de fichier par glisser-déposer physique non testés. Le chargement d’un fichier a été testé dans le navigateur simulé ; collage/import/confirmation ont été testés dans le navigateur réel.

## Fichiers

planning.js : modèles, mémoire, régression, import, cohérence, historique et adaptation ciblée des prompts/exports.
core.js : version, données additionnelles, normalisation stable et signature de préparation.
app.js : vues, formulaires, import et contrôles.
index.html : chargement du module et entrée de fichier, repère V3.3.
tests/planning.test.cjs, tests/core.test.cjs, tests/parcours.test.cjs, tests/package.json : vérifications.
README.md et ce rapport : utilisation, changements et limites.
