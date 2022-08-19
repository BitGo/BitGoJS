/**
 * @prettier
 */
import { bitgo } from '@bitgo/utxo-lib';
import { AddressInfo } from '@bitgo/blockapis';
import { RecoveryProvider } from '@bitgo/abstract-utxo';
import * as utxolib from '@bitgo/utxo-lib';

type Unspent = bitgo.Unspent;
export class MockRecoveryProvider implements RecoveryProvider {
  private mockTxHexes: Record<string, string> = {};
  constructor(public unspents: Unspent[]) {
    const maxVout: number = unspents.reduce((current: number, u: Unspent) => {
      const vout = bitgo.parseOutputId(u.id).vout;
      return vout > current ? vout : current;
    }, 0);

    const mockTx = new utxolib.bitgo.UtxoTransaction<number | bigint>(utxolib.networks.bitcoin);
    const dummyHash = '0000000000000000000000000000000000000000000000000000000000000000';
    const dummyIndex = 4294967295;
    const dummyData = '032832051c4d696e656420627920416e74506f6f6c20626a343a45ef0454c5de8d5e5300004e2c0000';
    mockTx.addInput(Buffer.from(dummyHash, 'hex'), dummyIndex);
    for (let i = 0; i <= maxVout; i++) {
      mockTx.addOutput(Buffer.from(dummyData, 'hex'), BigInt(0));
    }

    unspents.forEach((u) => {
      const { txid, vout } = bitgo.parseOutputId(u.id);
      mockTx.outs[vout].value = BigInt(u.value) + BigInt(1);
      this.mockTxHexes[txid] = mockTx.toHex();
    });
  }
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

  async getTransactionHex(txid: string): Promise<string> {
    return this.mockTxHexes[txid];
  }

  getTransactionInputs(txid: string): Promise<Unspent[]> {
    throw new Error(`not implemented`);
  }
}
