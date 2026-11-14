<div align="center">

<img src="public/icon-source.png" alt="Vizion" width="140" />

# Vizion

**Lecteur IPTV pour LG webOS — rapide, sobre et pensé pour la télécommande.**

[![webOS](https://img.shields.io/badge/LG-webOS-A50034?style=flat-square)](https://webostv.developer.lge.com/)
[![Preact](https://img.shields.io/badge/Preact-10-673AB8?style=flat-square&logo=preact&logoColor=white)](https://preactjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/tests-Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Licence 0BSD](https://img.shields.io/badge/licence-0BSD-2EA44F?style=flat-square)](LICENSE)

[Fonctionnalités](#-fonctionnalités) ·
[Démarrage](#-démarrage-rapide) ·
[Installation sur TV](#-installer-sur-une-tv-lg) ·
[Configuration à distance](#-configuration-à-distance) ·
[Architecture](#-architecture)

</div>

---

## ✨ Fonctionnalités

| | |
|---|---|
| 📡 **Sources multiples** | Serveurs **Xtream Codes** et playlists **M3U**, plusieurs profils par TV. |
| 📺 **Direct** | Catégories, liste de chaînes virtualisée, guide EPG, aperçu vidéo en sourdine (optionnel), repli automatique HLS → MPEG-TS. |
| 🎬 **Films & Séries** | Rangées par genre, grilles triables (fournisseur, A‑Z, Z‑A), fiches détaillées, saisons et épisodes. |
| ⏯️ **Reprise** | « Continuer à regarder », dernières chaînes, reprise automatique de la dernière chaîne au démarrage. |
| ⭐ **Favoris & Recherche** | Favoris par profil, recherche globale dans un Web Worker avec clavier à l'écran. |
| 📱 **Configuration à distance** | Scannez un QR code avec votre téléphone pour saisir vos sources — chiffrées de bout en bout. |
| 🎨 **Apparence** | 6 thèmes (OLED, Ardoise, Bleu nuit, Ambre, Prune, Forêt) × 5 couleurs d'accent. |
| 🌍 **Langues** | Français, English, Español, العربية (interface en miroir RTL). |
| ⚡ **Performances** | Parsing M3U en Worker, rendu fenêtré des grandes listes, panneau de diagnostic local (P95 touches, lecture, recherche). |

> [!NOTE]
> Vizion est **uniquement un lecteur**. Il ne fournit aucune chaîne ni aucun contenu : vous utilisez vos propres abonnements et playlists, dans le respect des droits applicables.

## 🚀 Démarrage rapide

Prérequis : **Node.js 22** et npm.

```sh
git clone https://github.com/BruskKurt/vizion.git
cd vizion
npm install
npm run dev
```

L'app s'ouvre sur `http://localhost:5173`. Naviguez au clavier : flèches, <kbd>Entrée</kbd>, <kbd>Retour arrière</kbd> ou <kbd>Échap</kbd> pour « Retour ».

> [!TIP]
> Dans un navigateur, le CORS bloque souvent les appels directs aux serveurs IPTV. Lancez le proxy local (`npm run proxy`, port 8788) et construisez avec `VITE_PROXY=http://localhost:8788/`. Sur TV, les appels sont directs.

### Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement Vite |
| `npm run build` | Vérification TypeScript + build de production dans `dist/` |
| `npm test` | Tests unitaires (Vitest + jsdom) |
| `npm run test:remote` | Tests du relais de configuration (`node --test`) |
| `npm run proxy` | Proxy CORS de développement |
| `npm run sim` | Build + lancement dans le simulateur webOS |
| `npm run package` | Génère le paquet `.ipk` dans `build/` |
| `npm run remote` | Lance le relais de configuration à distance en local |

## 📦 Installer sur une TV LG

1. Installez le CLI webOS :
   ```sh
   npm i -g @webosose/ares-cli
   ```
2. Activez le **mode développeur** sur la TV et enregistrez-la avec `ares-setup-device`.
3. Construisez et empaquetez :
   ```sh
   npm run package
   ```
4. Installez et lancez :
   ```sh
   ares-install -d <votre-tv> build/*.ipk
   ares-launch  -d <votre-tv> io.nowave.vizion
   ```

## 📱 Configuration à distance

Saisir une URL et un mot de passe à la télécommande est pénible. Vizion affiche un **QR code** (ou un code à 8 chiffres) : le téléphone envoie la configuration à la TV via un petit relais.

```
 Téléphone ──(AES‑GCM + RSA‑OAEP)──▶ Relais ipvizion.app ──▶ TV (déchiffre, valide, enregistre)
```

- La clé privée reste **en mémoire sur la TV** ; le relais ne voit qu'une enveloppe chiffrée.
- Sessions de 10 minutes, jetons de 256 bits, limitation des essais, aucune journalisation des données sensibles.
- La TV valide chaque source elle-même avant d'écrire ; en cas d'erreur, rien n'est remplacé.

> [!IMPORTANT]
> Le relais public `ipvizion.app` n'est pas encore en ligne. D'ici là, la TV affiche « service indisponible » et la saisie à la télécommande reste disponible.

Le relais (`server/`) se déploie avec Docker + Caddy (HTTPS automatique) :

```sh
docker compose -f server/compose.yaml up -d --build
```

Détails du protocole, essai en local et déploiement : [`docs/remote-setup.md`](docs/remote-setup.md).

## 🧱 Architecture

```
src/
├── app.tsx              # Shell : routage, gestion du bouton Retour, focus
├── data/                # Fournisseurs Xtream / M3U, cache, sessions
│   ├── xtream/          #   client + mappers API Xtream
│   └── m3u/             #   parser M3U (Web Worker)
├── screens/             # Accueil, Direct, Films, Séries, Recherche, Favoris, Lecteur
├── navigation/          # Navigation spatiale, mémoire de focus, défilement
├── profiles/            # Profils, favoris, reprise, réglages (localStorage)
├── remote-config/       # Appairage TV ↔ téléphone, chiffrement Web Crypto
├── remote/              # Mapping des touches de la télécommande
├── i18n/                # Traductions FR / EN / ES
├── appearance/          # Thèmes et couleurs d'accent
└── diagnostics/         # Mesures de performance locales
server/                  # Relais de configuration à distance (Node + Caddy)
scripts/                 # Packaging .ipk et proxy CORS de dev
```

**Stack** : [Preact](https://preactjs.com/) + [@preact/signals](https://preactjs.com/guide/v10/signals/), [Norigin Spatial Navigation](https://github.com/NoriginMedia/Norigin-Spatial-Navigation), Vite, TypeScript, Vitest. Cible de build ES2019 pour les moteurs web des TV.

Pour en savoir plus sur les choix de performance et de navigation : [`docs/performance-navigation.md`](docs/performance-navigation.md).

## 💛 Soutenir le projet

Vizion vous plaît ? Vous pouvez soutenir son développement sur **[nowave.io/vizion/donate](https://nowave.io/vizion/donate)** (aussi accessible depuis l'app via le QR code *Donate*).

## 🙏 Crédits

- Police [Inter](https://rsms.me/inter/) — SIL Open Font License ([`src/assets/fonts/Inter-OFL.txt`](src/assets/fonts/Inter-OFL.txt))

## 📄 Licence

[0BSD](LICENSE) : faites-en ce que vous voulez — utiliser, copier, modifier, vendre — sans obligation de citer l'auteur. La police Inter reste sous sa propre licence (OFL).

---

<div align="center">
<sub>Fait avec ❤️ par <a href="https://nowave.io">Nowave</a></sub>
</div>
