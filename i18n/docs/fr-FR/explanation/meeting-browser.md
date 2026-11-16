<!-- source: 6737f12a1fc7 -->

# Navigateur de réunion

Le navigateur de réunion existe parce qu’un appel est plus facile à enregistrer quand Vibe héberge la page lui-même : l’application contrôle la fenêtre, sait quand un enregistrement est en cours et peut afficher sa propre interface avec une seule action. La conception est façonnée par ce que le système d’exploitation permet réellement.

## Pourquoi un schéma d’URL plutôt que des clics https

Un navigateur ne transmet jamais un lien `https://` à une application installée à moins que cette application ne soit le navigateur par défaut. Les applications de réunion de bureau fonctionnent dans l’autre sens : elles enregistrent leur propre schéma (`zoommtg://`, `msteams://`, `mattermost://`), et leurs propres pages ou installateurs l’invoquent.

Vibe fait la même chose honnêtement :

- Activez **Ouvrir les liens de réunion dans Vibe** et Vibe enregistre les schémas de réunion que Zoom, Teams et Webex utilisent déjà (`zoommtg://`, `msteams://`, `webex://`), en faisant correspondre chacun à l’URL web qu’il transporte. L’application valide l’URL en Rust et l’ouvre dans la fenêtre de navigateur lorsque son hôte peut se charger, le navigateur système sinon.
- Une URL `https` transmise comme argument de lancement suit le même chemin.
- Dans l’application, la source **Navigateur de réunion** de la page d’accueil et **Paramètres → Enregistrement → Ouvrir dans Vibe** collent un lien dans le même chemin.

Vibe ne fournit délibérément aucun lien `vibe://open/` de son cru : aucune page de réunion n’en émet, ce qui explique pourquoi ce premier point d’entrée a été supprimé. Cliquer sur un lien `https` dans Chrome, Edge ou Firefox ouvre toujours ce navigateur. Faire de Vibe le navigateur par défaut est délibérément hors périmètre : cela prendrait le contrôle de chaque lien de la machine pour servir une seule fonctionnalité, et cela resterait une décision de l’utilisateur.

## Pourquoi la vue de contenu est isolée

La fenêtre contient deux webviews enfants : l’interface de Vibe et la page distante. L’interface fait partie de l’application et porte les capacités de l’application ; la page est du contenu web ordinaire non fiable, sans aucune capacité, sans script injecté, et avec des demandes de caméra et de microphone venant de la page elle-même plutôt que de Vibe qui les accorderait au nom de l’utilisateur. Les deux partagent l’environnement WebView2 du processus, car WebView2 ne prend pas en charge un second répertoire de données dans un même processus.

L’interface offre l’adresse, le retour, le suivant, le rechargement, la fermeture et **Ouvrir dans le navigateur système**. Cette dernière action est la soupape pour un service qui refuse de fonctionner dans la webview intégrée. L’intégration multi-webview est ici une capacité de bureau Windows/Linux ; sous macOS, le navigateur se rabat sur une fenêtre contenant uniquement la page, sans interface, plutôt que d’échouer.

## Pourquoi le navigateur est une liste d’autorisation

Le navigateur intégré chargeait à l’origine tout ce qu’une page demandait ; la liste des hôtes de réunion décidait seulement quels liens recevaient la barre d’enregistrement. C’est désormais une véritable frontière : seuls les domaines autorisés et leurs sous-domaines peuvent se charger en https, à la fois pour les pages de premier niveau et pour chaque ressource qu’elles demandent. Une ressource refusée reçoit une réponse d’erreur, afin que la page traite cette origine comme indisponible plutôt que de réessayer indéfiniment.

La rigueur a un coût : une page qui récupère des polices ou des scripts depuis un CDN casse tant que ce CDN n’est pas autorisé. La liste des bloqués est le remède — des hôtes uniques, les plus récents d’abord, chacun avec une action **Autoriser** qui ajoute le domaine et recharge la page. La liste est dessinée dans l’interface et l’interface grandit pour l’accueillir, car une fenêtre surgissante dans une webview de 104 pixels serait rognée par la page en dessous. L’interface fait la même proposition lorsqu’elle refuse une navigation. Windows applique le blocage des ressources avec `WebResourceRequested` de WebView2 ; Linux et macOS ne bloquent actuellement que la navigation de premier niveau.

Le mode est mis en cache plutôt que lu pour chaque fenêtre, et le filtre de ressources est installé dans les deux modes, si bien que passer de `strict` à `trusted-site` atteint une page déjà ouverte lors de sa prochaine requête au lieu d’exiger une réouverture.

## Pourquoi l’enregistrement reste manuel

Chaque page du navigateur affiche **Enregistrer cet appel**, et tant qu’une fenêtre de navigateur est ouverte, l’invite de réunion du navigateur externe est supprimée. L’enregistrement reste manuel — appuyez sur le bouton avant ou pendant l’appel, arrêtez depuis l’interface ou la fenêtre principale. Un démarrage automatique enregistrerait des appels que l’utilisateur n’a pas demandé d’enregistrer, et ferait apparaître l’indicateur de microphone de l’application sans action explicite.

Fermer la fenêtre pendant un enregistrement demande s’il faut arrêter ou poursuivre l’enregistrement en arrière-plan, si bien que quitter un appel ne peut ni jeter ni poursuivre un enregistrement en silence.

## Limites

- Seul un schéma de réunion enregistré ou un argument de lancement `https` est transmis à Vibe. Un clic `https` nécessite la décision de navigateur par défaut que Vibe ne prend pas.
- Les sites lourds en DRM ou hostiles à WebRTC peuvent mieux fonctionner dans le navigateur système ; **Ouvrir dans le navigateur système** est la solution de repli prise en charge.
- Windows est validé en premier. Les autres plateformes utilisent leurs propres webviews et se rabattent sur le navigateur système si la fenêtre ne peut pas héberger l’appel.

Les faits et les règles de la liste d’autorisation sont dans [Référence du navigateur de réunion](../reference/meeting-browser.md) ; les étapes sont dans [Utiliser le navigateur de réunion](../how-to/use-the-meeting-browser.md).
