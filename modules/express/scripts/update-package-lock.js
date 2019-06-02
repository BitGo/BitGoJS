#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const lockfile = require('../package-lock.json');
const pkg = require('../package.json');

lockfile.version = pkg.version;

const file = path.join(path.dirname(require.main.path), 'package-lock.json')
console.dir(file);
console.dir(lockfile.version);
fs.writeFileSync(file, JSON.stringify(lockfile, undefined, 2) + "\n");
