import { BaseCoin as CoinConfig, SolCoin } from '@bitgo/statics';
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
import { InstructionBuilderTypes } from './constants';
import { AtaInit, TokenAssociateRecipient, TokenTransfer } from './iface';
import assert from 'assert';
import { TransactionBuilder } from './transactionBuilder';
import _ from 'lodash';

export interface SendParams {
  address: string;
  amount: string;
  tokenName: string;
}

const UNSIGNED_BIGINT_MAX = BigInt('18446744073709551615');

export class TokenTransferBuilder extends TransactionBuilder {
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
      if (instruction.type === InstructionBuilderTypes.TokenTransfer) {
        const transferInstruction: TokenTransfer = instruction;
        this.sender(transferInstruction.params.fromAddress);
        this.send({
          address: transferInstruction.params.toAddress,
          amount: transferInstruction.params.amount,
          tokenName: transferInstruction.params.tokenName,
        });
      }
      if (instruction.type === InstructionBuilderTypes.CreateAssociatedTokenAccount) {
        const ataInitInstruction: AtaInit = instruction;
        this._createAtaParams.push({
          ownerAddress: ataInitInstruction.params.ownerAddress,
          tokenName: ataInitInstruction.params.tokenName,
        });
      }
    }
  }

  /**
   *  Set a transfer
   *
   * @param {SendParams} params - params for the transfer
   * @param {string} params.address - the receiver token address
   * @param {string} params.amount - the amount sent
   * @param {string} params.tokenName - name of token that is intended to send
   * @returns {TransactionBuilder} This transaction builder
   */
  send({ address, amount, tokenName }: SendParams): this {
    validateAddress(address, 'address');
    if (!amount || !isValidAmount(amount)) {
      throw new BuildTransactionError('Invalid or missing amount, got: ' + amount);
    }
    if (BigInt(amount) > UNSIGNED_BIGINT_MAX) {
      throw new BuildTransactionError(`input amount ${amount} exceeds big int limit ${UNSIGNED_BIGINT_MAX}`);
    }

    this._sendParams.push({ address, amount, tokenName: tokenName });
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
      this._sendParams.map(async (sendParams: SendParams): Promise<TokenTransfer> => {
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
