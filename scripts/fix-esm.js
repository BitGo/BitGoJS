const fs = require('fs');
const path = require('path');

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.d.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      // Regex to match import/export statements (including dynamic imports)
      const regex = /(from\s+['"]|import\s*\(?['"]|import\s+['"])([^'"]+)(['"]\)?)/g;
      
      let modifiedContent = content.replace(regex, (match, p1, p2, p3) => {
        // Skip if already has an extension or is a known standard module/bare module that doesn't need it
        if (p2.endsWith('.js') || p2.endsWith('.json') || p2.endsWith('.cjs') || p2.endsWith('.mjs')) {
          return match;
        }

        // Handle relative paths
        if (p2.startsWith('.')) {
          // If the path corresponds to a directory, it needs /index.js
          const targetPath = path.join(path.dirname(fullPath), p2);
          if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
            return `${p1}${p2}/index.js${p3}`;
          } else {
            return `${p1}${p2}.js${p3}`;
          }
        }
        
        // Handle specific subpath third-party imports mentioned in the bug report
        if (p2.startsWith('bip174/src/')) {
          return `${p1}${p2}.js${p3}`;
        }
        
        return match;
      });

      if (modifiedContent !== content) {
        fs.writeFileSync(fullPath, modifiedContent, 'utf8');
      }
    }
  }
}

const targetDir = process.argv[2];
if (!targetDir) {
  console.error("Usage: node fix-esm.js <directory>");
  process.exit(1);
}
processDir(targetDir);
