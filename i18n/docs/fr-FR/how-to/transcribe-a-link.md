<!-- source: b806d3524bf0 -->

# Transcrire depuis un lien

Vibe télécharge l’audio derrière une URL multimédia avec yt-dlp et transcrit le résultat. Les sites pris en charge sont ceux que yt-dlp prend en charge ; quand un site cesse de fonctionner, un yt-dlp mis à jour le corrige généralement.

## Envoyer le lien

1. Ouvrez Vibe et choisissez **Depuis un lien**.
1. Collez une URL, ou collez-en plusieurs séparées par des espaces pour toutes les mettre en file d’attente.
1. Appuyez sur **Transcrire**.

Vibe propose d’installer yt-dlp la première fois qu’un lien est utilisé, et de le mettre à jour quand un site échoue. L’audio téléchargé est temporaire ; la transcription est enregistrée comme n’importe quel autre projet.

## À quoi s’attendre

- Un seul lien démarre dès que le téléchargement se termine.
- Une file d’attente traite un lien à la fois et affiche la progression par élément.
- Les poids, les modèles et la transcription restent locaux. Le téléchargement lui-même contacte l’hôte du média et GitHub pour yt-dlp.

## Étapes suivantes

- [Formats pris en charge](/vibe/docs#formats) pour les fichiers locaux et les choix d’exportation.
- [Modèles](/vibe/docs#models) quand l’audio a besoin d’une autre langue ou d’une autre précision.
