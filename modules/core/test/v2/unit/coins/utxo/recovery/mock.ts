/**
 * @prettier
 */
import { Unspent } from '@bitgo/utxo-lib/dist/src/bitgo';
import { RecoveryAccountData, RecoveryProvider } from '../../../../../../src/v2/coins/utxo/recovery/RecoveryProvider';

export class MockRecoveryProvider implements RecoveryProvider {
  constructor(public unspents: Unspent[]) {}
  async getAccountInfo(address: string): Promise<RecoveryAccountData> {
    const u = this.unspents.find((u) => u.address === address);
    return {
      txCount: u ? 1 : 0,
      totalBalance: u ? u.value : 0,
    };
  }

  async getUnspents(address: string): Promise<Unspent[]> {
    return this.unspents
      .filter((u) => u.address === address)
      .map((u) => ({
        id: u.id,
        address: u.address,
        value: u.value,
      }));
  }
}
