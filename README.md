# Mon Atelier IA · V3.4 — équipes IA et circuits

Un atelier personnel pour organiser les projets menés avec ChatGPT et Claude : dix postes de travail, un dossier commun et un suivi clair des tâches, décisions, fichiers et versions.

## Démarrer sur ordinateur

Télécharger les fichiers du dépôt, décompresser le dossier, puis ouvrir **index.html** dans Chrome, Edge ou Firefox. Garder `styles.css`, `core.js`, `planning.js`, `workflows.js`, `github.js` et `app.js` à côté de `index.html`.

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

Une tâche indique son objectif, son poste, son intervenant, les éléments à consulter, son résultat attendu, ses critères de vérification et les résultats observés. Son état suit le parcours **À préparer → Prêt → En cours → Travail rendu → À vérifier → Validé**. Les dépendances et blocages restent visibles.

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

## Affectation conseillée des IA (V2.1)

Chaque poste affiche une IA principale et une IA de contrôle. ChatGPT est proposé pour pilotage, recherche, usages, médias, programmation, livraison et optimisation ; Claude pour design, contenus et tests. Les transmissions sélectionnent automatiquement l'IA principale lors du choix du poste, et le bouton « Contrôle » prépare la seconde IA. L'utilisateur peut changer l'IA destinataire, et les tâches existantes conservent leur intervenant. Aucun appel d'API payant n'est nécessaire. Les données V1/V2 restent dans leur format existant.

## Historique et appréciation des IA (V2.2)

Chaque transmission archivée conserve désormais son poste, la tâche associée et l'IA destinataire. Depuis le poste ou les transmissions, « Résultat / évaluation » permet de noter le livrable, le statut (en attente, réussi, partiel, non satisfaisant), une appréciation personnelle de 1 à 5 et les corrections utiles. Les postes affichent un historique et des bilans séparés ChatGPT/Claude, sans classement automatique arbitraire. Les anciennes transmissions restent intactes et apparaissent sans poste attribué si l'ancienne sauvegarde ne le précisait pas. Le bilan est local ; aucune donnée n'est automatiquement envoyée aux IA.

## Parcours guidé V3 — phase 1

L’accueil propose **Décrire une idée**, **Reprendre** et **Vérifier**. Le tableau détaillé reste disponible dans un volet replié, et les dix postes et les outils existants restent accessibles par le menu.

1. Décrire une idée : des règles locales par mots-clés proposent un poste et son IA principale. La fiche comprend l’objectif, le livrable attendu et des critères initiaux. Ce n’est pas une analyse par une IA ; relire et ajuster la fiche avec « Relire la fiche tâche ».
2. La transmission génère un prompt selon le poste et l’IA destinataire. Les documents sont présélectionnés selon leur catégorie et le poste. Chaque document peut être inclus ou exclu. Le cap, les règles et les décisions validées accompagnent la mission ; les niveaux court, standard et complet restent disponibles. Le niveau court exclut les documents. Les choix sont conservés pour le projet, et recalculés au changement de poste ou de tâche.
3. Copier le prompt et le coller dans ChatGPT ou Claude. Les pièces jointes doivent toujours être ajoutées manuellement. Aucun appel à une API IA payante.
4. Depuis la tâche, ouvrir **Retour de mission guidé** : résultat reçu, fichiers/liens/commits, vérifications, limites. L’enregistrement place la tâche en **Travail rendu**.
5. Ouvrir la tâche, contrôler les critères et choisir **À vérifier**, enregistrer, puis choisir **Validé** dans une seconde action. Résultat, critères et preuves sont obligatoires ; les blocages et prérequis non validés empêchent la validation.
6. Seules les tâches validées en V3 alimentent les livrables de référence du dossier commun, les prompts, le Markdown et le JSON partagé GitHub. Un résultat modifié après validation retourne à **À vérifier**. Une nouvelle saisie dans le retour guidé revient à **Travail rendu**.

Les documents et décisions du dossier restent modifiables comme en V2 ; la barrière de validation porte sur les livrables de tâches. Une évaluation de transmission dans l’historique ne valide pas une tâche.

## Migration V2.3 et sauvegardes

