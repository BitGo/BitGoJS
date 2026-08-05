/**
 * Toggles `private` on modules/bitgo/package.json so the release workflow can hold
 * the `bitgo` umbrella package out of a `lerna publish` pass without permanently
 * marking it private in the repo.
 *
 * Why a scripted toggle instead of lerna's `--include-private <names>` (which lets
 * a named private package publish "by temporarily removing the private property
 * from the package manifest" on its own): that would require `bitgo` to be
 * permanently `private: true` in the committed manifest, and three separate checks
 * in the release pipeline enumerate non-private packages to verify they exist/were
 * published — a permanently-private bitgo would silently stop being covered by all
 * three:
 *   - the pre-publish existence check (trusted publishing depends on it)
 *   - recovery verification
 *   - beta verification / recovery auto-retry
 *
 * Flipping the flag off, running pass 1 (siblings only — bitgo is skipped because
 * lerna filters private packages before packing), then flipping it back on before
 * pass 2 (bitgo only) keeps every one of those checks seeing a normal, publishable
 * package by the time they run. Callers MUST run the "restore" invocation (`true`)
 * under `always()` in the workflow so a failed or cancelled pass 1 cannot leave the
 * manifest flipped — this script does not track or restore state on its own, it
 * just sets the field to whatever you tell it.
 *
 * Usage:
 *   npx tsx scripts/set-umbrella-publishable.ts false   # hold back for pass 1
 *   npx tsx scripts/set-umbrella-publishable.ts true    # restore for pass 2
 */

import fs from 'fs';
import path from 'path';

const bitgoPackageJsonPath = path.resolve(__dirname, '..', 'modules', 'bitgo', 'package.json');

function parseArg(argv: string[]): boolean {
  const raw = argv[2];
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new Error(`Expected a single argument "true" or "false", got: ${JSON.stringify(raw)}`);
}

function main(): void {
  const publishable = parseArg(process.argv);
  const original = fs.readFileSync(bitgoPackageJsonPath, 'utf-8');
  const pkg = JSON.parse(original);

  if (publishable) {
    delete pkg.private;
  } else {
    pkg.private = true;
  }

  fs.writeFileSync(bitgoPackageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(
    publishable
      ? `Restored modules/bitgo/package.json to publishable (removed "private").`
      : `Marked modules/bitgo/package.json as private — it will be skipped by the next lerna publish pass.`
  );
}

main();
