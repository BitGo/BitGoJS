# Plugin Development Guide

This guide explains how to add a new chain type plugin to the SDK coin generator.

## Overview

The generator uses a plugin architecture where each chain type (generic-l1, evm-like, substrate-like, cosmos) is implemented as a plugin. Adding a new chain type is as simple as creating a plugin class and registering it.

## Quick Example

```typescript
// plugins/my-chain.ts
import { BaseChainPlugin } from './base';
import type { CoinConfig, DependencySet } from '../core/types';

export class MyChainPlugin extends BaseChainPlugin {
  readonly id = 'my-chain';
  readonly name = 'My Chain';
  readonly description = 'My custom chain type';
  readonly examples = ['Example1', 'Example2'];

  async getDependencies(config: CoinConfig, contextRoot: string): Promise<DependencySet> {
    return {
      dependencies: {
        ...(await this.getBaseDependencies(contextRoot)),
        ...(await this.getTssDependencies(config, contextRoot)),
        '@bitgo/abstract-mychain': await this.getVersionFromPackage('abstract-mychain', contextRoot),
      },
      devDependencies: await this.getBaseDevDependencies(contextRoot),
    };
  }
}
```

Then register in `plugins/index.ts`:

```typescript
import { MyChainPlugin } from './my-chain';

private registerDefaultPlugins(): void {
  this.register(new GenericL1Plugin());
  this.register(new EvmLikePlugin());
  this.register(new SubstrateLikePlugin());
  this.register(new CosmosPlugin());
  this.register(new MyChainPlugin()); // Add here
}

export { MyChainPlugin }; // Export for direct access
```

That's it! Your new chain type will appear in the prompts.

## Step-by-Step Guide

### 1. Create Plugin File

Create `plugins/my-chain.ts`:

```typescript
import { BaseChainPlugin } from './base';
import type { CoinConfig, DependencySet } from '../core/types';

export class MyChainPlugin extends BaseChainPlugin {
  // Unique ID used internally (lowercase-with-dashes)
  readonly id = 'my-chain';

  // Display name shown in prompts
  readonly name = 'My Chain';

  // Description/hint shown in prompts
  readonly description = 'My custom chain type description';

  // Examples shown to users
  readonly examples = ['Example Coin 1', 'Example Coin 2'];

  // Required: Define dependencies for this chain type
  async getDependencies(config: CoinConfig, contextRoot: string): Promise<DependencySet> {
    const dependencies = {
      // Always include base dependencies
      ...(await this.getBaseDependencies(contextRoot)),

      // Add TSS dependencies if enabled
      ...(await this.getTssDependencies(config, contextRoot)),

      // Add chain-specific dependencies
      '@bitgo/abstract-mychain': await this.getVersionFromPackage('abstract-mychain', contextRoot),
      'mychain-sdk': '^1.0.0', // External dependencies
    };

    const devDependencies = await this.getBaseDevDependencies(contextRoot);

    return { dependencies, devDependencies };
  }
}
```

### 2. Register Plugin

Update `plugins/index.ts`:

```typescript
import { MyChainPlugin } from './my-chain';

export class PluginRegistry {
  private registerDefaultPlugins(): void {
    this.register(new GenericL1Plugin());
    this.register(new EvmLikePlugin());
    this.register(new SubstrateLikePlugin());
    this.register(new CosmosPlugin());
    this.register(new MyChainPlugin()); // Add your plugin
  }
}

// Export for direct access if needed
export { GenericL1Plugin, EvmLikePlugin, SubstrateLikePlugin, CosmosPlugin, MyChainPlugin };
```

### 3. Test Your Plugin

```bash
yarn sdk-coin:new-v2
```

Your new chain type will appear in the list!

## Plugin Methods

### Required Methods

#### `getDependencies(config, contextRoot)`
Returns dependencies for this chain type.

```typescript
async getDependencies(config: CoinConfig, contextRoot: string): Promise<DependencySet> {
  return {
    dependencies: {
      ...(await this.getBaseDependencies(contextRoot)),
      // Add your dependencies
    },
    devDependencies: await this.getBaseDevDependencies(contextRoot),
  };
}
```

### Optional Methods

#### `getTemplateDir()`
Specify which template directory to use (defaults to `id`).

