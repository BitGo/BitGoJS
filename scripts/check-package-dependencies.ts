const fs = require('fs');
const path = require('path');
const depcheck = require('depcheck');

const {
  promises: { readdir },
} = fs;

const options = {
  ignoreBinPackage: false,
  skipMissing: false,
  ignorePatterns: ['dist', 'example', 'examples'],
  ignoreMatches: [
    '@components/**',
    // Required for opengpg types
    '@openpgp/web-stream-tools',
    '@types/**',
    'blake2b',
    // Required for sdk-coin-eth
    '@ethereumjs/util',
    'express-serve-static-core',
    // Required for sdk-coin-ada
    '@emurgo/cardano-serialization-lib-browser',
    // Required for sdk-coin-celo inner dependencies
    '@celo/contractkit',
    // Webpack - not detected by depcheck
    '@testing-library/cypress',
    'css-loader',
    'file-loader',
    'postcss',
    'postcss-loader',
    'postcss-preset-env',
    'sass',
    'sass-loader',
    'style-loader',
    'ts-loader',
  ],
  specials: [
    depcheck.special.babel,
    depcheck.special.bin,
    depcheck.special.eslint,
    depcheck.special.jest,
    depcheck.special['lint-staged'],
    depcheck.special.mocha,
    depcheck.special.tslint,
    depcheck.special.ttypescript,
    depcheck.special.webpack,
  ],
  detectors: [
    depcheck.detector.exportDeclaration,
    depcheck.detector.exportNamedDeclaration,
    depcheck.detector.extract,
    depcheck.detector.gruntLoadTaskCallExpression,
    depcheck.detector.importCallExpression,
    depcheck.detector.importDeclaration,
    depcheck.detector.requireCallExpression,
    depcheck.detector.requireResolveCallExpression,
    depcheck.detector.typescriptImportEqualsDeclaration,
    depcheck.detector.typescriptImportType,
  ],
};

async function getPackages(source) {
  return (await readdir(source, { withFileTypes: true }))
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

async function main() {
  const rootPath = path.resolve(__dirname, '../');
  const rootPackageJson = JSON.parse(fs.readFileSync(`${rootPath}/package.json`, { encoding: 'utf8', flag: 'r' }));
  const rootDependencies = rootPackageJson.dependencies ? Object.keys(rootPackageJson.dependencies) : [];
  const rootDevDependencies = rootPackageJson.devDependencies ? Object.keys(rootPackageJson.devDependencies) : [];

  const modulePath = path.resolve(__dirname, '../modules');
  const packages = await getPackages(modulePath);
  const promises = packages.map(async (name) => {
    const data = await depcheck(`${modulePath}/${name}`, options);
    return {
      name,
      data,
    };
  });

  const results = await Promise.all(promises);
  let exitCode = 0;

  results.forEach((pkg: any) => {
    let showDepWarnings = false;
    const depWarningModules: string[] = [];
    if (pkg.data.dependencies.length) {
      pkg.data.dependencies.forEach((module) => {
        const index = rootDependencies.findIndex((x) => x === module);
        if (index === -1) {
          showDepWarnings = true;
          depWarningModules.push(`\x1b[34m - ${module} \x1b[0m`);
        }
      });
    }

    if (showDepWarnings && depWarningModules.length) {
      exitCode = 1;
      console.warn(`\x1b[31m Warning: dependencies declared but not detected in code - ${pkg.name} \x1b[0m`);
      depWarningModules.forEach((x) => console.log(x));
    }

    let showDevDepWarnings = false;
    const devDepWarningModules: string[] = [];
    if (pkg.data.devDependencies.length) {
      pkg.data.devDependencies.forEach((module) => {
        const index = rootDevDependencies.findIndex((x) => x === module);
        if (index === -1) {
          showDevDepWarnings = true;
          devDepWarningModules.push(`\x1b[34m - ${module} \x1b[0m`);
        }
      });
    }

    if (showDevDepWarnings && devDepWarningModules.length) {
      exitCode = 1;
      console.warn(`\x1b[31m Warning: devDependencies declared but not detected in code - ${pkg.name} \x1b[0m`);
      devDepWarningModules.forEach((x) => console.log(x));
    }

    const pkgWarningModules: string[] = [];
    const missing = Object.keys(pkg.data.missing);

    if (missing.length) {
      missing.forEach((module) => {
        const indexDep = rootDependencies.findIndex((x) => x === module);
        const indexDevDep = rootDevDependencies.findIndex((x) => x === module);
        if (indexDep === -1 && indexDevDep === -1) {
          exitCode = 1;
          pkgWarningModules.push(`\x1b[34m - ${module} \x1b[0m`);
        }
      });
    }

    if (exitCode && pkgWarningModules.length) {
      console.error(`\x1b[31m Error: packages used but missing in package.json of ${pkg.name} \x1b[0m:`);
      pkgWarningModules.forEach((x) => console.log(x));
    }
  });

  return exitCode;
}

main()
  .then(process.exit)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
