import { BaseChainPlugin } from './base';
import type { CoinConfig, DependencySet } from '../core/types';

/**
 * Plugin for Substrate-like chains (Polkadot/Substrate based)
 *
 * Examples: TAO (Bittensor), DOT (Polkadot), KSM (Kusama)
 *
 * Substrate-like chains use the Substrate framework and typically
 * use Polkadot's ecosystem tooling.
 */
export class SubstrateLikePlugin extends BaseChainPlugin {
  readonly id = 'substrate-like';
  readonly name = 'Substrate-like';
  readonly description = 'Polkadot/Substrate based';
  readonly examples = ['TAO (ed25519)', 'DOT', 'Kusama'];

  /**
   * Substrate-like chains use the generic-l1 template for now
   * TODO: Create Substrate-specific templates with abstract-substrate patterns
   */
  getTemplateDir(): string {
    return 'generic-l1';
  }

  async getDependencies(config: CoinConfig, contextRoot: string): Promise<DependencySet> {
    const dependencies = {
      ...(await this.getBaseDependencies(contextRoot)),
      ...(await this.getTssDependencies(config, contextRoot)),
      '@bitgo/abstract-substrate': await this.getVersionFromPackage('abstract-substrate', contextRoot),
      '@polkadot/api': '14.1.1',
      '@substrate/txwrapper-core': '7.5.2',
      '@substrate/txwrapper-polkadot': '7.5.2',
    };

    const devDependencies = await this.getBaseDevDependencies(contextRoot);

    return { dependencies, devDependencies };
  }
}
