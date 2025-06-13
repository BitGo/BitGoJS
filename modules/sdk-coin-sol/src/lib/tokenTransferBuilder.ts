import { BaseCoin as CoinConfig } from '@bitgo/statics';
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
import { AtaInit, TokenAssociateRecipient, TokenTransfer, SetPriorityFee } from './iface';
import assert from 'assert';
import { TransactionBuilder } from './transactionBuilder';
import _ from 'lodash';

export interface SendParams {
  address: string;
  amount: string;
  tokenName: string;
  tokenAddress?: string;
  programId?: string;
  decimalPlaces?: number;
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
          ataAddress: ataInitInstruction.params.ataAddress,
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
  send({ address, amount, tokenName, tokenAddress, programId, decimalPlaces }: SendParams): this {
    validateAddress(address, 'address');
    if (!amount || !isValidAmount(amount)) {
      throw new BuildTransactionError('Invalid or missing amount, got: ' + amount);
    }
    if (BigInt(amount) > UNSIGNED_BIGINT_MAX) {
      throw new BuildTransactionError(`input amount ${amount} exceeds big int limit ${UNSIGNED_BIGINT_MAX}`);
    }

    this._sendParams.push({ address, amount, tokenName: tokenName, tokenAddress, programId, decimalPlaces });
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
    let tokenAddress: string;
    if (recipient.tokenAddress) {
      tokenAddress = recipient.tokenAddress;
    } else if (token) {
      tokenAddress = token.tokenAddress;
    } else {
      throw new BuildTransactionError('Invalid token name, got: ' + recipient.tokenName);
    }
    validateMintAddress(tokenAddress);

    this._createAtaParams.push(recipient);
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._sender, 'Sender must be set before building the transaction');
    const sendInstructions = await Promise.all(
      this._sendParams.map(async (sendParams: SendParams): Promise<TokenTransfer> => {
        const coin = getSolTokenFromTokenName(sendParams.tokenName);
        let tokenAddress: string;
        let tokenName: string;
        let programId: string | undefined;
        let decimals: number | undefined;
        if (sendParams.tokenAddress && sendParams.programId && sendParams.decimalPlaces) {
          tokenAddress = sendParams.tokenAddress;
          tokenName = sendParams.tokenName;
          programId = sendParams.programId;
          decimals = sendParams.decimalPlaces;
        } else if (coin) {
          tokenAddress = coin.tokenAddress;
          tokenName = coin.name;
          programId = coin.programId;
          decimals = coin.decimalPlaces;
        } else {
          throw new Error(`Could not determine token information for ${sendParams.tokenName}`);
        }
        const sourceAddress = await getAssociatedTokenAccountAddress(tokenAddress, this._sender);
        return {
          type: InstructionBuilderTypes.TokenTransfer,
          params: {
            fromAddress: this._sender,
            toAddress: sendParams.address,
            amount: sendParams.amount,
            tokenName: tokenName,
            sourceAddress: sourceAddress,
            tokenAddress: tokenAddress,
            programId: programId,
            decimalPlaces: decimals,
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
        let tokenAddress: string;
        let tokenName: string;
        let programId: string | undefined;
        if (recipient.tokenAddress && recipient.programId) {
          tokenName = recipient.tokenName;
          tokenAddress = recipient.tokenAddress;
          programId = recipient.programId;
        } else if (coin) {
          tokenName = coin.name;
          tokenAddress = coin.tokenAddress;
          programId = coin.programId;
        } else {
          throw new Error(`Could not determine token information for ${recipient.tokenName}`);
        }

        // Use the provided ataAddress if it exists, otherwise calculate it
        let ataAddress = recipient.ataAddress;
        if (!ataAddress) {
          ataAddress = await getAssociatedTokenAccountAddress(tokenAddress, recipient.ownerAddress);
        }
        return {
          type: InstructionBuilderTypes.CreateAssociatedTokenAccount,
          params: {
            ownerAddress: recipient.ownerAddress,
            mintAddress: tokenAddress,
            ataAddress,
            payerAddress: this._sender,
            tokenName: tokenName,
            programId: programId,
          },
        };
      })
    );
    const addPriorityFeeInstruction: SetPriorityFee = {
      type: InstructionBuilderTypes.SetPriorityFee,
      params: {
        fee: this._priorityFee,
      },
    };

    if (!this._priorityFee || this._priorityFee === Number(0)) {
      this._instructionsData = [...createAtaInstructions, ...sendInstructions];
    } else {
      // order is important, createAtaInstructions must be before sendInstructions
      this._instructionsData = [addPriorityFeeInstruction, ...createAtaInstructions, ...sendInstructions];
    }
    return await super.buildImplementation();
  }
}
