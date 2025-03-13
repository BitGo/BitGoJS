import * as sdkcore from '@bitgo/sdk-core';
import { SelfCustodialLightningWallet } from './selfCustodialLightning';
import { CustodialLightningWallet } from './custodialLightning';
import { ILightningWallet } from './lightning';

/**
 * Returns custodial or self custodial lightning wallet depends on wallet type.
 */
export function getLightningWallet(wallet: sdkcore.IWallet): ILightningWallet {
  if (wallet.baseCoin.getFamily() !== 'lnbtc') {
    throw new Error(`invalid coin for lightning wallet: ${wallet.baseCoin.getFamily()}`);
  }

  switch (wallet.subType()) {
    case 'lightningCustody':
      return new CustodialLightningWallet(wallet);
    case 'lightningSelfCustody':
      return new SelfCustodialLightningWallet(wallet);
    default:
      throw new Error(`invalid wallet type ${wallet.subType()} for lightning coin`);
  }
}
