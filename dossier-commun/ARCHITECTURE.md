# Repères techniques

Application statique en HTML, CSS et JavaScript, utilisable en ouvrant `index.html`. Aucune dépendance d’exécution, aucun serveur nécessaire au fonctionnement personnel.

| Fichier | Responsabilité |
| --- | --- |
| `index.html` | Structure, navigation et boîtes de dialogue. |
| `styles.css` | Interface et adaptation aux tailles d’écran. |
| `core.js` | Modèle, migration, postes, contextes, Markdown et création de ZIP. |
| `github.js` | Client REST GitHub, erreurs, aperçu et contrôle des conflits. |
| `app.js` | Écrans, événements, stockage, fichiers, imports et exports. |
| `.atelier-ia/dossier-commun.json` | Dossier commun de Mon Atelier IA, lisible depuis l’écran GitHub. |

La clé de stockage `atelier-ia-v1` est conservée pour retrouver les données existantes. Le modèle passe au schéma 2 ; une copie avant migration est gardée si le stockage le permet. Les anciens champs `context`, `decisions` et `tasks` restent présents. Les tâches structurées sont dans `workItems`.

Les projets contiennent leurs documents, médias, décisions, transmissions et paramètres de dépôt. Les prompts et archives de comparaison de la V1 sont conservés. Les octets des pièces jointes sont dans IndexedDB ; les sauvegardes JSON complètes les transportent en Base64. Les copies automatiques conservent les états précédents des textes et références.

Les originaux retirés du dossier courant restent disponibles pour la restauration des états précédents dans ce navigateur. Un export ne reprend que les références du ou des projets exportés.

Le jeton GitHub n’est ni dans le modèle ni dans les exports. Les requêtes vont à `https://api.github.com`. L’envoi du dossier cible un fichier précis et utilise le SHA attendu ; il s’arrête en cas de modification distante. Les branches, dépôts ou projets modifiés pendant une lecture sont détectés avant d’en exploiter le résultat.

Les fichiers binaires ne sont pas envoyés avec le JSON commun GitHub. Le dossier ZIP ou local transporte leurs originaux. Le choix d’un dossier réel dépend des capacités et permissions du navigateur ; l’export ZIP reste disponible sans cette fonction.