La clé de stockage `atelier-ia-v1` et le stockage des fichiers restent identiques. Le schéma local devient 3. Une copie du JSON avant migration est conservée sous `atelier-ia-before-v3`. Les projets, tâches, prompts, comparaisons, fichiers et champs existants restent conservés. Les anciennes tâches « Terminé » gardent leur état et leur contenu, avec le repère **Ancienne tâche terminée · à revérifier**. Elles sont visibles dans Vérifier et dans le tableau des tâches, mais exclues des références jusqu’à leur validation explicite en V3.

Pour ces tâches anciennes : compléter le résultat reçu et ses vérifications, passer à **À vérifier**, enregistrer, puis valider. Les prérequis anciens doivent aussi être revérifiés. Importer un dossier partagé V2 ne transforme pas ses anciennes tâches terminées en résultats validés V3. Les reprises répétées restent sans doublon et préservent les tâches locales.

Le format partagé reste `mon-atelier-ia-dossier`, version 2, avec des champs additionnels de validation et de résultat ; les sauvegardes complètes conservent le nouvel état. GitHub reste manuel avec aperçu et confirmation. Les originaux binaires restent dans le ZIP et la sauvegarde JSON, pas dans le dossier partagé GitHub.

Avant tout essai sur ses données réelles, exporter une sauvegarde complète depuis V2.3 et la conserver avec l’ancienne application. Le stockage d’un fichier HTML dépend toujours du navigateur et de son chemin : utiliser l’import JSON si les données ne sont pas retrouvées. Le retour vers V2.3 doit se faire avec la sauvegarde V2.3, car elle ne connaît pas le nouvel état « Travail rendu ».

Voir [RAPPORT-V3-PHASE1.md](RAPPORT-V3-PHASE1.md) pour les vérifications et limites.


## V3.1 — intégration et continuité

### Assistant GitHub

Dans **GitHub → Actualiser le suivi**, consulter les branches (30 maximum), les demandes de fusion ouvertes (30 maximum), les contrôles de la branche choisie et la dernière release disponible. La date de lecture reste visible. Une absence de contrôles, une erreur de permission ou des révisions différentes restent « non confirmées ». Le suivi n’écrit rien dans le dépôt. Les actions de création de branche, comparaison, fusion et publication s’effectuent sur GitHub, via les liens proposés ; l’envoi du dossier commun conserve son aperçu et sa confirmation.

Chaque tâche peut conserver une **branche de travail** et le **lien d’une demande de fusion**. Ces repères rejoignent le prompt, les références de livrables validés et la sauvegarde. L’assistant ne vérifie pas automatiquement que les liens de chaque tâche correspondent à une demande fusionnée.

### Suggestions des prochaines tâches

Après validation d’un résultat : conception/contenus/médias/usages → programmation ; programmation → tests ; tests → préparation de livraison. L’accueil explique la proposition. « Préparer cette tâche » ouvre une fiche modifiable : seule son sauvegarde crée la tâche. La source devient un prérequis et ses références sont reprises. Une suggestion déjà créée ou un relais du même poste déjà lié à cette source n’est plus proposé. Les suggestions reposent sur des règles locales, pas sur une API IA.

### Dépendances

Le tableau des tâches affiche les prérequis non validés, les références absentes et les boucles importées. La fiche indique aussi les tâches qui attendent son résultat. Le démarrage d’une tâche avec un prérequis bloquant est refusé. Les cycles créés dans l’éditeur sont toujours refusés.

Si un résultat validé est repris, les tâches validées qui en dépendent, directement ou indirectement, reviennent à vérifier ; leurs résultats et preuves sont conservés. Elles sortent des livrables de référence jusqu’à leur nouvelle validation. La vérification a aussi lieu à l’ouverture des données existantes, sans nouvelle version du schéma ni suppression de contenu.

### Préparer la livraison

Le nouvel espace rassemble la version cible, les nouveautés, les confirmations de sauvegarde/tests/fichiers/retour arrière et la procédure de restauration. Il signale les tâches encore non validées et demande au moins une mission **Tests & qualité** validée. Le contrôle porte sur **toutes les tâches du projet** ; il n’existe pas encore de sélection d’un lot de livraison.

