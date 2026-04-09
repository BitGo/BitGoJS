import { TxOutput, Transaction } from 'bitcoinjs-lib';
// eslint-disable-next-line
import * as bitcoinjs from 'bitcoinjs-lib';
import { Network } from '..';
import { Signer, TransactionBuilder } from '../transaction_builder';
import { UtxoTransaction } from './UtxoTransaction';

export interface TxbSignArg<TNumber extends number | bigint = number> {
  prevOutScriptType: string;
  vin: number;
  keyPair: Signer;
  redeemScript?: Buffer;
  hashType?: number;
  witnessValue?: TNumber;
  witnessScript?: Buffer;
  controlBlock?: Buffer;
}

export class UtxoTransactionBuilder<
  TNumber extends number | bigint = number,
  T extends UtxoTransaction<TNumber> = UtxoTransaction<TNumber>
> extends TransactionBuilder<TNumber> {
  constructor(network: Network, tx?: UtxoTransaction<TNumber>) {
    super();
    this.network = network;
    (this as any).__TX = this.createInitialTransaction(network, tx);
  }

  protected static newTransactionBuilder<TNumber extends number | bigint>(
    network: Network,
    tx: UtxoTransaction<TNumber>
  ): UtxoTransactionBuilder<TNumber> {
    return new UtxoTransactionBuilder<TNumber>(network, tx);
  }

  protected createInitialTransaction(network: Network, tx?: Transaction<TNumber>): UtxoTransaction<TNumber> {
    return new UtxoTransaction<TNumber>(network, tx);
  }

  static fromTransaction<TNumber extends number | bigint = number>(
    tx: UtxoTransaction<TNumber>,
    network?: Network,
    prevOutputs?: TxOutput<TNumber>[]
  ): UtxoTransactionBuilder<TNumber> {
    const txb = TransactionBuilder.fromTransaction<TNumber>(tx, network, prevOutputs);
    const utxb = this.newTransactionBuilder<TNumber>(tx.network, tx);

    (utxb as any).__INPUTS = (txb as any).__INPUTS;

    if (prevOutputs) {
      const txbInputs = (utxb as any).__INPUTS;
      if (prevOutputs.length !== txbInputs.length) {
        throw new Error(`prevOuts must match txbInput length`);
      }
      prevOutputs.forEach((o, i) => {
        txbInputs[i].value = o.value;
        txbInputs[i].prevOutScript = o.script;
      });
    }
    return utxb;
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
    signParams: number | TxbSignArg<TNumber>,
    keyPair?: Signer,
    redeemScript?: Buffer,
    hashType?: number,
    witnessValue?: TNumber,
    witnessScript?: Buffer
  ): void {
    // Regular bitcoin p2sh-p2ms inputs do not include the input amount (value) in the signature and
    // thus do not require the parameter `value` to be set.
    // For bitcoincash and bitcoinsv p2sh-p2ms inputs, the value parameter *is* required however.
    // Since the `value` parameter is not passed to the legacy hashing method, we must store it
    // on the transaction input object.

    if (typeof signParams === 'number') {
      if (typeof witnessValue === 'number' || typeof witnessValue === 'bigint') {
        (this.tx.ins[signParams] as any).value = witnessValue;
      }

      return super.sign(signParams, keyPair, redeemScript, hashType, witnessValue, witnessScript);
    }

    if (signParams.witnessValue !== undefined) {
      (this.tx.ins[signParams.vin] as any).value = signParams.witnessValue;
    }
    // When calling the sign method via TxbSignArg, the `value` parameter is actually not permitted
    // to be set for p2sh-p2ms transactions.
    if (signParams.prevOutScriptType === 'p2sh-p2ms') {
      delete signParams.witnessValue;
    }
    return super.sign(signParams);
  }
}
