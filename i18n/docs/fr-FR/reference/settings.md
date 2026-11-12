<!-- source: dd9e41dac7e3 -->

# Paramètres et configuration

Les paramètres résident dans `app_config.json` dans le répertoire de configuration de l’application. Le fichier est fait pour être lu et modifié : Vibe le surveille et applique une modification externe sans redémarrage. **Paramètres → Agents → Fichier de configuration** l’ouvre.

## Emplacement du fichier de configuration

| Plateforme | Répertoire |
| --- | --- |
| macOS | `~/Library/Application Support/github.com.thewh1teagle.vibe` |
| Windows | `%appdata%\github.com.thewh1teagle.vibe` |
| Linux | `~/.config/github.com.thewh1teagle.vibe` |

Le répertoire conserve son identifiant amont, donc son nom est inchangé depuis les versions précédentes.

## Sections de paramètres

| Section | Contenu |
| --- | --- |
| Général | Langue d’affichage, thème, mises à jour, réduction dans la zone de notification, lancement au démarrage, empêcher la veille |
| Confidentialité | Si les projets sont enregistrés, et la politique de confidentialité |
| Transcription | Langue, export automatique, son de fin et focus, dossier des projets |
| Modèles | Choix CPU/GPU, périphérique GPU, catalogue de modèles, modèle de séparation des intervenants |
| Réglages | Options Whisper, traitement audio, mémoire du modèle et délai de déchargement |
| Enregistrement | Navigateur de réunion, détection des réunions, transcription automatique, raccourci d’enregistrement, autorisations sous macOS |
| Dictée | Raccourci de dictée et mode d’activation |
| Assistant IA | Résumés et tâches de dictée, connexion à la plateforme |
| Téléphone | Transfert depuis le téléphone, association, appareils associés |
| Agents | API locale, compétence d’agent, fichier de configuration |
| Avancé | Journaux, diagnostics et contrôles de développeur |

## Valeurs utiles

| Groupe de clés | Signification |
| --- | --- |
| `transcription.*` | Langue, prompt, diarisation, horodatages, découpage des enregistrements longs |
| `model.*` | Modèle sélectionné, noms d’affichage, périphérique GPU, bascule CPU uniquement, délai de déchargement |
| `transcript.*` | Format d’exportation, horodatages, intervenants, export automatique |
| `recording.*` | Périphériques d’entrée et de sortie, détection des réunions, raccourci d’enregistrement |
| `ai.*` | Plateforme, URL de base, clé, modèle, prompt et bascules par tâche |
| `general.updateChannel` | `stable`, `beta` ou `dev` |
| `handoff.pairing` | Appareils téléphoniques associés et hachages d’informations d’identification |

Les noms exacts des champs sont assez stables pour être modifiés, mais l’application possède le schéma : changez une valeur via l’interface des paramètres quand elle existe, et laissez l’application réécrire le fichier plutôt que de le remplacer en entier.

## Pages liées

- [Changer de canal de mise à jour](/vibe/docs#switch-update-channels) pour le réglage du canal.
- [Résumer une transcription](/vibe/docs#summarize-transcripts) pour la connexion à l’IA.
- [Transcrire depuis votre téléphone](/vibe/docs#transcribe-from-a-phone) pour les réglages du transfert.
