#!/usr/bin/env bash
# Verify (or re-vendor) argon2.umd.min.js from hash-wasm on npm.
#
# Usage:
#   ./scripts/verify-vendor.sh           # verify current file matches upstream + pinned hash
#   ./scripts/verify-vendor.sh 4.13.0    # re-vendor from a specific version
#
set -euo pipefail

VERSION="${1:-4.12.0}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MODULE_DIR="$(dirname "$SCRIPT_DIR")"
TARGET="$MODULE_DIR/argon2.umd.min.js"

# Pinned SHA256 from PROVENANCE.md -- update when re-vendoring
PINNED_SHA="dcec617a2e1b700fa132d1583a186cb70611113395e869f2dd6cc82b415d3094"

# Step 1: Verify local file against pinned hash
if [ -f "$TARGET" ] && [ -z "${1:-}" ]; then
  LOCAL_SHA=$(shasum -a 256 "$TARGET" | awk '{print $1}')
  echo "Local    SHA256: $LOCAL_SHA"
  echo "Pinned   SHA256: $PINNED_SHA"

  if [ "$LOCAL_SHA" != "$PINNED_SHA" ]; then
    echo "FAIL: local file does not match pinned hash in PROVENANCE.md" >&2
    exit 1
  fi
  echo "PASS: local file matches pinned hash"
fi

# Step 2: Verify against npm tarball
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

echo "Downloading hash-wasm@${VERSION} from npm..."
curl -sL "https://registry.npmjs.org/hash-wasm/-/hash-wasm-${VERSION}.tgz" | tar xz -C "$TMPDIR"

UPSTREAM="$TMPDIR/package/dist/argon2.umd.min.js"
if [ ! -f "$UPSTREAM" ]; then
  echo "ERROR: argon2.umd.min.js not found in hash-wasm@${VERSION}" >&2
  exit 1
fi

UPSTREAM_SHA=$(shasum -a 256 "$UPSTREAM" | awk '{print $1}')
echo "Upstream SHA256: $UPSTREAM_SHA"

if [ -f "$TARGET" ]; then
  LOCAL_SHA=$(shasum -a 256 "$TARGET" | awk '{print $1}')

  if [ "$UPSTREAM_SHA" = "$LOCAL_SHA" ]; then
    echo "PASS: vendored file is identical to hash-wasm@${VERSION}"
    exit 0
  else
    echo "MISMATCH: vendored file differs from hash-wasm@${VERSION}"
    if [ -z "${1:-}" ]; then
      exit 1
    fi
  fi
fi

if [ -n "${1:-}" ]; then
  echo "Copying hash-wasm@${VERSION} argon2.umd.min.js into $MODULE_DIR..."
  cp "$UPSTREAM" "$TARGET"
  echo "New SHA256: $UPSTREAM_SHA"
  echo "Done. Update PINNED_SHA in this script and PROVENANCE.md."
fi
