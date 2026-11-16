<!-- source: 6fd793aea9b2 -->

# Choix du moteur et du GPU

Vibe sépare l’enveloppe de bureau du moteur de transcription. L’enveloppe est une application Tauri en Rust et React ; le moteur est `vibe-server`, un processus Rust qui appelle la bibliothèque C++ transcribe.cpp sur ggml.

## Pourquoi le moteur est un processus séparé

Le serveur possède le chargement des modèles et le calcul lourd. Le garder hors du processus de bureau signifie :

- la fenêtre peut redémarrer sans recharger un modèle de plusieurs gigaoctets ;
- le même binaire sert l’application, la CLI et l’API HTTP locale ;
- un plantage du moteur n’emporte pas la fenêtre avec lui ;
- le moteur peut être mis à jour selon son propre calendrier, épinglé par le build de l’application.

L’application de bureau dialogue avec le serveur en HTTP local. Rien dans ce chemin ne quitte la machine ; [Confidentialité et conception hors ligne](/vibe/docs#privacy) couvre la surface réseau.

## Un moteur, de nombreuses familles de modèles

Chaque famille prise en charge passe par le même build ggml : Whisper, Parakeet, Nemotron, Canary, Qwen3-ASR, Voxtral et GigaAM. Silero VAD et la diarisation Nemotron-3 tournent aussi sur cette pile. Un seul moteur garde la gestion de la mémoire, la quantification et la répartition GPU identiques pour chaque modèle.

Le compromis est le couplage de versions : un modèle dont le GGUF exige un transcribe.cpp plus récent que le build intégré est listé dans [Modèles](/vibe/docs#models) mais ne peut pas se charger tant que le moteur n’est pas mis à niveau. Cet épinglage est délibéré, car les mises à niveau du moteur sont des événements de parité, pas des mises à jour de dépendances en arrière-plan.

## Backends GPU

ggml choisit un backend pour la machine sur laquelle il s’exécute :

| Plateforme | Backend |
| --- | --- |
| macOS | Metal |
| Windows | Vulkan |
| Linux | Vulkan |

Une machine sans GPU utilisable s’exécute sur le CPU. **Paramètres → Modèles** contient **Transcrire sur le CPU** et, sous Windows et Linux, un sélecteur de périphérique GPU. Si un chargement GPU échoue, l’application réessaie sur le CPU et signale qu’elle l’a fait.

Le GPU compte surtout pour les gros modèles et les fichiers longs. Les petits modèles sur un CPU moderne peuvent être assez rapides, et le chemin CPU est la solution de repli quand un pilote ou le chargeur Vulkan manque.

## Pages liées

- [Modèles](/vibe/docs#models) pour le catalogue et les limites par famille.
- [Ligne de commande](/vibe/docs#cli) pour les options de `vibe-server` telles que `--gpu-device`.
- [Confidentialité et conception hors ligne](/vibe/docs#privacy) pour ce qui reste sur la machine.
