#!/usr/bin/env node

const { promisify } = require('util');
const childProcess = require('child_process');
const fs = require('fs');
const exec = promisify(childProcess.exec);

// ex WP-1234
const branchRegex = /([A-Z]+-)(\d+)/;
// ex TICKET: WP-1234
const commitRegex = /ticket:\s(\S+)/gim;

async function main() {
  const commitMsgFilepath = process.argv[2];
  try {
    const branch = (await exec(`git branch --show-current`)).stdout.trim();
    const found = branch.match(branchRegex);
    // Do not append message if branch name does not match regex
    if (!found.length) {
      return;
    }
    const ticket = found[0];
    const data = fs.readFileSync(commitMsgFilepath, 'utf8');
    // Exit if ticket is already in commit footer
    if (data.match(commitRegex)) {
      return;
    }
    fs.writeFileSync(commitMsgFilepath, `${data}\nTICKET: ${ticket}\n`);
  } catch (e) {}
}

main();
