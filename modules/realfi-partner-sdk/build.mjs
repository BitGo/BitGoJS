import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const tsc = require.resolve("typescript/bin/tsc");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

function run(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

rmSync(join(root, "dist"), { recursive: true, force: true });
run(process.execPath, [tsc, "-p", "tsconfig.esm.json"]);
run(process.execPath, [tsc, "-p", "tsconfig.cjs.json"]);

mkdirSync(join(root, "dist/cjs"), { recursive: true });
writeFileSync(join(root, "dist/cjs/package.json"), `${JSON.stringify({ type: "commonjs" })}\n`);

writeFileSync(
  join(root, "dist/build-info.json"),
  `${JSON.stringify(
    {
      version: pkg.version,
      builtAt: new Date().toISOString(),
      note: "Built from src/ via BitGo tsc dual emit — see UPSTREAM.md",
    },
    null,
    2,
  )}\n`,
);

console.log(`built @bitgo/realfi-partner-sdk@${pkg.version}`);
