import { TxOutput, Transaction, TransactionBuilder } from 'bitcoinjs-lib';
// eslint-disable-next-line
import * as bitcoinjs from 'bitcoinjs-lib';
import { Network } from '..';
import { UtxoTransaction } from './UtxoTransaction';

export interface TxbSignArg {
  prevOutScriptType: string;
  vin: number;
  keyPair: bitcoinjs.ECPair.Signer;
  redeemScript?: Buffer;
  hashType?: number;
  witnessValue?: number;
  witnessScript?: Buffer;
  controlBlock?: Buffer;
}

export class UtxoTransactionBuilder<T extends UtxoTransaction = UtxoTransaction> extends TransactionBuilder {
  constructor(network: Network, txb?: TransactionBuilder, prevOutputs?: TxOutput[]) {
    super();
    this.network = network as bitcoinjs.Network;

    (this as any).__TX = this.createInitialTransaction(network, (txb as any)?.__TX);

    if (txb) {
      (this as any).__INPUTS = (txb as any).__INPUTS;
    }

    if (prevOutputs) {
      const txbInputs = (this as any).__INPUTS;
      if (prevOutputs.length !== txbInputs.length) {
        throw new Error(`prevOuts must match txbInput length`);
      }
      prevOutputs.forEach((o, i) => {
        txbInputs[i].value = o.value;
        txbInputs[i].prevOutScript = o.script;
      });
    }
  }

  createInitialTransaction(network: Network, tx?: Transaction): UtxoTransaction {
    return new UtxoTransaction(network, tx);
  }

  static fromTransaction(
    tx: UtxoTransaction,
    network?: bitcoinjs.Network,
    prevOutputs?: TxOutput[]
  ): UtxoTransactionBuilder {
    return new UtxoTransactionBuilder(tx.network, TransactionBuilder.fromTransaction(tx), prevOutputs);
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
    keyPair?: bitcoinjs.ECPair.Signer,
    redeemScript?: Buffer,
    hashType?: number,
    witnessValue?: number,
    witnessScript?: Buffer
  ): void {
    // Regular bitcoin p2sh-p2ms inputs do not include the input amount (value) in the signature and
    // thus do not require the parameter `value` to be set.
    // For bitcoincash and bitcoinsv p2sh-p2ms inputs, the value parameter *is* required however.
    // Since the `value` parameter is not passed to the legacy hashing method, we must store it
    // on the transaction input object.

    if (typeof signParams === 'number') {
      if (typeof witnessValue === 'number') {
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
