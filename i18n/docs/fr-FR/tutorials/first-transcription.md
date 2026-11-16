<!-- source: a0b0bbb0302c -->

# Transcrire votre premier enregistrement

Ce tutoriel transcrit un fichier multimédia avec le modèle par défaut. Il suppose Vibe installé et le modèle par défaut téléchargé ; [Installer Vibe](/vibe/docs#install) couvre cette étape.

## Ajouter un fichier

1. Ouvrez Vibe.
1. Déposez un fichier audio ou vidéo sur la zone de dépôt, ou choisissez **Fichier** et sélectionnez-en un.
1. Attendez que le fichier apparaisse dans la file d’attente.

Vibe accepte les formats de [Formats pris en charge](/vibe/docs#formats). Il normalise le média avec ffmpeg avant la transcription, si bien qu’un conteneur inhabituel peut fonctionner quand même.

## Lancer la transcription

1. Laissez la langue sur automatique, ou choisissez une langue quand la détection se trompe.
1. Appuyez sur **Transcrire**.
1. Suivez l’aperçu en direct. **Annuler** arrête l’exécution sans supprimer l’enregistrement.

L’application de bureau démarre `vibe-server` en arrière-plan et lui envoie l’audio en HTTP local. Le serveur charge le modèle sélectionné, transcrit et renvoie des segments horodatés.

## Lire le résultat

La transcription s’ouvre à la fin de l’exécution. Chaque ligne est modifiable sur place, et la modification est enregistrée avec le projet.

Pour nommer les intervenants, activez **Reconnaître les intervenants** sous **Plus d’options** avant l’exécution. La diarisation utilise le modèle Nemotron-3 et nomme jusqu’à 8 intervenants.

## Exporter

Ouvrez la boîte de dialogue d’exportation et choisissez un format : TXT, Markdown, SRT, VTT, HTML, JSON, CSV, DOCX ou PDF. [Formats pris en charge](/vibe/docs#formats) explique ce que chacun contient.

## Étapes suivantes

- [Enregistrer le microphone et l’audio du système](/vibe/docs#record-audio) quand l’audio est un appel en direct plutôt qu’un fichier.
- [Modèles](/vibe/docs#models) quand vous avez besoin d’une autre langue, de vitesse ou de précision.
- [Ligne de commande](/vibe/docs#cli) pour exécuter le même moteur sans la fenêtre.