Enregistrer puis copier ou télécharger le dossier Markdown. Les cases restent des confirmations personnelles ; l’atelier ne lance pas lui-même les tests des autres applications. Après une modification des tâches, les confirmations doivent être relues et enregistrées de nouveau. « Dossier prêt pour une revue de livraison » ne signifie pas « application publiée » : fusion et déploiement sont à vérifier séparément sur GitHub.

La fiche de livraison est incluse dans les sauvegardes complètes et exports de projet. Elle n’est pas importée par le partage des seuls documents/références du dossier commun. La clé locale, le schéma 3 et le stockage des originaux restent identiques à V3.0.

Voir [RAPPORT-V3.1.md](RAPPORT-V3.1.md) pour les tests et limites.


## V3.2 — choisir son niveau de détail

Le sélecteur **NIVEAU DE DÉTAIL**, sous le projet actif, propose :

- **Débutant · guidé** (par défaut à la première ouverture de V3.2) : navigation essentielle, outils complémentaires regroupés dans **Tous les outils**, réglages GitHub et dépendances des fiches repliés, contexte de transmission ajustable dans un volet, liste verticale des états de tâches réellement présents.
- **Avancé · détaillé** : tous les liens directement accessibles, réglages déployés, tableau de tâches à six colonnes et tableau de bord détaillé ouvert.

Les deux modes utilisent les mêmes projets et contrôles de validation. Replier une option ne la vide pas : les valeurs, fichiers liés et dépendances sont conservés lors de l’enregistrement. Les volets restent ouvrables en mode débutant. Le mode choisi s’applique à tout l’atelier, survit à la fermeture et fait partie de la sauvegarde complète ; il ne modifie pas le niveau de contexte choisi pour une transmission.

Sur chaque page, **Aller à** donne accès à tous les espaces et **← Accueil** ramène au pilotage. Un lien direct vers un outil complémentaire ouvre son groupe dans le menu. Le contenu principal reçoit le focus après un changement de page pour faciliter la navigation au clavier.

## V3.2 — bilans des IA fondés sur les missions évaluées

**Bilans des IA** regroupe les résultats du projet actif, filtrables par poste et par IA. Une mission compte comme évaluée si elle possède les trois éléments suivants : résultat reçu, état **Réussi / Partiel / Non satisfaisant**, date d’évaluation valide. Une note sur 5 est facultative.

Le bilan affiche le nombre de missions évaluées et archivées, les résultats déclarés et la moyenne des seules missions **évaluées et notées**, avec son nombre d’avis. Zéro note donne « Aucune note exploitable », jamais zéro sur cinq. Les petits échantillons sont signalés. Il n’existe ni vainqueur automatique ni modification des recommandations de postes : il s’agit d’appréciations personnelles.

La liste permet de relire la consigne, vérifier le résultat et corriger une évaluation. Le filtre **Sans évaluation complète** permet de retrouver les missions en attente et anciennes notes non datées : elles sont conservées sans être incluses dans les calculs. Pour les inclure, relire leur résultat, choisir un état de réussite et enregistrer l’évaluation. Repasser une mission en attente la retire du bilan sans effacer son contenu.

Les boutons Copier/Télécharger exportent le bilan du poste et de l’IA sélectionnés, avec uniquement les missions évaluées, leurs identifiants, résultats, dates, notes et commentaires. Le filtre d’affichage de la liste ne change pas la population du calcul ou de l’export. Les bilans de chaque poste emploient la même règle.

Les préférences et évaluations restent locales, sauvegardées dans le JSON complet. Elles ne sont pas ajoutées au partage du seul dossier commun. Clé de stockage, schéma 3, originaux, dépendances, préparation de livraison et fonctions GitHub restent conservés. Voir [RAPPORT-V3.2.md](RAPPORT-V3.2.md).


## V3.2.1 — prompt limité à la tâche

La transmission affiche et copie par défaut uniquement la consigne du poste, le titre, l’objectif, les éléments utiles, le résultat attendu et les critères de la tâche sélectionnée, avec ses éventuels repères de branche/demande de fusion et la demande complémentaire saisie. Le contexte général, les documents, décisions, autres tâches et anciens résultats ne sont plus ajoutés automatiquement. La copie et l’archive utilisent le même texte.

