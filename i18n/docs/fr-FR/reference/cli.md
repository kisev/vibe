<!-- source: 82b1f22a4618 -->

# Ligne de commande

L’exécutable `vibe` est l’application de bureau. Quand il reçoit un argument autre que `--hidden`, il transmet les arguments au `vibe-server` intégré et affiche la sortie de ce processus, si bien que la CLI et la fenêtre utilisent le même moteur et les mêmes modèles.

Le binaire serveur est `vibe-server` ; un checkout de développement peut l’appeler directement. `--help` sur l’une ou l’autre des commandes affiche les options actuelles.

## Sous-commandes

| Commande | Rôle |
| --- | --- |
| `transcribe <model> <audio>` | Transcrire un fichier et afficher ou écrire le résultat |
| `serve [model]` | Démarrer le serveur HTTP local, avec la documentation Swagger |
| `pull <url>` | Télécharger un modèle ou un autre fichier |
| `devices` | Lister les périphériques GPU en JSON |

## Options de transcribe

| Option | Effet |
| --- | --- |
| `--format <txt\|markdown\|md\|json\|srt\|vtt>` | Format de sortie ; `txt` par défaut |
| `--output <path>` | Écrire dans un nouveau fichier ; refuse d’écraser |
| `-l`, `--language <code>` | Code de langue |
| `--detect-language` | Détecter la langue |
| `--translate` | Traduire vers l’anglais là où le modèle le prend en charge |
| `--vad-model <path>` | Modèle Silero VAD, requis par certaines familles pour l’audio long |
| `--diarize-model <path>` | Modèle de diarisation des intervenants |
| `--prompt <text>` | Prompt initial, pour les modèles qui en utilisent un |
| `--word-timestamps` | Émettre des horodatages au niveau des mots là où c’est pris en charge |
| `--threads <n>` | Threads CPU |
| `--gpu-device <n>` | Index du périphérique GPU, à partir de 1 ; `0` ou négatif signifie automatique |
| `--cache-dir <dir>` | Conserver les fragments terminés pour qu’une exécution interrompue reprenne |
| `--chunk-seconds <n>` | Longueur de fragment planifiée, plafonnée par la fenêtre du modèle |

`--enhance-audio`, `--temperature`, `--max-text-ctx`, `--max-segment-len`, `--best-of` et `--beam-size` règlent le moteur ; exécutez `--help` pour connaître leurs valeurs par défaut.

## Options de serve

| Option | Effet |
| --- | --- |
| `--host <ip>` | Adresse d’écoute ; `127.0.0.1` par défaut |
| `-p`, `--port <port>` | Port ; `0` en choisit un libre |
| `--exit-with-parent` | S’arrêter avec le processus parent |
| `--unload-timeout <value>` | Décharger un modèle inactif |
| `--cache-dir <dir>` | Répertoire du cache de fragments |

**Paramètres → Agents** démarre le même serveur depuis l’application et renvoie à sa documentation Swagger.

## Exemples

```console
vibe transcribe model.gguf recording.wav --format srt --output recording.srt
vibe transcribe model.gguf recording.wav --language ru --vad-model ggml-silero-v6.2.0.bin
vibe devices
vibe serve --port 0
```

## Pages liées

- [Modèles](/vibe/docs#models) pour les choix de modèles et les limites par famille.
- [Formats pris en charge](/vibe/docs#formats) pour les extensions d’entrée et les formats d’exportation.
