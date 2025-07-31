import { TransferBuilder as EthTransferBuilder } from '@bitgo/abstract-eth';

/** ETH transfer builder */
export class TransferBuilder extends EthTransferBuilder {
  /**
   * Get the prefix used in generating an operation hash for sending tokens
   *
   * @returns the string prefix
   */
  protected getTokenOperationHashPrefix(): string {
    return 'ERC20';
  }

  /**
   * Get the prefix used in generating an operation hash for sending native coins
   *
   * @returns the string prefix
   */
  protected getNativeOperationHashPrefix(): string {
    // TODO: if testnet, return '560048'
    // else, return 'ETHER'
    if (this._chainId === '560048') {
      return '560048';
    }
    return 'ETHER';
  }
}
