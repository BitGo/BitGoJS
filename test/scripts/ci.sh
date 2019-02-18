#!/usr/bin/env bash

# BitGoJS test runner

set -e
set -x

ROOT="."
MOCHA_OPTS="--require ts-node/register --timeout 20000 --reporter list --exit --recursive"
UNIT_TESTS="$ROOT/test/unit/*.ts $ROOT/test/v2/unit/*.ts"
INTEGRATION_TESTS="$ROOT/test/v2/integration/*.ts"
NYC="$ROOT/node_modules/.bin/nyc"
MOCHA="$ROOT/node_modules/.bin/mocha-parallel-tests"
ESLINT="$ROOT/node_modules/.bin/eslint"

echo "Using $ROOT as root directory"

# run linter in all envs
#"$ESLINT" ${ROOT}/src/**/*.ts

# only run audit, integration tests, and code coverage reports on node 10, since these should not be dependent on node versions
if [[ "$(node --version | cut -d. -f1)" == "v10" ]]; then
    # BG-10736: temporarily disable npm audit due to known, unfixed issue in development dependency karma
    # npm audit
    "$NYC" -- "$MOCHA" ${MOCHA_OPTS} ${UNIT_TESTS} ${INTEGRATION_TESTS}
else
    # on all other platforms, just run unit tests
    "$MOCHA" ${MOCHA_OPTS} ${UNIT_TESTS}
fi
