import { TransferBuilder as EthTransferBuilder } from '@bitgo/abstract-eth';

export class TransferBuilder extends EthTransferBuilder {
  /** @inheritdoc */
  protected getNativeOperationHashPrefix(): string {
    return 'ARBETH';
  }
}
