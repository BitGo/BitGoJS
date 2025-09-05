import assert from 'assert';
import { TransactionClause } from '@vechain/sdk-core';
import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import EthereumAbi from 'ethereumjs-abi';
import { addHexPrefix } from 'ethereumjs-util';

import { TransactionBuilder } from './transactionBuilder';
import { ExitDelegationTransaction } from '../transaction/exitDelegation';
import { Transaction } from '../transaction/transaction';
import utils from '../utils';
import { EXIT_DELEGATION_METHOD_ID, STARGATE_DELEGATION_ADDRESS } from '../constants';

export class ExitDelegationBuilder extends TransactionBuilder {
  /**
   * Creates a new ExitDelegationBuilder instance.
   *
   * @param {Readonly<CoinConfig>} _coinConfig - The coin configuration object
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new ExitDelegationTransaction(_coinConfig);
  }

  /**
   * Initializes the builder with an existing ExitDelegationTransaction.
   *
   * @param {ExitDelegationTransaction} tx - The transaction to initialize the builder with
   */
  initBuilder(tx: ExitDelegationTransaction): void {
    this._transaction = tx;
  }

  /**
   * Gets the exit delegation transaction instance.
   *
   * @returns {ExitDelegationTransaction} The exit delegation transaction
   */
  get exitDelegationTransaction(): ExitDelegationTransaction {
    return this._transaction as ExitDelegationTransaction;
  }

  /**
   * Gets the transaction type for unstaking.
   *
   * @returns {TransactionType} The transaction type
   */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingUnlock;
  }

  /**
   * Validates the transaction clauses for unstaking.
   * @param {TransactionClause[]} clauses - The transaction clauses to validate.
   * @returns {boolean} - Returns true if the clauses are valid, false otherwise.
   */
  protected isValidTransactionClauses(clauses: TransactionClause[]): boolean {
    try {
      if (!clauses || !Array.isArray(clauses) || clauses.length === 0) {
        return false;
      }

      const clause = clauses[0];

      if (!clause.to || !utils.isValidAddress(clause.to)) {
        return false;
      }

      // For unstaking transactions, value must be exactly '0x0'
      if (clause.value !== 0) {
        return false;
      }

      // Check if the data starts with the exitDelegation method ID
      if (!clause.data.startsWith(EXIT_DELEGATION_METHOD_ID)) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Sets the token ID for this unstaking transaction.
   *
   * @param {string} tokenId - The ID of the NFT token to unstake
   * @returns {ExitDelegationBuilder} This transaction builder
   */
  tokenId(tokenId: string): this {
    this.exitDelegationTransaction.tokenId = tokenId;
    return this;
  }

  /**
   * Sets the delegation contract address for this unstaking transaction.
   * If not provided, uses the default address from constants.
   *
   * @param {string} address - The delegation contract address
   * @returns {ExitDelegationBuilder} This transaction builder
   */
  delegationContract(address: string = STARGATE_DELEGATION_ADDRESS): this {
    this.validateAddress({ address });
    this.exitDelegationTransaction.contract = address;
    return this;
  }

  /** @inheritdoc */
  validateTransaction(transaction?: ExitDelegationTransaction): void {
    if (!transaction) {
      throw new Error('transaction not defined');
    }
    assert(transaction.contract, 'Delegation contract address is required');
    assert(transaction.tokenId, 'Token ID is required');

    this.validateAddress({ address: transaction.contract });
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.type = this.transactionType;
    // Set the transaction data before building
    this.exitDelegationTransaction.transactionData = this.getExitDelegationData();
    await this.exitDelegationTransaction.build();
    return this.transaction;
  }

  /**
   * Generates the transaction data for exit delegation by encoding the exitDelegation method call.
   *
   * @private
   * @returns {string} The encoded transaction data as a hex string
   */
  private getExitDelegationData(): string {
    const methodName = 'exitDelegation';
    const types = ['uint256'];
    const params = [this.exitDelegationTransaction.tokenId];

    const method = EthereumAbi.methodID(methodName, types);
    const args = EthereumAbi.rawEncode(types, params);

    return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
  }
}
