#!/bin/bash

# Ensure jq is installed
if ! command -v jq &> /dev/null; then
  sudo apt-get update
  sudo apt-get install -y jq
fi

# Check the version in package.json
version=$(jq -r .version package.json)
if [[ $version == *"canary"* ]]; then
  echo "Error: main branch should not contain 'canary' versions in the version field."
  exit 1
fi
