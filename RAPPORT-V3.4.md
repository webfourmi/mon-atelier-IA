# V3.4 — équipes IA par type de tâche

17 novembre 2026. Base : V3.3 publiée, `987bb3c`. Développement sur `v3.4-ai-workflows` avant fusion.

## Réalisé

- Bibliothèque globale de circuits réutilisables : création, duplication, modification, archivage/restauration, filtre par type. Quatre exemples modifiables couvrent développement, correction, rédaction et médias.
- Éditeur de 1 à 10 étapes, titres, postes, ChatGPT/Claude/Moi, consignes, livrables et critères indépendants. Ajout, retrait et réordonnancement sans perdre les champs déjà saisis.
- Aperçu avant confirmation : aucune tâche créée lors de la préparation. La confirmation génère les étapes et leurs dépendances séquentielles. Double confirmation du même aperçu refusée.
- Application à une nouvelle demande ou première étape reprise depuis une tâche non commencée. La fiche source et ses fichiers/prérequis sont conservés ; poste, IA et livrable sont adaptés et critères complétés, avec copie de la fiche antérieure. Sources ayant commencé ou possédant résultat/preuve/mission archivée exclues ; aperçu périmé refusé.
- Suivi des équipes dans chaque projet, ouverture des tâches, préparation du prompt et réutilisation d’une copie du circuit utilisé. Les modifications du modèle ne modifient pas les étapes existantes.
- Destinataire de transmission fondé sur l’intervenant de la tâche, avec indication du circuit. Deux IA peuvent travailler successivement sur le même poste.
- Prompt limité à l’étape et au résultat validé de l’étape précédente du même circuit. Aucune référence au résultat non validé ; extrait signalé au-delà de 6 000 caractères. Aucun ajout automatique du dossier entier.
- Suggestions générales suspendues pour les étapes intermédiaires afin de ne pas concurrencer le circuit prévu. Dépendances, validation, régressions et bilans des missions restent ceux des tâches existantes.
- Bibliothèque conservée dans la sauvegarde complète ; copies des équipes et de leurs circuits conservées dans les projets exportés. Liens de fichiers des étapes/fiches d’origine remappés à la restauration des pièces jointes.

## Vérifications

**69 tests réussis**, dont les 59 contrôles précédents et dix nouveaux contrôles : bibliothèque initialisée une fois, conservation d’une bibliothèque personnalisée ou vide, normalisation et refus des étapes invalides, aperçu sans mutation, création confirmée unique, dépendances, préservation de source et refus d’aperçu périmé, exclusion des tâches commencées, IA distinctes sur un même poste, copie indépendante du modèle, relais limité au résultat validé, absence de suggestions concurrentes, édition/réordonnancement/archivage, choix effectif du destinataire, sauvegarde/restauration et associations de fichiers.

Syntaxe de core.js, planning.js, workflows.js, github.js et app.js ; `git diff --check`.

Navigateur réel sur aperçu local avec données fictives : liste des quatre circuits, sélection du circuit de développement, demande, aperçu des trois étapes, confirmation et création de l’équipe. Vérification du prompt de la deuxième étape : destinataire Claude, étape 2/3 et attente de validation de la première étape. Vue des cartes et du suivi examinée visuellement.

## Limites

- Circuits séquentiels uniquement : pas de branches conditionnelles, d’étapes parallèles ou d’exécution automatique des IA.
- ChatGPT, Claude et Moi disponibles comme intervenants. Les répartitions des exemples sont modifiables et ne constituent pas une évaluation comparative des IA.
- Les transferts, pièces jointes, résultats et validations restent manuels. Préparer un prompt à l’avance ne valide pas son prérequis et ne permet pas de démarrer/clôturer une tâche bloquée.
- Une source déjà commencée doit rester conservée ; préparer une nouvelle demande plutôt que la réaffecter rétroactivement. La copie de la fiche initiale est une référence conservée, pas une commande d’annulation automatique.
- L’export de projet conserve le circuit utilisé dans chaque équipe, pas toute la bibliothèque globale ; Réutiliser cette équipe reste possible. Le partage du dossier commun n’ajoute pas les modèles globaux ni l’état complet des équipes.
- Un résultat précédent dépassant 6 000 caractères est abrégé avec un avertissement ; il faut consulter/transmettre le résultat complet et les originaux si nécessaire.
- Mobile, autres navigateurs et exécution réelle dans les services IA non testés. Le contrôle visuel porte sur un navigateur d’ordinateur et des données fictives.

## Fichiers

workflows.js : modèles, normalisation, préparation/application et prompt d’étape.
core.js : version, bibliothèque et équipes additionnelles, suggestions adaptées.
app.js : vues, éditeur, aperçus, actions, destinataire et restauration des liens de fichiers.
index.html : chargement du module et repère V3.4.
tests/workflows.test.cjs, tests/core.test.cjs, tests/parcours.test.cjs, tests/package.json : contrôles.
README.md et ce rapport : utilisation et limites.
