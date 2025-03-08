import { ILightningWallet, LightningWallet } from './lightning';
import * as sdkcore from '@bitgo/sdk-core';

export type ICustodialLightningWallet = ILightningWallet;

export class CustodialLightningWallet extends LightningWallet implements ICustodialLightningWallet {
  constructor(wallet: sdkcore.IWallet) {
    super(wallet);
    if (wallet.type() !== 'custodial') {
      throw new Error(`Invalid lightning wallet type for custodial lightning: ${wallet.type()}`);
    }
  }
}
