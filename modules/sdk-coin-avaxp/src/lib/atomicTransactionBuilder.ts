import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BN, Buffer as BufferAvax } from 'avalanche';
import utils from './utils';
import { TransactionBuilder } from './transactionBuilder';

/**
 * Cross-chain transactions (export and import) are atomic operations.
 */
export abstract class AtomicTransactionBuilder extends TransactionBuilder {
  protected _externalChainId: BufferAvax;
  protected _fee: BN;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * The internal chain is the one set for the coin in coinConfig.network. The external chain is the other chain involved.
   * The external chain id is the source on import and the destination on export.
   *
   * @param {string} chainId - id of the external chain
   */
  externalChainId(chainId: string | Buffer): this {
    const newTargetChainId = typeof chainId === 'string' ? utils.cb58Decode(chainId) : BufferAvax.from(chainId);
    this.validateChainId(newTargetChainId);
    this._externalChainId = newTargetChainId;
    return this;
  }
}
