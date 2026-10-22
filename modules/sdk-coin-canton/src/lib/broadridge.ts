import {
  BroadridgeAllocationLeg,
  BroadridgeAllocationRequestData,
  BroadridgeAllocationRequestOutcome,
  BroadridgeAllocationSpecification,
  BroadridgeProtocolDescriptor,
  BroadridgeSettlementAuthorizationData,
  BroadridgeSettlementIdentity,
  CantonCommandInfo,
} from './iface';

const V1_ALLOCATION_MODULE = 'Broadridge.Token.Implementations.AllocationRequestImpl_v1';
const V2_ALLOCATION_MODULE = 'Broadridge.Token.Implementations.AllocationRequestImpl_v2';
const SETTLEMENT_MODULE = 'Broadridge.Token.Implementations';

function settlementModule(entityName: string): string {
  return `${SETTLEMENT_MODULE}.${entityName}`;
}

export const BROADRIDGE_TEMPLATE_NAMES = {
  allocationRequestV1: 'AllocationRequestImpl_v1',
  allocationRequestV2: 'AllocationRequestImpl_v2',
  standingDelegation: 'StandingDelegationImpl_v1',
  settlementProposal: 'SettlementProposalImpl_v1',
  settlementAgreement: 'SettlementAgreementImpl_v1',
} as const;

export const BROADRIDGE_CHOICES = {
  requestAccept: 'AllocationRequest_Accept',
  requestReject: 'AllocationRequest_Reject',
  requestWithdraw: 'AllocationRequest_Withdraw',
  archive: 'Archive',
  delegationRevoke: 'StandingDelegation_Revoke',
  delegationWithdraw: 'StandingDelegation_Withdraw',
  delegationPropose: 'StandingDelegation_ProposeSettlement',
  delegationAccept: 'StandingDelegation_AcceptSettlement',
  proposalAccept: 'SettlementProposal_Accept',
  proposalReject: 'SettlementProposal_Reject',
  proposalWithdraw: 'SettlementProposal_Withdraw',
  agreementSettle: 'SettlementAgreement_Settle',
  agreementCancel: 'SettlementAgreement_Cancel',
} as const;

export type BroadridgeOperation = (typeof BROADRIDGE_CHOICES)[keyof typeof BROADRIDGE_CHOICES] | 'Create';

export function isBroadridgeAllocationTemplate(entityName: string): boolean {
  return (
    entityName === BROADRIDGE_TEMPLATE_NAMES.allocationRequestV1 ||
    entityName === BROADRIDGE_TEMPLATE_NAMES.allocationRequestV2
  );
}

export function isBroadridgeSettlementTemplate(entityName: string): boolean {
  return (
    entityName === BROADRIDGE_TEMPLATE_NAMES.standingDelegation ||
    entityName === BROADRIDGE_TEMPLATE_NAMES.settlementProposal ||
    entityName === BROADRIDGE_TEMPLATE_NAMES.settlementAgreement
  );
}

