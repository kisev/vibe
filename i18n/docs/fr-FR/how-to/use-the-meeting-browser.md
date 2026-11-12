<!-- source: fa863fbcee4b -->

# Utiliser le navigateur de réunion

Vibe peut héberger un appel dans sa propre fenêtre avec une barre toujours au premier plan dont l’action principale est **Enregistrer cet appel**. La fenêtre utilise la webview de la plateforme ; [Pourquoi le navigateur de réunion fonctionne ainsi](/vibe/docs#meeting-browser) couvre l’isolation et les limites.

## Ouvrir un appel dans Vibe

Utilisez l’un de ces chemins :

- Ouvrez **Paramètres → Enregistrement → Ouvrir dans Vibe**, collez le lien et ouvrez-le.
- Depuis une autre application, un script ou un raccourci, appelez `vibe://open/?url=https://…`. Vibe accepte uniquement les URL https bien formées et refuse tout le reste par une boîte de dialogue.
- Activez **Ouvrir les liens de réunion dans Vibe** sous **Paramètres → Enregistrement** pour enregistrer les liens Zoom, Teams et Webex. Disponible sous Windows et Linux, pas sous macOS.

Cliquer sur un lien https dans Chrome, Edge ou Firefox ouvre toujours ce navigateur. Vibe ne s’enregistre pas comme navigateur par défaut.

## Obtenir la barre d’enregistrement

**Paramètres → Enregistrement → Hôtes de réunion** liste les hôtes qui reçoivent la barre de réunion. Les valeurs par défaut sont `telemost.yandex.ru` et `stream.wb.ru`.

- Ajoutez un hôte pour faire de ses liens des sessions enregistrables.
- Retirez un hôte pour perdre la barre ; ses liens s’ouvrent toujours dans la fenêtre de navigateur.

La correspondance se fait par nom d’hôte en https, si bien que `sub.telemost.yandex.ru` correspond à une entrée `telemost.yandex.ru` alors qu’une URL `http` non. La liste est un filtre de commodité, pas une frontière de sécurité : chaque lien https s’ouvre dans la fenêtre, mais seuls les hôtes listés reçoivent la barre.

## Enregistrer un appel

1. Ouvrez la réunion dans Vibe.
1. Appuyez sur **Enregistrer cet appel** avant ou pendant l’appel.
1. Arrêtez depuis la barre ou depuis la fenêtre principale.

L’enregistrement est manuel ; une fenêtre de réunion ne démarre jamais l’enregistrement d’elle-même. L’enregistreur capture le microphone configuré et, lorsqu’il est activé, la boucle d’audio du système, si bien que les deux côtés de l’appel sont enregistrés.

Fermer la fenêtre pendant un enregistrement demande s’il faut arrêter ou continuer l’enregistrement en arrière-plan.

## Revenir au navigateur système

Si un service refuse de fonctionner dans la webview intégrée, utilisez **Ouvrir dans le navigateur système** dans la barre. C’est la solution de repli prise en charge pour les sites lourds en DRM ou hostiles à WebRTC.

## Étapes suivantes

- [Pourquoi le navigateur de réunion fonctionne ainsi](/vibe/docs#meeting-browser) explique le schéma d’URL, la webview isolée et la règle de l’enregistrement manuel.
- [Enregistrer le microphone et l’audio du système](/vibe/docs#record-audio) couvre l’enregistrement hors d’un appel.
