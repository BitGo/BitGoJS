#!/usr/bin/env bash

# BitGoJS test runner

set -e
set -x

ROOT="."
MOCHA_OPTS="--timeout 20000 --reporter list --exit --recursive"
UNIT_TEST_DIRS="$ROOT/test/unit $ROOT/test/v2/unit"
INTEGRATION_TEST_DIRS="$ROOT/test/v2/integration"
NYC="$ROOT/node_modules/.bin/nyc"
MOCHA="$ROOT/node_modules/.bin/_mocha"
ESLINT="$ROOT/node_modules/.bin/eslint"

echo "Using $ROOT as root directory"

# run linter in all envs
"$ESLINT" ${ROOT}/src/**/*.js

# only run audit, integration tests, and code coverage reports on node 10, since these should not be dependent on node versions
if [[ "$(node --version | cut -d. -f1)" == "v10" ]]; then
    npm audit
    "$NYC" -- "$MOCHA" ${MOCHA_OPTS} ${UNIT_TEST_DIRS} ${INTEGRATION_TEST_DIRS}
else
    # on all other platforms, just run unit tests
    "$MOCHA" ${MOCHA_OPTS} ${UNIT_TEST_DIRS}
fi
