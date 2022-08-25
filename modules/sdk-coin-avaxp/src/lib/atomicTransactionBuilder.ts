import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BN, Buffer as BufferAvax } from 'avalanche';
import utils from './utils';
import { TransactionBuilder } from './transactionBuilder';

/**
 * Atomic transaction are the cross chain transaction.
 */
export abstract class AtomicTransactionBuilder extends TransactionBuilder {
  private static _cChainId: BufferAvax = utils.cb58Decode('yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp');
  protected _externalChainId: BufferAvax = AtomicTransactionBuilder._cChainId;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction._fee = new BN(this.transaction._network.txFee);
  }

  /**
   * The external chain is outside cross chain, where the internal is the one set in coinConfig.network.
   * The external chain id could be source or destiny chain depend of the type transaction.
   *
   * @param chainId
   */
  externalChainId(chainId: string | Buffer): this {
    const newTargetChainId = typeof chainId === 'string' ? utils.cb58Decode(chainId) : BufferAvax.from(chainId);
    this.validateChainId(newTargetChainId);
    this._externalChainId = newTargetChainId;
    return this;
  }
}
