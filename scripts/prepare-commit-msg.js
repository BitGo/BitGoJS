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
// null when no prefixes are configured — avoids ^()(\d+) matching bare-digit branches.
const branchRegex =
  escapedPrefixes.length > 0 ? new RegExp(`^(${escapedPrefixes.join('|')})(\\d+)`, 'i') : null;
// ex TICKET: WP-1234
const commitRegex = /(ticket|issue):\s(\S+)/gim;

function extractTicket(branch) {
  if (!branchRegex) return null;
  const found = branch.match(branchRegex);
  return found ? found[0].toUpperCase() : null;
}

// Given the existing commit message and a ticket, return the message with a
// TICKET footer appended, or null when no change is needed (no ticket, or the
// message already contains a ticket/issue footer). Pure so it is unit-testable.
function appendTicketFooter(data, ticket) {
  if (!ticket) {
    return null;
  }
  // Reset lastIndex: commitRegex is global, so .test() is stateful across calls.
  commitRegex.lastIndex = 0;
  if (commitRegex.test(data)) {
    return null;
  }
  return `${data}\nTICKET: ${ticket}\n`;
}

async function main() {
  const commitMsgFilepath = process.argv[2];
  try {
    const branch = (await exec(`git branch --show-current`)).stdout.trim();
    const ticket = extractTicket(branch);
    const data = fs.readFileSync(commitMsgFilepath, 'utf8');
    const updated = appendTicketFooter(data, ticket);
    if (updated === null) {
      return;
    }
    fs.writeFileSync(commitMsgFilepath, updated);
  } catch (e) {}
}

module.exports = { extractTicket, appendTicketFooter };
if (require.main === module) main();