```typescript
getTemplateDir(): string {
  // Use generic-l1 templates until you create custom ones
  return 'generic-l1';

  // Or use custom templates
  // return 'my-chain'; // Must create templates/my-chain/
}
```

#### `validate(config)`
Add custom validation logic.

```typescript
validate(config: CoinConfig): ValidationResult {
  // Call base validation first
  const baseResult = super.validate(config);

  // Add custom validation
  const errors: string[] = [...(baseResult.errors || [])];
  const warnings: string[] = [...(baseResult.warnings || [])];

  if (config.symbol.length < 3) {
    errors.push('Symbol must be at least 3 characters for My Chain');
  }

  if (config.baseFactor !== '1e18') {
    warnings.push('My Chain typically uses 1e18 as base factor');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
```

#### `getAdditionalTemplateFiles(config)`
Generate extra files specific to your chain type.

```typescript
getAdditionalTemplateFiles(config: CoinConfig): Array<{ src: string; dest: string }> {
  return [
    { src: 'src/custom-builder.ts', dest: 'src/custom-builder.ts' },
    { src: 'src/custom-factory.ts', dest: 'src/custom-factory.ts' },
  ];
}
```

#### `postGenerate(context, config)`
Run custom logic after generation.

```typescript
async postGenerate(context: PluginContext, config: CoinConfig): Promise<void> {
  // Example: Create additional files
  const customFile = path.join(context.destRoot, 'CUSTOM.md');
  await writeFile(customFile, 'Custom content for My Chain', 'utf-8');

  // Example: Run chain-specific scripts
  console.log(`Generated ${config.symbol} module for My Chain`);
}
```

## Helper Methods (From BaseChainPlugin)

### `getVersionFromPackage(moduleName, contextRoot)`
Get version from a workspace package.

```typescript
const version = await this.getVersionFromPackage('sdk-core', contextRoot);
// Returns: "^36.23.1"
```

### `getBaseDependencies(contextRoot)`
Get common dependencies for all chain types.

```typescript
const baseDeps = await this.getBaseDependencies(contextRoot);
// Returns:
// {
//   '@bitgo/sdk-core': '^36.23.1',
//   '@bitgo/statics': '^58.16.1',
//   'bignumber.js': '^9.1.1'
// }
```

### `getBaseDevDependencies(contextRoot)`
Get common dev dependencies.

```typescript
const baseDevDeps = await this.getBaseDevDependencies(contextRoot);
// Returns:
// {
//   '@bitgo/sdk-api': '^1.71.9',
//   '@bitgo/sdk-test': '^9.1.17'
// }
```

### `getTssDependencies(config, contextRoot)`
Get TSS-specific dependencies if enabled.

```typescript
const tssDeps = await this.getTssDependencies(config, contextRoot);
// Returns (if TSS enabled):
// {
//   '@bitgo/sdk-lib-mpc': '^10.8.1'
// }
// Returns empty object if TSS not enabled
```

## Complete Plugin Example

```typescript
// plugins/polkadot-like.ts
import { BaseChainPlugin } from './base';
import type { CoinConfig, DependencySet, ValidationResult, PluginContext } from '../core/types';
import * as path from 'path';
import { promisify } from 'util';
import * as fs from 'fs';

const writeFile = promisify(fs.writeFile);

export class PolkadotLikePlugin extends BaseChainPlugin {
  readonly id = 'polkadot-like';
  readonly name = 'Polkadot-like';
  readonly description = 'Polkadot parachains and relay chains';
  readonly examples = ['DOT (Polkadot)', 'KSM (Kusama)', 'ASTR (Astar)'];

  getTemplateDir(): string {
    // Reuse substrate-like templates
    return 'generic-l1';
  }

  async getDependencies(config: CoinConfig, contextRoot: string): Promise<DependencySet> {
    return {
      dependencies: {
        ...(await this.getBaseDependencies(contextRoot)),
        ...(await this.getTssDependencies(config, contextRoot)),
        '@bitgo/abstract-substrate': await this.getVersionFromPackage('abstract-substrate', contextRoot),
        '@polkadot/api': '14.1.1',
        '@polkadot/types': '14.1.1',
      },
      devDependencies: await this.getBaseDevDependencies(contextRoot),
    };
  }

  validate(config: CoinConfig): ValidationResult {
    const baseResult = super.validate(config);
    const warnings = [...(baseResult.warnings || [])];

    // Polkadot chains typically use ed25519
    if (config.keyCurve !== 'ed25519') {
      warnings.push('Polkadot chains typically use ed25519 key curve');
    }

    return {
      valid: baseResult.valid,
      errors: baseResult.errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  async postGenerate(context: PluginContext, config: CoinConfig): Promise<void> {
    // Create a Polkadot-specific README section
    const readmePath = path.join(context.destRoot, 'POLKADOT.md');
    const content = `# Polkadot Integration Notes

