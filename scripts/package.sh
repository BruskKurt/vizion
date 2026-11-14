#!/usr/bin/env bash
set -euo pipefail
npm run build
# appinfo.json et icônes sont dans public/ -> copiés tels quels dans dist/ par Vite
mkdir -p build
rm -f build/*.ipk

command -v ares-package >/dev/null 2>&1 || {
  echo "ERREUR : 'ares-package' introuvable. Installe le CLI webOS : npm i -g @webosose/ares-cli" >&2
  exit 1
}

# ares-cli 3.2.4 a un bug de nettoyage post-packaging (`rimraf is not a function`)
# qui le fait sortir en erreur ALORS QUE le .ipk est correctement écrit.
# On ignore donc le code de sortie d'ares-package et on vérifie l'artefact nous-mêmes.
ares-package dist -o build || true

if ls build/*.ipk >/dev/null 2>&1; then
  echo "IPK généré dans ./build/ :"
  ls -1 build/*.ipk
else
  echo "ERREUR : aucun .ipk généré." >&2
  exit 1
fi
