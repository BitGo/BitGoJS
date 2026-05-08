const fs = require("fs");
const path = require("path");

const REGISTRY_URL = "https://registry.npmjs.org";
const MODULES_DIR = path.resolve(__dirname, "..", "..", "..", "modules");
const CONCURRENCY = 10;

async function getPublicPackages() {
  const entries = fs.readdirSync(MODULES_DIR, { withFileTypes: true });
  const packages = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const pkgPath = path.join(MODULES_DIR, entry.name, "package.json");
    if (!fs.existsSync(pkgPath)) continue;

    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    if (pkg.private) continue;

    packages.push({ name: pkg.name, dir: entry.name });
  }

  return packages;
}

async function packageExistsOnNpm(packageName) {
  const url = `${REGISTRY_URL}/${packageName}`;
  const response = await fetch(url, { method: "HEAD" });
  return response.status === 200;
}

async function processInBatches(items, fn, concurrency) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

async function main() {
  const packages = await getPublicPackages();
  console.log(`Found ${packages.length} public packages to verify.\n`);

  const results = await processInBatches(
    packages,
    async (pkg) => {
      const exists = await packageExistsOnNpm(pkg.name);
      if (exists) {
        console.log(`  ✓ ${pkg.name}`);
      } else {
        console.error(`  ✗ ${pkg.name} — not found on npm`);
      }
      return { ...pkg, exists };
    },
    CONCURRENCY
  );

  const missing = results.filter((r) => !r.exists);

  if (missing.length > 0) {
    console.log(`\n${missing.length} package(s) not found on npm:\n`);
    for (const pkg of missing) {
      console.log(`  - ${pkg.name} (modules/${pkg.dir})`);
    }
    console.error(
      "\nThese packages must be created on npm before publishing with trusted publishing."
    );
    process.exit(1);
  }

  console.log(`\nAll ${packages.length} packages exist on npm.`);
}

main().catch((err) => {
  console.error("Failed to verify npm packages:", err);
  process.exit(1);
});
