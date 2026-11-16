<!-- source: f5e20b838770 -->

# Résumer une transcription

Vibe peut transformer une transcription terminée en résumé, en notes ou en traduction. La requête part vers la plateforme d’IA que vous configurez : un modèle Ollama local, Claude, ou tout point de terminaison compatible OpenAI. [Paramètres et configuration](/vibe/docs#settings) liste où la connexion est stockée.

## Utiliser un modèle Ollama local

1. Installez [Ollama](https://ollama.com) et récupérez un modèle, par exemple `ollama pull llama3.1`.
1. Ouvrez **Paramètres → IA**.
1. Réglez **Plate-forme** sur **Ollama**. L’URL par défaut est `http://localhost:11434`.
1. Choisissez le nom du modèle.
1. Activez **Résumés**, et éventuellement **Résumer automatiquement les nouvelles transcriptions**.

Ollama s’exécute sur cette machine, si bien que la transcription reste locale.

## Utiliser Claude ou un point de terminaison compatible OpenAI

1. Ouvrez **Paramètres → IA** et choisissez la plateforme.
1. Collez la clé API, et modifiez l’URL de base si le point de terminaison n’est pas celui par défaut.
1. Choisissez le modèle.
1. Activez **Résumés**.

Pour un point de terminaison non standard, l’URL de base et la clé forment la connexion que l’application utilise à la fois pour les résumés et la dictée.

## Résumer

1. Terminez une transcription.
1. Ouvrez l’action de résumé dans la vue de transcription.
1. Choisissez un préréglage et, si nécessaire, modifiez le prompt.
1. Lancez-le ; le résultat est enregistré avec le projet et peut être exporté à côté de la transcription.

Avec **Résumer automatiquement les nouvelles transcriptions** activé, le résumé s’exécute dès qu’une transcription se termine.

## Étapes suivantes

- [Paramètres et configuration](/vibe/docs#settings) pour le fichier de configuration et les sections de paramètres.
- [Confidentialité et conception hors ligne](/vibe/docs#privacy) pour savoir quelles plateformes gardent le texte sur la machine.
