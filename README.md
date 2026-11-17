# Mon Atelier IA · V2.0

Un atelier personnel pour organiser les projets menés avec ChatGPT et Claude : dix postes de travail, un dossier commun et un suivi clair des tâches, décisions, fichiers et versions.

## Démarrer sur ordinateur

Télécharger les fichiers du dépôt, décompresser le dossier, puis ouvrir **index.html** dans Chrome, Edge ou Firefox. Garder `styles.css`, `core.js`, `github.js` et `app.js` à côté de `index.html`.

Aucune installation ni API IA payante n’est nécessaire pour utiliser l’application. GitHub nécessite une connexion Internet. Les échanges avec les IA se font par copie du contexte et ajout manuel des pièces jointes.

## Récupérer les données de la V1

1. Dans l’ancienne version, ouvrir **Sauvegarde → Exporter la sauvegarde JSON**.
2. Conserver ce JSON et l’ancienne application pendant la mise à jour.
3. Ouvrir la V2. Si le navigateur retrouve les données de la V1, elles sont migrées automatiquement ; une copie des textes avant migration est conservée.
4. Si la V2 affiche les projets d’exemple, ouvrir **Sauvegardes → Importer une sauvegarde**, puis choisir le JSON exporté de la V1.
5. Vérifier ses projets, prompts et comparaisons, puis exporter une nouvelle sauvegarde complète.

Le stockage des pages ouvertes directement depuis un fichier dépend du navigateur et du chemin du fichier. L’import JSON est la voie fiable pour changer de dossier, de navigateur ou d’ordinateur. Les données personnelles déjà saisies dans le navigateur ne sont pas contenues dans ce dépôt.

## Organiser un projet

Le **Pilotage** présente le travail à faire, les résultats à vérifier, les blocages et les décisions importantes. Les dix **Postes de travail** couvrent pilotage, recherche, usages, design, contenus, médias, programmation, tests, livraison et optimisation.

Une tâche indique son objectif, son poste, son intervenant, les éléments à consulter, son résultat attendu, ses critères de vérification et les résultats observés. Son état suit le parcours **À préparer → Prêt → En cours → À vérifier → Terminé**. Les dépendances et blocages restent visibles.

Le **Dossier commun** rassemble le contexte, les règles, les documents de référence et les fichiers originaux. Une image est suivie séparément comme **à valider, validée, intégrée, vérifiée en place**. L’application ne réduit pas les fichiers ajoutés.

Dans **Transmissions IA**, choisir le poste, la tâche, l’IA destinataire et le niveau de contexte. Copier la mission dans l’IA, puis reporter le résultat dans la tâche. Les propositions et décisions validées restent distinguées dans le journal.

## Dossier commun sur l’ordinateur

L’export ZIP d’un projet contient `DOSSIER_COMMUN.md`, un `projet.json` réimportable et les originaux disponibles dans `pieces-jointes/`. Dans les navigateurs compatibles, l’onglet **Dossier sur l’ordinateur** permet aussi de sélectionner un dossier et d’y enregistrer le projet, manuellement ou après chaque modification. Cet accès est à réassocier après fermeture de la page.

L’atelier crée ses propres sous-dossiers sous `mon-atelier-ia/`. Les copies automatiques du navigateur conservent les textes et références ; une sauvegarde JSON complète inclut les originaux disponibles. Les fichiers absents sont explicitement signalés dans l’export.

## GitHub

Dans chaque projet, ouvrir **GitHub**, indiquer `propriétaire/dépôt` ou son URL, puis **Associer le dépôt** et **Vérifier l’accès**.

- Consultation des dépôts publics et de leurs fichiers sans jeton.
- Choix du dépôt parmi les dépôts accessibles.
- Lecture des issues ouvertes et ajout aux tâches avec détection des doublons.
- Lecture du dossier commun distant et reprise de ses documents et décisions.
- Envoi du dossier commun après aperçu du contenu, du dépôt, de sa visibilité et de la branche.
- Vérification du fichier distant avant écriture ; un conflit bloque l’envoi.

Pour lire un dépôt privé ou écrire, ouvrir une session dans l’atelier avec un **jeton personnel GitHub à accès limité**. Le limiter aux dépôts utiles : **Contents: read** pour lire, **Contents: read and write** pour envoyer le dossier ; ajouter **Issues: read** pour consulter les issues privées. Le jeton reste en mémoire et est oublié à la fermeture ou à la déconnexion. Il n’est pas enregistré dans les sauvegardes.

Le partage du dossier écrit par défaut `.atelier-ia/dossier-commun.json`. Il partage les objectifs, documents, décisions et références des médias. Les fichiers binaires restent dans le dossier local et le ZIP. Fermer une tâche dans l’atelier ne ferme pas son issue GitHub. L’atelier ne déploie pas automatiquement le code du projet.

## Le dossier de ce projet

Les documents du projet Mon Atelier IA sont dans [dossier-commun](dossier-commun/). Pour les retrouver dans l’application, utiliser **Sauvegardes → Ajouter un projet exporté** et sélectionner `dossier-commun/mon-atelier-ia.projet.json`. Les autres projets seront conservés.

## Vérifications

25 tests automatisés passent : migration V1, parcours simulés, fichiers, restauration, contextes, tâches, comparaisons et protections GitHub. La lecture réelle du dépôt public Dragon de Jade a aussi été vérifiée. Les écritures GitHub et la sélection d’un dossier ont été testées par simulation. L’affichage et les permissions réelles sur le PC restent à vérifier : voir [VERIFICATIONS.md](VERIFICATIONS.md).

L’application n’a aucune dépendance à installer. Les dépendances présentes dans `tests/package.json` servent uniquement à rejouer les tests : depuis `tests/`, exécuter `npm install`, puis `npm test` avec Node.js 24.

## Références techniques vérifiées

- [API officielle GitHub : contenu des dépôts](https://docs.github.com/en/rest/repos/contents)
- [GitHub : jetons personnels](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [MDN : stockage local et comportement des fichiers locaux](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [MDN : sélection d’un dossier](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker)
