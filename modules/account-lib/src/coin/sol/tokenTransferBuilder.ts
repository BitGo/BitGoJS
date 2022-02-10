import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError } from '../baseCoin/errors';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { isValidAmount, isValidPublicKey } from './utils';
import { TransactionType } from '../baseCoin';
import { InstructionBuilderTypes } from './constants';
import { TokenTransfer } from './iface';

import assert from 'assert';

export interface SendParams {
  toAddress: string;
  amount: string;
  assetName: string;
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
          toAddress: transferInstruction.params.toAddress,
          mint: transferInstruction.params.mint,
          amount: transferInstruction.params.amount,
        });
      }
    }
  }

  /**
   *  Set a transfer
   *
   * @param {string} fromAddress - the sender address
   * @param {string} toAddress - the receiver address
   * @param {string} amount - the amount sent
   * @returns {TransactionBuilder} This transaction builder
   */
  send({ toAddress, amount, assetName }: SendParams): this {
    /*
        validate to address
     */
    if (!isValidPublicKey(toAddress)) {
      throw new BuildTransactionError('Invalid or missing address, got: ' + toAddress);
    } else if (!toAddress) {
      /*
        create new wallet with new address for given mint for token
       */
    }
    /*
        validate amount
     */
    if (!amount || !isValidAmount(amount)) {
      throw new BuildTransactionError('Invalid or missing address, got: ' + amount);
    }

    /*
        validate assetName
     */
    if (!assetName || !isSupportedAssetName(assetName)) {
      throw new BuildTransactionError('Unsupported asset, got: ' + assetName);
    }

    this._sendParams.push({ toAddress, amount, assetName }); // fix

    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._sender, 'Sender must be set before building the transaction');

    const transferData = this._sendParams.map((sendParams: SendParams): TokenTransfer => {
      return {
        type: InstructionBuilderTypes.TokenTransfer,
        params: {
          fromAddress: this._sender,
          toAddress: sendParams.toAddress,
          mint: sendParams.mint,
          amount: sendParams.amount,
        },
      };
    });

    this._instructionsData = transferData;

    return await super.buildImplementation();
  }
}
