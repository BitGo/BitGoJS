/**
 * @prettier
 */
import { bitgo } from '@bitgo/utxo-lib';
import { AddressInfo, TransactionIO } from '@bitgo/blockapis';
import { AbstractUtxoCoin, RecoveryProvider } from '@bitgo/abstract-utxo';
import * as utxolib from '@bitgo/utxo-lib';
import { Bch } from '@bitgo/sdk-coin-bch';
import { Bsv } from '@bitgo/sdk-coin-bsv';

type Unspent<TNumber extends number | bigint = number> = bitgo.Unspent<TNumber>;
export class MockRecoveryProvider implements RecoveryProvider {
  private prevTxCache: Record<string, string> = {};
  constructor(public unspents: Unspent<bigint>[]) {
    this.unspents.forEach((u) => {
      if (utxolib.bitgo.isUnspentWithPrevTx(u)) {
        const { txid } = bitgo.parseOutputId(u.id);
        this.prevTxCache[txid] = u.prevTx.toString('hex');
      }
    });
  }
  async getAddressInfo(address: string): Promise<AddressInfo> {
    const u = this.unspents.find((u) => u.address === address);
    return {
      txCount: u ? 1 : 0,
      balance: u ? Number(u.value) : 0,
    };
  }

  async getUnspentsForAddresses(addresses: string[]): Promise<Unspent[]> {
    return this.unspents
      .filter((u) => addresses.includes(u.address))
      .map((u) => ({
        id: u.id,
        address: u.address,
        value: Number(u.value),
      }));
  }

  async getTransactionHex(txid: string): Promise<string> {
    return this.prevTxCache[txid];
  }

  getTransactionInputs(txid: string): Promise<Unspent[]> {
    throw new Error(`not implemented`);
  }

  getTransactionIO(txid: string): Promise<TransactionIO> {
    throw new Error(`not implemented`);
  }
}
export class MockCrossChainRecoveryProvider<TNumber extends number | bigint> implements RecoveryProvider {
  private addressVersion: 'cashaddr' | 'base58';
  private addressFormat: utxolib.addressFormat.AddressFormat;
  constructor(
    public coin: AbstractUtxoCoin,
    public unspents: Unspent<TNumber>[],
    public tx: utxolib.bitgo.UtxoTransaction<TNumber>
  ) {
    // this is how blockchair will return the data, as a cashaddr for BCH like coins
    // BSV supports cashaddr, but at the time of writing the SDK does not support cashaddr for bsv
    this.addressFormat = this.coin instanceof Bch && !(this.coin instanceof Bsv) ? 'cashaddr' : 'default';
    this.addressVersion = this.coin instanceof Bch && !(this.coin instanceof Bsv) ? 'cashaddr' : 'base58';
  }

  async getUnspentsForAddresses(addresses: string[]): Promise<Unspent[]> {
    return this.tx.outs.map((o, vout: number) => {
      let address = utxolib.addressFormat.fromOutputScriptWithFormat(o.script, this.addressFormat, this.coin.network);
      if (address.includes(':')) {
        [, address] = address.split(':');
      }
      return {
        id: `${this.tx?.getId()}:${vout}`,
        address,
        value: Number(o.value),
        valueString: this.coin.amountType === 'bigint' ? o.value.toString() : undefined,
      };
    });
  }

  async getTransactionIO(txid: string): Promise<TransactionIO> {
    const payload: TransactionIO = {
      inputs: this.unspents.map((u) => {
        // imitate how blockchair returns data
        let address = this.coin.canonicalAddress(u.address, this.addressVersion);
        if (address.includes(':')) {
          [, address] = address.split(':');
        }
        return {
          address,
        };
      }),
      outputs: this.tx.outs.map((o) => {
        let address = utxolib.addressFormat.fromOutputScriptWithFormat(o.script, this.addressFormat, this.coin.network);
        if (address.includes(':')) {
          [, address] = address.split(':');
        }
        return {
          address,
        };
      }),
    };
    return payload;
  }

  async getAddressInfo(address: string): Promise<AddressInfo> {
    throw new Error(`not implemented`);
  }

  async getTransactionHex(txid: string): Promise<string> {
    throw new Error(`not implemented`);
  }

  getTransactionInputs(txid: string): Promise<Unspent<TNumber>[]> {
    throw new Error(`not implemented`);
  }
}
