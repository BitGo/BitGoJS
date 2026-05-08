import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import type { CoinConfig, DependencySet, PluginContext, ValidationResult, ChainTypeOption } from '../core/types';

const readFile = promisify(fs.readFile);

/**
 * Base plugin interface that all chain type plugins must implement
 */
export interface IChainPlugin {
  /**
   * Unique identifier for this chain type
   */
  readonly id: string;

  /**
   * Display name for this chain type
   */
  readonly name: string;

  /**
   * Description/hint for the chain type
   */
  readonly description: string;

  /**
   * Examples of coins using this chain type
   */
  readonly examples: string[];

  /**
   * Get the template directory name for this chain type
   */
  getTemplateDir(): string;

  /**
   * Get dependencies specific to this chain type
   */
  getDependencies(config: CoinConfig, contextRoot: string): Promise<DependencySet>;

  /**
   * Validate configuration specific to this chain type
   */
  validate(config: CoinConfig): ValidationResult;

  /**
   * Get additional template files specific to this chain type (optional)
   */
  getAdditionalTemplateFiles?(config: CoinConfig): Array<{ src: string; dest: string }>;

  /**
   * Post-generation hook for chain-specific actions (optional)
   */
  postGenerate?(context: PluginContext, config: CoinConfig): Promise<void>;
}

/**
 * Abstract base class providing common functionality for all chain plugins
 */
export abstract class BaseChainPlugin implements IChainPlugin {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly examples: string[];

  /**
   * Get template directory name (defaults to plugin id)
   */
  getTemplateDir(): string {
    return this.id;
  }

  /**
   * Get version from a package in the workspace
   */
  protected async getVersionFromPackage(moduleName: string, contextRoot: string): Promise<string> {
    try {
      const packagePath = path.join(contextRoot, 'modules', moduleName, 'package.json');
      const content = await readFile(packagePath, 'utf-8');
      const pkg = JSON.parse(content);
      return `^${pkg.version}`;
    } catch (error) {
      return '^1.0.0';
    }
  }

  /**
   * Get base dependencies common to all chain types
   */
  protected async getBaseDependencies(contextRoot: string): Promise<Record<string, string>> {
    return {
      '@bitgo/sdk-core': await this.getVersionFromPackage('sdk-core', contextRoot),
      '@bitgo/statics': await this.getVersionFromPackage('statics', contextRoot),
      'bignumber.js': '^9.1.1',
    };
  }

  /**
   * Get base dev dependencies common to all chain types
   */
  protected async getBaseDevDependencies(contextRoot: string): Promise<Record<string, string>> {
    return {
      '@bitgo/sdk-api': await this.getVersionFromPackage('sdk-api', contextRoot),
      '@bitgo/sdk-test': await this.getVersionFromPackage('sdk-test', contextRoot),
    };
  }

  /**
   * Get TSS-specific dependencies
   */
  protected async getTssDependencies(config: CoinConfig, contextRoot: string): Promise<Record<string, string>> {
    if (!config.supportsTss || !config.mpcAlgorithm) {
      return {};
    }

    return {
      '@bitgo/sdk-lib-mpc': await this.getVersionFromPackage('sdk-lib-mpc', contextRoot),
    };
  }

  /**
   * Base validation - can be extended by subclasses
   */
  validate(config: CoinConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate MPC algorithm matches key curve when TSS is enabled
    if (config.supportsTss && config.mpcAlgorithm) {
      const expectedMpc = config.keyCurve === 'ed25519' ? 'eddsa' : 'ecdsa';
      if (config.mpcAlgorithm !== expectedMpc) {
        warnings.push(
          `Key curve ${config.keyCurve} typically uses ${expectedMpc}, but ${config.mpcAlgorithm} was specified`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Abstract method - must be implemented by subclasses
   */
  abstract getDependencies(config: CoinConfig, contextRoot: string): Promise<DependencySet>;

  /**
   * Convert this plugin to a chain type option for prompts
   */
  toChainTypeOption(): ChainTypeOption {
    return {
      value: this.id,
      label: this.name,
      hint: this.description,
    };
  }
}
