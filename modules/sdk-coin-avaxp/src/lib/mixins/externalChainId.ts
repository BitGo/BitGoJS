import { Buffer as BufferAvax } from 'avalanche';
import { BuildTransactionError } from '@bitgo/sdk-core';
import { Constructor } from '../iface';
import utils from '../utils';

export interface IExternalChainIdBuilder {
  _externalChainId: BufferAvax;

  /**
   * The internal chain is the one set for the coin in coinConfig.network. The external chain is the other chain involved.
   * The external chain id is the source on import and the destination on export.
   *
   * @param {string} chainId - id of the external chain
   */
  externalChainId(chainId: string | Buffer): this;

  /**
   * Check the buffer has 32 byte long.
   * @param chainID
   */
  validateChainId(chainID: BufferAvax): void;
}

function ExternalChainId<T extends Constructor>(targetBuilder: T): Constructor<IExternalChainIdBuilder> & T {
  return class ExternalChainIdBuilder extends targetBuilder implements IExternalChainIdBuilder {
    _externalChainId: BufferAvax;

    /**
     * The internal chain is the one set for the coin in coinConfig.network. The external chain is the other chain involved.
     * The external chain id is the source on import and the destination on export.
     *
     * @param {string} chainId - id of the external chain
     */
    externalChainId(chainId: string | Buffer): this {
      const newTargetChainId =
        typeof chainId === 'string' ? utils.binTools.cb58Decode(chainId) : BufferAvax.from(chainId);
      this.validateChainId(newTargetChainId);
      this._externalChainId = newTargetChainId;
      return this;
    }

    /**
     * Check the buffer has 32 byte long.
     * @param chainID
     */
    validateChainId(chainID: BufferAvax): void {
      if (chainID.length !== 32) {
        throw new BuildTransactionError('Chain id are 32 byte size');
      }
    }
  };
}

export default ExternalChainId;
