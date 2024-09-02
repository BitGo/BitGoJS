import { TransactionBuilder } from './transactionBuilder';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import {
  getAssociatedTokenAccountAddress,
  getSolTokenFromTokenName,
  isValidAmount,
  validateAddress,
  validateMintAddress,
  validateOwnerAddress,
} from './utils';
import { BaseCoin as CoinConfig, SolCoin } from '@bitgo/statics';
import assert from 'assert';
import { AtaInit, TokenAssociateRecipient, TokenTransfer, Transfer } from './iface';
import { InstructionBuilderTypes } from './constants';
import _ from 'lodash';

export interface SendParams {
  address: string;
  amount: string;
  tokenName?: string;
}

const UNSIGNED_BIGINT_MAX = BigInt('18446744073709551615');

export class TransferBuilderV2 extends TransactionBuilder {
  private _sendParams: SendParams[] = [];
  private _createAtaParams: TokenAssociateRecipient[];
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._createAtaParams = [];
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);

    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.Transfer) {
        const transferInstruction: Transfer = instruction;
        this.sender(transferInstruction.params.fromAddress);
        this.send({
          address: transferInstruction.params.toAddress,
          amount: transferInstruction.params.amount,
        });
      } else if (instruction.type === InstructionBuilderTypes.TokenTransfer) {
        const transferInstruction: TokenTransfer = instruction;
        this.sender(transferInstruction.params.fromAddress);
        this.send({
          address: transferInstruction.params.toAddress,
          amount: transferInstruction.params.amount,
          tokenName: transferInstruction.params.tokenName,
        });
      } else if (instruction.type === InstructionBuilderTypes.CreateAssociatedTokenAccount) {
        const ataInitInstruction: AtaInit = instruction;
        this._createAtaParams.push({
          ownerAddress: ataInitInstruction.params.ownerAddress,
          tokenName: ataInitInstruction.params.tokenName,
        });
      }
    }
  }

  /**
   * Set a feePayer
   * @param payerAddress
   */
  feePayer(payerAddress: string): this {
    validateAddress(payerAddress, 'address');
    this._feePayer = payerAddress;
    return this;
  }

  /**
   *  Set a transfer
   *
   * @param {SendParams} sendParams - sendParams
   * @returns {TransactionBuilder} This transaction builder
   */
  send(sendParams: SendParams): this {
    validateAddress(sendParams.address, 'address');
    if (!sendParams.amount || !isValidAmount(sendParams.amount)) {
      throw new BuildTransactionError('Invalid or missing amount, got: ' + sendParams.amount);
    }
    if (sendParams.tokenName && BigInt(sendParams.amount) > UNSIGNED_BIGINT_MAX) {
      throw new BuildTransactionError(`input amount ${sendParams.amount} exceeds big int limit ${UNSIGNED_BIGINT_MAX}`);
    } else if (!sendParams.tokenName && BigInt(sendParams.amount) > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new BuildTransactionError(
        `input amount ${sendParams.amount} exceeds max safe int ${Number.MAX_SAFE_INTEGER}`
      );
    }

    this._sendParams.push(sendParams);
    return this;
  }

  /**
   *
   * @param {TokenAssociateRecipient} recipient - recipient of the associated token account creation
   * @param {string} recipient.ownerAddress - owner of the associated token account
   * @param {string} recipient.tokenName - name of the token that is intended to associate
   * @returns {TransactionBuilder} This transaction builder
   */
  createAssociatedTokenAccount(recipient: TokenAssociateRecipient): this {
    validateOwnerAddress(recipient.ownerAddress);
    const token = getSolTokenFromTokenName(recipient.tokenName);
    if (!token) {
      throw new BuildTransactionError('Invalid token name, got: ' + recipient.tokenName);
    }
    validateMintAddress(token.tokenAddress);

    this._createAtaParams.push(recipient);
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._sender, 'Sender must be set before building the transaction');
    const sendInstructions = await Promise.all(
      this._sendParams.map(async (sendParams: SendParams): Promise<Transfer | TokenTransfer> => {
        if (sendParams.tokenName) {
          const coin = getSolTokenFromTokenName(sendParams.tokenName);
          assert(coin instanceof SolCoin);
          const sourceAddress = await getAssociatedTokenAccountAddress(coin.tokenAddress, this._sender);
          return {
            type: InstructionBuilderTypes.TokenTransfer,
            params: {
              fromAddress: this._sender,
              toAddress: sendParams.address,
              amount: sendParams.amount,
              tokenName: coin.name,
              sourceAddress: sourceAddress,
            },
          };
        } else {
          return {
            type: InstructionBuilderTypes.Transfer,
            params: {
              fromAddress: this._sender,
              toAddress: sendParams.address,
              amount: sendParams.amount,
            },
          };
        }
      })
    );
    const uniqueCreateAtaParams = _.uniqBy(this._createAtaParams, (recipient: TokenAssociateRecipient) => {
      return recipient.ownerAddress + recipient.tokenName;
    });
    const createAtaInstructions = await Promise.all(
      uniqueCreateAtaParams.map(async (recipient: TokenAssociateRecipient): Promise<AtaInit> => {
        const coin = getSolTokenFromTokenName(recipient.tokenName);
        assert(coin instanceof SolCoin);
        const recipientTokenAddress = await getAssociatedTokenAccountAddress(coin.tokenAddress, recipient.ownerAddress);
        return {
          type: InstructionBuilderTypes.CreateAssociatedTokenAccount,
          params: {
            ownerAddress: recipient.ownerAddress,
            tokenName: coin.name,
            mintAddress: coin.tokenAddress,
            ataAddress: recipientTokenAddress,
            payerAddress: this._sender,
          },
        };
      })
    );
    // order is important, createAtaInstructions must be before sendInstructions
    this._instructionsData = [...createAtaInstructions, ...sendInstructions];
    return await super.buildImplementation();
  }
}
