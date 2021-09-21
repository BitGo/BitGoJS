import { Transaction, TransactionBuilder } from 'bitcoinjs-lib';
// eslint-disable-next-line
import * as bitcoinjs from 'bitcoinjs-lib';
import { Network } from '../networkTypes';
import { UtxoTransaction } from './UtxoTransaction';
import { Signer } from 'bitcoinjs-lib/ts_src';

interface TxbSignArg {
  prevOutScriptType: string;
  vin: number;
  keyPair: Signer;
  redeemScript?: Buffer;
  hashType?: number;
  witnessValue?: number;
  witnessScript?: Buffer;
}

export class UtxoTransactionBuilder<T extends UtxoTransaction = UtxoTransaction> extends TransactionBuilder {
  constructor(network: Network, txb?: TransactionBuilder) {
    super();
    this.network = network as bitcoinjs.Network;

    (this as any).__TX = this.createInitialTransaction(network, (txb as any)?.__TX);

    if (txb) {
      (this as any).__INPUTS = (txb as any).__INPUTS;
    }
  }

  createInitialTransaction(network: Network, tx?: Transaction): UtxoTransaction {
    return new UtxoTransaction(network, tx);
  }

  static fromTransaction(tx: UtxoTransaction): UtxoTransactionBuilder {
    return new UtxoTransactionBuilder(tx.network, TransactionBuilder.fromTransaction(tx));
  }

  get tx(): T {
    return (this as any).__TX;
  }

  build(): T {
    return super.build() as T;
  }

  buildIncomplete(): T {
    return super.buildIncomplete() as T;
  }

  sign(
    signParams: number | TxbSignArg,
    keyPair?: Signer,
    redeemScript?: Buffer,
    hashType?: number,
    witnessValue?: number,
    witnessScript?: Buffer
  ): void {
    if (typeof signParams !== 'number') {
      throw new Error(`TxbSignArg not supported yet`);
    }

    if (typeof witnessValue === 'number') {
      (this.tx.ins[signParams] as any).value = witnessValue;
    }

    return super.sign(signParams, keyPair, redeemScript, hashType, witnessValue, witnessScript);
  }
}
