import BigNumber from 'bignumber.js';
import {
  BaseCoin,
  BaseTransaction,
  BitGoBase,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions as BaseSignTransactionOptions,
  TransactionExplanation,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { KeyPair as AdaKeyPair, TransactionBuilderFactory } from './lib';
import { coins } from '@bitgo/statics';

export interface TransactionPrebuild {
  txHex: string;
  key: string;
  blockHash: string;
}

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

interface TransactionOutput {
  address: string;
  amount: string;
}

type TransactionInput = TransactionOutput;

export interface AdaParsedTransaction extends ParsedTransaction {
  // total assets being moved, including fees
  inputs: TransactionInput[];

  // where assets are moved to
  outputs: TransactionOutput[];
}

export type AdaTransactionExplanation = TransactionExplanation;

export class Ada extends BaseCoin {
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Ada(bitgo);
  }

  /**
   * Factor between the coin's base unit and its smallest subdivison
   */
  public getBaseFactor(): number {
    return 1e6;
  }

  public getChain(): string {
    return 'ada';
  }

  public getFamily(): string {
    return 'ada';
  }

  public getFullName(): string {
    return 'Ada';
  }

  getBaseChain(): string {
    return this.getChain();
  }

  verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  isWalletAddress(params: VerifyAddressOptions): boolean {
    throw new Error('Method not implemented.');
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<AdaParsedTransaction> {
    const transactionExplanation = await this.explainTransaction({
      txPrebuild: params.txPrebuild,
      publicKey: params.publicKey,
      feeInfo: params.feeInfo,
    });

    if (!transactionExplanation) {
      throw new Error('Invalid transaction');
    }

    const adaTransaction = transactionExplanation as AdaTransactionExplanation;
    if (adaTransaction.outputs.length <= 0) {
      return {
        inputs: [],
        outputs: [],
      };
    }

    const senderAddress = adaTransaction.outputs[0].address;
    const feeAmount = new BigNumber(adaTransaction.fee.fee === '' ? '0' : adaTransaction.fee.fee);

    // assume 1 sender, who is also the fee payer
    const inputs = [
      {
        address: senderAddress,
        amount: new BigNumber(adaTransaction.outputAmount).plus(feeAmount).toFixed(),
      },
    ];

    const outputs: TransactionOutput[] = adaTransaction.outputs.map((output) => {
      return {
        address: output.address,
        amount: new BigNumber(output.amount).toFixed(),
      };
    });

    return {
      inputs,
      outputs,
    };
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new AdaKeyPair({ seed }) : new AdaKeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  isValidPub(pub: string): boolean {
    throw new Error('Method not implemented.');
  }

  isValidAddress(address: string): boolean {
    throw new Error('Method not implemented.');
  }

  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    const factory = this.getBuilder();
    const txBuilder = factory.from(params.txPrebuild.txHex);
    txBuilder.sign({ key: params.prv });
    const transaction: BaseTransaction = await txBuilder.build();

    if (!transaction) {
      throw new Error('Invalid transaction');
    }

    console.log(transaction.toJson());
    const serializedTx = transaction.toBroadcastFormat();

    return {
      txHex: serializedTx,
    } as any;
  }

  private getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getBaseChain()));
  }
}
