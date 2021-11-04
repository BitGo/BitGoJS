import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError } from '../baseCoin/errors';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { isValidAmount, isValidPublicKey } from './utils';
import { TransactionType } from '../baseCoin';
import { WalletInit } from './iface';
import { InstructionBuilderTypes } from './constants';

export class WalletInitializationBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }
  protected get transactionType(): TransactionType {
    return TransactionType.WalletInitialization;
  }

  /**
   *  Creates a nonce account for an address
   *
   * @param {string} nonceAddress - the nonce address to be created
   * @param {string} authAddress - the address whos gonna own the nonce
   * @param {string} amount - the amount sent to cover the rent of the nonce address
   * @returns {TransactionBuilder} This transaction builder
   */
  walletInit(nonceAddress: string, authAddress: string, amount: string): this {
    if (!nonceAddress || !isValidPublicKey(nonceAddress)) {
      throw new BuildTransactionError('Invalid or missing nonceAddress, got: ' + nonceAddress);
    }
    if (!authAddress || !isValidPublicKey(authAddress)) {
      throw new BuildTransactionError('Invalid or missing authAddress, got: ' + authAddress);
    }
    if (authAddress === nonceAddress) {
      throw new BuildTransactionError('nonceAddress cant be equal to fromAddress');
    }
    if (!amount || !isValidAmount(amount)) {
      throw new BuildTransactionError('Invalid or missing amount, got: ' + amount);
    }
    if (this._instructionsData.some((instruction) => instruction.type === InstructionBuilderTypes.CreateNonceAccount)) {
      throw new BuildTransactionError('Cannot use walletInit method more than once');
    }

    const walletInitData: WalletInit = {
      type: InstructionBuilderTypes.CreateNonceAccount,
      params: {
        fromAddress: authAddress,
        nonceAddress,
        authAddress,
        amount,
      },
    };
    this._instructionsData.push(walletInitData);
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    return await super.buildImplementation();
  }
}
