import { ILightningWallet, LightningWallet } from './lightning';
import * as sdkcore from '@bitgo/sdk-core';

export type ICustodialLightningWallet = ILightningWallet;

export class CustodialLightningWallet extends LightningWallet implements ICustodialLightningWallet {
  constructor(wallet: sdkcore.IWallet) {
    super(wallet);
    if (wallet.subType() !== 'lightningCustody') {
      throw new Error(`Invalid lightning wallet type for custodial lightning: ${wallet.subType()}`);
    }
  }
}
