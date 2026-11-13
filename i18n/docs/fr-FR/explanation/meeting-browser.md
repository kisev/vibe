<!-- source: 7770d2556ea9 -->

# Pourquoi le navigateur de réunion fonctionne ainsi

Un appel est plus facile à enregistrer quand Vibe héberge la page lui-même : l’application contrôle la fenêtre, sait quand un enregistrement est en cours et peut afficher une barre avec une seule action. La conception est façonnée par ce que le système d’exploitation permet réellement.

## Pourquoi un schéma d’URL plutôt que des clics https

Un navigateur ne transmet jamais un lien `https://` à une application installée à moins que cette application ne soit le navigateur par défaut. Les applications de réunion fonctionnent dans l’autre sens : elles enregistrent leur propre schéma, et leurs pages ou installateurs l’invoquent.

Vibe fait de même :

- `vibe://open/?url=https://…` ouvre la cible dans la fenêtre de navigateur de Vibe. N’importe quelle application, script ou raccourci peut l’appeler. Vibe valide l’URL en Rust et refuse tout ce qui n’est pas https et bien formé.
- **Paramètres → Enregistrement → Ouvrir dans Vibe** colle un lien dans le même chemin.

Cliquer sur un lien `https` dans Chrome, Edge ou Firefox ouvre toujours ce navigateur. Faire de Vibe le navigateur par défaut est délibérément hors périmètre : cela prendrait le contrôle de chaque lien de la machine pour servir une seule fonctionnalité.

## Pourquoi la vue de contenu est isolée

La fenêtre de contenu est une webview ordinaire avec son propre répertoire de données. Les cookies des services ne se mélangent jamais avec le stockage de l’application, aucun script n’est injecté dans la page, et les demandes de caméra et de microphone viennent de la page elle-même plutôt que de Vibe qui les accorderait au nom de l’utilisateur. La page intégrée est traitée comme du contenu web non fiable, et non comme une partie de l’application.

La barre offre adresse, retour, suivant, recharger, fermer et **Ouvrir dans le navigateur système**. Cette dernière action est la soupape pour un service qui refuse de fonctionner dans la webview intégrée.

## Pourquoi le navigateur est une liste d’autorisation

Le navigateur intégré chargeait à l’origine tout ce qu’une page demandait ; la liste des hôtes de réunion décidait seulement quels liens recevaient la barre d’enregistrement. C’est désormais une véritable frontière. Seuls les domaines que l’utilisateur a autorisés, et leurs sous-domaines en https, peuvent se charger — les pages de premier niveau et chaque ressource que la page demande. Une ressource refusée reçoit une réponse d’erreur afin que la page traite cette origine comme indisponible plutôt que de réessayer indéfiniment.

La rigueur est le but, et elle a un coût : une page qui récupère des polices ou des scripts depuis un CDN casse tant que ce CDN n’est pas autorisé. La liste des bloqués est le remède — des hôtes uniques, les plus récents d’abord, chacun avec une action **Autoriser** qui ajoute le domaine et recharge la page. La barre du navigateur propose la même chose lorsqu’elle refuse une navigation.

## Pourquoi l’enregistrement reste manuel

Chaque page de la fenêtre de navigateur affiche **Enregistrer cet appel**, et tant qu’une fenêtre de navigateur est ouverte, Vibe supprime sa propre invite d’appel externe. L’enregistrement reste manuel — appuyez sur le bouton avant ou pendant l’appel, arrêtez depuis la barre du navigateur ou la fenêtre principale. Un démarrage automatique enregistrerait des appels que l’utilisateur n’a pas demandé d’enregistrer, et ferait apparaître l’indicateur de microphone sans action explicite.

Fermer la fenêtre pendant un enregistrement demande s’il faut arrêter ou continuer l’enregistrement en arrière-plan, si bien que quitter un appel ne peut pas jeter ni poursuivre un enregistrement en silence.

## Limites

- Seuls les liens `vibe://open/` s’ouvrent automatiquement. Un clic `https` dépend de la décision de navigateur par défaut que Vibe ne prend pas.
- Les sites lourds en DRM ou hostiles à WebRTC peuvent mieux fonctionner dans le navigateur système ; **Ouvrir dans le navigateur système** est la solution de repli prise en charge.
- Windows est validé en premier. Le blocage des ressources utilise le mécanisme propre à chaque moteur : WebView2 `WebResourceRequested` sous Windows ; Linux et macOS ne bloquent actuellement que la navigation de premier niveau et sont en cours de finalisation.
- L’enregistrement des schémas Zoom, Teams et Webex est facultatif et disponible sous Windows et Linux, pas sous macOS.

## Pages liées

- [Utiliser le navigateur de réunion](/vibe/docs#use-the-meeting-browser) pour les étapes.
- [Enregistrer le microphone et l’audio du système](/vibe/docs#record-audio) pour l’enregistreur lui-même.
