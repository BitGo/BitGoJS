import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError } from '../baseCoin/errors';
import { Transaction } from './transaction';
import { isValidAmount, validateAddress } from './utils';
import { TransactionType } from '../baseCoin';
import { InstructionBuilderTypes } from './constants';
import { TokenTransfer } from './iface';

import assert from 'assert';
import { TransactionBuilder } from './transactionBuilder';
import { PublicKey } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';

export interface SendParams {
  address: string;
  amount: string;
  mintAddress: string;
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
          mintAddress: transferInstruction.params.mintAddress,
        });
      }
    }
  }

  /**
   *  Set a transfer
   *
   * @param {string} fromAddress - the sender address
   * @param {string} amount - the amount sent
   * @param {string} mintAddress - the token's mint address
   * @returns {TransactionBuilder} This transaction builder
   */
  send({ address, amount, mintAddress }: SendParams): this {
    validateAddress(address, 'address');
    if (!amount || !isValidAmount(amount)) {
      throw new BuildTransactionError('Invalid or missing amount, got: ' + amount);
    }

    this._sendParams.push({ address, amount, mintAddress: mintAddress });

    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._sender, 'Sender must be set before building the transaction');
    const sourceAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      new PublicKey(this._sendParams[0].mintAddress),
      new PublicKey(this._sender),
    );
    const transferData = this._sendParams.map((sendParams: SendParams): TokenTransfer => {
      return {
        type: InstructionBuilderTypes.TokenTransfer,
        params: {
          fromAddress: this._sender,
          toAddress: sendParams.address,
          amount: sendParams.amount,
          mintAddress: sendParams.mintAddress,
          sourceAddress: sourceAddress.toString(),
        },
      };
    });
    this._instructionsData = transferData;

    return await super.buildImplementation();
  }
}
