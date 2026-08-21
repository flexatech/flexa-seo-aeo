#!/usr/bin/env bash
# Build a production zip of flexa-seo-aeo into ./build/.
#
# The runtime has NO composer dependencies (the bootstrap autoloads src/ via a
# spl_autoload_register fallback), and .distignore strips vendor/ from the zip,
# so there is no composer build step here. The React admin bundle IS required
# at runtime and is git-ignored, so it is rebuilt fresh with pnpm.
set -euo pipefail

PLUGIN_SLUG="flexa-seo-aeo"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${ROOT_DIR}/build"
STAGE_DIR="${BUILD_DIR}/${PLUGIN_SLUG}"

cd "${ROOT_DIR}"

# Read plugin version from the main file header.
VERSION="$(grep -E '^[[:space:]]*\*[[:space:]]*Version:' "${PLUGIN_SLUG}.php" | head -1 | sed -E 's/.*Version:[[:space:]]*([^[:space:]]+).*/\1/')"
if [[ -z "${VERSION}" ]]; then
    echo "Could not read Version from ${PLUGIN_SLUG}.php" >&2
    exit 1
fi
echo "Building ${PLUGIN_SLUG} v${VERSION}"

# Fresh production assets (the git-ignored assets/dist bundle).
if [[ -f package.json ]]; then
    pnpm install --frozen-lockfile
    pnpm build
fi

# Regenerate the translation template so it never lags the source.
if command -v wp >/dev/null 2>&1; then
    pnpm i18n:pot
fi

# Stage a clean copy honoring .distignore.
rm -rf "${BUILD_DIR}"
mkdir -p "${STAGE_DIR}"

EXCLUDES=()
if [[ -f .distignore ]]; then
    while IFS= read -r line; do
        line="${line%%#*}"
        line="${line## }"
        line="${line%% }"
        [[ -z "${line}" ]] && continue
        EXCLUDES+=(--exclude="${line#/}")
    done < .distignore
fi

rsync -a "${EXCLUDES[@]}" --exclude="build" --exclude=".git" "${ROOT_DIR}/" "${STAGE_DIR}/"

# Sanity: the compiled bundle must be present in the stage, or the plugin ships broken.
if [[ ! -f "${STAGE_DIR}/assets/dist/.vite/manifest.json" && ! -f "${STAGE_DIR}/assets/dist/manifest.json" ]]; then
    echo "Build manifest missing in stage — did 'pnpm build' succeed?" >&2
    exit 1
fi

cd "${BUILD_DIR}"
ZIP_NAME="${PLUGIN_SLUG}-${VERSION}.zip"
rm -f "${ZIP_NAME}"
zip -rq "${ZIP_NAME}" "${PLUGIN_SLUG}"
echo "Built ${BUILD_DIR}/${ZIP_NAME}"

# Drop the staging tree — only the zip needs to stay in build/.
rm -rf "${STAGE_DIR}"