L’ajout du dossier commun reste possible en ouvrant **Ajouter du contexte du projet (facultatif)** puis en cochant explicitement l’option. Ce choix est conservé dans le brouillon courant, mais revient à désactivé lorsqu’une nouvelle tâche est sélectionnée ou préparée. Le mode débutant/avancé et l’ancien niveau de contexte ne l’activent pas automatiquement.


## V3.3 — mémoire structurée, régressions et réponses importées

### A. Mémoire du projet

Le nouvel espace distingue **Cahier des charges**, **Décisions validées**, **Fonctionnalités existantes**, **Problèmes connus** et **Travaux à venir**. Le cahier initial reprend le contexte existant sans supprimer les anciens documents. Les décisions validées et les tâches sont reliées à leurs registres existants : aucune copie de tâche n’est créée. Ajouter une fonction confirme qu’elle existe déjà ; préciser ses zones/mots-clés et les contrôles permettant de la préserver. Les problèmes peuvent être résolus, bloquants ou simplement à surveiller.

La mémoire accompagne les sauvegardes et le dossier partagé GitHub. Lors d’une reprise, les entrées locales déjà connues ne sont pas écrasées par une entrée distante portant le même identifiant. Les versions et leurs instantanés restent dans les sauvegardes complètes, pas dans le partage du seul dossier commun.

### B. Contrôles de régression

Dans une tâche, ouvrir **Fonctions liées et contrôles de régression**. La liste est préparée à partir du type de projet, des mots-clés et des fonctions explicitement sélectionnées. Pour une application pédagogique, elle couvre recherche, sauvegarde/progression, révisions et navigation entre cours/épisodes. Chaque contrôle conserve un état et une observation.

Changer le résultat, les zones concernées ou les fonctions du registre remet les preuves de régression à refaire. Le contrôle prépare des vérifications : il ne lance pas les tests de l’application et ne peut pas garantir l’absence de régression. Le prompt reste limité à la tâche ; seules les fonctions explicitement liées et le repère du modèle peuvent s’y ajouter, pas la mémoire entière.

### C. Importer le résultat

Le bouton est disponible dans une tâche et dans sa transmission. Coller la réponse ou choisir/déposer un fichier **.txt, .md ou .json de moins de 2 Mo**, puis **Prévisualiser avant enregistrement**. Les rubriques Livrable/Résultat, Fichiers, Tests/Vérifications, Limites et Prochaines étapes sont reconnues localement. Le JSON peut utiliser `result`, `files`, `tests`, `limits`, `nextTasks` (ou `livrables`, `fichiers`, `verifications`, `limites`, `tachesSuivantes`). Sans rubrique de résultat exploitable, le texte entier est conservé comme résultat à relire.

L’aperçu est modifiable. Une case de confirmation est obligatoire ; seules les tâches suivantes cochées sont créées, avec une dépendance vers la tâche source et dédoublonnage des mêmes propositions. La réponse source reste conservée quand elle diffère du résultat extrait. L’import place la tâche en **Travail rendu** et ne valide ni la tâche ni les tests déclarés par l’IA. Aucun PDF ou fichier Word n’est analysé.

### D. Modèles de projet

Choisir le type depuis **Modifier le projet** ou la mémoire : application pédagogique, jeu, site d’articles, outil professionnel ou projet général. Le modèle propose des postes, des critères et des contrôles adaptés. Les nouveaux prompts comportent un repère spécifique au type de projet. Les dix postes restent utilisables et les tâches existantes ne sont pas réécrites.

### E. Historique des versions

**Historique des versions → Consigner une version publiée** enregistre les nouveautés, fichiers, tests, problèmes, date et lien GitHub d’une publication déjà réalisée, avec confirmation. Un état des textes et références est conservé ; les versions précédentes ne sont pas écrasées. Sélectionner une version permet de voir les changements consignés depuis cette référence jusqu’à la dernière version enregistrée.

Le lien GitHub permet de retrouver le commit/tag/version. Le téléchargement de l’état n’inclut pas les originaux binaires et n’effectue aucun retour arrière. Les anciennes versions ne sont pas reconstituées automatiquement depuis GitHub ; les dates et nouveautés doivent être consignées à partir d’informations réelles.

### F. Cohérence avant publication

