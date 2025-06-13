import * as _ from 'lodash';
import BigNumber from 'bignumber.js';
import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BaseTransaction,
  BitGoBase,
  InvalidAddressError,
  KeyPair,
  MPCAlgorithm,
  MultisigType,
  multisigTypes,
  ParsedTransaction,
  SignedTransaction,
  SignTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import utils from './lib/utils';
import { bip32 } from '@bitgo/secp256k1';
import { randomBytes } from 'crypto';
import { KeyPair as EthKeyPair } from '@bitgo/abstract-eth';
import { TransactionBuilderFactory } from './lib';
import { ExplainTransactionOptions, VetParseTransactionOptions } from './lib/types';
import { VetTransactionExplanation } from './lib/iface';

/**
 * Full Name: Vechain
 * Docs: https://docs.vechain.org/
 * GitHub : https://github.com/vechain
 */
export class Vet extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Vet(bitgo, staticsCoin);
  }

  /**
   * Factor between the coin's base unit and its smallest sub division
   */
  public getBaseFactor(): number {
    return 1e18;
  }

  public getChain(): string {
    return 'vet';
  }

  public getFamily(): string {
    return 'vet';
  }

  public getFullName(): string {
    return 'VeChain';
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  allowsAccountConsolidations(): boolean {
    return true;
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const { txPrebuild: txPrebuild, txParams: txParams } = params;
    const txHex = txPrebuild.txHex;
    if (!txHex) {
      throw new Error('missing required tx prebuild property txHex');
    }
    const explainedTx = await this.explainTransaction({ txHex });
    if (!explainedTx) {
      throw new Error('failed to explain transaction');
    }
    if (txParams.recipients !== undefined) {
      const filteredRecipients = txParams.recipients?.map((recipient) => {
        return {
          address: recipient.address,
          amount: BigInt(recipient.amount),
        };
      });
      const filteredOutputs = explainedTx.outputs.map((output) => {
        return {
          address: output.address,
          amount: BigInt(output.amount),
        };
      });
      if (!_.isEqual(filteredOutputs, filteredRecipients)) {
        throw new Error('Tx outputs does not match with expected txParams recipients');
      }
      let totalAmount = new BigNumber(0);
      for (const recipients of txParams.recipients) {
        totalAmount = totalAmount.plus(recipients.amount);
      }
      if (!totalAmount.isEqualTo(explainedTx.outputAmount)) {
        throw new Error('Tx total amount does not match with expected total amount field');
      }
    }
    return true;
  }

  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    const { address: newAddress } = params;

    if (!this.isValidAddress(newAddress)) {
      throw new InvalidAddressError(`invalid address: ${newAddress}`);
    }
    return true;
  }

  async parseTransaction(params: VetParseTransactionOptions): Promise<ParsedTransaction> {
    const transactionExplanation = await this.explainTransaction({ txHex: params.txHex });
    if (!transactionExplanation) {
      throw new Error('Invalid transaction');
    }
    return {
      inputs: [
        {
          address: transactionExplanation.sender,
          amount: transactionExplanation.outputAmount,
        },
      ],
      outputs: [
        {
          address: transactionExplanation.outputs[0].address,
          amount: transactionExplanation.outputs[0].amount,
        },
      ],
    };
  }

  /**
   * Explain a Vechain transaction
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<VetTransactionExplanation | undefined> {
    let rebuiltTransaction: BaseTransaction;
    try {
      rebuiltTransaction = await this.rebuildTransaction(params.txHex);
    } catch {
      return undefined;
    }
    return rebuiltTransaction.explainTransaction();
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    if (!seed) {
      // An extended private key has both a normal 256 bit private key and a 256
      // bit chain code, both of which must be random. 512 bits is therefore the
      // maximum entropy and gives us maximum security against cracking.
      seed = randomBytes(512 / 8);
    }
    const extendedKey = bip32.fromSeed(seed);
    const xpub = extendedKey.neutered().toBase58();
    return {
      pub: xpub,
      prv: extendedKey.toBase58(),
    };
  }

  isValidPub(pub: string): boolean {
    let valid = true;
    try {
      new EthKeyPair({ pub });
    } catch (e) {
      valid = false;
    }
    return valid;
  }

  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address);
  }

  signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  protected getTxBuilderFactory(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(this._staticsCoin);
  }

  protected async rebuildTransaction(txHex: string): Promise<BaseTransaction> {
    const txBuilderFactory = this.getTxBuilderFactory();
    try {
      const txBuilder = txBuilderFactory.from(txHex);
      return txBuilder.transaction;
    } catch {
      throw new Error('Failed to rebuild transaction');
    }
  }

  /** @inheritDoc */
  auditDecryptedKey(params: AuditDecryptedKeyParams): void {
    /** https://bitgoinc.atlassian.net/browse/COIN-4213 */
    throw new Error('Method not implemented.');
  }
}
