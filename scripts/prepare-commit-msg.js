#!/usr/bin/env node

const { promisify } = require('util');
const childProcess = require('child_process');
const fs = require('fs');
const exec = promisify(childProcess.exec);

// Build regex from commitlint's known issuePrefixes so arbitrary branch segments
// (e.g. "release-2-hotfix") don't produce bogus TICKET footers.
let issuePrefixes;
try {
  issuePrefixes = require('../commitlint.config.js').parserPreset.parserOpts.issuePrefixes;
} catch (_) {
  issuePrefixes = [];
}
const escapedPrefixes = issuePrefixes
  .filter((p) => p !== '#')
  .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
// Anchored at branch start; case-insensitive so "web-000-desc" matches "WEB-"
const branchRegex = new RegExp(`^(${escapedPrefixes.join('|')})(\\d+)`, 'i');
// ex TICKET: WP-1234
const commitRegex = /(ticket|issue):\s(\S+)/gim;

function extractTicket(branch) {
  const found = branch.match(branchRegex);
  return found ? found[0].toUpperCase() : null;
}

async function main() {
  const commitMsgFilepath = process.argv[2];
  try {
    const branch = (await exec(`git branch --show-current`)).stdout.trim();
    const ticket = extractTicket(branch);
    if (!ticket) {
      return;
    }
    const data = fs.readFileSync(commitMsgFilepath, 'utf8');
    // Exit if ticket is already in commit footer
    if (data.match(commitRegex)) {
      return;
    }
    fs.writeFileSync(commitMsgFilepath, `${data}\nTICKET: ${ticket}\n`);
  } catch (e) {}
}

module.exports = { extractTicket };
if (require.main === module) main();
