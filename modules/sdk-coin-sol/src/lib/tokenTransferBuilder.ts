import { BaseCoin as CoinConfig, coins, SolCoin } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { getAssociatedTokenAccountAddress, isValidAmount, validateAddress } from './utils';
import { InstructionBuilderTypes } from './constants';
import { TokenTransfer } from './iface';

import assert from 'assert';
import { TransactionBuilder } from './transactionBuilder';

export interface SendParams {
  address: string;
  amount: string;
  tokenName: string;
}

export class TokenTransferBuilder extends TransactionBuilder {
  private _sendParams: SendParams[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);

    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.TokenTransfer) {
        const transferInstruction: TokenTransfer = instruction;
        this.sender(transferInstruction.params.fromAddress);
        this.send({
          address: transferInstruction.params.toAddress,
          amount: transferInstruction.params.amount,
          tokenName: transferInstruction.params.tokenName,
        });
      }
    }
  }

  /**
   *  Set a transfer
   *
   * @param {string} fromAddress - the sender address
   * @param {string} amount - the amount sent
   * @param {string} tokenName - name of token that is intended to send
   * @returns {TransactionBuilder} This transaction builder
   */
  send({ address, amount, tokenName }: SendParams): this {
    validateAddress(address, 'address');
    if (!amount || !isValidAmount(amount)) {
      throw new BuildTransactionError('Invalid or missing amount, got: ' + amount);
    }

    this._sendParams.push({ address, amount, tokenName: tokenName });

    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._sender, 'Sender must be set before building the transaction');
    this._instructionsData = await Promise.all(
      this._sendParams.map(async (sendParams: SendParams): Promise<TokenTransfer> => {
        const coin = coins.get(sendParams.tokenName);
        assert(coin instanceof SolCoin);
        const sourceAddress = await getAssociatedTokenAccountAddress(coin.tokenAddress, this._sender);
        return {
          type: InstructionBuilderTypes.TokenTransfer,
          params: {
            fromAddress: this._sender,
            toAddress: sendParams.address,
            amount: sendParams.amount,
            tokenName: sendParams.tokenName,
            sourceAddress: sourceAddress,
          },
        };
      })
    );

    return await super.buildImplementation();
  }
}
