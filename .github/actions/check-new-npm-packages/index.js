const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const REGISTRY_URL = "https://registry.npmjs.org";
const DO_TICKET_URL = "https://bitgoinc.atlassian.net/browse/DO-17865";

function getAddedPackageJsonFiles() {
  const baseRef = process.env.BASE_REF;
  if (!baseRef) {
    throw new Error("BASE_REF environment variable is not set");
  }

  const output = execSync(
    `git diff ${baseRef} --name-only --diff-filter=A`,
    { encoding: "utf-8" }
  );

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^modules\/[^/]+\/package\.json$/.test(line));
}

function readPublicPackages(addedFiles) {
  const repoRoot = path.resolve(__dirname, "..", "..", "..");
  const packages = [];

  for (const filePath of addedFiles) {
    const absPath = path.join(repoRoot, filePath);
    if (!fs.existsSync(absPath)) continue;

    const pkg = JSON.parse(fs.readFileSync(absPath, "utf-8"));
    if (pkg.private) continue;

    const moduleDir = filePath.split("/")[1];
    packages.push({ name: pkg.name, dir: moduleDir });
  }

  return packages;
}

async function packageExistsOnNpm(packageName) {
  const url = `${REGISTRY_URL}/${packageName}`;
  const response = await fetch(url, { method: "HEAD" });
  return response.status === 200;
}

async function main() {
  const addedFiles = getAddedPackageJsonFiles();

  if (addedFiles.length === 0) {
    console.log("No new modules/*/package.json files detected. Nothing to check.");
    return;
  }

  const packages = readPublicPackages(addedFiles);

  if (packages.length === 0) {
    console.log("No new public packages detected. Nothing to check.");
    return;
  }

  console.log(`Checking ${packages.length} new public package(s) against npm registry...\n`);

  const results = await Promise.all(
    packages.map(async (pkg) => {
      const exists = await packageExistsOnNpm(pkg.name);
      return { ...pkg, exists };
    })
  );

  const missing = results.filter((r) => !r.exists);

  if (missing.length === 0) {
    console.log("All new packages are already registered on npm:");
    for (const pkg of results) {
      console.log(`  ✓ ${pkg.name}`);
    }
    return;
  }

  console.error("The following new package(s) are not yet registered on npm:\n");
  for (const pkg of missing) {
    console.error(`  - ${pkg.name} (modules/${pkg.dir})`);
  }
  console.error(`
New packages must be configured for trusted publishing before merging.
Please file a DevOps request using DO-17865 as a template:
${DO_TICKET_URL}

The DO ticket must be resolved and the package registered on npm
before this PR can be merged.`);

  process.exit(1);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
