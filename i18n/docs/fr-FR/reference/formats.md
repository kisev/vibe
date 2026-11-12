<!-- source: e0f14454bcc5 -->

# Formats pris en charge

Vibe accepte les fichiers audio et vidéo et exporte les transcriptions dans plusieurs formats texte. L’application de bureau normalise les médias avec ffmpeg avant la transcription ; sous Linux, le `ffmpeg` du système est requis, tandis que les bundles macOS et Windows fournissent le leur.

## Entrée

| Type | Extensions |
| --- | --- |
| Audio | `mp3`, `wav`, `aac`, `flac`, `oga`, `ogg`, `opus`, `m4a`, `m4b`, `wma` |
| Vidéo | `mp4`, `mkv`, `avi`, `mov`, `wmv`, `webm`, `mxf` |

Un conteneur hors de cette liste peut encore fonctionner si ffmpeg peut le décoder ; convertissez-le d’abord si l’application le refuse.

## Exportation depuis le bureau

Ouvrez la boîte de dialogue d’exportation sur une transcription et choisissez l’un de ces formats :

| Format | Contenu |
| --- | --- |
| TXT | Texte brut sans mise en forme |
| Markdown | Titres et texte mis en forme |
| SRT | Sous-titres numérotés avec horodatages |
| VTT | Sous-titres WebVTT avec horodatages |
| HTML | Une page web mise en forme |
| JSON | Données structurées de transcription et de minutage |
| CSV | Lignes prêtes pour un tableur |
| DOCX | Un document Word mis en forme |
| PDF | Un document imprimable |

Les options d’exportation permettent aussi d’activer ou de désactiver les horodatages et les libellés d’intervenant lorsque le format les prend en charge. L’export automatique peut écrire l’un de ces formats à côté de l’enregistrement, dans le dossier des projets, ou dans un dossier de votre choix.

## Sortie CLI

`vibe-server transcribe` écrit `txt` (par défaut), `markdown` (alias `md`), `json`, `srt` ou `vtt`. `--output` écrit un nouveau fichier et refuse d’écraser un chemin existant. Voir [Ligne de commande](/vibe/docs#cli).

## Pages liées

- [Modèles](/vibe/docs#models) pour les familles de modèles et leurs limites.
- [Transcrire votre premier enregistrement](/vibe/docs#first-transcription) pour le flux de bureau.
