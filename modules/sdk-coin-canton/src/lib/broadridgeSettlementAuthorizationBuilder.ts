import { CantonCommand, PublicKey, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  BroadridgeCommandRequest,
  BroadridgeProtocolDescriptor,
  BroadridgeSettlementIdentity,
  CantonPrepareCommandResponse,
} from './iface';
import { CantonCommandBuilder } from './cantonCommandBuilder';
import { BROADRIDGE_CHOICES, BROADRIDGE_TEMPLATE_NAMES, BroadridgeOperation } from './broadridge';

export interface BroadridgeSettlementAuthorizationParams {
  commandId: string;
  templateId: string;
  actAs: string[];
  contractId?: string;
  choiceArgument?: Record<string, unknown>;
  settlement?: BroadridgeSettlementIdentity;
  requestCid?: string;
  agreementCid?: string;
  allocationCids?: string[];
}

/** Builds only the exact CIP-56 Settlement Authorization commands. */
export class BroadridgeSettlementAuthorizationBuilder extends CantonCommandBuilder {
  private _broadridge?: BroadridgeProtocolDescriptor;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
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

  addSignature(publicKey: PublicKey, signature: Buffer): void {
    super.addSignature(publicKey, signature);
  }

  override toRequestObject(): BroadridgeCommandRequest {
    const request = super.toRequestObject() as BroadridgeCommandRequest;
    if (!this._broadridge) {
      throw new Error('Broadridge protocol descriptor is missing');
    }
    request.broadridge = this._broadridge;
    return request;
  }

  createStandingDelegation(params: BroadridgeSettlementAuthorizationParams): this {
    return this.configure(params, BROADRIDGE_TEMPLATE_NAMES.standingDelegation, 'Create', 'client');
  }

  revokeStandingDelegation(params: BroadridgeSettlementAuthorizationParams): this {
    return this.configure(
      params,
      BROADRIDGE_TEMPLATE_NAMES.standingDelegation,
      BROADRIDGE_CHOICES.delegationRevoke,
      'client'
    );
  }

  withdrawStandingDelegation(params: BroadridgeSettlementAuthorizationParams): this {
    return this.configure(
      params,
      BROADRIDGE_TEMPLATE_NAMES.standingDelegation,
      BROADRIDGE_CHOICES.delegationWithdraw,
      'executor'
    );
  }

  proposeSettlement(params: BroadridgeSettlementAuthorizationParams): this {
    return this.configure(
      params,
      BROADRIDGE_TEMPLATE_NAMES.standingDelegation,
      BROADRIDGE_CHOICES.delegationPropose,
      'executor'
    );
  }

  acceptSettlement(params: BroadridgeSettlementAuthorizationParams): this {
    return this.configure(
      params,
      BROADRIDGE_TEMPLATE_NAMES.standingDelegation,
      BROADRIDGE_CHOICES.delegationAccept,
      'executor'
    );
  }

  acceptSettlementProposal(params: BroadridgeSettlementAuthorizationParams): this {
    return this.configure(
      params,
      BROADRIDGE_TEMPLATE_NAMES.settlementProposal,
      BROADRIDGE_CHOICES.proposalAccept,
      'trading-party'
    );
  }

  rejectSettlementProposal(params: BroadridgeSettlementAuthorizationParams): this {
    return this.configure(
      params,
      BROADRIDGE_TEMPLATE_NAMES.settlementProposal,
      BROADRIDGE_CHOICES.proposalReject,
      'trading-party'
    );
  }

  withdrawSettlementProposal(params: BroadridgeSettlementAuthorizationParams): this {
    return this.configure(
      params,
      BROADRIDGE_TEMPLATE_NAMES.settlementProposal,
      BROADRIDGE_CHOICES.proposalWithdraw,
      'executor'
    );
  }

  settleAgreement(params: BroadridgeSettlementAuthorizationParams): this {
    return this.configure(
      params,
      BROADRIDGE_TEMPLATE_NAMES.settlementAgreement,
      BROADRIDGE_CHOICES.agreementSettle,
      'executor'
    );
  }

  cancelAgreement(params: BroadridgeSettlementAuthorizationParams): this {
    return this.configure(
      params,
      BROADRIDGE_TEMPLATE_NAMES.settlementAgreement,
      BROADRIDGE_CHOICES.agreementCancel,
      'executor'
    );
  }

  private configure(
    params: BroadridgeSettlementAuthorizationParams,
    entityName: string,
    operation: BroadridgeOperation,
    role: BroadridgeProtocolDescriptor['role']
  ): this {
    if (!params || !params.templateId || !params.templateId.trim()) {
      throw new Error('templateId must be a non-empty string');
    }
    const parts = params.templateId.split(':');
    const expectedModule = `Broadridge.Token.Implementations.${entityName}`;
    if (
      parts.length !== 3 ||
      !parts[0] ||
      (parts[1] !== 'Broadridge.Token.Implementations' && parts[1] !== expectedModule) ||
      parts[2] !== entityName
    ) {
      throw new Error(`templateId must identify Broadridge.Token.Implementations:${entityName}`);
    }
    this.commandId(params.commandId);
    this.actAs(params.actAs);
    const command: CantonCommand =
      operation === 'Create'
        ? { CreateCommand: { templateId: params.templateId, createArguments: params.choiceArgument ?? {} } }
        : {
            ExerciseCommand: {
              templateId: params.templateId,
              contractId: params.contractId,
              choice: operation,
              choiceArgument: params.choiceArgument ?? {},
            },
          };
    this.command(command);
    const createArguments = operation === 'Create' ? params.choiceArgument ?? {} : {};
    const client = typeof createArguments.client === 'string' ? createArguments.client : undefined;
    const executor = typeof createArguments.executor === 'string' ? createArguments.executor : undefined;
    this._broadridge = {
      protocol: 'broadridge',
      standard: 'CIP-56',
      packageId: parts[0],
      moduleName: parts[1],
      entityName: parts[2],
      templateId: params.templateId,
      ...(operation !== 'Create' ? { choice: operation } : {}),
      role,
      actors: [...params.actAs],
      ...(client ? { client } : {}),
      ...(executor ? { executor } : {}),
      ...(params.requestCid ? { requestCid: params.requestCid } : {}),
      ...(params.agreementCid ? { agreementCid: params.agreementCid } : {}),
      ...(params.settlement ? { settlement: params.settlement } : {}),
      ...(params.allocationCids ? { allocationCids: [...params.allocationCids] } : {}),
    };
    return this;
  }
}
