<!-- source: 648b5aad742b -->

# Enregistrer le microphone et l’audio du système

Vibe enregistre depuis les périphériques que vous choisissez, puis transcrit l’enregistrement. Utilisez ce guide pour les appels, les réunions et l’audio qui est diffusé plutôt qu’enregistré dans un fichier. [Formats pris en charge](/vibe/docs#formats) couvre les fichiers.

## Choisir les périphériques

1. Ouvrez Vibe et choisissez **Enregistrer**.
1. Sous **Microphone**, choisissez le périphérique d’entrée. Vibe mémorise le périphérique par son nom.
1. Sous **Haut-parleurs**, choisissez le périphérique de sortie à capturer pour l’audio du système. Choisissez **Aucun** pour enregistrer uniquement le microphone.

Enregistrer les deux périphériques les fusionne en une seule piste avec ffmpeg, si bien que les deux côtés d’un appel se retrouvent dans la même transcription.

## Accorder les autorisations sous macOS

Ouvrez **Paramètres → Enregistrement → Autorisations** et accordez ce dont l’enregistrement a besoin :

| Autorisation | Utilisée pour |
| --- | --- |
| Microphone | L’audio du microphone |
| Audio du système | L’audio diffusé sur le Mac (Enregistrement de l’écran et de l’audio du système) |

Sans l’autorisation d’audio du système, macOS ouvre le flux en bouclage mais enregistre du silence, si bien que l’enregistrement est inutilisable.

## Enregistrer et transcrire

1. Appuyez sur **Enregistrer**.
1. Utilisez **Arrêter** à la fin de l’appel.
1. L’enregistrement s’ouvre avec un sélecteur de langue. Choisissez une langue ou laissez l’automatique.
1. Appuyez sur **Transcrire**.

Si **Transcrire automatiquement les enregistrements** est activé dans **Paramètres → Enregistrement**, la dernière étape démarre d’elle-même.

## Étapes suivantes

- [Résumer une transcription](/vibe/docs#summarize-transcripts) une fois l’enregistrement terminé.
- [Utiliser le navigateur de réunion](/vibe/docs#use-the-meeting-browser) pour enregistrer un appel dans Vibe.
