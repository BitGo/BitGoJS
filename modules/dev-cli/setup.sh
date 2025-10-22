#!/usr/bin/env bash

# Quick setup script for dev-cli

cd "$(dirname "$0")"

echo "BitGo Dev CLI Setup"
echo "==================="
echo ""

# Check if config.json exists
if [ ! -f config.json ]; then
  echo "Creating config.json from example..."
  cp config.example.json config.json
  echo "✓ Created config.json"
  echo ""
  echo "⚠️  Please edit config.json and fill in your configuration:"
  echo "   Organize by environment (test, staging, prod) and coin"
  echo ""
else
  echo "✓ config.json already exists"
fi

# Optionally create .env if user wants it
if [ ! -f .env ]; then
  read -p "Do you also want to create .env file? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp env.example .env
    echo "✓ Created .env file"
    echo "   Note: config.json takes precedence, .env variables can override"
  fi
fi

# Build the module
echo ""
echo "Building dev-cli..."
yarn build

echo ""
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit config.json with your credentials for each env/coin"
echo "  2. Try: BITGO_COIN=tbtc BITGO_ENV=test yarn bitgo-dev balance"
echo "  3. Or:  BITGO_COIN=gteth BITGO_ENV=test yarn bitgo-dev balance"
echo ""
echo "See QUICKSTART.md for more examples"
echo ""

