import { BaseChainPlugin } from './base';
import type { CoinConfig, DependencySet } from '../core/types';

/**
 * Plugin for Cosmos SDK chains
 *
 * Examples: ATOM (Cosmos Hub), OSMO (Osmosis), TIA (Celestia)
 *
 * Cosmos SDK chains use the Cosmos SDK framework and typically
 * use Tendermint/CometBFT consensus.
 */
export class CosmosPlugin extends BaseChainPlugin {
  readonly id = 'cosmos';
  readonly name = 'Cosmos';
  readonly description = 'Cosmos SDK chains';
  readonly examples = ['ATOM (Cosmos Hub)', 'OSMO (Osmosis)', 'TIA (Celestia)'];

  /**
   * Cosmos chains use the generic-l1 template for now
   * TODO: Create Cosmos-specific templates with abstract-cosmos patterns
   */
  getTemplateDir(): string {
    return 'generic-l1';
  }

  async getDependencies(config: CoinConfig, contextRoot: string): Promise<DependencySet> {
    const dependencies = {
      ...(await this.getBaseDependencies(contextRoot)),
      ...(await this.getTssDependencies(config, contextRoot)),
      '@bitgo/abstract-cosmos': await this.getVersionFromPackage('abstract-cosmos', contextRoot),
    };

    const devDependencies = await this.getBaseDevDependencies(contextRoot);

    return { dependencies, devDependencies };
  }
}
