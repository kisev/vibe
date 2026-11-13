---
version: unreleased
date: 
title: "À venir"
source: 4462099ac37f
---

## New

- 🧪 **Comparaison de modèles, côte à côte** — Paramètres → Modèles exécute un court extrait ou un fichier dans chaque modèle installé que vous choisissez et ouvre des résultats en pleine fenêtre : une colonne par modèle avec son temps et son nombre de mots, un défilement indépendant, un sélecteur de référence, et une mise en surbrillance au niveau du mot qui barre les mots manqués et marque les mots en trop
- 🗣️ **Séparation des locuteurs dans la comparaison** — un seul commutateur ajoute des libellés de voix à la transcription de chaque modèle, si bien qu’une même exécution montre quel modèle a entendu les mots et qui les a dits
- 🔄 **Trois canaux de mise à jour** — suivez Release, Beta ou Dev, consultez la version actuelle et la date de la dernière vérification, et lancez vous-même une vérification d’un simple bouton au lieu d’attendre le prochain démarrage
- 🗺️ **Le site a une feuille de route** — une nouvelle page liste chaque changement non archivé directement depuis les fichiers de planification du projet, si bien que ce qui arrive n’est jamais une devinette écrite à la main
- 🌐 **Les réunions s’ouvrent dans Vibe** — les liens de réunion s’ouvrent dans un navigateur intégré avec son propre menu (retour, suivant, recharger, ouvrir dans le navigateur système, fermer) et une liste d’hôtes de réunion modifiable ; Vibe peut s’enregistrer comme gestionnaire des liens Zoom, Teams et Webex quand vous le lui demandez, et un appel détecté vous invite à l’enregistrer avec votre microphone et l’audio système
- 🌍 **Le site parle votre langue** — un sélecteur de langue dans l’en-tête change la page sur place, conserve `?lang=` dans l’URL afin que les liens partagés portent le choix, et applique une disposition de droite à gauche. `/changelog/dev` est désormais l’adresse permanente des notes de dev

## Improved

- 🧭 **Les mises à jour dev ont leur propre ligne** — les builds dev sont livrés en tant que préversions `-dev.N` sur le canal Dev, les versions candidates sont produites pour Beta, et le journal des modifications dev conserve une URL stable au fil des builds
- 🏷️ **Les comparaisons nomment correctement les modèles** — les résultats et les boîtes de dialogue utilisent le nom canonique du modèle et l’orthographe de quantification du catalogue au lieu de mettre en majuscules un nom de fichier
- 🤫 **La détection des réunions reste discrète** — la fenêtre de réunion de Vibe elle-même supprime l’invite de détection externe, et l’état d’enregistrement est partagé, si bien qu’un appel déjà ouvert dans Vibe ne propose jamais d’enregistrer deux fois
- 🕵️ **Rien ne quitte votre appareil** — toute la télémétrie a disparu : plus de clé d’analyse, aucun ping au lancement ni lors d’une action, et aucune bannière de don sur le site. Les journaux, diagnostics et exports restent sur le disque, et ne partent que lorsque vous les envoyez vous-même
- 📚 **La documentation suit Diátaxis** — les tutoriels, les guides pratiques, la référence et l’explication sont séparés, dans le dépôt comme sur le site, si bien que « comment puis-je… » et « que signifie ceci » ne partagent plus une seule longue page
- 🔗 **Les notes de version renvoient au journal des modifications traduit** — chaque corps de version renvoie à `https://kisev.github.io/vibe/changelog/<version>`, si bien que le lecteur choisit sa propre langue au lieu de l’anglais

## Fixed

- 🎙️ **Chaque modèle peut exécuter la comparaison** — GigaAM et Parakeet ne refusent plus une exécution pour un modèle VAD manquant ; le laboratoire fournit son détecteur intégré, si bien que les résultats ne diffèrent que par le modèle
- 📍 **La comparaison passe en premier** — le laboratoire a été déplacé au-dessus du long catalogue de modèles dans Paramètres → Modèles, si bien qu’il est la première chose que vous voyez
- 🔍 **Les longues transcriptions restent mises en surbrillance** — le diff n’abandonne plus au-delà de mille mots en signalant zéro différence ; lorsqu’un texte est réellement trop long, la colonne l’indique à la place
- 🔁 **Les canaux de mise à jour gardent leurs noms et leur ligne** — le sélecteur affiche Release, Beta et Dev dans chaque langue, et Beta ne propose que des versions candidates au lieu de refléter le build stable
- 🔌 **L’interrupteur du serveur API reste éteint** — l’interrupteur Agents est votre choix et survit à un redémarrage ; la lecture des métadonnées des modèles au lancement ne laisse plus de serveur tourner derrière lui
- 🪟 **La fenêtre de réunion peut être fermée** — ses commandes vivent dans la fenêtre elle-même, si bien qu’une page qui ne se charge pas ne laisse plus une fenêtre sans issue
- 🌍 **Le site traduit toute la page** — changer de langue ne laisse plus de sections en anglais, et le journal des modifications suit aussi la langue choisie
