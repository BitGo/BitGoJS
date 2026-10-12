import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { V1TransactionBuilder } from './v1TransactionBuilder';
import { Transaction } from './transaction';
import { isValidAmount, validateAddress } from './utils';
import { InstructionBuilderTypes } from './constants';
import { InstructionParams, Transfer } from './iface';

import assert from 'assert';

export interface SendParams {
  address: string;
  amount: string;
}

/**
 * Transaction builder for Solana v1 (SIMD-0296/0385) native SOL payments.
 *
 * Server-side construction surface: builds a v1 payment envelope from
 * structured params (sender + recipients/amounts) — the caller supplies fields,
 * never instructions. The builder owns the `AdvanceNonceAccount` injection, the
 * message compile, and the message-signer-order signature assembly (inherited
 * from {@link V1TransactionBuilder}); set the fee payer via
 * {@link V1TransactionBuilder.sender}, optional durable nonce via
 * {@link V1TransactionBuilder.nonce}, and the v1 config via
 * {@link V1TransactionBuilder.transactionConfig}.
 */
export class V1PaymentBuilder extends V1TransactionBuilder {
  private _sendParams: SendParams[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  /**
   * Set a transfer.
   *
   * @param {string} address - the receiver address
   * @param {string} amount - the amount sent (lamports)
   * @returns {V1PaymentBuilder} This transaction builder
   */
  send({ address, amount }: SendParams): this {
    validateAddress(address, 'address');
    if (!amount || !isValidAmount(amount)) {
      throw new BuildTransactionError('Invalid or missing amount, got: ' + amount);
    }
    if (BigInt(amount) > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new BuildTransactionError(`input amount ${amount} exceeds max safe int ${Number.MAX_SAFE_INTEGER}`);
    }

    this._sendParams.push({ address, amount });

    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._sender, 'Sender must be set before building the transaction');

    const transferData: InstructionParams[] = this._sendParams.map((sendParams: SendParams): Transfer => {
      return {
        type: InstructionBuilderTypes.Transfer,
        params: {
          fromAddress: this._sender,
          toAddress: sendParams.address,
          amount: sendParams.amount,
        },
      };
    });
    // v1: the priority fee is carried in the message config mask (transactionConfig),
    // so no explicit SetPriorityFee instruction is needed (unlike the v0 flow).
    this.instructions(transferData);

    return await super.buildImplementation();
  }
}
