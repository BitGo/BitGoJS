import type { IChainPlugin } from './base';
import { GenericL1Plugin } from './generic-l1';
import { EvmLikePlugin } from './evm-like';
import { SubstrateLikePlugin } from './substrate-like';
import { CosmosPlugin } from './cosmos';
import type { ChainTypeOption } from '../core/types';

/**
 * Plugin Registry
 *
 * Manages all available chain type plugins and provides
 * plugin lookup and registration functionality.
 */
export class PluginRegistry {
  private plugins: Map<string, IChainPlugin> = new Map();

  constructor() {
    // Register default plugins
    this.registerDefaultPlugins();
  }

  /**
   * Register default chain type plugins
   */
  private registerDefaultPlugins(): void {
    this.register(new GenericL1Plugin());
    this.register(new EvmLikePlugin());
    this.register(new SubstrateLikePlugin());
    this.register(new CosmosPlugin());
  }

  /**
   * Register a new plugin
   * This allows users to add custom chain type plugins
   */
  register(plugin: IChainPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin with id '${plugin.id}' is already registered`);
    }
    this.plugins.set(plugin.id, plugin);
  }

  /**
   * Unregister a plugin by id
   */
  unregister(pluginId: string): boolean {
    return this.plugins.delete(pluginId);
  }

  /**
   * Get a plugin by id
   */
  get(pluginId: string): IChainPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get a plugin by id, throw error if not found
   */
  getRequired(pluginId: string): IChainPlugin {
    const plugin = this.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found. Available plugins: ${this.getPluginIds().join(', ')}`);
    }
    return plugin;
  }

  /**
   * Check if a plugin exists
   */
  has(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Get all registered plugin IDs
   */
  getPluginIds(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Get all registered plugins
   */
  getAll(): IChainPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get chain type options for prompts
   */
  getChainTypeOptions(): ChainTypeOption[] {
    return this.getAll().map((plugin) => ({
      value: plugin.id,
      label: plugin.name,
      hint: plugin.description,
    }));
  }

  /**
   * Get examples from all plugins for display
   */
  getAllExamples(): Array<{ chainType: string; examples: string[] }> {
    return this.getAll().map((plugin) => ({
      chainType: plugin.name,
      examples: plugin.examples,
    }));
  }

  /**
   * Clear all plugins (useful for testing)
   */
  clear(): void {
    this.plugins.clear();
  }

  /**
   * Get the number of registered plugins
   */
  get size(): number {
    return this.plugins.size;
  }
}

/**
 * Default plugin registry instance
 */
export const defaultRegistry = new PluginRegistry();

/**
 * Re-export plugins for direct access if needed
 */
export { GenericL1Plugin, EvmLikePlugin, SubstrateLikePlugin, CosmosPlugin };
export type { IChainPlugin } from './base';
