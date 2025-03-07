import * as sdkcore from '@bitgo/sdk-core';
import { BackupResponse } from '../codecs';
import { ILightningWallet, LightningWallet } from './lightning';

export interface ISelfCustodialLightningWallet extends ILightningWallet {
  /**
   * Get the channel backup for the given wallet.
   * @returns {Promise<BackupResponse>} A promise resolving to the channel backup
   */
  getChannelBackup(): Promise<BackupResponse>;
}

export class SelfCustodialLightningWallet extends LightningWallet implements ISelfCustodialLightningWallet {
  constructor(wallet: sdkcore.IWallet) {
    super(wallet);
    if (wallet.type() !== 'hot') {
      throw new Error(`Invalid lightning wallet type for self custodial lightning: ${wallet.type()}`);
    }
  }

  async getChannelBackup(): Promise<BackupResponse> {
    const backupResponse = await this.wallet.bitgo
      .get(this.wallet.baseCoin.url(`/wallet/${this.wallet.id()}/lightning/backup`))
      .result();
    return sdkcore.decodeOrElse(BackupResponse.name, BackupResponse, backupResponse, (error) => {
      throw new Error(`Invalid backup response: ${error}`);
    });
  }
}
