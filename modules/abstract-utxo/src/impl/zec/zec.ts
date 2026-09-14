/**
 * @prettier
 */
import { BitGoBase, MPCAlgorithm } from '@bitgo/sdk-core';

import { AbstractUtxoCoin } from '../../abstractUtxoCoin';
import { UtxoCoinName } from '../../names';

import { ZecAddressCodec } from './address';

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

  override get addressCodec(): ZecAddressCodec {
    return new ZecAddressCodec(this.name, this.wasmName);
  }

  isValidAddress(address: string, param?: { anyFormat?: boolean; allowLightning?: boolean } | boolean): boolean {
    return this.addressCodec.isValidAddress(address);
  }
}
