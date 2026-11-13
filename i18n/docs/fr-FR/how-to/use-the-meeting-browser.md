<!-- source: cc4651e4e37d -->

# Utiliser le navigateur de réunion

Vibe peut héberger un appel dans sa propre fenêtre avec une barre toujours au premier plan dont l’action principale est **Enregistrer cet appel**. La fenêtre utilise la webview de la plateforme ; [Pourquoi le navigateur de réunion fonctionne ainsi](/vibe/docs#meeting-browser) couvre l’isolation et les limites.

## Ouvrir un appel dans Vibe

Utilisez l’un de ces chemins :

- Ouvrez **Paramètres → Enregistrement → Ouvrir dans Vibe**, collez le lien et ouvrez-le.
- Depuis une autre application, un script ou un raccourci, appelez `vibe://open/?url=https://…`. Vibe accepte uniquement les URL https bien formées et refuse tout le reste par une boîte de dialogue.
- Activez **Ouvrir les liens de réunion dans Vibe** sous **Paramètres → Enregistrement** pour enregistrer les liens Zoom, Teams et Webex. Disponible sous Windows et Linux, pas sous macOS.

Cliquer sur un lien https dans Chrome, Edge ou Firefox ouvre toujours ce navigateur. Vibe ne s’enregistre pas comme navigateur par défaut.

## Autoriser les sites que vous utilisez

**Paramètres → Enregistrement → Domaines autorisés** est la liste d’autorisation du navigateur. Elle démarre vide : ajoutez chaque domaine que vous voulez ouvrir, et ses sous-domaines sont inclus automatiquement. La correspondance se fait par nom d’hôte en https — une URL `http` ne se charge jamais.

La liste est une frontière, pas un filtre. Un lien vers un hôte hors de celle-ci est refusé, tout comme un script, une police ou une image qu’une page autorisée demande à une origine non listée. Chaque hôte refusé apparaît sous **Bloqués** avec une action **Autoriser** ; l’autoriser ajoute le domaine et recharge la page pour que les ressources refusées soient réessayées.

Une liste stricte peut casser une page dont les ressources viennent d’un CDN tant que ce CDN n’est pas autorisé. La liste Bloqués est le remède, et la barre du navigateur propose la même chose lorsqu’elle refuse une navigation. Tant qu’une fenêtre de navigateur est ouverte, Vibe supprime sa propre invite d’appel.

## Enregistrer un appel

Les commandes d’enregistrement de la barre du navigateur sont présentes sur chaque page autorisée, pas seulement sur une liste d’hôtes.

1. Ouvrez la réunion dans Vibe.
1. Appuyez sur **Enregistrer cet appel** avant ou pendant l’appel.
1. Arrêtez depuis la barre du navigateur ou depuis la fenêtre principale.

L’enregistrement est manuel ; une fenêtre de réunion ne démarre jamais l’enregistrement d’elle-même. L’enregistreur capture le microphone configuré et, lorsqu’il est activé, la boucle d’audio du système, si bien que les deux côtés de l’appel sont enregistrés.

Fermer la fenêtre pendant un enregistrement demande s’il faut arrêter ou continuer l’enregistrement en arrière-plan.

## Revenir au navigateur système

Si un service refuse de fonctionner dans la webview intégrée, utilisez **Ouvrir dans le navigateur système** dans la barre. C’est la solution de repli prise en charge pour les sites lourds en DRM ou hostiles à WebRTC.

## Étapes suivantes

- [Pourquoi le navigateur de réunion fonctionne ainsi](/vibe/docs#meeting-browser) explique le schéma d’URL, la webview isolée, le compromis de la liste d’autorisation et la règle de l’enregistrement manuel.
- [Enregistrer le microphone et l’audio du système](/vibe/docs#record-audio) couvre l’enregistrement en dehors d’un appel.
