import { BaseChainPlugin } from './base';
import type { CoinConfig, DependencySet } from '../core/types';

/**
 * Plugin for EVM-like (Ethereum Virtual Machine compatible) chains
 *
 * Examples: Arbitrum, Optimism, Polygon, Avalanche C-Chain
 *
 * EVM-like chains are compatible with Ethereum's Virtual Machine and
 * share similar transaction structures and tooling.
 */
export class EvmLikePlugin extends BaseChainPlugin {
  readonly id = 'evm-like';
  readonly name = 'EVM-like';
  readonly description = 'Ethereum Virtual Machine compatible';
  readonly examples = ['Arbitrum', 'Optimism', 'Polygon'];

  /**
   * EVM-like chains use the generic-l1 template for now
   * TODO: Create EVM-specific templates with abstract-eth patterns
   */
  getTemplateDir(): string {
    return 'generic-l1';
  }

  async getDependencies(config: CoinConfig, contextRoot: string): Promise<DependencySet> {
    const dependencies = {
      ...(await this.getBaseDependencies(contextRoot)),
      ...(await this.getTssDependencies(config, contextRoot)),
      '@bitgo/abstract-eth': await this.getVersionFromPackage('abstract-eth', contextRoot),
    };

    const devDependencies = await this.getBaseDevDependencies(contextRoot);

    return { dependencies, devDependencies };
  }
}
