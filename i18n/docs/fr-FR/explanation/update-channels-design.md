<!-- source: dc7efd39c01b -->

# Pourquoi les canaux de mise à jour fonctionnent ainsi

GitHub n’a qu’une « dernière version ». Vibe a besoin de trois lignes — Release, Beta et Dev — entre lesquelles un utilisateur peut basculer, y compris depuis une installation plus ancienne. Cette inadéquation dicte la conception des canaux.

## Pourquoi le site Web, et non GitHub

L’application lit `updater/<channel>.json` depuis le site Web. Chaque fichier est le `latest.json` produit par un build de version, copié à côté des autres :

- Release → `stable.json`
- Beta → `beta.json`
- Dev → `dev.json`

Un fichier de canal est un actif statique déployé avec le site, si bien que pointer une ligne vers un build est un commit, pas une modification de version. Cela permet aussi à un canal manquant de signifier quelque chose de précis : un `404` ou `410` est « rien sur cette ligne », que l’application signale comme à jour. Si l’application se rabattait sur un autre canal en cas de fichier manquant, un utilisateur Beta sans candidate serait silencieusement déplacé vers Release.

## Pourquoi le suffixe beta est `-rc.<n>`

Semver trie :

```text
X.Y.Z-dev.N < X.Y.Z-rc.N < X.Y.Z
```

Cet ordre est toute la raison de cette écriture. Avec la comparaison stricte du mécanisme de mise à jour, Dev → Beta → Release avance toujours ; aucune dérogation spéciale n’est nécessaire.

Une ligne antérieure utilisait `-beta.N`, mais elle n’avait pas de canal dev. `X.Y.Z-beta.N` se classe au-dessus de `X.Y.Z-dev.N`, si bien qu’un build beta paraîtrait plus récent que chaque build dev et casserait le basculement. Le canal beta garde son nom ; seul le suffixe de version est `-rc.<n>`.

## Pourquoi beta ne porte que des candidates

Seule une version `X.Y.Z-rc.<n>` est écrite dans `beta.json` ; une version stable ordinaire est rejetée. Cela garde la ligne beta utile : c’est la ligne des candidates, pas une deuxième ligne stable. Après une version stable, une installation Beta passe à la finale en basculant son canal sur Release, où `X.Y.Z` se classe au-dessus de ses candidates.

## Mises à jour en avant uniquement

Le mécanisme de mise à jour ne va qu’en avant. Une mauvaise version se corrige en en publiant une plus récente, et c’est à cela que sert la ligne beta : l’attraper avant que Release ne l’ait. C’est aussi pourquoi une installation Release ou Beta qui sélectionne Dev affiche « à jour » : chaque build dev se classe en dessous de la version qu’elle exécute déjà. Passer à la ligne dev demande une installation manuelle d’un build dev ; ensuite, le canal Dev la met à jour en avant.

## Compromis

- **Manifestes copiés** : un changement de canal est un commit sur `main` plus un déploiement du site, pas un appel d’API. Le délai se compte en minutes et l’historique est relisible.
- **Aucun repli entre canaux** : un utilisateur voit un « à jour » exact plutôt qu’une rétrogradation surprise ou un saut entre lignes.
- **Dev exige une installation manuelle** : c’est le prix à payer pour garder un ordre semver honnête. L’automatiser exigerait un concept de canal que les anciens clients n’ont pas.

## Pages liées

- [Canaux de mise à jour](/vibe/docs#update-channels) pour les fichiers et les règles de version.
- [Changer de canal de mise à jour](/vibe/docs#switch-update-channels) pour les étapes.
