import { TransferBuilder as EthTransferBuilder } from '@bitgo/sdk-coin-eth';

/** POLYGON transfer builder */
export class TransferBuilder extends EthTransferBuilder {
  /**
   * Get the prefix used in generating an operation hash for sending tokens
   * See https://github.com/BitGo/eth-multisig-v4/blob/master/contracts/coins/PolygonWalletSimple.sol
   *
   * @returns the string prefix
   */
  protected getTokenOperationHashPrefix(): string {
    return 'POLYGON-ERC20';
  }

  /**
   * Get the prefix used in generating an operation hash for sending native coins
   * See https://github.com/BitGo/eth-multisig-v4/blob/master/contracts/coins/PolygonWalletSimple.sol
   *
   * @returns the string prefix
   */
  protected getNativeOperationHashPrefix(): string {
    return 'POLYGON';
  }
}
