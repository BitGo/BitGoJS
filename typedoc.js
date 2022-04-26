const fs = require('fs');
const TypeDoc = require('typedoc');
const toJsonSchema = require('jsdoc-to-json-schema');

const packages = [
  { name: 'account-lib', type: 'ts', entry: 'src/index.ts' },
  { name: 'bitgo', type: 'ts', entry: 'src/index.ts' },
  { name: 'blake2b', type: 'js', entry: 'index.js' },
  { name: 'blake2b-wasm', type: 'js', entry: 'index.js' },
  { name: 'blockapis', type: 'ts', entry: 'src/index.ts' },
  { name: 'bls-dkg', type: 'js', entry: 'index.js' },
  { name: 'express', type: 'ts', entry: 'src/expressApp.ts' },
  { name: 'sdk-api', type: 'ts', entry: 'src/index.ts' },
  { name: 'sdk-core', type: 'ts', entry: 'src/index.ts' },
  { name: 'sjcl', type: 'js', entry: 'sjcl.min.js' },
  { name: 'statics', type: 'ts', entry: 'src/index.ts' },
  { name: 'unspents', type: 'ts', entry: 'src/index.ts' },
  { name: 'utxo-bin', type: 'ts', entry: 'src/index.ts' },
  { name: 'utxo-lib', type: 'ts', entry: 'src/index.ts' },
];

function main() {
  packages.forEach(async pkg => {
    if (pkg.type === 'ts') {
      await _generataTypeScriptDoc(pkg);
    } else {
      await _generateJavaScriptDoc(pkg);
    }
  });
}

async function _generataTypeScriptDoc(pkg) {
  const app = new TypeDoc.Application();
    
  app.options.addReader(new TypeDoc.TSConfigReader());
  app.options.addReader(new TypeDoc.TypeDocReader());

  app.bootstrap({
    exclude: ['**/node_modules/**/*', '**/*.types.ts'],
    entryPoints: [`./modules/${pkg.name}/${pkg.entry}`],
    pretty: true,
    includeVersion: true,
    sort: 'alphabetical',
    githubPages: true,
    tsconfig: `./modules/${pkg.name}/tsconfig.json`,
  });

  const project = app.convert();

  if (project) {
    const outputDir = `./docs/${pkg.name}`;

    await app.generateDocs(project, outputDir);
    await app.generateJson(project, outputDir + '/output.json');
  }
}

async function _generateJavaScriptDoc(pkg) {
  const entry = `./modules/${pkg.name}/${pkg.entry}`;
  const output = `./docs/${pkg.name}/output.json`;

  const dir = `./docs/${pkg.name}`;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  await toJsonSchema(entry, output);
}

main();
