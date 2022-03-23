/* eslint-disable no-sync */

const fs = require('fs');
const path = require('path');

const source = path.join('src', 'vendor', 'sjcl.min.js');
const dest = path.join('dist', 'src', 'vendor', 'sjcl.min.js');

// create dist/src/vendor if it does not exist
const destDir = path.dirname(dest);

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir);
}

// copy sjcl.min.js into dist/src/vendor
fs.createReadStream(source).pipe(fs.createWriteStream(dest));
