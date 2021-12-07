/**
 * @prettier
 */
import { RecoveryAccountData, RecoveryProvider } from '../../../../../../src/v2/coins/utxo/recovery/RecoveryProvider';
import { PublicUnspent, Unspent } from '../../../../../../src/v2/coins/utxo/unspent';

export class MockRecoveryProvider implements RecoveryProvider {
  constructor(public unspents: Unspent[]) {}
  async getAccountInfo(address: string): Promise<RecoveryAccountData> {
    const u = this.unspents.find((u) => u.address === address);
    return {
      txCount: u ? 1 : 0,
      totalBalance: u ? u.value : 0,
    };
  }

  async getUnspents(address: string): Promise<PublicUnspent[]> {
    return this.unspents
      .filter((u) => u.address === address)
      .map((u) => ({
        id: u.id,
        address: u.address,
        value: u.value,
      }));
  }
}
