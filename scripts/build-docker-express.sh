#!/bin/bash

set -e

# Get dynamic build arguments
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VERSION=$(jq -r .version < modules/express/package.json)
GIT_HASH=$(git rev-parse HEAD)

echo "Building Docker image with:"
echo "  BUILD_DATE: $BUILD_DATE"
echo "  VERSION: $VERSION"
echo "  GIT_HASH: $GIT_HASH"

# Build the Docker image
docker build \
  --platform=linux/amd64 \
  --build-arg BUILD_DATE="$BUILD_DATE" \
  --build-arg VERSION="$VERSION" \
  --build-arg GIT_HASH="$GIT_HASH" \
  -t bitgo/express:latest \
  -t bitgo/express:"$VERSION" \
  .

echo "Docker build completed successfully!"
