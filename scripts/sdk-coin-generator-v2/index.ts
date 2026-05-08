#!/usr/bin/env node

import * as p from '@clack/prompts';
import { defaultRegistry } from './plugins';
import { Generator } from './core/generator';
import { promptUser } from './core/prompts';

/**
 * SDK Coin Generator V2 - Main Entry Point
 *
 * This generator uses a modular, plugin-based architecture:
 * - Plugins: Each chain type (generic-l1, evm-like, substrate-like, cosmos) is a plugin
 * - Registry: Manages all available plugins
 * - Generator: Core logic that orchestrates module generation using plugins
 * - Prompts: Interactive CLI for gathering user input
 *
 * To add a new chain type:
 * 1. Create a new plugin class extending BaseChainPlugin
 * 2. Implement the required methods (getDependencies, validate, etc.)
 * 3. Register it in the PluginRegistry
 *
 * Example:
 * ```typescript
 * import { BaseChainPlugin } from './plugins/base';
 *
 * class MyChainPlugin extends BaseChainPlugin {
 *   readonly id = 'my-chain';
 *   readonly name = 'My Chain';
 *   readonly description = 'My custom chain type';
 *   readonly examples = ['Example1', 'Example2'];
 *
 *   async getDependencies(config, contextRoot) {
 *     return {
 *       dependencies: { ... },
 *       devDependencies: { ... }
 *     };
 *   }
 * }
 *
 * // Register the plugin
 * defaultRegistry.register(new MyChainPlugin());
 * ```
 */
async function main() {
  try {
    // Get user input using interactive prompts
    const config = await promptUser(defaultRegistry);

    // Generate the module using the core generator
    const generator = new Generator(defaultRegistry);
    await generator.generate(config);

    p.outro('✨ All done! Happy coding!');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    p.log.error(`Generation failed: ${errorMessage}`);

    // Log stack trace for debugging if available
    if (error instanceof Error && error.stack) {
      p.log.error(error.stack);
    }

    process.exit(1);
  }
}

main();
