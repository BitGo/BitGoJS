/**
 * @prettier
 */
import { Unspent } from '@bitgo/utxo-lib/dist/src/bitgo';
import { AddressInfo } from '@bitgo/blockapis';
import { RecoveryProvider } from '../../../../../../src/v2/coins/utxo/recovery/RecoveryProvider';

export class MockRecoveryProvider implements RecoveryProvider {
  constructor(public unspents: Unspent[]) {}
  async getAddressInfo(address: string): Promise<AddressInfo> {
    const u = this.unspents.find((u) => u.address === address);
    return {
      txCount: u ? 1 : 0,
      balance: u ? u.value : 0,
    };
  }

  async getUnspentsForAddresses(addresses: string[]): Promise<Unspent[]> {
    return this.unspents
      .filter((u) => addresses.includes(u.address))
      .map((u) => ({
        id: u.id,
        address: u.address,
        value: u.value,
      }));
  }

  getTransactionHex(txid: string): Promise<string> {
    throw new Error(`not implemented`);
  }

  getTransactionInputs(txid: string): Promise<Unspent[]> {
    throw new Error(`not implemented`);
  }
}
