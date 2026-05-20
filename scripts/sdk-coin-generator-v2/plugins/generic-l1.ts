import { BaseChainPlugin } from './base';
import type { CoinConfig, DependencySet } from '../core/types';

/**
 * Plugin for Generic L1 blockchains
 *
 * Examples: Canton, ICP
 *
 * Generic L1 chains are unique layer-1 blockchains that don't fit into
 * other categories (EVM-like, Substrate-like, Cosmos).
 */
export class GenericL1Plugin extends BaseChainPlugin {
  readonly id = 'generic-l1';
  readonly name = 'Generic L1';
  readonly description = 'Unique L1 blockchains';
  readonly examples = ['Canton (ed25519, TSS/eddsa)', 'ICP (secp256k1, TSS/ecdsa)'];

  async getDependencies(config: CoinConfig, contextRoot: string): Promise<DependencySet> {
    const dependencies = {
      ...(await this.getBaseDependencies(contextRoot)),
      ...(await this.getTssDependencies(config, contextRoot)),
    };

    const devDependencies = await this.getBaseDevDependencies(contextRoot);

    return { dependencies, devDependencies };
  }
}
