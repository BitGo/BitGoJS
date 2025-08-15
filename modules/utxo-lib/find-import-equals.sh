#!/bin/bash

# Find all TypeScript files with import equals require pattern
echo "Finding all TypeScript files with 'import something = require('something')' pattern..."
echo "================================================"

# Change to the repository root
cd /Users/zahinmohammad/workspace/bitgo/BitGoJS

# Find all occurrences with file paths and line numbers
rg -n "import\s+\w+\s*=\s*require\s*\(" --type ts | head -100

echo ""
echo "Total count of files:"
rg -l "import\s+\w+\s*=\s*require\s*\(" --type ts | wc -l

echo ""
echo "Total count of occurrences:"
rg "import\s+\w+\s*=\s*require\s*\(" --type ts | wc -l