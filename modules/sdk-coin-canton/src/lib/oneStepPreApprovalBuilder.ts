import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { CantonPrepareCommandResponse, OneStepEnablementRequest } from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction/transaction';

export class OneStepPreApprovalBuilder extends TransactionBuilder {
  private _synchronizerId: string;
  private _commandId: string;
  private _templateId: string;
  private _receiverPartyId: string;
  private _providerPartyId: string;
  private _expectedDso: string;
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.setTransactionType();
  }

  get transactionType(): TransactionType {
    return TransactionType.OneStepPreApproval;
  }

  setTransactionType(): void {
    this.transaction.transactionType = TransactionType.OneStepPreApproval;
  }

  setTransaction(transaction: CantonPrepareCommandResponse): void {
    this.transaction.prepareCommand = transaction;
  }

  /**
   * Sets the synchronizer ID for the pre-approval builder.
   *
   * @param id - The synchronizer identifier (must be a non-empty string).
   * @returns The current builder instance for chaining.
   * @throws Error if the synchronizer ID is empty.
   */
  synchronizerId(id: string): this {
    if (!id.trim()) {
      throw new Error('synchronizer must be a non-empty string');
    }
    this._synchronizerId = id.trim();
    return this;
  }

  /**
   * Sets the unique id for the 1-step enablement
   * Also sets the _id of the transaction
   *
   * @param id - A uuid
   * @returns The current builder instance for chaining.
   * @throws Error if id is empty.
   */
  commandId(id: string): this {
    if (!id.trim()) {
      throw new Error('commandId must be a non-empty string');
    }
    this._commandId = id.trim();
    // also set the transaction _id
    this.transaction.id = id.trim();
    return this;
  }

  /**
   * Sets the template id for the 1-step enablement
   *
   * @param id - the template if of the form `#splice-wallet:Splice.Wallet.TransferPreapproval:TransferPreapprovalProposal`
   * @returns The current builder instance for chaining.
   * @throws Error if id is empty.
   */
  templateId(id: string): this {
    if (!id.trim()) {
      throw new Error('templateId must be a non-empty string');
    }
    this._templateId = id.trim();
    return this;
  }

  /**
   * Sets the receiver for the 1-step enablement
   *
   * @param id - the receiver party id (address)
   * @returns The current builder instance for chaining.
   * @throws Error if id is empty.
   */
  receiverPartyId(id: string): this {
    if (!id.trim()) {
      throw new Error('receiverPartyId must be a non-empty string');
    }
    this._receiverPartyId = id.trim();
    return this;
  }

  /**
   * Sets the provider for the 1-step enablement
   *
   * @param id - the validator party id (address)
   * @returns The current builder instance for chaining.
   * @throws Error if id is empty.
   */
  providerPartyId(id: string): this {
    if (!id.trim()) {
      throw new Error('providerPartyId must be a non-empty string');
    }
    this._providerPartyId = id.trim();
    return this;
  }

  /**
   * Sets the dso id for the 1-step enablement
   *
   * @param id - the dso id of the validator
   * @returns The current builder instance for chaining.
   * @throws Error if id is empty.
   */
  expectedDso(id: string): this {
    if (!id.trim()) {
      throw new Error('expectedDso must be a non-empty string');
    }
    this._expectedDso = id.trim();
    return this;
  }

  /**
   * Builds and returns the OneStepEnablementRequest object from the builder's internal state.
   *
   * This method performs validation before constructing the object. If required fields are
   * missing or invalid, it throws an error.
   *
   * @returns {OneStepEnablementRequest} - A fully constructed and validated request object for 1-step enablement.
   * @throws {Error} If any required field is missing or fails validation.
   */
  toRequestObject(): OneStepEnablementRequest {
    this.validate();

    return {
      commandId: this._commandId,
      commands: [
        {
          CreateCommand: {
            templateId: this._templateId,
            createArguments: {
              receiver: this._receiverPartyId,
              provider: this._providerPartyId,
              expectedDso: this._expectedDso,
            },
          },
        },
      ],
      disclosedContracts: [],
      synchronizerId: this._synchronizerId,
      verboseHashing: false,
      actAs: [this._receiverPartyId],
      readAs: [],
      packageIdSelectionPreference: [],
    };
  }

  /**
   * Validates the internal state of the builder before building the request object.
   *
   * @private
   * @throws {Error} If any required field is missing or invalid.
   */
  private validate(): void {
    if (!this._receiverPartyId) throw new Error('receiver partyId is missing');
    if (!this._providerPartyId) throw new Error('provider partyId is missing');
    if (!this._expectedDso) throw new Error('expectedDso is missing');
    if (!this._commandId) throw new Error('commandId is missing');
    if (!this._templateId) throw new Error('templateId is missing');
    if (!this._synchronizerId) throw new Error('synchronizerId is missing');
  }
}
