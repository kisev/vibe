<!-- source: bc1a1519974a -->

# Changer de canal de mise à jour

Vibe vérifie l’un de trois canaux de mise à jour : Release, Beta ou Dev. Le canal décide quels builds l’application propose, et il ne va jamais qu’en avant.

## Choisir un canal

1. Ouvrez **Paramètres → Général → Mises à jour**.
1. Choisissez **Release**, **Beta** ou **Dev**.
1. Appuyez sur **Rechercher des mises à jour**.

La même section affiche la version installée, l’heure de la dernière vérification et le résultat. La vérification s’exécute aussi au démarrage.

## Ce que porte chaque canal

| Canal | Builds |
| --- | --- |
| Release | Versions stables |
| Beta | Versions candidates de la prochaine version stable |
| Dev | Les builds `dev` les plus récents |

Une installation Release ou Beta qui sélectionne Dev affiche **À jour** : chaque build dev se classe en dessous de la version qu’elle exécute déjà. Passer à la ligne dev demande une installation manuelle d’un build dev ; ensuite, le canal Dev la met à jour en avant.

Une installation Beta passe à la version finale en basculant sur Release, où la version stable se classe au-dessus de ses candidates.

## Étapes suivantes

- [Canaux de mise à jour](/vibe/docs#update-channels) pour les fichiers de canal et les règles de tag.
- [Pourquoi les canaux de mise à jour fonctionnent ainsi](/vibe/docs#update-channels-design) pour l’ordre des versions.
