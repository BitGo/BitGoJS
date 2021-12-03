/**
 * @prettier
 */
import {
  RecoveryAccountData,
  RecoveryProvider,
  RecoveryUnspent,
} from '../../../../../../src/v2/coins/utxo/recovery/RecoveryProvider';
import { Unspent } from '../../../../../../src/v2/coins/utxo/unspent';

export class MockRecoveryProvider implements RecoveryProvider {
  constructor(public unspents: Unspent[]) {}
  async getAccountInfo(address: string): Promise<RecoveryAccountData> {
    const u = this.unspents.find((u) => u.address === address);
    return {
      txCount: u ? 1 : 0,
      totalBalance: u ? u.value : 0,
    };
  }

  async getUnspents(address: string): Promise<RecoveryUnspent[]> {
    const u = this.unspents.find((u) => u.address === address);
    if (!u) {
      return [];
    }
    return [
      {
        txid: u.id.split(':')[0],
        n: Number(u.id.split(':')[1]),
        address,
        amount: u.value,
      },
    ];
  }
}