**Préparer la livraison** signale tâches/prérequis non validés, contrôles sans réussite documentée, problèmes connus et intégrations GitHub non confirmées. **Actualiser fichiers et intégration GitHub** vérifie les originaux dans le stockage local et consulte les demandes de fusion liées aux tâches (30 maximum). Une fusion doit être effective vers la branche par défaut du dépôt associé et toujours correspondre aux repères de la tâche. Une branche sans demande de fusion reste non confirmée.

Le contrôle des originaux doit être renouvelé après réouverture de l’atelier ou changement des fichiers. Un lien GitHub ou un résultat modifié rend la confirmation d’intégration périmée. L’indicateur de préparation tient compte des oublis bloquants ; les problèmes « à surveiller » restent visibles sans être bloquants. Les confirmations personnelles de préparation doivent être renouvelées après modification des preuves de régression.

Ce tableau ne remplace pas les tests et ne prouve pas que le contenu d’un commit correspond à un résultat décrit. Il ne fusionne et ne publie rien. Les fonctions GitHub et les sauvegardes précédentes sont préservées. Voir [RAPPORT-V3.3.md](RAPPORT-V3.3.md).


## V3.4 — équipes IA par type de tâche

**Circuits IA** permet d’enregistrer des équipes de travail communes à tous les projets. Quatre exemples modifiables sont fournis : développement, correction, contenus et médias. Les répartitions ChatGPT/Claude sont des points de départ, pas un classement de leurs capacités.

Un circuit comporte de **1 à 10 étapes ordonnées**, chacune avec un intitulé, un poste, un intervenant (**ChatGPT, Claude ou Moi**), une consigne, un livrable et des critères. Deux étapes peuvent employer le même poste avec des IA différentes. Créer, modifier, ajouter/retirer/réordonner des étapes et dupliquer un modèle ; l’archivage est réversible.

### Préparer une équipe

1. Choisir **Utiliser pour ce projet** et décrire une nouvelle demande, ou sélectionner une tâche non commencée.
2. Relire l’aperçu des étapes et confirmer leur création. Rien n’est ajouté avant cette confirmation.
3. Ouvrir les tâches créées ou préparer leur prompt depuis la liste de l’équipe. Le destinataire reprend l’intervenant prévu pour l’étape, même s’il diffère de la recommandation habituelle du poste.
4. Copier le prompt dans l’IA, importer le résultat, puis vérifier et valider la tâche. L’étape suivante dépend de cette validation. Un prérequis non validé bloque le démarrage et la clôture ; son prompt peut néanmoins être préparé avec l’indication d’attente.

Le prompt comprend la consigne de l’étape et, une fois validé, le résultat de l’étape précédente du même circuit. Il ne reprend pas toute la mémoire du projet. Les longs résultats sont limités à un extrait de 6 000 caractères, signalé comme tel ; les pièces jointes restent à transmettre manuellement.

### Tâche existante et préservation

Une tâche existante ne peut être réaffectée à une équipe que si elle est À préparer/Prêt, sans résultat, preuve, mission archivée ni circuit antérieur. La première étape reprend son titre, objectif, fichiers et prérequis ; son poste, son intervenant et son livrable sont adaptés au circuit, les critères sont complétés. Sa fiche d’origine est conservée dans l’équipe. L’aperçu devient invalide si cette fiche change avant confirmation.

Les autres étapes sont de nouvelles tâches liées dans l’ordre. Les suggestions générales ne s’intercalent pas entre les étapes d’un circuit ; elles peuvent reprendre après sa dernière étape validée.

Chaque équipe conserve une copie du modèle utilisé. Modifier/archiver le modèle ne change donc pas les équipes déjà créées. **Réutiliser cette équipe** prépare une nouvelle demande à partir de cette copie, même depuis un projet importé.

La bibliothèque des circuits est incluse dans la sauvegarde complète de l’atelier. L’export de projet conserve les équipes utilisées et leurs étapes, mais pas toute la bibliothèque globale ; ces copies restent réutilisables. Le dossier commun partagé garde sa portée de références validées. La restauration conserve aussi les liens entre tâches, fiches d’origine et pièces jointes réidentifiées.

Les circuits organisent des relais séquentiels. Ils ne lancent pas plusieurs IA automatiquement, n’envoient aucun message et ne nécessitent aucune API payante. Voir [RAPPORT-V3.4.md](RAPPORT-V3.4.md).
