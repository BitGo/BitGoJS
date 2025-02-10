import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { NativeTransferBuilder } from './nativeTransferBuilder';

export class TransferBuilder extends NativeTransferBuilder {
  protected _amount: string;
  protected _to: string;
  protected _owner: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }
}
