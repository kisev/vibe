<!-- source: aa8415261690 -->

# Importer un modèle personnalisé

Vibe exécute les modèles GGUF via le moteur intégré. Le catalogue dans **Paramètres → Modèles** couvre les familles testées ; ce guide ajoute un modèle que le catalogue ne liste pas. [Modèles](/vibe/docs#models) est la référence pour ce que prend en charge chaque famille.

## Télécharger depuis une URL

1. Ouvrez **Paramètres → Modèles**.
1. Collez un lien direct vers un modèle dans **Télécharger le modèle** et confirmez.
1. Attendez la fin du téléchargement ; le fichier arrive dans le dossier des modèles.
1. Sélectionnez le nouveau modèle dans la liste des modèles.

Vibe accepte aussi la même requête sous forme de lien profond :

```text
vibe://download/?url=https://example.com/model.gguf
```

Une URL collée ne porte ni taille ni somme de contrôle, si bien que Vibe vérifie les octets téléchargés et l’en-tête GGUF/BIN avant d’accepter le fichier. Les entrées du catalogue dans [Modèles](/vibe/docs#models) portent une révision figée, une taille et un SHA-256.

## Utiliser un fichier sur le disque

1. Placez le fichier `.gguf` dans le dossier des modèles. Le chemin du dossier se trouve dans **Paramètres → Modèles → Dossier des modèles**, qui l’ouvre aussi.
1. Revenez à **Paramètres → Modèles** ; le fichier apparaît dans la liste des modèles installés.
1. Sélectionnez-le.

Déplacez ou renommez le dossier uniquement via **Modifier le dossier des modèles**, puis sélectionnez à nouveau le modèle.

## Quand un modèle ne se charge pas

- Le fichier doit être GGUF ou l’ancien conteneur `.bin` que le moteur accepte.
- Un modèle qui exige un transcribe.cpp plus récent que celui intégré est listé dans le catalogue mais ne peut pas encore se charger.
- Un modèle à langue fixe rejette une autre langue ; l’erreur nomme celle qui est prise en charge.

## Étapes suivantes

- [Modèles](/vibe/docs#models) pour le catalogue testé et les limites par famille.
- [Ligne de commande](/vibe/docs#cli) pour exécuter un modèle sans la fenêtre.
