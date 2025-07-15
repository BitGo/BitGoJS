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
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import assert from 'assert';
import { AtaInit, TokenAssociateRecipient, TokenTransfer, Transfer, SetPriorityFee } from './iface';
import { InstructionBuilderTypes } from './constants';
import _ from 'lodash';

export interface SendParams {
  address: string;
  amount: string;
  tokenName?: string;
  tokenAddress?: string;
  programId?: string;
  decimalPlaces?: number;
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
          ataAddress: ataInitInstruction.params.ataAddress,
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
    let tokenAddress;
    if (recipient.tokenAddress) {
      tokenAddress = recipient.tokenAddress;
    } else if (token) {
      tokenAddress = token.tokenAddress;
    }

    if (!tokenAddress) {
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
      this._sendParams.map(async (sendParams: SendParams): Promise<Transfer | TokenTransfer> => {
        if (sendParams.tokenName) {
          const coin = getSolTokenFromTokenName(sendParams.tokenName);
          let tokenAddress: string;
          let tokenName: string;
          let programId: string | undefined;
          let decimals: number | undefined;
          if (sendParams.tokenAddress && sendParams.programId && sendParams.decimalPlaces) {
            tokenName = sendParams.tokenName;
            tokenAddress = sendParams.tokenAddress;
            decimals = sendParams.decimalPlaces;
            programId = sendParams.programId;
          } else if (coin) {
            tokenName = coin.name;
            tokenAddress = coin.tokenAddress;
            decimals = coin.decimalPlaces;
            programId = coin.programId;
          } else {
            throw new Error(`Could not determine token information for ${sendParams.tokenName}`);
          }

          const sourceAddress = await getAssociatedTokenAccountAddress(tokenAddress, this._sender, false, programId);
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
        const recipientTokenAddress = await getAssociatedTokenAccountAddress(
          tokenAddress,
          recipient.ownerAddress,
          false,
          programId
        );
        return {
          type: InstructionBuilderTypes.CreateAssociatedTokenAccount,
          params: {
            ownerAddress: recipient.ownerAddress,
            tokenName: tokenName,
            mintAddress: tokenAddress,
            ataAddress: recipientTokenAddress,
            payerAddress: this._sender,
            programId: programId,
          },
        };
      })
    );

    let addPriorityFeeInstruction: SetPriorityFee;
    // If there are createAtaInstructions, then token is involved and we need to add a priority fee instruction
    if (!this._priorityFee || this._priorityFee === Number(0)) {
      this._instructionsData = [...createAtaInstructions, ...sendInstructions];
    } else if (
      createAtaInstructions.length !== 0 ||
      sendInstructions.some((instruction) => instruction.type === InstructionBuilderTypes.TokenTransfer)
    ) {
      addPriorityFeeInstruction = {
        type: InstructionBuilderTypes.SetPriorityFee,
        params: {
          fee: this._priorityFee,
        },
      };
      this._instructionsData = [addPriorityFeeInstruction, ...createAtaInstructions, ...sendInstructions];
    }

    return await super.buildImplementation();
  }
}
