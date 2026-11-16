<!-- source: 63b7a2f2736b -->

# Canaux de mise à jour

L’application se met à jour depuis l’un de trois fichiers de canal sur le site Web, et non depuis la dernière version publiée sur GitHub :

| Canal | Fichier |
| --- | --- |
| Release | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

Chaque fichier est le `latest.json` produit par un build de version. Un canal sans fichier est une ligne sans contenu : l’application signale « À jour » plutôt que de se rabattre sur un autre canal ou de traiter le fichier manquant comme une vérification échouée.

## Lignes et versions

| Canal | Tag | Branche | Version | Ce que c’est |
| --- | --- | --- | --- | --- |
| Release | `vX.Y.Z` | `main` | `X.Y.Z` | La ligne stable |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | Candidate pour la prochaine version stable, publiée comme préversion GitHub |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | Le build évolutif de `dev` |

`beta.json` est absent tant qu’aucune candidate n’est publiée. Une version stable ordinaire est rejetée sur le canal beta ; seul `X.Y.Z-rc.<n>` y est accepté.

## D’où viennent les manifestes

- **Release et beta** : le mécanisme de mise à jour Tauri du build de version produit `latest.json`. `scripts/channel.py <version> --channel <stable|beta>` le télécharge depuis `https://github.com/kisev/vibe/releases/download/v<version>/latest.json`, valide la version et écrit `website/public/updater/<channel>.json`. Commitez le fichier sur `main` ; le déploiement du site le publie.
- **Dev** : `.github/workflows/dev-build.yml` publie une préversion avec les artefacts de mise à jour et `latest.json`. `scripts/dev_manifest.py` lit la dernière version dev complète et écrit `website/public/updater/dev.json` ; un nouveau build dev déclenche le déploiement du site. Si la dernière version est partielle ou si l’appel d’API échoue, le `dev.json` précédent est conservé.

`channel.py` refuse de faire reculer un canal et comprend l’ordre des `-rc.<n>`.

## Dans l’application

- **Paramètres → Général → Mises à jour** contient le sélecteur de canal, la version actuelle, **Rechercher des mises à jour**, l’heure de la dernière vérification et le résultat.
- La sélection à l’exécution réside dans `desktop/src-tauri/src/updater.rs` ; le côté webview est `desktop/src/providers/updater.tsx`.
- `desktop/src-tauri/src/updater.rs` interroge directement `updater/<channel>.json`. Un `404` ou `410` signifie que le canal n’a jamais été publié ; toute autre défaillance est une vraie erreur.
- Le point de terminaison statique du plugin Tauri dans `tauri.conf.json` est le repli que le plugin lui-même connaît ; le choix du canal se fait dans le code de l’application.

## Limites

- Le mécanisme de mise à jour ne va qu’en avant. Un mauvais build se corrige en publiant un build plus récent.
- Une installation Release ou Beta qui sélectionne Dev affiche « À jour » : chaque build dev se classe en dessous de la version qu’elle exécute déjà. Passer à la ligne dev demande une installation manuelle d’un build dev ; ensuite, le canal Dev la met à jour en avant.
- Une installation Beta passe à la version finale en basculant sur Release, où `X.Y.Z` se classe au-dessus de ses candidates.
- Les applications construites avant les fichiers de canal (la ligne 3.x amont) lisent encore la version GitHub marquée « latest ». `gh release edit --latest` est ce qui leur est livré, exécuté en dernier.

Voir [Publier une version](../how-to/publish-a-release.md) et [Découper un build dev](../how-to/cut-a-dev-build.md) pour les procédures, et [l’explication](../explanation/update-channels.md) pour comprendre pourquoi les lignes et les suffixes sont ainsi façonnés.
