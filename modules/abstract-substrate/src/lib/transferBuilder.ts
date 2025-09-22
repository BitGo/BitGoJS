import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import { NativeTransferBuilder } from './nativeTransferBuilder';

export class TransferBuilder extends NativeTransferBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }
}
