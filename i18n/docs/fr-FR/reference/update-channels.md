<!-- source: 18fa449ab772 -->

# Canaux de mise à jour

L’application se met à jour depuis l’un de trois fichiers de canal sur le site Web, et non depuis la « dernière version » de GitHub :

| Canal | Fichier |
| --- | --- |
| Release | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

Chaque fichier est le `latest.json` produit par un build de version. Un fichier manquant signifie que la ligne ne contient rien : l’application signale « à jour » plutôt que de se rabattre sur un autre canal.

## Lignes et versions

| Canal | Tag | Branche | Version | Ce que c’est |
| --- | --- | --- | --- | --- |
| Release | `vX.Y.Z` | `main` | `X.Y.Z` | La ligne stable |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | Candidate pour la prochaine stable, publiée comme préversion |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | Le build évolutif de `dev` |

Une version stable ordinaire est rejetée sur le canal beta ; seul `X.Y.Z-rc.<n>` y est accepté. Un canal sans candidate est absent, pas vide.

## Dans l’application

- **Paramètres → Général → Mises à jour** contient le sélecteur de canal, la version actuelle, **Rechercher des mises à jour**, l’heure de la dernière vérification et le résultat.
- L’application interroge `updater/<channel>.json` elle-même. Un `404` ou `410` signifie que le canal n’a jamais été publié ; toute autre défaillance est une vraie erreur.
- La vérification s’exécute au démarrage et après un changement de canal.

## Limites

- Le mécanisme de mise à jour ne va qu’en avant. Un mauvais build se corrige en publiant un build plus récent.
- Une installation Release ou Beta qui sélectionne Dev affiche « à jour » : chaque build dev se classe en dessous de la version qu’elle exécute déjà. Passer à la ligne dev demande une installation manuelle d’un build dev ; ensuite, le canal Dev la met à jour en avant.
- Une installation Beta passe à la version finale en basculant sur Release, où `X.Y.Z` se classe au-dessus de ses candidates.

## Pages liées

- [Changer de canal de mise à jour](/vibe/docs#switch-update-channels) pour les étapes.
- [Pourquoi les canaux de mise à jour fonctionnent ainsi](/vibe/docs#update-channels-design) pour la conception.
