import { TransferBuilder as EthTransferBuilder } from '@bitgo/sdk-coin-eth';

export class TransferBuilder extends EthTransferBuilder {
  /** @inheritdoc */
  protected getNativeOperationHashPrefix(): string {
    return 'BSC';
  }
}
