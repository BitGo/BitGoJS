#!/usr/bin/env node

/**
 * Pre-commit hook to validate ERC20 contract addresses are lowercase.
 * This prevents InvalidContractAddressError at runtime.
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Regex patterns to match erc20-like function calls with contract addresses
const ERC20_FUNCTION_PATTERNS = [
  // Matches all ERC20 function variants with contract addresses
  // Pattern: erc20('id', 'name', 'fullName', decimals, '0xABC...', ...)
  /\b(erc20|erc20Token|terc20|erc20CompatibleAccountCoin|avaxErc20|tavaxErc20|polygonErc20|tpolygonErc20|arbethErc20|tarbethErc20|opethErc20|topethErc20|zkethErc20|tzkethErc20|beraErc20|tberaErc20|coredaoErc20|tcoredaoErc20|worldErc20|tworldErc20|flrErc20|tflrErc20|xdcErc20|txdcErc20|monErc20|tmonErc20)\s*\([^)]*['"`](0x[a-fA-F0-9]{40})['"`]/g,
  // Matches: contractAddress: '0xABC...'
  /contractAddress\s*:\s*['"`](0x[a-fA-F0-9]{40})['"`]/g,
];

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
    return output
      .split('\n')
      .filter(file => file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js'))
      .filter(file => file.length > 0);
  } catch (error) {
    return [];
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const errors = [];

  ERC20_FUNCTION_PATTERNS.forEach(pattern => {
    let match;
    // Reset regex state
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const address = match[match.length - 1]; // Last capture group is the address

      // Check if address contains uppercase hex characters (A-F)
      if (/[A-F]/.test(address)) {
        // Find line number
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        const lineContent = lines[lineNumber - 1];

        errors.push({
          file: filePath,
          line: lineNumber,
          address: address,
          lowercase: address.toLowerCase(),
          context: lineContent.trim(),
        });
      }
    }
  });

  return errors;
}

function main() {
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    process.exit(0);
  }

  let allErrors = [];

  for (const file of stagedFiles) {
    try {
      const errors = checkFile(file);
      allErrors = allErrors.concat(errors);
    } catch (error) {
      // Skip files that can't be read
    }
  }

  if (allErrors.length > 0) {
    console.error('\n❌ ERC20 Contract Address Validation Failed\n');
    console.error('Contract addresses must be lowercase to avoid InvalidContractAddressError.\n');
    console.error('Found uppercase addresses in the following locations:\n');

    allErrors.forEach(({ file, line, address, lowercase, context }) => {
      console.error(`  ${file}:${line}`);
      console.error(`    Found:    ${address}`);
      console.error(`    Expected: ${lowercase}`);
      console.error(`    Context:  ${context.substring(0, 80)}${context.length > 80 ? '...' : ''}`);
      console.error('');
    });

    console.error('Please convert all ERC20 contract addresses to lowercase before committing.\n');

    process.exit(1);
  }

  process.exit(0);
}

main();
