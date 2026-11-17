# Mon Atelier IA V3.0 — phase 1

Date : 17 novembre 2026. Base : V2.3, commit `0425955`. Branche : `v3.0-phase-1`.

## Changements

- `app.js` : accueil en trois actions, ancienne vue détaillée repliée, génération de fiche depuis une idée, prompt lié à la tâche et à l’IA, sélection des documents, formulaire de retour de mission, contrôle des transitions, repères des tâches anciennes. Correction des boutons du dialogue pour éviter leur soumission implicite, initialisation explicite des listes et suppression des identifiants de sélection vides.
- `core.js` : version 3.0.0-phase1, schéma local 3, proposition de tâche par mots-clés, présélection des catégories de documents selon le poste, prompt pour ChatGPT ou Claude, validation et export des seuls livrables validés V3 (résultat, références de livraison, limites et preuves).
- `index.html`, `styles.css` : repère V3, vue détaillée repliable, présentation du choix des documents, tableau à six états.
- `tests/core.test.cjs`, `tests/parcours.test.cjs` : contrôles V3 ajoutés et scénarios de clôture V2 adaptés à la validation explicite. Les contrôles existants des sauvegardes, fichiers, conflits et GitHub sont conservés.
- `tests/pnpm-lock.yaml` : versions des dépendances de test verrouillées. `.gitignore` : exclusion du cache local de dépendances.
- `README.md` et ce rapport : utilisation, migration et limites documentées.

## Données et références

La clé locale et la base des originaux ne changent pas. Une copie brute pré-migration est conservée sous `atelier-ia-before-v3`. Aucune donnée du dossier commun du dépôt n’est réécrite par cette mise à jour.

Les anciennes tâches terminées gardent leurs champs et leur statut interne `done`, avec un repère de migration. Elles apparaissent à vérifier et ne sont pas comptées comme résultats validés. Leur validation V3 demande une étape de contrôle explicite. Les nouvelles tâches suivent Travail rendu → À vérifier → Validé ; le résultat, les critères, les preuves et les prérequis sont contrôlés avant validation. Modifier le contenu d’un livrable validé le retire des références et le remet à vérifier.

Les références sont calculées depuis les tâches, sans copie supplémentaire. Markdown, JSON partagé, ZIP et prompt utilisent les seuls livrables validés. Le projet complet de la sauvegarde conserve aussi toutes les tâches non validées. Les documents et décisions restent éditables comme auparavant : la nouvelle barrière porte sur les livrables des tâches. L’import d’un ancien dossier partagé conserve ses tâches sans les déclarer validées V3 et ne crée pas de doublons.

## Vérifications réalisées

- Syntaxe : `node --check core.js`, `node --check app.js`, `node --check github.js`.
- Fonctionnel : `node --test tests/core.test.cjs tests/parcours.test.cjs` : **29 tests réussis, 0 échec**.
- Navigation des dix postes et des espaces existants dans un navigateur simulé Happy DOM ; parcours idée → fiche → prompt, copie/archivage et restauration du brouillon.
- Cycle retour → contrôle → validation, blocage sans contrôle, prérequis non validé, modification après validation et migration d’une tâche terminée V2.3.
- Sélection de documents, propositions locales, isolation des références validées, partage/réimport sans doublon et conservation du résultat livré.
- Sauvegarde/restauration des pièces jointes avec vérification des octets, ZIP, export vers dossier simulé, données corrompues, quota, conflit entre fenêtres et absence de jeton dans les exports.
- GitHub avec réponses simulées : lecture, aperçu, confirmation, refus de conflit SHA, conservation des données locales et absence d’écriture implicite.
- `git diff --check`.

## Limites et décision de livraison

L’aperçu a été tenté dans le navigateur intégré à l’adresse locale du serveur, mais la connexion a expiré. Aucun contrôle visuel réel, mobile, Chrome/Edge/Firefox ni sélection réelle d’un dossier Windows n’est confirmé. Les tests Happy DOM vérifient le comportement et la navigation, pas la mise en page finale.

Le routage des idées et le choix de contexte utilisent des mots-clés et catégories, sans compréhension sémantique par IA. Le poste, l’intervenant et les critères restent à relire et modifier. Les documents sont sélectionnables ; cap, règles et références validées restent transmis selon le niveau de contexte, avec les limites de longueur existantes. Les pièces jointes et les réponses des IA se transfèrent manuellement. Aucun test d’envoi GitHub avec les données personnelles réelles n’a été effectué.

Les phases suivantes (assistant GitHub avancé, détection des tâches suivantes, modes débutant/avancé complets) ne sont pas incluses. Les fonctions GitHub existantes restent disponibles.

**Décision : conserver la branche de travail et une proposition de fusion en brouillon. Aucune fusion ni publication sur main**, en raison du contrôle visuel réel restant à faire. Conserver une sauvegarde V2.3 pour revenir à l’ancienne version ; elle ne connaît pas l’état Travail rendu.
