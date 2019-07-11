#!/usr/bin/env bash

VERSION="$(jq -r .dependencies.bitgo < package.json)"

npm install --package-lock-only "bitgo@$VERSION"

if ! git diff-index --quiet HEAD; then
    git diff
    git add package-lock.json
    echo "=== PREPARE TO TAP YUBIKEY ==="
    git commit -m "Update SDK to bitgo@$VERSION"
    npm ci
    npm run unit-test
    npm run integration-test
else
    echo "package-lock.json is unchanged, skipping commit"
fi

echo "=== PACKAGE LOCK UPDATE COMPLETE ==="

