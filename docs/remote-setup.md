# Configuration à distance — ipvizion.app

Le code est prêt pour le domaine **ipvizion.app**. Aucun domaine, hébergement ou déploiement n'a été créé. Le build TV de production vise `https://ipvizion.app` via `.env.production` ; tant que le domaine et le service ne sont pas en ligne, la TV affiche « service indisponible » et la saisie locale reste disponible.

## Essayer en local

Avec Node.js 22 et les dépendances installées :

```sh
npm run build
npm run remote
# Dans un deuxième terminal :
npm run dev
```

Ouvrir l'app TV sur `http://localhost:5173`, choisir la langue puis **Configurer à distance**. Ouvrir `http://localhost:8789/remote.html` dans un autre onglet et entrer le code TV. Les profils présents sur la TV sont présentés sans leurs mots de passe ; modifier une source exige de ressaisir ses identifiants. Les modifications et suppressions ne s'appliquent qu'au clic sur **Enregistrer sur la TV**, après validation des sources modifiées.

Les adresses localhost sont destinées au test sur le même ordinateur. Pour un vrai téléphone, utiliser une origine HTTPS accessible aux deux appareils et reconstruire avec `VITE_REMOTE_CONFIG_URL`. Web Crypto nécessite un contexte sécurisé ; il n'y a pas de repli vers un transfert en clair si une ancienne TV ne le supporte pas.

## Déployer plus tard

1. Acheter le domaine et disposer d'un serveur Docker exposant les ports TCP 80/443 (UDP 443 facultatif).
2. Faire pointer l'enregistrement DNS A de `ipvizion.app` vers ce serveur. Ne créer un AAAA que si IPv6 est réellement configuré.
3. Copier le projet sur le serveur et lancer :

```sh
docker compose -f server/compose.yaml up -d --build
```

Caddy obtient et renouvelle le certificat HTTPS. Le conteneur Node ne publie aucun port ; seule la passerelle Caddy y accède. `TRUST_PROXY=1` est activé dans ce réseau privé pour attribuer les limites de requêtes à l'adresse client. Ne pas exposer le port Node avec ce réglage. En exécution directe, laisser `TRUST_PROXY` désactivé.

4. Vérifier `https://ipvizion.app/health` et la page d'accueil mobile.
5. Construire et empaqueter l'app TV avec `npm run build` puis `npm run package` (outils LG nécessaires). Valider le scan et la réception depuis une TV physique et un téléphone en 4G.

Le service est volontairement **mono-instance**, avec 1 000 sessions simultanées maximum et stockage en mémoire. Un redémarrage invalide les codes en cours mais ne touche pas les playlists déjà enregistrées sur les TV. Ne pas multiplier les instances sans remplacer le stockage mémoire par un stockage partagé avec expiration et transitions atomiques. Les images Docker utilisent les branches maintenues Node 22 et Caddy 2 ; épingler leurs digests lors d'un déploiement reproductible.

## Protocole

- La TV crée une paire RSA-OAEP 2048 bits / SHA-256 et conserve la clé privée uniquement en mémoire.
- `POST /api/sessions` enregistre la clé publique et les noms/types/ID des sources, jamais les identifiants IPTV. Le service crée un ID et deux jetons indépendants de 256 bits, plus un code de 8 chiffres. Durée : 10 minutes.
- Le QR contient le jeton téléphone dans le fragment de l'URL. Le code alternatif est réclamable une fois ; 5 essais par minute et par IP.
- Le téléphone chiffre la configuration avec une clé AES-GCM 256 bits aléatoire, elle-même chiffrée pour la TV avec RSA-OAEP.
- `POST /api/sessions/:id/submit` envoie l'enveloppe et un identifiant de soumission. Le téléphone ne peut ni lire cette enveloppe via l'API ni accuser réception à la place de la TV.
- La TV interroge le relais toutes les deux secondes, déchiffre, contrôle le schéma et authentifie chaque source modifiée depuis sa propre connexion. Aucun proxy IPTV côté serveur.
- Une seule écriture durable remplace la configuration. En cas d'erreur de validation ou de stockage, rien n'est remplacé.
- `POST /api/sessions/:id/ack` confirme `applied` ou `error` et supprime l'enveloppe. Les renvois de la même soumission sont idempotents ; si l'accusé de réception est perdu, la TV le retente sans réappliquer la configuration.
- Le téléphone annonce le succès uniquement après cet accusé. L'état final reste lisible jusqu'à l'expiration, même après fermeture de l'écran TV.

HTTPS reste indispensable pour authentifier le serveur et protéger les jetons. Le chiffrement protège le contenu du relais au repos en mémoire ; il ne protège pas contre un serveur compromis qui modifierait le JavaScript mobile ou substituerait une clé. Pas de journalisation des corps, jetons ou URL sensibles. Les identifiants restent dans le stockage local de la TV, comme auparavant.

## Vérifications

```sh
npm test
npm run test:remote
npm run build
```

Tests inclus : séparation des rôles, expiration, brute force du code, soumission dupliquée, correction après rejet, chiffrement et intégrité, invalidation des caches, TTL EPG et échec de stockage. Un scénario navigateur avec fournisseur local simulé a vérifié le refus d'un mot de passe incorrect puis la sauvegarde et la confirmation sur les deux écrans. Aucune validation sur TV physique n'est encore revendiquée.