This module integrates with Polkadot using @polkadot/api.

## Configuration

Parachain ID: TBD
Relay chain: Polkadot/Kusama

## Resources

- [Polkadot Wiki](https://wiki.polkadot.network/)
- [@polkadot/api Documentation](https://polkadot.js.org/docs/api/)
`;
    await writeFile(readmePath, content, 'utf-8');
  }
}
```

## Creating Custom Templates

If your chain type needs different file structure, create custom templates:

1. Create directory: `templates/my-chain/`
2. Copy files from `templates/generic-l1/` as a starting point
3. Customize files with your chain-specific logic
4. Use template variables: `<%= symbol %>`, `<%= constructor %>`, etc.

### Available Template Variables

- `<%= coin %>` - Coin name (e.g., "My New Chain")
- `<%= symbol %>` - Symbol (e.g., "mynew")
- `<%= testnetSymbol %>` - Testnet symbol (e.g., "tmynew")
- `<%= constructor %>` - PascalCase symbol (e.g., "Mynew")
- `<%= testnetConstructor %>` - PascalCase testnet symbol (e.g., "Tmynew")
- `<%= baseFactor %>` - Base factor (e.g., "1e18")
- `<%= keyCurve %>` - Key curve (e.g., "secp256k1")
- `<%= supportsTss %>` - TSS support (boolean)
- `<%= mpcAlgorithm %>` - MPC algorithm (e.g., "ecdsa")
- `<%= withTokenSupport %>` - Token support (boolean)

## Testing Your Plugin

1. **Generate a test coin**:
```bash
yarn sdk-coin:new-v2
```

2. **Build the generated coin**:
```bash
cd modules/sdk-coin-{symbol}
npx tsc --build --incremental .
```

3. **Verify output**:
```bash
ls dist/src/  # Should have .js and .d.ts files
```

## Architecture

```
plugins/
├── base.ts                 # Base plugin class with helpers
├── index.ts                # Plugin registry
├── generic-l1.ts           # Generic L1 plugin
├── evm-like.ts             # EVM-like plugin
├── substrate-like.ts       # Substrate-like plugin
├── cosmos.ts               # Cosmos plugin
└── my-chain.ts             # Your new plugin

core/
├── types.ts                # TypeScript interfaces
├── generator.ts            # Core generator (uses plugins)
└── prompts.ts              # Interactive prompts (uses plugin registry)

templates/
├── generic-l1/             # Generic L1 templates
└── my-chain/               # Your custom templates (optional)
```

## Best Practices

1. **Start with generic-l1 templates**: Reuse existing templates until you need customization
2. **Use helper methods**: Leverage `getBaseDependencies()`, `getTssDependencies()`, etc.
3. **Add validation**: Warn users about chain-specific requirements
4. **Provide examples**: List real coins using your chain type
5. **Test thoroughly**: Generate and build coins with your plugin
6. **Keep it simple**: Only add chain-specific dependencies and logic

## Troubleshooting

### Plugin not showing in prompts
- Check registration in `plugins/index.ts`
- Ensure plugin class is exported
- Verify `id` is unique

### TypeScript errors
- Ensure plugin extends `BaseChainPlugin`
- Implement required `getDependencies()` method
- Return correct types (`DependencySet`, `ValidationResult`)

### Template not found
- Check `getTemplateDir()` returns existing directory
- Verify templates exist in `templates/{templateDir}/`
- Use `generic-l1` if custom templates don't exist yet

## Need Help?

- Check existing plugins in `plugins/` directory
- Review `BaseChainPlugin` in `plugins/base.ts`
- See main [README.md](./README.md) for usage

---

**Version**: 2.0.1
