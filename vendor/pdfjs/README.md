# PDF.js 5.6.205

Ces deux fichiers proviennent du paquet Mozilla `pdfjs-dist@5.6.205` (build `ada343803`). La licence Apache 2.0 figure dans `LICENSE`. Le code de lecture et son worker sont distribués avec l’atelier pour permettre un usage local.

Les modules officiels `build/pdf.min.mjs` et `build/pdf.worker.min.mjs` ont été convertis en scripts classiques avec esbuild 0.25.12. La commande utilisée, depuis un dossier contenant ces deux modules, est la suivante.

```sh
esbuild pdf.min.mjs pdf.worker.min.mjs --format=iife --target=es2022 --define:import.meta.url=globalThis.location.href --legal-comments=inline --minify --outdir=out
```

Chaque fichier distribué conserve en tête la notice de licence et le numéro de build du module original. Le lecteur se charge à l’ouverture d’un PDF. En ouvrant directement `index.html` depuis le disque, l’application charge également le worker comme script classique.

[Projet Mozilla PDF.js](https://github.com/mozilla/pdf.js)
