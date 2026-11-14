# Performances et navigation

## Changements

- Caches de sessions invalidés quand la source change, y compris ses identifiants sans changement d'ID. Catalogues : 5 minutes avec ancien résultat servi pendant un rafraîchissement ; EPG : 1 minute, avec nouvelle lecture toutes les minutes sur la chaîne sélectionnée.
- Limites par session : 48 entrées / environ 50 000 éléments de tableaux. La dernière réponse est conservée même si un catalogue seul dépasse cette cible ; ce budget ne mesure pas des octets et ne constitue pas une limite stricte de heap. Les éléments montés à l'écran peuvent aussi conserver leurs références.
- Recherche : index de noms normalisés réutilisé, Worker pour les moteurs compatibles, traitement par lots coopératifs en repli. Résultats progressifs Direct/Films/Séries. Les premiers catalogues doivent toujours être téléchargés si le fournisseur n'a pas d'API de recherche.
- M3U : parsing dans un Worker pour les grosses réponses, repli coopératif, classement des chaînes par catégorie une seule fois par chargement.
- Délai limite des requêtes fournisseur, boutons Réessayer dans les grilles/rangées et la recherche. Chargement différé des affiches/logos.
- Grille média : seules les lignes de la fenêtre sont découpées et rendues. Retour à la même affiche/position après une fiche ; tri fournisseur/A-Z/Z-A.
- Films/Séries : accès direct aux catégories avec filtre et tri. Focus des affiches distingué par rangée pour éviter les collisions avec « Continuer à regarder ».
- Retour de lecture Direct : la fenêtre contenant la chaîne est rendue avant de restaurer son focus.
- Accueil : reprise, accès Favoris/Recherche, huit dernières chaînes. Le démarrage Direct et l'option existante de reprise automatique sont conservés.
- Réglages : section Playlists et accès à la configuration à distance ; diagnostic local.

## Mesurer sur TV

Dans **Réglages → Diagnostic**, afficher les mesures de la session : dernier échantillon et P95 sur au plus 120 mesures. Rien n'est transmis.

- Premier affichage : depuis le lancement du code principal jusqu'au premier callback animation. N'inclut pas le chargement initial du bundle ni le téléchargement du catalogue.
- Réponse aux touches : keydown jusqu'au prochain callback animation. C'est un indicateur de disponibilité du thread, pas une mesure matérielle télécommande/écran.
- Recherche : appel jusqu'à l'achèvement de tous les catalogues ; les premiers résultats peuvent apparaître plus tôt.
- Lecture : affectation de la source vidéo jusqu'au premier événement `playing`.

Comparer démarrage à froid/chaud, parcours continu de 100 chaînes, grille de 10 000 films, recherches successives et zapping sur le même modèle de TV, la même playlist et le même réseau. Compléter avec le profileur webOS et l'overlay vidéo existant pour distinguer CPU, réseau et décodage. Aucun gain chiffré sur TV n'est annoncé sans ces mesures.

## Appuis prolongés de la télécommande

Le suivi du focus utilise maintenant un effet de layout, exécuté avant l'affichage de l'image, avec défilement immédiat. Les listes n'utilisent plus de scroll animé ni de fondu du surlignage. L'ancrage automatique du navigateur est désactivé dans les listes virtualisées pour éviter qu'il compense le déplacement des espaceurs.

Vérification navigateur avec répétition de touches sans relâchement : catégories (70 déplacements dans chaque sens), chaînes (180 dans chaque sens), grille de films (100 dans chaque sens). La géométrie de l'élément focalisé est contrôlée à chaque animation frame contre les zones de défilement parentes. Test réalisé en 1080p et 4K avec des données simulées ; à confirmer sur le matériel TV.
