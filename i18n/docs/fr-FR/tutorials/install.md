<!-- source: 03e5a04c40fd -->

# Installer Vibe

Ce tutoriel mène une machine neuve du téléchargement à une fenêtre Vibe en fonctionnement. Il suppose un ordinateur de bureau avec une connexion Internet et aucune installation existante. [Transcrire votre premier enregistrement](/vibe/docs#first-transcription) est l’étape suivante.

## Télécharger l’installateur

Ouvrez la [page de téléchargement](https://kisev.github.io/vibe/) et choisissez le build pour cette machine :

| Plateforme | Build |
| --- | --- |
| Windows | Installateur `.exe` |
| macOS, Apple silicon | `aarch64.dmg` |
| macOS, Intel | `x64.dmg` |
| Linux | `.deb` ou `.rpm`, x86-64 ou arm64 |

Les mêmes fichiers sont joints à chaque [version GitHub](https://github.com/kisev/vibe/releases). Le `.deb` Linux déclare ses dépendances d’exécution, dont `ffmpeg`.

## Installer et ouvrir

1. Lancez l’installateur et suivez ses instructions.
1. Ouvrez Vibe depuis le menu des applications, ou exécutez `vibe` dans un terminal.

Les builds de release ne sont pas signés. Sous macOS, le premier lancement nécessite un clic droit → **Ouvrir** dans le Finder pour passer Gatekeeper ; les lancements suivants s’ouvrent normalement. Windows SmartScreen peut afficher un avertissement pour la même raison.

## Terminer la configuration

Au premier lancement, Vibe propose le modèle par défaut. Acceptez le téléchargement et attendez qu’il se termine. Le modèle est stocké localement et réutilisé à chaque exécution ultérieure ; [Modèles](/vibe/docs#models) liste les alternatives.

La fenêtre est prête quand la zone de dépôt et les actions **Enregistrer** et **Depuis un lien** sont visibles.

## Étapes suivantes

- [Transcrire votre premier enregistrement](/vibe/docs#first-transcription) utilise cette installation.
- [Formats pris en charge](/vibe/docs#formats) liste ce que Vibe peut ouvrir et exporter.
- [Résoudre un plantage](https://github.com/kisev/vibe/blob/main/docs/how-to/troubleshoot-a-crash.md) couvre les journaux et les diagnostics si la fenêtre ne s’ouvre pas.
