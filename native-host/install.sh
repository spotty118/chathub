#!/usr/bin/env bash
set -euo pipefail

BIN_NAME="chathub-native-host"
INSTALL_BIN="/usr/local/bin/${BIN_NAME}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST_SRC="${SCRIPT_DIR}/manifest/com.chathub.proxy.json"

if [[ ! -f "${SCRIPT_DIR}/index.js" ]]; then
  echo "index.js not found"
  exit 1
fi

cp "${SCRIPT_DIR}/index.js" "${INSTALL_BIN}"
chmod +x "${INSTALL_BIN}"

OS="$(uname -s)"
if [[ "${OS}" == "Darwin" ]]; then
  TARGET_DIR="${HOME}/Library/Application Support/Google/Chrome/NativeMessagingHosts"
elif [[ "${OS}" == "Linux" ]]; then
  TARGET_DIR="${HOME}/.config/google-chrome/NativeMessagingHosts"
else
  echo "Unsupported OS"
  exit 1
fi

mkdir -p "${TARGET_DIR}"

EXT_ID="${1:-__EXTENSION_ID__}"
TMP_MANIFEST="$(mktemp)"
sed "s|/usr/local/bin/chathub-native-host|${INSTALL_BIN}|g; s|__EXTENSION_ID__|${EXT_ID}|g" "${MANIFEST_SRC}" > "${TMP_MANIFEST}"
install -m 644 "${TMP_MANIFEST}" "${TARGET_DIR}/com.chathub.proxy.json"
rm -f "${TMP_MANIFEST}"

echo "Installed native host to ${INSTALL_BIN}"
echo "Manifest installed to ${TARGET_DIR}/com.chathub.proxy.json"
echo "Extension ID set to ${EXT_ID}"
