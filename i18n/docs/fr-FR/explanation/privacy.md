<!-- source: 2459ffcb4329 -->

# Confidentialité et conception hors ligne

Vibe est conçu pour que le chemin de transcription normal ne nécessite ni compte ni service cloud. L’application démarre un serveur local, le serveur charge un modèle depuis le disque, et l’audio est décodé et transcrit sur la même machine.

## Ce qui reste local

- Les fichiers audio, les enregistrements, les exportations et les transcriptions.
- Les modèles et les binaires ffmpeg.
- L’historique des projets dans le dossier des projets.
- L’API HTTP locale entre l’application de bureau et `vibe-server`, liée à la boucle locale.

L’application n’envoie aucune télémétrie. **Signaler un problème** construit un ticket prérempli à partir des diagnostics locaux et ouvre GitHub ; rien n’est soumis avant que vous ne le relisiez et l’envoyiez.

## Où le réseau est utilisé

| Fonctionnalité | Contact réseau |
| --- | --- |
| Téléchargement de modèle | L’hôte qui sert le fichier de modèle |
| Transcription depuis un lien | L’hôte du média, et GitHub pour le binaire yt-dlp |
| Vérification des mises à jour | Le fichier de canal du site Web |
| Résumé IA avec Claude ou OpenAI | Le fournisseur configuré |
| Résumé IA avec Ollama | L’URL Ollama, locale par défaut |
| Transfert depuis le téléphone | Un relais chiffré de bout en bout entre le téléphone et cet ordinateur |

Le moteur de transcription lui-même n’a aucun accès réseau.

## Transfert depuis le téléphone

Le téléphone et le bureau se connectent via iroh. Le relais transporte du trafic chiffré de bout en bout, si bien que le relais transmet des octets qu’il ne peut pas lire ; la transcription se fait toujours sur cet ordinateur, et Vibe doit rester ouvert pour que le transfert fonctionne.

## Compromis

- Les modèles locaux coûtent de l’espace disque et utilisent le CPU ou le GPU de la machine. [Choix du moteur et du GPU](/vibe/docs#engine) explique la répartition.
- Un résumé cloud envoie le texte de la transcription au fournisseur que vous choisissez. Laissez la plateforme sur Ollama pour qu’elle reste locale.
- Les mises à jour sont vérifiées depuis des fichiers statiques sur le site Web, ce qui révèle que l’application a vérifié un canal, pas ce qu’elle a transcrit.

## Pages liées

- [Paramètres et configuration](/vibe/docs#settings) pour le fichier de configuration local.
- [Transcrire depuis votre téléphone](/vibe/docs#transcribe-from-a-phone) pour les étapes du transfert.
- [Résumer une transcription](/vibe/docs#summarize-transcripts) pour les plateformes d’IA.
