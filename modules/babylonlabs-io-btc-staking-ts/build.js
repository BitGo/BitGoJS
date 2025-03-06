/* eslint-disable no-undef */
import { build } from "esbuild";
import { readFile } from "fs/promises";
import path from "path";

async function main() {
  const pkgPath = path.resolve("./package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
  const { dependencies } = pkg;

  const shared = {
    entryPoints: ["src/index.ts"],
    bundle: true,
    external: Object.keys(dependencies || {}),
  };

  await build({
    ...shared,
    platform: "node", // for CJS
    outfile: "dist/index.cjs",
    format: "cjs",
  });

  await build({
    ...shared,
    platform: "node", // for ESM
    outfile: "dist/index.js",
    format: "esm",
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});