import {
  BaseCoin,
  BaseTransaction,
  BitGoBase,
  EDDSAMethods,
  InvalidAddressError,
  KeyPair,
  MPCAlgorithm,
  ParsedTransaction,
  ParseTransactionOptions as BaseParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  TransactionExplanation,
  TssVerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { TransactionBuilderFactory, KeyPair as SuiKeyPair } from './lib';
import utils from './lib/utils';
import * as _ from 'lodash';
import { TransferTransaction } from './lib/transferTransaction';

export interface ExplainTransactionOptions {
  txHex: string;
}

export interface SuiParseTransactionOptions extends BaseParseTransactionOptions {
  txHex: string;
}

interface TransactionOutput {
  address: string;
  amount: string;
}

type TransactionInput = TransactionOutput;

export interface SuiParsedTransaction extends ParsedTransaction {
  // total assets being moved, including fees
  inputs: TransactionInput[];

  // where assets are moved to
  outputs: TransactionOutput[];
}

export type SuiTransactionExplanation = TransactionExplanation;

export class Sui extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Sui(bitgo, staticsCoin);
  }

  /**
   * Factor between the coin's base unit and its smallest subdivison
   */
  public getBaseFactor(): number {
    return 1e9;
  }

  public getChain(): string {
    return 'sui';
  }

  public getFamily(): string {
    return 'sui';
  }

  public getFullName(): string {
    return 'Sui';
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return 'eddsa';
  }

  allowsAccountConsolidations(): boolean {
    return true;
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    let totalAmount = new BigNumber(0);
    const coinConfig = coins.get(this.getChain());
    const { txPrebuild: txPrebuild, txParams: txParams } = params;
    const transaction = new TransferTransaction(coinConfig);
    const rawTx = txPrebuild.txHex;
    if (!rawTx) {
      throw new Error('missing required tx prebuild property txHex');
    }

    transaction.fromRawTransaction(Buffer.from(rawTx, 'hex').toString('base64'));
    const explainedTx = transaction.explainTransaction();

    if (txParams.recipients && txParams.recipients.length > 0) {
      const filteredRecipients = txParams.recipients?.map((recipient) => {
        const filteredRecipient = _.pick(recipient, ['address', 'amount']);
        filteredRecipient.amount = new BigNumber(filteredRecipient.amount).toFixed();
        return filteredRecipient;
      });
      const filteredOutputs = explainedTx.outputs.map((output) => {
        const filteredOutput = _.pick(output, ['address', 'amount']);
        filteredOutput.amount = new BigNumber(filteredOutput.amount).toFixed();
        return filteredOutput;
      });

      if (!_.isEqual(filteredOutputs, filteredRecipients)) {
        throw new Error('Tx outputs does not match with expected txParams recipients');
      }
      for (const recipients of txParams.recipients) {
        totalAmount = totalAmount.plus(recipients.amount);
      }
      if (!totalAmount.isEqualTo(explainedTx.outputAmount)) {
        throw new Error('Tx total amount does not match with expected total amount field');
      }
    }
    return true;
  }

  async isWalletAddress(params: TssVerifyAddressOptions): Promise<boolean> {
    const { keychains, address: newAddress, index } = params;

    if (!this.isValidAddress(newAddress)) {
      throw new InvalidAddressError(`invalid address: ${newAddress}`);
    }

    if (!keychains) {
      throw new Error('missing required param keychains');
    }

    for (const keychain of keychains) {
      const MPC = await EDDSAMethods.getInitializedMpcInstance();
      const commonKeychain = keychain.commonKeychain as string;

      const derivationPath = 'm/' + index;
      const derivedPublicKey = MPC.deriveUnhardened(commonKeychain, derivationPath).slice(0, 64);
      const expectedAddress = this.getAddressFromPublicKey(derivedPublicKey);

      if (newAddress !== expectedAddress) {
        return false;
      }
    }

    return true;
  }

  async parseTransaction(params: SuiParseTransactionOptions): Promise<SuiParsedTransaction> {
    const transactionExplanation = await this.explainTransaction({ txHex: params.txHex });

    if (!transactionExplanation) {
      throw new Error('Invalid transaction');
    }

    const suiTransaction = transactionExplanation as SuiTransactionExplanation;
    if (suiTransaction.outputs.length <= 0) {
      return {
        inputs: [],
        outputs: [],
      };
    }

    const senderAddress = suiTransaction.outputs[0].address;
    const feeAmount = new BigNumber(suiTransaction.fee.fee === '' ? '0' : suiTransaction.fee.fee);

    // assume 1 sender, who is also the fee payer
    const inputs = [
      {
        address: senderAddress,
        amount: new BigNumber(suiTransaction.outputAmount).plus(feeAmount).toFixed(),
      },
    ];

    const outputs: TransactionOutput[] = suiTransaction.outputs.map((output) => {
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
    const keyPair = seed ? new SuiKeyPair({ seed }) : new SuiKeyPair();
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

  isValidPrv(prv: string): boolean {
    throw new Error('Method not implemented.');
  }

  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address);
  }

  signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  /**
   * Explain a Sui transaction
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<SuiTransactionExplanation> {
    const factory = this.getBuilder();
    let rebuiltTransaction: BaseTransaction;

    try {
      const transactionBuilder = factory.from(Buffer.from(params.txHex, 'hex').toString('base64'));
      rebuiltTransaction = await transactionBuilder.build();
    } catch {
      throw new Error('Invalid transaction');
    }

    return rebuiltTransaction.explainTransaction();
  }

  private getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  private getAddressFromPublicKey(derivedPublicKey: string) {
    // TODO(BG-59016) replace with account lib implementation
    return utils.getAddressFromPublicKey(derivedPublicKey);
  }

  /** @inheritDoc */
  async getSignablePayload(serializedTx: string): Promise<Buffer> {
    const factory = this.getBuilder();
    const rebuiltTransaction = await factory.from(serializedTx).build();
    return rebuiltTransaction.signablePayload;
  }
}
