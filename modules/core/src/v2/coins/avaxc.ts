/**
 * @prettier
 */
import { BaseCoin, KeyPair } from '../baseCoin';
import { BitGo } from '../../bitgo';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { AbstractEthLikeCoin, EthSignTransactionOptions, SignedEthLikeTransaction } from './abstractEthLikeCoin';
import { AvaxC as AvaxCAccountLib } from '@bitgo/account-lib';

export class AvaxC extends AbstractEthLikeCoin {
  protected constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new AvaxC(bitgo, staticsCoin);
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    const avaxKeyPair = seed ? new AvaxCAccountLib.KeyPair({ seed }) : new AvaxCAccountLib.KeyPair();
    const extendedKeys = avaxKeyPair.getExtendedKeys();
    return {
      pub: extendedKeys.xpub,
      prv: extendedKeys.xprv!,
    };
  }

  isValidPub(pub: string): boolean {
    let valid = true;
    try {
      new AvaxCAccountLib.KeyPair({ pub });
    } catch (e) {
      valid = false;
    }
    return valid;
  }

  isValidAddress(address: string): boolean {
    return !!address && AvaxCAccountLib.Utils.isValidEthAddress(address);
  }

  async signTransaction(params: EthSignTransactionOptions): Promise<SignedEthLikeTransaction> {
    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(params.txPrebuild.txHex);
    txBuilder.transfer().key(new AvaxCAccountLib.KeyPair({ prv: params.prv }).getKeys().prv!);
    const transaction = await txBuilder.build();

    const recipients = transaction.outputs.map((output) => ({ address: output.address, amount: output.value }));

    return {
      halfSigned: {
        txHex: transaction.toBroadcastFormat(),
        recipients: recipients,
        expiration: params.txPrebuild.expireTime,
      },
    };
  }
}
