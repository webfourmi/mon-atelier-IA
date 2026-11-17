# V3.1 — phase 2 : intégration et continuité

17 novembre 2026. Base : V3.0 publiée, `64508d7`. Développement sur `v3.1-phase-2` avant fusion.

## Réalisé

- Assistant GitHub : lecture des branches, demandes de fusion, Checks, statuts de commit et dernière release ; état daté, erreurs partielles explicites et liens de préparation. Les lectures ne modifient pas le dépôt. Sur la branche par défaut, le lien propose d’abord de choisir/créer une branche.
- Repères GitHub par tâche : branche et demande de fusion, transmis dans le prompt et conservés dans les sauvegardes et livrables validés.
- Suggestions locales expliquées : conception → programmation → tests → livraison. Fiche modifiable avant création, dépendance vers la source, reprise des références et dédoublonnage.
- Dépendances directes et indirectes : prérequis manquants, cycles importés, interdiction de démarrer avec un prérequis non validé, retour à vérifier des résultats dépendants quand leur source change. Résultats et preuves conservés, retrait des références jusqu’à nouvelle validation.
- Espace Préparer la livraison : version, notes, sauvegarde, tests, liste de fichiers et retour arrière ; liste des tâches à résoudre, mission de tests validée requise, dossier Markdown à copier/télécharger. Confirmations à renouveler après changement des tâches.
- Schéma local 3, clé de stockage et base des originaux conservés. Tous les tests V3.0 conservés. Aucun changement du contenu personnel du dossier commun du dépôt.

## Vérifications

- Syntaxe des trois scripts et `git diff --check`.
- **38 tests réussis** : tests V3.0, chaînes et cycles de dépendances, invalidation en cascade, création et dédoublonnage des suggestions, préparation de livraison et confirmations périmées, sauvegarde/restauration de la fiche, permissions GitHub partielles, absence de faux succès et lecture sans écriture.
- Navigateur réel sur aperçu local : création d’une idée, enregistrement d’une branche de tâche et présence dans le prompt, retour guidé → à vérifier → validé, affichage de la suggestion de tests.
- Lecture réelle du dépôt public webfourmi/mon-atelier-IA depuis l’assistant : branches et contrôles affichés, absence de PR/release correctement indiquée. Aucun envoi sur GitHub depuis l’interface d’essai.
- Présentation de l’accueil, de GitHub et de la préparation de livraison examinée sur ordinateur ; saisie et enregistrement de la fiche de livraison vérifiés.

## Limites

- L’assistant accompagne les manipulations sur GitHub ; il ne crée pas automatiquement une branche, une PR, une fusion ou une release. Le suivi concerne la branche sélectionnée et les informations consultées à une date donnée. Il ne remplace pas les vérifications propres à chaque PR ou au déploiement.
- Branches et demandes de fusion limitées aux 30 premiers résultats ; Checks limités aux 100 premiers. Les limites de requêtes et permissions GitHub peuvent empêcher une lecture.
- Les suggestions sont des règles de relais, sans analyse sémantique du code ou des retours. Pas de découpage automatique arbitraire ni de tâches créées sans enregistrement de la fiche.
- Le contrôle de préparation concerne toutes les tâches du projet. Les confirmations de sauvegarde et de tests sont déclaratives ; les preuves sont consultables dans les tâches. Le document est une préparation de revue de livraison, sans promesse de publication.
- La fiche de livraison reste locale aux sauvegardes complètes/projets ; le partage du dossier commun conserve sa portée de documents et références validées.
- Mobile, Firefox/Edge et sélection réelle d’un dossier Windows non testés. Les essais ont utilisé des données locales fictives, pas les données personnelles de production.

## Fichiers

`core.js` : dépendances, suggestions, préparation et suivi des confirmations, repères GitHub et état des contrôles.
`app.js` : vues, formulaires et actions du parcours V3.1.
`github.js` : consultation du suivi GitHub et erreurs partielles.
`index.html` : repère V3.1.
`tests/core.test.cjs`, `tests/parcours.test.cjs` : neuf nouveaux tests V3.1.
`README.md`, `RAPPORT-V3.1.md` : utilisation et limites.
