import assert from 'assert';

import { coins } from '@bitgo/statics';

import { BroadridgeSettlementAuthorizationBuilder, Transaction } from '../../../../src';
import { broadridgeDescriptorFromCommand, parseBroadridgeAllocationRequest } from '../../../../src/lib/broadridge';
import { CantonCommandInfo } from '../../../../src/lib/iface';

const packageId = 'broadridge-settlement-package';
const standingDelegationTemplate = `${packageId}:Broadridge.Token.Implementations:StandingDelegationImpl_v1`;
const proposalTemplate = `${packageId}:Broadridge.Token.Implementations:SettlementProposalImpl_v1`;
const agreementTemplate = `${packageId}:Broadridge.Token.Implementations:SettlementAgreementImpl_v1`;
const client = 'client::1220aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const executor = 'executor::1220bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const proposal = '0010-proposal-cid';

function builder(): BroadridgeSettlementAuthorizationBuilder {
  const result = new BroadridgeSettlementAuthorizationBuilder(coins.get('tcanton'));
  result.initBuilder(new Transaction(coins.get('tcanton')));
  return result;
}

describe('Broadridge Settlement Authorization Builder', function () {
  it('builds a package-qualified standing delegation create command', function () {
    const request = builder()
      .createStandingDelegation({
        commandId: 'create-delegation',
        templateId: standingDelegationTemplate,
        actAs: [client],
        choiceArgument: { client, executor, meta: { source: 'test' } },
      })
      .toRequestObject();

    assert.deepStrictEqual(request.command, {
      CreateCommand: {
        templateId: standingDelegationTemplate,
        createArguments: { client, executor, meta: { source: 'test' } },
      },
    });
    assert.equal(request.broadridge?.standard, 'CIP-56');
    assert.equal(request.broadridge?.role, 'client');
    assert.equal(request.broadridge?.client, client);
    assert.equal(request.broadridge?.executor, executor);
    assert.equal(request.broadridge?.entityName, 'StandingDelegationImpl_v1');
  });

  it('builds role-specific proposal and agreement choices', function () {
    const proposalRequest = builder()
      .acceptSettlementProposal({
        commandId: 'accept-proposal',
        templateId: proposalTemplate,
        contractId: proposal,
        actAs: [client],
        choiceArgument: { extraArgs: { meta: { reason: 'approved' } } },
      })
      .toRequestObject();
    assert.equal(proposalRequest.broadridge?.choice, 'SettlementProposal_Accept');
    assert.equal(proposalRequest.broadridge?.role, 'trading-party');

    const agreementRequest = builder()
      .settleAgreement({
        commandId: 'settle-agreement',
        templateId: agreementTemplate,
        contractId: '0010-agreement-cid',
        actAs: [executor],
        allocationCids: ['0010-allocation-a', '0010-allocation-b'],
      })
      .toRequestObject();
    assert.equal(agreementRequest.broadridge?.choice, 'SettlementAgreement_Settle');
    assert.deepStrictEqual(agreementRequest.broadridge?.allocationCids, ['0010-allocation-a', '0010-allocation-b']);
  });

  it('rejects unknown template modules instead of falling back to another venue', function () {
    assert.throws(
      () =>
        builder().settleAgreement({
          commandId: 'bad-command',
          templateId: `${packageId}:TradeWeb.Module:SettlementAgreementImpl_v1`,
          contractId: '0010-agreement-cid',
          actAs: [executor],
        }),
      /templateId must identify Broadridge/
    );
  });
  it('keeps payment-only V1 requests without a fictional receive leg', function () {
    const info: CantonCommandInfo = {
      kind: 'CreateCommand',
      templateId: {
        packageId,
        moduleName: 'Broadridge.Token.Implementations.AllocationRequestImpl_v1',
        entityName: 'AllocationRequestImpl_v1',
      },
      argument: {
        executor,
        settlement: { executor, reference: 'payment-only-settlement', allocateBefore: '2026-10-21T00:00:00Z' },
        transferLegs: {
          'cash-leg': {
            sender: client,
            receiver: executor,
            amount: '12.5',
            instrumentId: { admin: executor, id: 'USD' },
          },
        },
        meta: { source: 'broadridge' },
      },
    };
    const parsed = parseBroadridgeAllocationRequest(info);
    assert.equal(parsed?.version, 'v1');
    assert.equal(parsed?.transferLegs?.length, 1);
    assert.equal(parsed?.transferLegs?.[0].legId, 'cash-leg');
    assert.equal(parsed?.transferLegs?.[0].receiverPartyId, executor);
  });

  it('retains receiver-only V2 sides with explicit no-input semantics', function () {
    const info: CantonCommandInfo = {
      kind: 'CreateCommand',
      templateId: {
        packageId,
        moduleName: 'Broadridge.Token.Implementations.AllocationRequestImpl_v2',
        entityName: 'AllocationRequestImpl_v2',
      },
      argument: {
        executor,
        settlement: { executors: [executor], id: 'settlement-v2', meta: { trade: 'T-1' } },
        allocations: [
          {
            admin: executor,
            authorizer: { owner: client, provider: executor, id: 'account-1' },
            transferLegSides: [
              {
                side: 'ReceiverSide',
                legId: 'receive-leg',
                otherside: { owner: executor },
                amount: '1',
                instrumentId: 'USD',
              },
            ],
            committed: true,
            nextIterationFunding: { amount: '0' },
          },
        ],
      },
    };
    const parsed = parseBroadridgeAllocationRequest(info);
    assert.equal(parsed?.version, 'v2');
    assert.equal(parsed?.allocations?.[0].receiverOnly, true);
    assert.deepStrictEqual(parsed?.allocations?.[0].inputHoldingCids, []);
    assert.equal(parsed?.allocations?.[0].transferLegSides?.[0].side, 'ReceiverSide');
  });

  it('rejects unknown Broadridge choices', function () {
    const descriptor = broadridgeDescriptorFromCommand({
      kind: 'ExerciseCommand',
      templateId: {
        packageId,
        moduleName: 'Broadridge.Token.Implementations.SettlementAgreementImpl_v1',
        entityName: 'SettlementAgreementImpl_v1',
      },
      argument: {},
      choice: 'UnknownChoice',
      contractId: 'agreement-cid',
      actingParties: [executor],
    });
    assert.equal(descriptor, undefined);
  });
});
