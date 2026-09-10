import { InvalidTransactionError, PublicKey, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  CantonCommandRequest,
  CantonCommandResolveContractSpec,
  CantonCommandUnion,
  CantonPrepareCommandResponse,
} from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction/transaction';
import utils from './utils';

/**
 * Generic builder for any allowlisted Canton DAML command (CreateCommand or ExerciseCommand).
 * Unlike the purpose-built builders (e.g. TransferRejectionBuilder), this builder does not
 * know the shape of the command it carries — it only validates the envelope fields
 * (commandId, actAs, command) and passes the command through unchanged. The template/choice
 * allowlist and any active-contract resolution are enforced server-side.
 */
export class CantonCommandBuilder extends TransactionBuilder {
  private _commandId: string;
  private _actAs: string[] = [];
  private _readAs: string[] = [];
  private _command: CantonCommandUnion;
  private _resolveContracts: CantonCommandResolveContractSpec[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.setTransactionType();
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
   * Sets the unique id for the command
   * Also sets the _id of the transaction
   *
   * @param id - A uuid
   * @returns The current builder instance for chaining.
   * @throws Error if id is empty.
   */
  commandId(id: string): this {
    if (!id || !id.trim()) {
      throw new Error('commandId must be a non-empty string');
    }
    this._commandId = id.trim();
    // also set the transaction _id
    this.transaction.id = id.trim();
    return this;
  }

  /**
   * Sets the parties that must sign the command
   *
   * @param parties - the acting party ids
   * @returns The current builder instance for chaining.
   * @throws Error if parties is empty.
   */
  actAs(parties: string[]): this {
    if (!parties || parties.length === 0) {
      throw new Error('actAs must contain at least one party');
    }
    this._actAs = parties;
    return this;
  }

  /**
   * Sets the parties used for read-only ACS visibility
   *
   * @param parties - the read-only party ids
   * @returns The current builder instance for chaining.
   */
  readAs(parties: string[]): this {
    this._readAs = parties;
    return this;
  }

  /**
   * Sets the DAML command (CreateCommand or ExerciseCommand) to execute
   *
   * @param command - the command envelope
   * @returns The current builder instance for chaining.
   * @throws Error if command is missing.
   */
  command(command: CantonCommandUnion): this {
    if (!command) {
      throw new Error('command must be provided');
    }
    this._command = command;
    return this;
  }

  /**
   * Sets the ACS resolution specs used to look up and inject contractIds into the command
   * at build time (e.g. when the caller doesn't know the contractId up front)
   *
   * @param specs - the resolve-contract specs
   * @returns The current builder instance for chaining.
   */
  resolveContracts(specs: CantonCommandResolveContractSpec[]): this {
    this._resolveContracts = specs;
    return this;
  }

  /**
   * Builds and returns the CantonCommandRequest object from the builder's internal state.
   *
   * This method performs validation before constructing the object. If required fields are
   * missing or invalid, it throws an error.
   *
   * @returns {CantonCommandRequest} - A fully constructed and validated request object for the command.
   * @throws {Error} If any required field is missing or fails validation.
   */
  toRequestObject(): CantonCommandRequest {
    this.validate();

    const request: CantonCommandRequest = {
      commandId: this._commandId,
      command: this._command,
      verboseHashing: false,
      actAs: this._actAs,
      readAs: this._readAs,
    };
    if (this._resolveContracts.length > 0) {
      request.resolveContracts = this._resolveContracts;
    }
    return request;
  }

  /**
   * Validates the internal state of the builder before building the request object.
   *
   * @private
   * @throws {Error} If any required field is missing or invalid.
   */
  private validate(): void {
    if (!this._commandId) throw new Error('commandId is missing');
    if (!this._actAs || this._actAs.length === 0) throw new Error('actAs is missing');
    if (!this._command) throw new Error('command is missing');
  }
}
