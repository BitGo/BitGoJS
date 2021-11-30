/**
 * @prettier
 */
import { BaseCoin, VerifyAddressOptions } from '../baseCoin';
import { BitGo } from '../../bitgo';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { AbstractEthLikeCoin } from './abstractEthLikeCoin';
import { Celo as CeloAccountLib } from '@bitgo/account-lib';
import { InvalidAddressError } from '../../errors';

export class Celo extends AbstractEthLikeCoin {
  protected constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Celo(bitgo, staticsCoin);
  }

  isValidPub(pub: string): boolean {
    let valid = true;
    try {
      new CeloAccountLib.KeyPair({ pub });
    } catch (e) {
      valid = false;
    }
    return valid;
  }

  verifyAddress({ address, coinSpecific }: VerifyAddressOptions): boolean {
    // for celo if the coin is pending init then an error will be thrown
    // returning true to 'skip' verification
    if (coinSpecific && coinSpecific.pendingChainInitialization) {
      return true;
    }

    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }
    return true;
  }
}
