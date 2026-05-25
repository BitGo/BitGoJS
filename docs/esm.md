# Dual ESM/CJS Module Pattern

Modules that need to work in the browser (especially those importing `@bitgo/wasm-utxo`) must provide both ESM and CJS builds. The browser webpack build uses ESM to properly handle async WASM initialization.

## When to Use

Add dual builds to a module if:
- It imports `@bitgo/wasm-utxo` (required for browser WASM support)
- It's imported by other modules that need browser support
- It needs to be bundled for browser use

## How to Convert a Module

### 1. Update package.json

```json
{
  "main": "./dist/cjs/src/index.js",
  "module": "./dist/esm/index.js",
  "browser": "./dist/esm/index.js",
  "types": "./dist/cjs/src/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/esm/index.d.ts",
        "default": "./dist/esm/index.js"
      },
      "require": {
        "types": "./dist/cjs/src/index.d.ts",
        "default": "./dist/cjs/src/index.js"
      }
    }
  },
  "files": ["dist/cjs", "dist/esm"],
  "scripts": {
    "build": "npm run build:cjs && npm run build:esm",
    "build:cjs": "yarn tsc --build --incremental --verbose .",
    "build:esm": "yarn tsc --project tsconfig.esm.json"
  }
}
```

### 2. Update tsconfig.json

Change output directory to `dist/cjs`:

```json
{
  "compilerOptions": {
    "outDir": "./dist/cjs",
    "rootDir": "."
  }
}
```

### 3. Create tsconfig.esm.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist/esm",
    "rootDir": "./src",
    "module": "ES2020",
    "target": "ES2020",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM"],
    "declaration": true,
    "declarationMap": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "test", "dist"],
  "references": []
}
```

### 4. Add Webpack Alias (if needed for browser bundle)

If your module is imported in the browser bundle and uses `@bitgo/wasm-utxo`, you must add a webpack alias in [`webpack/bitgojs.config.js`](../webpack/bitgojs.config.js):

```javascript
resolve: {
  alias: {
    '@bitgo/your-module': path.resolve('../your-module/dist/esm/index.js'),
  }
}
```

**Why aliases are required:** Webpack doesn't automatically use the `browser` or `module` fields when resolving imports from CJS code. While we could use `resolve.conditionNames: ['browser', 'import', ...]` to prioritize ESM, this breaks third-party packages like `@solana/spl-token` and `@bufbuild/protobuf` that have broken ESM builds. The explicit aliases target only our packages.

## Reference Implementations

- [`modules/utxo-core`](../modules/utxo-core) - Full dual build setup
- [`modules/abstract-utxo`](../modules/abstract-utxo) - Full dual build setup
- [`modules/utxo-staking`](../modules/utxo-staking) - Full dual build setup
- [`modules/utxo-ord`](../modules/utxo-ord) - Full dual build setup