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
import {
  AtaInit,
  ExtraAccountMeta,
  PermissionlessThawIdempotent,
  TokenAssociateRecipient,
  TokenTransfer,
  Transfer,
  SetPriorityFee,
} from './iface';
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
  private _transferHookAccounts?: ExtraAccountMeta[];
  private _permissionlessThaw?: PermissionlessThawIdempotent['params'];
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._createAtaParams = [];
  }

  /**
   * Set the resolved sRFC-37 Token ACL permissionless-thaw params for this transfer.
   *
   * These must be resolved live by the caller (e.g. via `Sol.resolvePermissionlessThaw`) since
   * builders remain offline and never perform RPC. When set, the built transaction bundles a
   * `PermissionlessThawIdempotent` instruction after any ATA creation and before the transfer, so
   * a freshly created (frozen) allowlist/blocklist token account is thawed atomically with the
   * transfer — all-or-nothing.
   *
   * @param {PermissionlessThawIdempotent['params']} params - resolved thaw params
   * @returns {TransferBuilderV2} This transaction builder
   */
  permissionlessThaw(params: PermissionlessThawIdempotent['params']): this {
    this._permissionlessThaw = params;
    return this;
  }

  /**
   * Set the resolved Token-2022 Transfer Hook extra account metas for this transfer.
   *
   * These must be resolved live by the caller (e.g. via `Sol.resolveTransferHookAccounts`)
   * since builders remain offline and never perform RPC. The order is significant and
   * must match the hook's ExtraAccountMetaList.
   *
   * @param {ExtraAccountMeta[]} metas - resolved extra account metas, in hook order
   * @returns {TransferBuilderV2} This transaction builder
   */
  transferHookAccounts(metas: ExtraAccountMeta[]): this {
    this._transferHookAccounts = metas;
    return this;
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
          if (sendParams.tokenAddress && sendParams.programId && sendParams.decimalPlaces != null) {
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
              ...(this._transferHookAccounts ? { transferHookAccounts: this._transferHookAccounts } : {}),
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
            // Match transactionBuilder fee payer selection: when a distinct fee payer
            // is set (e.g. gas tank on consolidation), it must fund ATA rent — the
            // token sender/authority often has no SOL.
            payerAddress: this._feePayer ?? this._sender,
            programId: programId,
          },
        };
      })
    );

    // When resolved, emit the permissionless thaw between ATA creation and the transfer so the
    // built order is [CreateATA?, PermissionlessThawIdempotent, TokenTransfer].
    const thawInstructions: PermissionlessThawIdempotent[] = this._permissionlessThaw
      ? [{ type: InstructionBuilderTypes.PermissionlessThawIdempotent, params: this._permissionlessThaw }]
      : [];

    let addPriorityFeeInstruction: SetPriorityFee;
    // If there are createAtaInstructions, then token is involved and we need to add a priority fee instruction
    if (!this._priorityFee || this._priorityFee === Number(0)) {
      this._instructionsData = [...createAtaInstructions, ...thawInstructions, ...sendInstructions];
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
      this._instructionsData = [
        addPriorityFeeInstruction,
        ...createAtaInstructions,
        ...thawInstructions,
        ...sendInstructions,
      ];
    }

    return await super.buildImplementation();
  }
}
