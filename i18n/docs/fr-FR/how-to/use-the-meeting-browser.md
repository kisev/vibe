<!-- source: a039b159d4fd -->

# Utiliser le navigateur de réunion

Vibe peut héberger un appel dans sa propre fenêtre basée sur Chromium : l’interface de l’application (adresse, retour, suivant, rechargement, ouverture externe, fermeture et **Enregistrer cet appel**) occupe le haut, et la page remplit le reste de cette même fenêtre. Il n’y a pas de fenêtre de barre séparée. Voir [Référence du navigateur de réunion](../reference/meeting-browser.md) pour les schémas d’URL et la liste d’autorisation, et [l’explication](../explanation/meeting-browser.md) pour comprendre pourquoi ce mécanisme fonctionne ainsi.

## Ouvrir un appel dans Vibe

Utilisez l’un de ces chemins :

- Depuis une autre application ou le système : activez **Ouvrir les liens de réunion dans Vibe** sous **Paramètres → Enregistrement** pour enregistrer les liens Zoom, Teams et Webex (Windows et Linux, pas macOS). L’application valide l’URL mise en correspondance et l’ouvre dans la fenêtre de navigateur lorsque son hôte peut se charger, le navigateur système sinon.
- Dans Vibe : la source **Navigateur de réunion** de la page d’accueil, ou **Paramètres → Enregistrement → Ouvrir dans Vibe** ; collez le lien et appuyez sur **Ouvrir dans Vibe**.
- L’hôte du lien doit figurer dans la liste d’autorisation ; la navigation de premier niveau et les ressources d’origine croisée en dehors de celle-ci sont refusées. Les commandes d’enregistrement de l’interface sont présentes sur chaque page autorisée.

Cliquer sur un lien https dans Chrome, Edge ou Firefox ouvre toujours ce navigateur. Vibe ne s’enregistre pas comme navigateur par défaut.

## Enregistrer un appel

1. Ouvrez la réunion dans Vibe.
1. Appuyez sur **Enregistrer cet appel** dans l’interface de la fenêtre avant ou pendant l’appel.
1. Arrêtez depuis l’interface ou depuis la fenêtre principale.

L’enregistrement est manuel ; une fenêtre de réunion ne démarre jamais l’enregistrement d’elle-même. L’enregistreur capture le microphone configuré et, lorsqu’il est activé, la boucle d’audio du système, si bien que les deux côtés de l’appel sont enregistrés.

Les sélecteurs de microphone et de haut-parleurs de l’interface modifient les mêmes périphériques que ceux utilisés par la fenêtre principale, si bien qu’un appel peut être routé sans la quitter. Pendant qu’un enregistrement est en cours, ils sont désactivés et nomment les périphériques capturés ; une source que l’exécution ne capture pas affiche **Aucun**.

Fermer la fenêtre pendant un enregistrement demande s’il faut arrêter ou poursuivre l’enregistrement en arrière-plan.

## Autoriser les sites que vous utilisez

**Paramètres → Enregistrement → Domaines autorisés** est la liste d’autorisation du navigateur ; elle démarre vide. Ajoutez chaque domaine dont vous avez besoin et ses sous-domaines sont inclus en https.

Seuls les domaines listés peuvent se charger. Un lien vers un autre hôte est refusé, tout comme un script, une police ou une image qu’une page autorisée récupère depuis une origine non listée. Les hôtes refusés apparaissent sous **Bloqués** avec une action **Autoriser** qui ajoute le domaine et recharge la page. L’interface propose la même chose lorsqu’elle refuse une navigation.

La liste stricte peut casser une page dont les ressources viennent d’un CDN tant que ce CDN n’est pas autorisé ; c’est le compromis voulu, et la liste des bloqués rend la correction possible en un clic.

## Revenir au navigateur système

Si un service refuse de fonctionner dans la webview intégrée, utilisez **Ouvrir dans le navigateur système** dans l’interface. Le navigateur système est la solution de repli prise en charge pour les sites lourds en DRM ou hostiles à WebRTC.

Sous macOS, le navigateur intégré n’a pas d’interface dans la fenêtre : la page s’ouvre dans une fenêtre contenant uniquement la page, l’enregistrement reste disponible depuis la fenêtre principale, et le navigateur système est la solution de repli pour tout l’appel.
