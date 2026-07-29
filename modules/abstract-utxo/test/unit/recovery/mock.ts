import { AddressInfo, TransactionIO } from '@bitgo/blockapis';
import { address as wasmAddress, AddressFormat } from '@bitgo/wasm-utxo';

import { AbstractUtxoCoin, RecoveryProvider } from '../../../src';
import { Bch } from '../../../src/impl/bch';
import { Bsv } from '../../../src/impl/bsv';
import { parseOutputId, type Unspent, type UnspentWithPrevTx, type WalletUnspent } from '../../../src/unspent';
export class MockRecoveryProvider implements RecoveryProvider {
  public unspents: Unspent<bigint>[];
  private prevTxCache: Record<string, string> = {};
  constructor(unspents: Unspent<bigint>[]) {
    this.unspents = unspents;
    this.unspents.forEach((u) => {
      if ('prevTx' in u) {
        const { txid } = parseOutputId(u.id);
        this.prevTxCache[txid] = (u as UnspentWithPrevTx<bigint>).prevTx.toString('hex');
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

/**
 * Cross-chain recovery mock provider using wasm-utxo only (no utxolib dependency).
 * Uses direct unspent data instead of parsing a utxolib transaction.
 */
export class WasmCrossChainRecoveryProvider<TNumber extends number | bigint> implements RecoveryProvider {
  private addressVersion: 'cashaddr' | 'base58';
  private addressFormat: AddressFormat;

  constructor(
    public coin: AbstractUtxoCoin,
    /** The wallet unspent representing the output on the wrong chain */
    public depositUnspent: WalletUnspent<TNumber>,
    /** The addresses that were inputs to the original deposit transaction */
    public inputAddresses: string[]
  ) {
    this.addressFormat = this.coin instanceof Bch && !(this.coin instanceof Bsv) ? 'cashaddr' : 'default';
    this.addressVersion = this.coin instanceof Bch && !(this.coin instanceof Bsv) ? 'cashaddr' : 'base58';
  }

  async getUnspentsForAddresses(addresses: string[]): Promise<Unspent[]> {
    // Format the deposit address for BCH-like coins
    let formattedAddress = this.depositUnspent.address;
    if (this.addressFormat === 'cashaddr') {
      formattedAddress = wasmAddress.fromOutputScriptWithCoin(
        wasmAddress.toOutputScriptWithCoin(this.depositUnspent.address, this.coin.name),
        this.coin.name,
        this.addressFormat
      );
      if (formattedAddress.includes(':')) {
        [, formattedAddress] = formattedAddress.split(':');
      }
    }

    return [
      {
        id: this.depositUnspent.id,
        address: formattedAddress,
        value: Number(this.depositUnspent.value),
        ...(this.coin.amountType === 'bigint' ? { valueString: this.depositUnspent.value.toString() } : {}),
      },
    ];
  }

  async getTransactionIO(txid: string): Promise<TransactionIO> {
    // Format deposit address for output
    let outputAddress = this.depositUnspent.address;
    if (this.addressFormat === 'cashaddr') {
      outputAddress = wasmAddress.fromOutputScriptWithCoin(
        wasmAddress.toOutputScriptWithCoin(this.depositUnspent.address, this.coin.name),
        this.coin.name,
        this.addressFormat
      );
      if (outputAddress.includes(':')) {
        [, outputAddress] = outputAddress.split(':');
      }
    }

    return {
      inputs: this.inputAddresses.map((addr) => {
        let address = this.coin.canonicalAddress(addr, this.addressVersion);
        if (address.includes(':')) {
          [, address] = address.split(':');
        }
        return { address };
      }),
      outputs: [{ address: outputAddress }],
    };
  }

  async getAddressInfo(address: string): Promise<AddressInfo> {
    throw new Error('not implemented');
  }

  async getTransactionHex(txid: string): Promise<string> {
    throw new Error('not implemented');
  }

  getTransactionInputs(txid: string): Promise<Unspent<TNumber>[]> {
    throw new Error('not implemented');
  }
}