export function broadridgeDescriptorFromCommand(info: CantonCommandInfo): BroadridgeProtocolDescriptor | undefined {
  const { moduleName, entityName, packageId } = info.templateId;
  const isV1 = moduleName === V1_ALLOCATION_MODULE && entityName === BROADRIDGE_TEMPLATE_NAMES.allocationRequestV1;
  const isV2 = moduleName === V2_ALLOCATION_MODULE && entityName === BROADRIDGE_TEMPLATE_NAMES.allocationRequestV2;
  const isSettlement =
    isBroadridgeSettlementTemplate(entityName) &&
    (moduleName === SETTLEMENT_MODULE || moduleName === settlementModule(entityName));
  if (!isV1 && !isV2 && !isSettlement) return undefined;
  const choice = info.choice;
  const supportedChoices: readonly string[] =
    isV1 || isV2
      ? [
          BROADRIDGE_CHOICES.requestAccept,
          BROADRIDGE_CHOICES.requestReject,
          BROADRIDGE_CHOICES.requestWithdraw,
          BROADRIDGE_CHOICES.archive,
        ]
      : entityName === BROADRIDGE_TEMPLATE_NAMES.standingDelegation
      ? [
          BROADRIDGE_CHOICES.delegationRevoke,
          BROADRIDGE_CHOICES.delegationWithdraw,
          BROADRIDGE_CHOICES.delegationPropose,
          BROADRIDGE_CHOICES.delegationAccept,
        ]
      : entityName === BROADRIDGE_TEMPLATE_NAMES.settlementProposal
      ? [BROADRIDGE_CHOICES.proposalAccept, BROADRIDGE_CHOICES.proposalReject, BROADRIDGE_CHOICES.proposalWithdraw]
      : [BROADRIDGE_CHOICES.agreementSettle, BROADRIDGE_CHOICES.agreementCancel];
  if (choice && !supportedChoices.includes(choice)) return undefined;
  const role: BroadridgeProtocolDescriptor['role'] =
    isV1 || isV2
      ? 'request'
      : entityName === BROADRIDGE_TEMPLATE_NAMES.standingDelegation
      ? !choice || choice === BROADRIDGE_CHOICES.delegationRevoke
        ? 'client'
        : 'executor'
      : entityName === BROADRIDGE_TEMPLATE_NAMES.settlementProposal
      ? choice === BROADRIDGE_CHOICES.proposalAccept || choice === BROADRIDGE_CHOICES.proposalReject
        ? 'trading-party'
        : 'executor'
      : 'executor';
  const standard = isV2 ? 'CIP-112' : 'CIP-56';
  return {
    protocol: 'broadridge',
    standard,
    packageId,
    moduleName,
    entityName,
    templateId: `${packageId}:${moduleName}:${entityName}`,
    ...(choice ? { choice } : {}),
    role,
    actors: info.actingParties ?? [],
    ...(info.contractId ? { contractId: info.contractId } : {}),
    ...(isV1 || isV2 ? { requestCid: info.contractId } : {}),
    ...(entityName === BROADRIDGE_TEMPLATE_NAMES.settlementAgreement ? { agreementCid: info.contractId } : {}),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function optionalString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  return typeof value === 'string' ? value : String(value);
}

function party(value: unknown): string | undefined {
  return stringValue(value) ?? stringValue(asRecord(value).owner);
}

function instrument(value: unknown): { instrumentId?: string; instrumentAdmin?: string } {
  const record = asRecord(value);
  return {
    instrumentId: stringValue(record.id),
    instrumentAdmin: party(record.admin) ?? party(record.source),
  };
}

function settlement(value: unknown): BroadridgeSettlementIdentity | undefined {
  const record = asRecord(value);
  if (Object.keys(record).length === 0) return undefined;
  return {
    executor: party(record.executor),
    executors: Array.isArray(record.executors)
      ? record.executors.map(party).filter((v): v is string => !!v)
      : undefined,
    id: optionalString(record.id ?? record.reference ?? record.settlementId),
    cid: optionalString(record.cid ?? record.contractId),
    requestedAt: optionalString(record.requestedAt),
    allocateBefore: optionalString(record.allocateBefore),
    settleBefore: optionalString(record.settleBefore),
    settleAt: optionalString(record.settleAt),
    meta: record.meta,
  };
}

function leg(value: unknown, legId?: string, side?: string): BroadridgeAllocationLeg {
  const record = asRecord(value);
  const other = asRecord(record.otherside ?? record.otherSide);
  const instrumentData = instrument(record.instrumentId ?? record.instrument);
  const sender = party(record.sender);
  const receiver = party(record.receiver);
  const otherOwner = party(other.owner ?? other);
  return {
    ...record,
    ...(legId ? { legId } : {}),
    ...(side ?? record.side ? { side: side ?? optionalString(record.side) } : {}),
    ...(sender ? { senderPartyId: sender } : {}),
    ...(receiver ? { receiverPartyId: receiver } : {}),
    ...(otherOwner && side === 'SenderSide' ? { receiverPartyId: otherOwner } : {}),
    ...(otherOwner && side === 'ReceiverSide' ? { senderPartyId: otherOwner } : {}),
    ...(optionalString(record.amount) !== undefined ? { amount: optionalString(record.amount) } : {}),
    ...instrumentData,
  };
}

function v1Legs(value: unknown): BroadridgeAllocationLeg[] {
  const map = asRecord(value);
  return Object.entries(map).map(([legId, value]) => leg(value, legId));
}

function v2Allocation(value: unknown): BroadridgeAllocationSpecification {
  const record = asRecord(value);
  const authorizer = asRecord(record.authorizer);
  const sides = Array.isArray(record.transferLegSides)
    ? record.transferLegSides.map((side) => {
        const sideRecord = asRecord(side);
        return leg(side, optionalString(sideRecord.legId ?? sideRecord.id), optionalString(sideRecord.side));
      })
    : [];
  return {
    ...record,
    ...(stringValue(record.admin) ? { admin: stringValue(record.admin) } : {}),
    authorizer: {
      ...(party(authorizer.owner) ? { owner: party(authorizer.owner) } : {}),
      ...(party(authorizer.provider) ? { provider: party(authorizer.provider) } : {}),
      ...(optionalString(authorizer.id) !== undefined ? { id: optionalString(authorizer.id) } : {}),
    },
    transferLegSides: sides,
    receiverOnly: sides.length > 0 && !sides.some((side) => side.side === 'SenderSide'),
    inputHoldingCids: sides.length > 0 && !sides.some((side) => side.side === 'SenderSide') ? [] : undefined,
    deadline: optionalString(record.deadline ?? record.settleBefore),
    committed: typeof record.committed === 'boolean' ? record.committed : undefined,
    nextIterationFunding: record.nextIterationFunding,
    meta: record.meta,
  };
}

export function parseBroadridgeAllocationRequest(
  info: CantonCommandInfo,
  rawArgument: unknown = info.argument
): BroadridgeAllocationRequestData | undefined {
  const descriptor = broadridgeDescriptorFromCommand(info);
  if (!descriptor || !isBroadridgeAllocationTemplate(info.templateId.entityName) || info.kind !== 'CreateCommand')
    return undefined;
  const raw = asRecord(rawArgument);
  const isV2 = descriptor.standard === 'CIP-112';
  const settlementData = settlement(raw.settlement);
  const result: BroadridgeAllocationRequestData = {
    version: isV2 ? 'v2' : 'v1',
    templateId: descriptor.templateId,
    executor: party(raw.executor),
    settlement: settlementData,
    ...(isV2
      ? {
          allocations: Array.isArray(raw.allocations) ? raw.allocations.map(v2Allocation) : [],
          requestedAt: optionalString(raw.requestedAt),
          settleAt: optionalString(raw.settleAt),
        }
      : { transferLegs: v1Legs(raw.transferLegs) }),
    meta: raw.meta,
    raw,
  };
  return result;
}

function outcomeStatus(choice: string): BroadridgeAllocationRequestOutcome['status'] | undefined {
  switch (choice) {
    case BROADRIDGE_CHOICES.requestAccept:
      return 'accepted';
    case BROADRIDGE_CHOICES.requestReject:
      return 'rejected';
    case BROADRIDGE_CHOICES.requestWithdraw:
      return 'withdrawn';
    case BROADRIDGE_CHOICES.archive:
      return 'archived';
    default:
      return undefined;
  }
}

export function parseBroadridgeAllocationOutcome(
  info: CantonCommandInfo
): BroadridgeAllocationRequestOutcome | undefined {
  const descriptor = broadridgeDescriptorFromCommand(info);
  if (
    !descriptor ||
    !isBroadridgeAllocationTemplate(info.templateId.entityName) ||
    info.kind !== 'ExerciseCommand' ||
    !info.choice
  ) {
    return undefined;
  }
  const status = outcomeStatus(info.choice);
  if (!status) return undefined;
  const argument = asRecord(info.argument);
  const extraArgs = asRecord(argument.extraArgs);
  const meta = extraArgs.meta ?? argument.meta;
  return {
    choice: info.choice as BroadridgeAllocationRequestOutcome['choice'],
    requestCid: info.contractId,
    actors: info.actingParties ?? [],
    ...(meta !== undefined ? { meta } : {}),
    status,
  };
}

function valueField(record: Record<string, unknown>, ...names: string[]): unknown {
  for (const name of names) {
    if (record[name] !== undefined) return record[name];
  }
  return undefined;
}

export function parseBroadridgeSettlementAuthorization(
  info: CantonCommandInfo
): BroadridgeSettlementAuthorizationData | undefined {
  const descriptor = broadridgeDescriptorFromCommand(info);
  if (!descriptor || !isBroadridgeSettlementTemplate(info.templateId.entityName)) return undefined;
  const argument = asRecord(info.argument);
  const template = info.templateId.entityName;
  const data: BroadridgeSettlementAuthorizationData = {
    descriptor,
    client: party(valueField(argument, 'client')),
    executor: party(valueField(argument, 'executor')),
    tradingParties: Array.isArray(argument.tradingParties)
      ? argument.tradingParties.map(party).filter((v): v is string => !!v)
      : undefined,
    approvers: Array.isArray(argument.approvers)
      ? argument.approvers.map(party).filter((v): v is string => !!v)
      : undefined,
    settlement: settlement(argument.settlement),
    delegationCid: optionalString(valueField(argument, 'delegationCid', 'delegationContractId')),
    proposalCid: optionalString(valueField(argument, 'proposalCid', 'proposalContractId')),
    agreementCid: optionalString(valueField(argument, 'agreementCid', 'agreementContractId')),
    allocationCids: Array.isArray(argument.allocationCids)
      ? argument.allocationCids.map(optionalString).filter((v): v is string => !!v)
      : undefined,
    meta: valueField(argument, 'meta'),
    reason: asRecord(argument.extraArgs).meta,
    result: valueField(argument, 'result', 'results'),
  };
  if (template === BROADRIDGE_TEMPLATE_NAMES.standingDelegation && !data.client && descriptor.choice === undefined) {
    data.client = party(argument.client);
  }
  return data;
}
