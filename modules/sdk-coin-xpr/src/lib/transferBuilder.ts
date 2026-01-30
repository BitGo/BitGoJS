/**
 * Proton (XPR Network) Transfer Transaction Builder
 */

import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  Transaction as EosioTransaction,
  Action,
  Name,
  Asset,
  Struct,
  TimePointSec,
  UInt16,
  UInt32,
} from '@greymass/eosio';
import BigNumber from 'bignumber.js';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { isValidAddress } from './utils';
import { TOKEN_CONTRACT, XPR_SYMBOL, XPR_PRECISION } from './constants';

/**
 * Define the transfer struct for eosio.token
 */
class Transfer extends Struct {
  static abiName = 'transfer';
  static abiFields = [
    { name: 'from', type: Name },
    { name: 'to', type: Name },
    { name: 'quantity', type: Asset },
    { name: 'memo', type: 'string' },
  ];
}

/**
 * Transfer parameters
 */
export interface TransferParams {
  to: string;
  amount: string;
  memo?: string;
}

export class TransferBuilder extends TransactionBuilder {
  private _to: string;
  private _amount: string;
  private _memo: string = '';

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /**
   * Transaction type is Send for transfers
   */
  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  /**
   * Initialize builder from existing transaction
   */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    const json = tx.toJson();

    // Extract transfer details from first action
    if (json.actions.length > 0) {
      const action = json.actions[0];
      if (action.data && typeof action.data === 'object' && 'to' in action.data) {
        const data = action.data as { from: string; to: string; quantity: string; memo: string };
        this._sender = data.from;
        this._to = data.to;
        // Parse quantity to get amount in base units
        const quantityParts = data.quantity.split(' ');
        if (quantityParts.length >= 1) {
          const value = parseFloat(quantityParts[0]);
          this._amount = new BigNumber(value).times(Math.pow(10, XPR_PRECISION)).toFixed(0);
        }
        this._memo = data.memo || '';
      }
    }
  }

  /**
   * Set the recipient address
   */
  to(address: string): this {
    if (!isValidAddress(address)) {
      throw new BuildTransactionError(`Invalid recipient address: ${address}`);
    }
    this._to = address;
    return this;
  }

  /**
   * Set the transfer amount in base units (smallest unit)
   */
  amount(amount: string | number): this {
    const amountBN = new BigNumber(amount);
    if (amountBN.isLessThanOrEqualTo(0)) {
      throw new BuildTransactionError('Amount must be positive');
    }
    if (!amountBN.isInteger()) {
      throw new BuildTransactionError('Amount must be an integer (base units)');
    }
    this._amount = amountBN.toFixed(0);
    return this;
  }

  /**
   * Set the transfer memo
   */
  memo(memo: string): this {
    if (memo.length > 256) {
      throw new BuildTransactionError('Memo must be 256 characters or less');
    }
    this._memo = memo;
    return this;
  }

  /**
   * Validate the transaction before building
   */
  validateTransaction(transaction?: Transaction): void {
    super.validateTransaction(transaction);

    if (!this._to) {
      throw new BuildTransactionError('Recipient is required');
    }
    if (!this._amount) {
      throw new BuildTransactionError('Amount is required');
    }
  }

  /**
   * Build the EOSIO transfer transaction
   */
  protected buildEosioTransaction(): EosioTransaction {
    // Convert amount from base units to asset format
    const amountValue = new BigNumber(this._amount).dividedBy(Math.pow(10, XPR_PRECISION));
    const quantity = `${amountValue.toFixed(XPR_PRECISION)} ${XPR_SYMBOL}`;

    // Create the transfer action data
    const transferData = Transfer.from({
      from: Name.from(this._sender),
      to: Name.from(this._to),
      quantity: Asset.from(quantity),
      memo: this._memo,
    });

    // Create the action
    const transferAction = Action.from({
      account: TOKEN_CONTRACT,
      name: 'transfer',
      authorization: [
        {
          actor: this._sender,
          permission: 'active',
        },
      ],
      data: transferData,
    });

    // Create the transaction
    const tx = EosioTransaction.from({
      expiration: TimePointSec.from(this._expiration),
      ref_block_num: UInt16.from(this._refBlockNum),
      ref_block_prefix: UInt32.from(this._refBlockPrefix),
      max_net_usage_words: 0,
      max_cpu_usage_ms: 0,
      delay_sec: 0,
      context_free_actions: [],
      actions: [transferAction],
      transaction_extensions: [],
    });

    return tx;
  }
}
