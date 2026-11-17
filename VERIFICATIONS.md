# Vérifications de la V2.0

Date : 17 novembre 2026. Exécution : Node.js 24.22.1, Happy DOM 21.0.4 et fake-indexeddb 6.2.8 pour les parcours simulés.

## Résultat

**25 tests automatisés réussis, aucun échec.** Syntaxe des trois fichiers JavaScript vérifiée. Archives ZIP relues indépendamment avec Python `zipfile` : intégrité, noms Unicode et octets originaux confirmés.

## Couverture

| Domaine | Contrôles effectués |
| --- | --- |
| Migration | Textes, projets, prompts, comparaisons et champs supplémentaires de la V1 conservés ; copie avant migration ; redémarrage sans doublons de tâches. |
| Organisation | Dix postes, écrans, création et modification des tâches, dépendances et clôture d’un résultat débloqué. |
| Contexte | Documents et décisions validées dans la transmission ; trois niveaux distincts ; tâche et demande conservées si le contexte est abrégé. |
| Séparation des projets | Brouillons de mission propres au projet ; ajout d’un projet exporté sans remplacer les autres. |
| Fichiers | Ajout, export complet et réimportation avec conservation exacte des octets ; médias partagés par deux copies d’un projet dédupliqués dans le JSON. |
| Comparaison | Réponses, notes de vérification, appréciations et résultat retenu conservés. |
| Données | Import malformé refusé, données illisibles conservées, saturation simulée sans écrasement, modification dans une autre fenêtre détectée. |
| GitHub simulé | Lecture publique, session, issues sans doublon, aperçu et confirmation, nouvel envoi et remplacement par SHA exact, conflit distant, jeton refusé, absence du jeton dans les exports. |
| Lecture asynchrone | Un résultat reçu de l’ancien dépôt est écarté si le dépôt associé a changé entre-temps. |
| Contenu importé | Les textes contenant du HTML restent du texte. |
| Dossier local simulé | Écriture du dossier commun et du JSON réimportable dans un sous-dossier propre à l’atelier. |

## Contrôles réels et limites

- Lecture réelle, sans authentification, des métadonnées et des 31 entrées de la racine de `webfourmi/dragon-de-jade`, avec le client GitHub de l’application.
- Aucun envoi de dossier personnel n’a été effectué sur GitHub pour les tests ; les écritures ont été simulées. La mise en dépôt du code de l’application est une opération distincte.
- Les tentatives d’ouverture du navigateur de test ont été bloquées par l’environnement. Les parcours Happy DOM ne vérifient pas le rendu graphique, les vrais téléchargements du navigateur, les permissions du système de fichiers, ni les différences Chrome / Edge / Firefox.
- Après installation : importer une sauvegarde V1, ouvrir les dix postes et un fichier joint, vérifier le rendu à l’écran, puis exporter et conserver une sauvegarde complète.
- La première connexion privée et le premier envoi avec un jeton réel restent à effectuer dans la session GitHub de l’utilisateur.
