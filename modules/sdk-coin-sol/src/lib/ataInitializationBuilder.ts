import { TransactionBuilder } from './transactionBuilder';
import { BuildTransactionError, DuplicateMethodError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from './transaction';
import { AtaInit, PermissionlessThawIdempotent, TokenAssociateRecipient } from './iface';
import { InstructionBuilderTypes } from './constants';
import {
  getAssociatedTokenAccountAddress,
  getSolTokenFromTokenName,
  validateMintAddress,
  validateOwnerAddress,
} from './utils';
import assert from 'assert';
import * as _ from 'lodash';

export class AtaInitializationBuilder extends TransactionBuilder {
  // @deprecated - Use the _tokenAssociateRecipients field instead
  private _tokenName: string;
  // @deprecated - Use the _tokenAssociateRecipients field instead
  private _mint: string;
  // @deprecated - Use the _tokenAssociateRecipients field instead
  private _owner: string;
  private _tokenAssociateRecipients: TokenAssociateRecipient[];
  private _permissionlessThawParams: PermissionlessThawIdempotent['params'][];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
    this._permissionlessThawParams = [];
    this._tokenAssociateRecipients = [];
  }

  protected get transactionType(): TransactionType {
    return TransactionType.AssociatedTokenAccountInitialization;
  }

  /** @inheritDoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this._permissionlessThawParams = [];
    this._tokenAssociateRecipients = [];
    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.CreateAssociatedTokenAccount) {
        const ataInitInstruction: AtaInit = instruction;
        this._tokenAssociateRecipients.push({
          ownerAddress: ataInitInstruction.params.ownerAddress,
          tokenName: ataInitInstruction.params.tokenName,
          tokenAddress: ataInitInstruction.params.mintAddress,
          programId: ataInitInstruction.params.programId,
        });
      } else if (instruction.type === InstructionBuilderTypes.PermissionlessThawIdempotent) {
        this._permissionlessThawParams.push((instruction as PermissionlessThawIdempotent).params);
      }
    }
  }

  /**
   * @deprecated - Use the enableToken method instead
   * Sets the mint address of the associated token account
   *
   * @param tokenName name of the token
   */
  mint(tokenName: string): this {
    if (this._tokenAssociateRecipients.length > 0) {
      throw new DuplicateMethodError('Invalid method: enableToken already used');
    }
    const token = getSolTokenFromTokenName(tokenName);
    if (!token) {
      throw new BuildTransactionError('Invalid transaction: invalid token name, got: ' + tokenName);
    }
    this._mint = token.tokenAddress;
    this._tokenName = token.name;
    validateMintAddress(this._mint);
    return this;
  }

  /**
   * @deprecated - Use the enableToken method instead
   * Sets the owner address of the associated token account
   *
   * @param owner owner address of associated token account
   */
  owner(owner: string): this {
    if (this._tokenAssociateRecipients.length > 0) {
      throw new DuplicateMethodError('Invalid method: enableToken already used');
    }
    this._owner = owner;
    validateOwnerAddress(owner);
    return this;
  }

  /**
   * @deprecated - Use the associatedTokenAccountRent method instead
   * Used to set the minimum rent exempt amount
   *
   * @param rentExemptAmount minimum rent exempt amount in lamports
   */
  rentExemptAmount(rentExemptAmount: string): this {
    return super.associatedTokenAccountRent(rentExemptAmount);
  }

  /**
   * Used for adding token association recipients consisting
   *  1. ownerAddress: owner of the token address
   *  2. tokenName: the name of token enabled that is supported by BitGo
   *
   *  @param TokenAssociateRecipient token associate recipient info
   */

  enableToken(recipient: TokenAssociateRecipient): this {
    if (this._tokenAssociateRecipients.some((tokenAssociate) => _.isEqual(tokenAssociate, recipient))) {
      throw new BuildTransactionError(
        'Invalid transaction: invalid duplicate recipients, got: owner ' +
          recipient.ownerAddress +
          ' and tokenName ' +
          recipient.tokenName +
          ' twice'
      );
    }
    if (this._tokenName || this._mint) {
      throw new DuplicateMethodError('Invalid method: single mint already used');
    }
    validateOwnerAddress(recipient.ownerAddress);
    let tokenAddress: string;
    if (recipient.tokenAddress) {
      tokenAddress = recipient.tokenAddress;
    } else {
      const token = getSolTokenFromTokenName(recipient.tokenName);
      if (token) {
        tokenAddress = token.tokenAddress;
      } else {
        throw new BuildTransactionError('Invalid transaction: invalid token name, got: ' + recipient.tokenName);
      }
    }
    validateMintAddress(tokenAddress);

    this._tokenAssociateRecipients.push(recipient);
    return this;
  }

  /**
   * Set a resolved sRFC-37 Token ACL permissionless-thaw instruction for an ATA enablement.
   *
   * The builder remains offline; callers resolve gating accounts live and pass fully materialized
   * params. Multiple Token-2022 ATA enablements may each add one thaw instruction.
   *
   * @param {PermissionlessThawIdempotent['params']} params - resolved thaw params
   * @returns {AtaInitializationBuilder} This transaction builder
   */
  permissionlessThaw(params: PermissionlessThawIdempotent['params']): this {
    this._permissionlessThawParams.push(params);
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._sender, 'Sender must be set before building the transaction');
    if (this._tokenAssociateRecipients.length === 0) {
      assert(this._mint && this._tokenName, 'Mint must be set before building the transaction');
      this._owner = this._owner || this._sender;

      this._tokenAssociateRecipients.push({
        ownerAddress: this._owner,
        tokenName: this._tokenName,
      });
    }

    this._instructionsData = [];
    await Promise.all(
      this._tokenAssociateRecipients.map(async (recipient) => {
        let tokenAddress: string;
        let programId: string;
        if (recipient.tokenAddress && recipient.programId) {
          tokenAddress = recipient.tokenAddress;
          programId = recipient.programId;
        } else {
          const token = getSolTokenFromTokenName(recipient.tokenName);
          if (token) {
            tokenAddress = token.tokenAddress;
            programId = token.programId;
          } else {
            throw new BuildTransactionError('Invalid transaction: invalid token name, got: ' + recipient.tokenName);
          }
        }

        // Use the provided ataAddress if it exists, otherwise calculate it
        let ataPk = recipient.ataAddress;
        if (!ataPk) {
          ataPk = await getAssociatedTokenAccountAddress(tokenAddress, recipient.ownerAddress, false, programId);
        }

        this._instructionsData.push({
          type: InstructionBuilderTypes.CreateAssociatedTokenAccount,
          params: {
            mintAddress: tokenAddress,
            ataAddress: ataPk,
            ownerAddress: recipient.ownerAddress,
            // Match transactionBuilder fee payer selection when a distinct fee payer is set.
            payerAddress: this._feePayer ?? this._sender,
            tokenName: recipient.tokenName,
            programId: programId,
          },
        });
      })
    );

    this._instructionsData.push(
      ...this._permissionlessThawParams.map(
        (params): PermissionlessThawIdempotent => ({
          type: InstructionBuilderTypes.PermissionlessThawIdempotent,
          params,
        })
      )
    );

    return await super.buildImplementation();
  }
}
