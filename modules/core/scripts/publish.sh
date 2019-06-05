#!/usr/bin/env bash

# Due to the strange behavior in npm@3 of running prepublish scripts during npm install,
# this script is designed as a replacement for `npm publish` for correctly preparing,
# building, publishing, and verifying this package.

usage() {
    echo "usage: $0 [ref-name]"
    echo
    echo "Builds, publishes, and verifies a release from the given ref name (branch, tag, or commit hash)"
    echo
    echo "If ref-name is not given, HEAD is used as the release ref"
    exit 0
}

error() {
    echo "error: $1"
    exit "${2:-1}"
}

confirm()  {
    echo -n "$1 [yN]: "
    read -r confirm
    [[ "$confirm" != "y" && "$confirm" != "Y" ]] && error "user aborted"
}

package_json() {
    node -e "console.log(require('./package.json').$1)"
}

# check preconditions
# make sure we can read the package.json
[[ -f package.json ]] || error "could not locate package.json in directory $(pwd). Publish must be run from the package root."
git rev-parse --verify "${1:-HEAD}" >/dev/null 2>&1 || error "ref $1 does not exist"
REF_NAME="$(git rev-parse --abbrev-ref "${1:-HEAD}")"

# warn if release is not rel/something
[[ "$REF_NAME" =~ rel/.* || "$REF_NAME" =~ [0-9]+\.[0-9]+\.[0-9] ]] || \
confirm "Ref $REF_NAME does not look like a release branch or version tag. Are you sure you want to publish this ref?"

# make sure the working directory is clean
[[ -z "$(git status --porcelain)" ]] || error "working directory not clean"

git checkout -q "$REF_NAME"
PACKAGE_NAME="$(package_json 'name')"
PACKAGE_VERSION="$(package_json 'version')"

# install
npm install

# build
echo "executing dry run publish of $PACKAGE_NAME@$PACKAGE_VERSION from ref $REF_NAME..."
npm publish --dry-run
confirm "Does everything look ok?"

echo
echo "publishing package with the following details to npm:"
echo "package: $PACKAGE_NAME"
echo "version: $PACKAGE_VERSION"
echo "ref: $REF_NAME"
echo "commit: $(git rev-parse HEAD)"
echo "date: $(date)"
echo
confirm "confirm publish"

echo -n "enter OTP: "
read -r otp
npm publish --otp="$otp"
git checkout -q -

# verify package
echo "verifying correct publish of $PACKAGE_NAME@$PACKAGE_VERSION"
cd "$(mktemp -d)" || error "cd failed. Verify package manually."
npm init -y >/dev/null 2>&1 || error "npm init failed. Verify package manually."
npm install "$PACKAGE_NAME@$PACKAGE_VERSION" >/dev/null 2>&1 || error "npm install failed! Publish may not have occurred or there was an installation blocker!!!"
node -e "require('${PACKAGE_NAME}')" || error "node require failed! unpublish!!!"
cd "$OLDPWD" || error "cd to OLDPWD failed. Verify package manually."
echo "correct publish of $PACKAGE_NAME@$PACKAGE_VERSION has been verified!"
