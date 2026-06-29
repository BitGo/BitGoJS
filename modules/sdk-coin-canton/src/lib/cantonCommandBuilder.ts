import {
  InvalidTransactionError,
  PublicKey,
  TransactionType,
  CantonCommand,
  CantonCommandResolveContractSpec,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { CANTON_COMMAND_KEYS, CantonCommandRequest, CantonPrepareCommandResponse } from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction/transaction';
import utils from './utils';

export class CantonCommandBuilder extends TransactionBuilder {
  private _commandId: string;
  private _actAs: string[] = [];
  private _readAs: string[] = [];
  private _command: CantonCommand;
  private _resolveContracts: CantonCommandResolveContractSpec[] = [];
  private _token?: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.setTransactionType();
    try {
      this._commandId = tx.id;
    } catch {
      // tx.id throws when not set — leave _commandId uninitialized
    }
    const parties = tx.cantonCommandActAsParties;
    if (parties.length > 0) {
      this._actAs = parties;
    }
  }

  get transactionType(): TransactionType {
    return TransactionType.CantonCommand;
  }

  setTransactionType(): void {
    this.transaction.transactionType = TransactionType.CantonCommand;
  }

  setTransaction(transaction: CantonPrepareCommandResponse): void {
    this.transaction.prepareCommand = transaction;
  }

  /** @inheritDoc */
  addSignature(publicKey: PublicKey, signature: Buffer): void {
    if (!this.transaction) {
      throw new InvalidTransactionError('transaction is empty!');
    }
    this._signatures.push({ publicKey, signature });
    const pubKeyBase64 = utils.getBase64FromHex(publicKey.pub);
    this.transaction.signerFingerprint = utils.getAddressFromPublicKey(pubKeyBase64);
    this.transaction.signatures = signature.toString('base64');
  }

  /**
   * Sets the unique command id. Also sets the transaction _id.
   *
   * @param id - A uuid
   * @returns The current builder instance for chaining.
   */
  commandId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('commandId must be a non-empty string');
    }
    this._commandId = id.trim();
    this.transaction.id = id.trim();
    return this;
  }

  /**
   * Sets the parties that will act in the DAML submission.
   *
   * @param parties - Non-empty array of fully-qualified party ids
   * @returns The current builder instance for chaining.
   */
  actAs(parties: string[]): this {
    if (!parties || parties.length === 0) {
      throw new Error('actAs must be a non-empty array');
    }
    const normalizedParties = parties.map((p) => p.trim());
    if (normalizedParties.some((p) => !p)) {
      throw new Error('actAs parties must be non-empty strings');
    }
    this._actAs = normalizedParties;
    this.transaction.cantonCommandActAs = normalizedParties;
    return this;
  }

  /**
   * Sets the read-only parties for the DAML submission.
   *
   * @param parties - Array of fully-qualified party ids
   * @returns The current builder instance for chaining.
   */
  readAs(parties?: string[] | null): this {
    if (parties && parties.length > 0) {
      const normalized = parties.map((p) => p.trim());
      if (normalized.some((p) => !p)) {
        throw new Error('readAs parties must be non-empty strings');
      }
      this._readAs = normalized;
    } else {
      this._readAs = [];
    }
    return this;
  }

  /**
   * Sets the opaque DAML command object (CreateCommand or ExerciseCommand).
   *
   * @param command - The raw DAML command as a plain object
   * @returns The current builder instance for chaining.
   */
  command(command: CantonCommand): this {
    if (!command || typeof command !== 'object' || Array.isArray(command)) {
      throw new Error('command must be a plain object');
    }
    this._command = command;
    return this;
  }

  /**
   * Sets the list of ACS contract resolution specs that IMS will resolve before prepare.
   *
   * @param specs - Array of CantonCommandResolveContractSpec
   * @returns The current builder instance for chaining.
   */
  resolveContracts(specs?: CantonCommandResolveContractSpec[] | null): this {
    this._resolveContracts = specs ?? [];
    return this;
  }

  /**
   * Sets the Canton token identifier (e.g. 'tcanton:stgusd1') forwarded to IMS for
   * choice-context resolution on token-specific commands such as mint and burn.
   *
   * @param name - Registered BitGo canton token name
   * @returns The current builder instance for chaining.
   */
  token(name: string): this {
    if (typeof name !== 'string' || !name.trim()) {
      throw new Error('token must be a non-empty string');
    }
    this._token = name.trim();
    return this;
  }

  /**
   * Builds and returns the CantonCommandRequest from the builder's internal state.
   *
   * @returns {CantonCommandRequest}
   * @throws {Error} If any required field is missing.
   */
  toRequestObject(): CantonCommandRequest {
    this.validate();

    const req: CantonCommandRequest = {
      commandId: this._commandId,
      actAs: this._actAs,
      readAs: this._readAs ?? [],
      command: this._command,
      resolveContracts: this._resolveContracts ?? [],
    };
    if (this._token) {
      req.token = this._token;
    }
    return req;
  }

  private validate(): void {
    if (!this._commandId) throw new Error('commandId is missing');
    if (!this._actAs || this._actAs.length === 0) throw new Error('actAs is missing');
    if (!this._command) throw new Error('command is missing');
    const activeKeys = CANTON_COMMAND_KEYS.filter((key) =>
      utils.isPlainObject(this._command[key as keyof CantonCommand])
    );
    if (activeKeys.length !== 1) {
      throw new Error(
        `command must contain exactly one of: ${CANTON_COMMAND_KEYS.join(', ')} as a non-null plain object`
      );
    }
  }
}
