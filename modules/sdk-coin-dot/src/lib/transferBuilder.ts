import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { ProxyType } from './iface';
import { NativeTransferBuilder } from './nativeTransferBuilder';

export class TransferBuilder extends NativeTransferBuilder {
  protected _amount: string;
  protected _to: string;
  protected _owner: string;
  protected _forceProxyType: ProxyType;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }
  //
  // THIS METHOD WILL BE OVERRIDEN IF FOR SOME REASON THE PARACHAIN NATIVE ASSET TRANSFER IS DIFFERENT

  // protected buildTransaction(): UnsignedTransaction {
  //   const baseTxInfo = this.createBaseTxInfo();
  //   return methods.balances.transferKeepAlive(
  //     {
  //       value: this._amount,
  //       dest: this._to,
  //     },
  //     baseTxInfo.baseTxInfo,
  //     baseTxInfo.options
  //   );
  // }
}
