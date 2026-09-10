/**
 * @prettier
 */
import { BitGoBase, MPCAlgorithm } from '@bitgo/sdk-core';
import { zcashAddress } from '@bitgo/wasm-utxo';

import { AbstractUtxoCoin } from '../../abstractUtxoCoin';
import { UtxoCoinName } from '../../names';

export class Zec extends AbstractUtxoCoin {
  readonly name: UtxoCoinName = 'zec';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  /**
   * ZEC shielded (Orchard/Ironwood) custodial wallets use RedPallas threshold keys.
   * Transparent (secp256k1 multisig) flows are unaffected: MPCAlgorithm is only
   * consulted on the TSS custodial wallet-creation path.
   * @inheritdoc
   */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'redpallas';
  }

  static createInstance(bitgo: BitGoBase): Zec {
    return new Zec(bitgo);
  }

  isValidAddress(address: string, param?: { anyFormat?: boolean; allowLightning?: boolean } | boolean): boolean {
    return (
      zcashAddress.hasTransparentReceiver(address, this.name) || zcashAddress.hasOrchardReceiver(address, this.name)
    );
  }
}
