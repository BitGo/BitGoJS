import { TransferBuilder as EthTransferBuilder } from '../eth';

/** Avax C-Chain transfer builder */
export class TransferBuilder extends EthTransferBuilder {
  /**
   * Get the prefix used in generating an operation hash for sending tokens
   * See https://github.com/BitGo/eth-multisig-v2/blob/master/contracts/coins/AvaxWalletSimple.sol
   *
   * @returns {string} the string prefix
   */
  protected getTokenOperationHashPrefix(): string {
    return 'AVAX-ERC20';
  }

  /**
   * Get the prefix used in generating an operation hash for sending native coins
   * See https://github.com/BitGo/eth-multisig-v2/blob/master/contracts/coins/AvaxWalletSimple.sol
   *
   * @returns {string} the string prefix
   */
  protected getNativeOperationHashPrefix(): string {
    return 'AVAX';
  }
}
