import assert from 'assert';
import { NO_RECIPIENT_TX_TYPES, resolveEffectiveTxParams } from '../../../../../src/bitgo/utils/tss/recipientUtils';
import { InvalidTransactionError } from '../../../../../src/bitgo/errors';
import { PopulatedIntent, TxRequest } from '../../../../../src/bitgo/utils/tss/baseTypes';

function makeTxRequest(overrides: Partial<TxRequest> = {}): TxRequest {
  return {
    txRequestId: 'test-tx-request-id',
    walletId: 'test-wallet-id',
    intent: undefined,
    ...overrides,
  } as unknown as TxRequest;
}

describe('recipientUtils', function () {
  describe('NO_RECIPIENT_TX_TYPES', function () {
    it('contains all expected types', function () {
      const expected = [
        // ECDSA EVM
        'acceleration',
        'fillNonce',
        'transferToken',
        'tokenApproval',
        'consolidate',
        'bridgeFunds',
        'enableToken',
        'enabletoken',
        'disableToken',
        'disabletoken',
        'customTx',
        'defiApprove',
        'defiDeposit',
        'defiWithdraw',
        // Native wrap/unwrap — registered in both spellings on purpose
        'wrapNative',
        'wrap-native',
        'unwrapNative',
        'unwrap-native',
        'wrapApprove',
        'wrap',
        'unwrap',
        'finalizeUnwrap',
        'contractCall',
        // Staking — 'delegate' also covers SOL solDelegateIntent
        'delegate',
        'undelegate',
        'switchValidator',
        'stake',
        'unstake',
        'stakeWithCallData',
        'unstakeWithCallData',
        'transferStake',
        'increaseStake',
        'goUnstake',
        'claim',
        'stakeClaimRewards',
        'createAccount',
        // Canton operations with no SDK-level recipients.
        'transferAccept',
        'transferReject',
        'transferOfferWithdrawn',
        'cosignDelegationAccept',
        'allocationAllocate',
        'allocationOfferWithdrawn',
        'cantonCommand',
        'cantonBroadridgeStandingDelegation',
        'cantonEndInvestorOnboardingOffer',
        'cantonEndInvestorOnboardingAccept',
        'cantonEndInvestorOnboardingReject',
        'cantonParticipantOnboardingRequest',
        'pledge',
        // Avalanche / Flare cross-chain atomic imports
        'import',
        'importtoc',
        // SOL: deactivate stake account (solDeactivateIntent)
        'deactivate',
        // SOL: authorize stake account (solAuthorizeIntent)
        'authorize',
      ];
      expected.forEach((t) => assert.ok(NO_RECIPIENT_TX_TYPES.has(t), `${t} should be in NO_RECIPIENT_TX_TYPES`));
      assert.strictEqual(NO_RECIPIENT_TX_TYPES.size, expected.length);
    });

    it('does not contain value-transfer types', function () {
      ['payment', 'fanout', 'vote', 'defi-deposit', 'defi-redeem'].forEach((t) => {
        assert.ok(!NO_RECIPIENT_TX_TYPES.has(t), `${t} must NOT be in NO_RECIPIENT_TX_TYPES`);
      });
    });
  });

  describe('resolveEffectiveTxParams', function () {
    it('passes through txParams.recipients when present', function () {
      const txRequest = makeTxRequest();
      const txParams = { recipients: [{ address: '0xabc', amount: '100' }] };
      const result = resolveEffectiveTxParams(txRequest, txParams);
      assert.deepStrictEqual(result.recipients, txParams.recipients);
    });

    it('falls back to intent.recipients when txParams has none', function () {
      const txRequest = makeTxRequest({
        intent: {
          intentType: 'payment',
          recipients: [{ address: { address: '0xabc' }, amount: { value: '500', symbol: 'eth' } }],
        } as any,
      });
      const result = resolveEffectiveTxParams(txRequest, {});
      assert.strictEqual(result.recipients?.length, 1);
      assert.strictEqual(result.recipients?.[0].address, '0xabc');
      assert.strictEqual(result.recipients?.[0].amount, '500');
    });

    it('falls back to intent.recipients when the intent stores the address as a plain string', function () {
      const txRequest = makeTxRequest({
        intent: {
          intentType: 'payment',
          recipients: [{ address: '0xabc', amount: { value: '500', symbol: 'eth' } }],
        } as any,
      });
      const result = resolveEffectiveTxParams(txRequest, {});
      assert.strictEqual(result.recipients?.[0].address, '0xabc');
    });

    describe('split count propagation (Canton fanout)', function () {
      const splitIntent = {
        intentType: 'payment',
        numberOfSplits: 2,
        recipients: [{ address: '0xabc', amount: { value: '500', symbol: 'eth' } }],
      } as any;

      it('derives numberOfSplits from the intent when txParams is undefined (signAndSendTxRequest path)', function () {
        const result = resolveEffectiveTxParams(makeTxRequest({ intent: splitIntent }), undefined);
        assert.strictEqual(result.numberOfSplits, 2);
      });

      it('does not overwrite numberOfSplits supplied by the caller', function () {
        const result = resolveEffectiveTxParams(makeTxRequest({ intent: splitIntent }), { numberOfSplits: 5 });
        assert.strictEqual(result.numberOfSplits, 5);
      });

      it('leaves numberOfSplits undefined when the intent has none or a non-numeric one', function () {
        const noSplits = { intentType: 'payment', recipients: splitIntent.recipients } as any;
        assert.strictEqual(resolveEffectiveTxParams(makeTxRequest({ intent: noSplits }), {}).numberOfSplits, undefined);
        const stringSplits = { ...splitIntent, numberOfSplits: '2' };
        assert.strictEqual(
          resolveEffectiveTxParams(makeTxRequest({ intent: stringSplits }), {}).numberOfSplits,
          undefined
        );
      });
    });

    it('resolves txType from intent.intentType when txParams.type is absent', function () {
      const txRequest = makeTxRequest({ intent: { intentType: 'consolidate' } as any });
      const result = resolveEffectiveTxParams(txRequest, {});
      assert.strictEqual(result.type, 'consolidate');
    });
    it('propagates the executor party from a Canton standing delegation intent', function () {
      const txRequest = makeTxRequest({
        intent: {
          intentType: 'cantonBroadridgeStandingDelegation',
          executorPartyId: 'executor::1220bbbb',
        } as PopulatedIntent,
      });
      const result = resolveEffectiveTxParams(txRequest, undefined);
      assert.strictEqual(result.type, 'cantonBroadridgeStandingDelegation');
      assert.strictEqual(result.executorPartyId, 'executor::1220bbbb');
      assert.strictEqual(result.recipients, undefined);
    });

    describe('ERC-7984 shield wrapParams propagation', function () {
      const tokenName = 'hteth:cusdt';
      const amount = '1000000';

      it('derives wrapParams from a wrapApprove intent when txParams is undefined (pendingApproval re-sign path)', function () {
        const txRequest = makeTxRequest({
          intent: { intentType: 'wrapApprove', tokenName, amount } as PopulatedIntent,
        });
        const result = resolveEffectiveTxParams(txRequest, undefined);
        assert.strictEqual(result.type, 'wrapApprove');
        assert.deepStrictEqual(result.wrapParams, { tokenName, amount });
      });

      it('derives wrapParams from a wrap intent', function () {
        const txRequest = makeTxRequest({ intent: { intentType: 'wrap', tokenName, amount } as PopulatedIntent });
        assert.deepStrictEqual(resolveEffectiveTxParams(txRequest, undefined).wrapParams, { tokenName, amount });
      });

      it('does not overwrite wrapParams supplied by the caller', function () {
        const callerWrapParams = { tokenName: 'hteth:ctest1', amount: '5' };
        const txRequest = makeTxRequest({
          intent: { intentType: 'wrapApprove', tokenName, amount } as PopulatedIntent,
        });
        const result = resolveEffectiveTxParams(txRequest, { type: 'wrapApprove', wrapParams: callerWrapParams });
        assert.deepStrictEqual(result.wrapParams, callerWrapParams);
      });

      it('does not derive wrapParams for other intent types or a non-string amount', function () {
        const other = makeTxRequest({ intent: { intentType: 'tokenApproval', tokenName, amount } as PopulatedIntent });
        assert.strictEqual(resolveEffectiveTxParams(other, undefined).wrapParams, undefined);

        const objectAmount = makeTxRequest({
          intent: {
            intentType: 'wrapApprove',
            tokenName,
            amount: { value: amount, symbol: tokenName },
          } as PopulatedIntent,
        });
        assert.strictEqual(resolveEffectiveTxParams(objectAmount, undefined).wrapParams, undefined);
      });
    });

    describe('tokenName propagation (tokenApproval)', function () {
      const approvalTokenName = 'hteth:stgusd1';

      it('derives tokenName from the intent when txParams is undefined (pendingApproval re-sign path)', function () {
        const txRequest = makeTxRequest({
          intent: { intentType: 'tokenApproval', tokenName: approvalTokenName } as PopulatedIntent,
        });
        const result = resolveEffectiveTxParams(txRequest, undefined);
        assert.strictEqual(result.tokenName, approvalTokenName);
        assert.strictEqual(result.type, 'tokenApproval');
        assert.strictEqual(result.recipients, undefined);
      });

      it('does not overwrite a caller-supplied tokenName', function () {
        const txRequest = makeTxRequest({
          intent: { intentType: 'tokenApproval', tokenName: approvalTokenName } as PopulatedIntent,
        });
        assert.strictEqual(resolveEffectiveTxParams(txRequest, { tokenName: 'hteth:usdc' }).tokenName, 'hteth:usdc');
      });

      it('does not attach a stored tokenName to a caller-declared payment', function () {
        const txRequest = makeTxRequest({
          intent: { intentType: 'payment', tokenName: approvalTokenName, recipients: [] } as unknown as PopulatedIntent,
        });
        const result = resolveEffectiveTxParams(
          txRequest,
          { type: 'transfer', recipients: [{ address: '0xabc', amount: '1' }] },
          'hteth'
        );
        assert.strictEqual(result.tokenName, undefined);
      });

      it('does not attach a stored tokenApproval tokenName when the caller declared another type', function () {
        const txRequest = makeTxRequest({
          intent: { intentType: 'tokenApproval', tokenName: approvalTokenName } as PopulatedIntent,
        });
        assert.strictEqual(resolveEffectiveTxParams(txRequest, { type: 'transfer' }).tokenName, undefined);
      });
    });

    describe('stored bridgeFunds amount propagation (CECHO-2690)', function () {
      // Production stored-intent shape (45 rows): { intentType: 'bridgeFunds', amount: { symbol, value } }.
      const storedBridgeIntent = {
        intentType: 'bridgeFunds',
        amount: { symbol: 'hypeevm', value: '21000000000000000' },
      } as PopulatedIntent;

      it('derives intentAmount from the intent when txParams is undefined (pendingApproval re-sign path)', function () {
        const result = resolveEffectiveTxParams(makeTxRequest({ intent: storedBridgeIntent }), undefined, 'hypeevm');
        assert.strictEqual(result.type, 'bridgeFunds');
        assert.deepStrictEqual(result.intentAmount, { value: '21000000000000000', symbol: 'hypeevm' });
        assert.strictEqual(result.recipients, undefined);
      });

      it('does not overwrite a caller-supplied intentAmount', function () {
        const callerAmount = { value: '1', symbol: 'hypeevm' };
        const result = resolveEffectiveTxParams(makeTxRequest({ intent: storedBridgeIntent }), {
          intentAmount: callerAmount,
        });
        assert.deepStrictEqual(result.intentAmount, callerAmount);
      });

      it('does not attach the stored amount to a caller-declared payment', function () {
        const result = resolveEffectiveTxParams(makeTxRequest({ intent: storedBridgeIntent }), {
          type: 'transfer',
          recipients: [{ address: '0xabc', amount: '1' }],
        });
        assert.strictEqual(result.intentAmount, undefined);
      });

      it('ignores a string amount and a non-bridgeFunds intent', function () {
        const stringAmount = makeTxRequest({
          intent: { intentType: 'bridgeFunds', amount: '21000000000000000' } as PopulatedIntent,
        });
        assert.strictEqual(resolveEffectiveTxParams(stringAmount, {}).intentAmount, undefined);

        const otherIntent = makeTxRequest({
          intent: {
            intentType: 'payment',
            amount: { value: '21000000000000000', symbol: 'hypeevm' },
            recipients: [{ address: { address: '0xabc' }, amount: { value: '1', symbol: 'hypeevm' } }],
          } as PopulatedIntent,
        });
        assert.strictEqual(resolveEffectiveTxParams(otherIntent, undefined).intentAmount, undefined);
      });
    });

    describe('stored transferToken tokenData preservation (CECHO-2690)', function () {
      // Production ETH/Arbitrum shape: amount.value is the '0' placeholder and tokenData carries the quantity.
      const storedTokenIntent = {
        intentType: 'transferToken',
        recipients: [
          {
            address: { address: '0x7e85bdc27c050e3905ebf4b8e634d9ad6edd0de6' },
            amount: { value: '0', symbol: 'usdt' },
            tokenData: { tokenName: 'usdt', tokenQuantity: '1000000', tokenType: 'ERC20' },
          },
        ],
      } as unknown as PopulatedIntent;

      it('carries tokenData onto the reconstructed recipient', function () {
        const result = resolveEffectiveTxParams(makeTxRequest({ intent: storedTokenIntent }), undefined, 'eth');
        assert.strictEqual(result.type, 'transferToken');
        assert.strictEqual(result.recipients?.[0].amount, '0');
        assert.deepStrictEqual(result.recipients?.[0].tokenData, {
          tokenName: 'usdt',
          tokenQuantity: '1000000',
          tokenType: 'ERC20',
        });
      });

      it('does not invent tokenData when the stored intent has none', function () {
        const txRequest = makeTxRequest({
          intent: {
            intentType: 'transferToken',
            recipients: [{ address: { address: '0xabc' }, amount: { value: '1', symbol: 'eth' } }],
          } as unknown as PopulatedIntent,
        });
        assert.strictEqual(resolveEffectiveTxParams(txRequest, {}).recipients?.[0].tokenData, undefined);
      });

      it('leaves caller-supplied recipients untouched', function () {
        const callerRecipients = [{ address: '0xabc', amount: '5' }];
        const result = resolveEffectiveTxParams(makeTxRequest({ intent: storedTokenIntent }), {
          recipients: callerRecipients,
        });
        assert.strictEqual(result.recipients, callerRecipients);
      });
    });

    describe('intent nonce propagation (fillNonce only, CECHO-2690)', function () {
      it('derives nonce from the intent when txParams is undefined', function () {
        const txRequest = makeTxRequest({ intent: { intentType: 'fillNonce', nonce: '7' } as PopulatedIntent });
        assert.strictEqual(resolveEffectiveTxParams(txRequest, undefined).nonce, '7');
      });

      it('does not overwrite a caller-supplied nonce', function () {
        const txRequest = makeTxRequest({ intent: { intentType: 'fillNonce', nonce: '7' } as PopulatedIntent });
        assert.strictEqual(resolveEffectiveTxParams(txRequest, { nonce: '9' }).nonce, '9');
      });

      it('preserves numeric stored nonce including 0', function () {
        const zeroNonceReq = makeTxRequest({ intent: { intentType: 'fillNonce', nonce: 0 } as PopulatedIntent });
        assert.strictEqual(resolveEffectiveTxParams(zeroNonceReq, undefined).nonce, '0');

        const nonZeroNonceReq = makeTxRequest({ intent: { intentType: 'fillNonce', nonce: 42 } as PopulatedIntent });
        assert.strictEqual(resolveEffectiveTxParams(nonZeroNonceReq, undefined).nonce, '42');
      });

      it('does not overwrite caller-supplied numeric nonce 0', function () {
        const txRequest = makeTxRequest({ intent: { intentType: 'fillNonce', nonce: '7' } as PopulatedIntent });
        assert.strictEqual(resolveEffectiveTxParams(txRequest, { nonce: 0 }).nonce, 0);
      });

      it('does not attach the stored nonce to a caller-declared payment', function () {
        const txRequest = makeTxRequest({ intent: { intentType: 'fillNonce', nonce: '7' } as PopulatedIntent });
        const result = resolveEffectiveTxParams(
          txRequest,
          { type: 'transfer', recipients: [{ address: '0xabc', amount: '1' }] },
          'hteth'
        );
        assert.strictEqual(result.type, 'transfer');
        assert.strictEqual(result.nonce, undefined);
      });

      it('does not attach a stored fillNonce nonce when the caller declared another type', function () {
        const txRequest = makeTxRequest({ intent: { intentType: 'fillNonce', nonce: '7' } as PopulatedIntent });
        assert.strictEqual(resolveEffectiveTxParams(txRequest, { type: 'acceleration' }).nonce, undefined);
      });

      it('does not attach a stored nonce when the intent is not a fillNonce intent', function () {
        const txRequest = makeTxRequest({ intent: { intentType: 'acceleration', nonce: '7' } as PopulatedIntent });
        assert.strictEqual(resolveEffectiveTxParams(txRequest, undefined).nonce, undefined);
      });

      it('keeps the caller nonce when a fillNonce caller pairs with a non-fillNonce intent', function () {
        // Inverse of the stored-`fillNonce` case: the resolved type alone must not be enough to pull
        // the stored intent's nonce in, so the caller's own nonce stays authoritative.
        const txRequest = makeTxRequest({ intent: { intentType: 'acceleration', nonce: '7' } as PopulatedIntent });
        assert.strictEqual(resolveEffectiveTxParams(txRequest, { type: 'fillNonce', nonce: '9' }).nonce, '9');

        // Same intent, caller declares `fillNonce` but supplies no nonce: nothing is inherited.
        assert.strictEqual(resolveEffectiveTxParams(txRequest, { type: 'fillNonce' }).nonce, undefined);
      });

      it('ignores negative, non-integer, or non-finite numeric stored nonces', function () {
        for (const badNonce of [-1, 1.5, NaN, Infinity]) {
          const txRequest = makeTxRequest({ intent: { intentType: 'fillNonce', nonce: badNonce } as PopulatedIntent });
          assert.strictEqual(resolveEffectiveTxParams(txRequest, undefined).nonce, undefined);
        }
      });
    });

    describe('tx-level memo propagation', function () {
      it('derives memo from the intent when txParams is undefined (pendingApproval re-sign path)', function () {
        const txRequest = makeTxRequest({
          intent: {
            intentType: 'payment',
            recipients: [{ address: { address: 'cosmos1abc' }, amount: { value: '100', symbol: 'atom' } }],
            memo: '153',
          } as PopulatedIntent,
        });
        const result = resolveEffectiveTxParams(txRequest, undefined);
        assert.deepStrictEqual(result.memo, { value: '153', type: 'text' });
      });
      it('does not overwrite memo supplied by the caller', function () {
        const txRequest = makeTxRequest({
          intent: {
            intentType: 'payment',
            recipients: [{ address: { address: 'cosmos1abc' }, amount: { value: '100', symbol: 'atom' } }],
            memo: '153',
          } as PopulatedIntent,
        });
        const result = resolveEffectiveTxParams(txRequest, { memo: { value: '999', type: 'id' } });
        assert.deepStrictEqual(result.memo, { value: '999', type: 'id' });
      });

      it('does not derive memo when the intent has none or an empty one', function () {
        const recipient = { address: { address: 'cosmos1abc' }, amount: { value: '100', symbol: 'atom' } };
        const noMemo = makeTxRequest({
          intent: { intentType: 'payment', recipients: [recipient] } as PopulatedIntent,
        });
        assert.strictEqual(resolveEffectiveTxParams(noMemo, undefined).memo, undefined);

        const emptyMemo = makeTxRequest({
          intent: { intentType: 'payment', recipients: [recipient], memo: '' } as PopulatedIntent,
        });
        assert.strictEqual(resolveEffectiveTxParams(emptyMemo, undefined).memo, undefined);
      });
    });

    it('does not throw for exempt types', function () {
      for (const txType of [
        'acceleration',
        'consolidate',
        'contractCall',
        'delegate',
        'stake',
        'createAccount',
        'pledge',
        'import',
        'importtoc',
        'deactivate',
      ]) {
        const txRequest = makeTxRequest();
        assert.doesNotThrow(() => resolveEffectiveTxParams(txRequest, { type: txType }));
      }
    });

    it('does not require recipients for Canton intents resolved from the tx request', function () {
      const cantonIntentTypes = [
        'transferAccept',
        'transferReject',
        'transferOfferWithdrawn',
        'cosignDelegationAccept',
        'allocationAllocate',
        'allocationOfferWithdrawn',
        'cantonCommand',
        'cantonEndInvestorOnboardingOffer',
        'cantonEndInvestorOnboardingAccept',
        'cantonEndInvestorOnboardingReject',
        'cantonParticipantOnboardingRequest',
        'cantonBroadridgeStandingDelegation',
      ];

      for (const intentType of cantonIntentTypes) {
        const intent: PopulatedIntent = { intentType };
        const txRequest = makeTxRequest({ intent });
        assert.doesNotThrow(() => resolveEffectiveTxParams(txRequest, undefined));
      }
    });

    it('does not require recipients for a wrapApprove intent', function () {
      const txRequest = makeTxRequest({
        intent: {
          intentType: 'wrapApprove',
          tokenName: 'hteth:cusdt',
          amount: '1000000',
        } as any,
      });

      const result = resolveEffectiveTxParams(txRequest, {});

      assert.strictEqual(result.type, 'wrapApprove');
      assert.strictEqual(result.recipients, undefined);
    });

    it('does not require recipients for a wrap intent', function () {
      const txRequest = makeTxRequest({
        intent: {
          intentType: 'wrap',
          tokenName: 'hteth:cusdt',
          amount: '1000000',
        } as any,
      });

      const result = resolveEffectiveTxParams(txRequest, {});

      assert.strictEqual(result.type, 'wrap');
      assert.strictEqual(result.recipients, undefined);
    });

    it('does not require recipients for an unwrap intent', function () {
      const txRequest = makeTxRequest({
        intent: {
          intentType: 'unwrap',
          tokenName: 'hteth:cusdt',
          amount: '1000000',
        },
      });

      const result = resolveEffectiveTxParams(txRequest, {});

      assert.strictEqual(result.type, 'unwrap');
      assert.strictEqual(result.recipients, undefined);
    });

    it('does not require recipients for a WP-created finalizeUnwrap intent', function () {
      // WP creates the finalize txnReq at READY_TO_FINALIZE (CHALO-1139); the client
      // signs it — requestId/cleartextAmount/decryptionProof live in the calldata,
      // verification decodes them from txHex, and no SDK-level recipients exist.
      const txRequest = makeTxRequest({
        intent: {
          intentType: 'finalizeUnwrap',
        },
      });

      const result = resolveEffectiveTxParams(txRequest, {});

      assert.strictEqual(result.type, 'finalizeUnwrap');
      assert.strictEqual(result.recipients, undefined);
    });

    it('does not throw for Avalanche cross-chain imports resolved from intent.intentType', function () {
      // P-chain and C-chain import intents legitimately carry no recipients —
      // the wallet imports its own UTXOs and the destination address is the
      // wallet itself. The intentType lives only on the intent (txParams.type
      // is unset on the MPC signing call) so the guard must read it from there.
      for (const intentType of ['import', 'importtoc']) {
        const txRequest = makeTxRequest({ intent: { intentType } as any });
        assert.doesNotThrow(() => resolveEffectiveTxParams(txRequest, {}));
      }
    });

    describe('native wrap/unwrap intents', function () {
      // Regression test for the camelCase/kebab-case asymmetry. This set is matched
      // against BOTH txParams.type (buildParams.type — camelCase, from wallet.sendMany)
      // and intent.intentType (kebab-case, as WP persists it). Signing paths that carry
      // no txParams — pendingApproval.approve() → recreateTxRequest() → signTxRequest()
      // — only ever see the kebab-case spelling, so both must be registered.
      it('does not throw when the type comes from buildParams.type (camelCase)', function () {
        for (const txType of ['wrapNative', 'unwrapNative']) {
          const txRequest = makeTxRequest();
          assert.doesNotThrow(() => resolveEffectiveTxParams(txRequest, { type: txType }));
        }
      });

      it('does not throw when the type comes only from intent.intentType (kebab-case)', function () {
        for (const intentType of ['wrap-native', 'unwrap-native']) {
          const txRequest = makeTxRequest({ intent: { intentType } as any });
          const result = resolveEffectiveTxParams(txRequest, {});
          assert.strictEqual(result.type, intentType);
          assert.strictEqual(result.recipients, undefined);
        }
      });

      it('does not throw when txParams is undefined entirely (pendingApproval re-sign path)', function () {
        for (const intentType of ['wrap-native', 'unwrap-native']) {
          const txRequest = makeTxRequest({ intent: { intentType, vaultId: 'vlt-weth-1', amount: '10' } as any });
          assert.doesNotThrow(() => resolveEffectiveTxParams(txRequest, undefined));
        }
      });
    });

    it('does not throw when buildParams.type is PascalCase but intent.intentType is lowercase', function () {
      // signTransactionTss passes txPrebuild.buildParams as txParams. Prebuild uses
      // type: 'Import' while WP stores intentType: 'import' on the txRequest.
      const txRequest = makeTxRequest({ intent: { intentType: 'import', recipients: [] } as any });
      assert.doesNotThrow(() => resolveEffectiveTxParams(txRequest, { type: 'Import', recipients: [] }));
    });

    it('throws InvalidTransactionError for unknown types with no recipients', function () {
      const txRequest = makeTxRequest();
      assert.throws(
        () => resolveEffectiveTxParams(txRequest, { type: 'payment' }),
        InvalidTransactionError,
        'should throw for payment type with no recipients'
      );
    });

    it('throws when txParams is undefined and no intent', function () {
      const txRequest = makeTxRequest();
      assert.throws(() => resolveEffectiveTxParams(txRequest, undefined), InvalidTransactionError);
    });

    it('does not throw when intent has stakingRequestId (staking bypass)', function () {
      const txRequest = makeTxRequest({
        intent: { intentType: 'delegate', stakingRequestId: 'staking-req-123' } as any,
      });
      assert.doesNotThrow(() => resolveEffectiveTxParams(txRequest, {}));
    });

    it('propagates stakingRequestId from intent into effectiveTxParams', function () {
      const txRequest = makeTxRequest({
        intent: { intentType: 'delegate', stakingRequestId: 'staking-req-456' } as any,
      });
      const result = resolveEffectiveTxParams(txRequest, {});
      assert.strictEqual(result.stakingRequestId, 'staking-req-456');
    });

    it('does not overwrite existing stakingRequestId in txParams', function () {
      const txRequest = makeTxRequest({
        intent: { intentType: 'delegate', stakingRequestId: 'from-intent' } as any,
      });
      const result = resolveEffectiveTxParams(txRequest, { stakingRequestId: 'from-caller' });
      assert.strictEqual(result.stakingRequestId, 'from-caller');
    });

    it('prefers txParams.recipients over intent.recipients', function () {
      const txRequest = makeTxRequest({
        intent: {
          intentType: 'payment',
          recipients: [{ address: { address: '0xintent' }, amount: { value: '999', symbol: 'eth' } }],
        } as any,
      });
      const txParams = { recipients: [{ address: '0xcaller', amount: '100' }] };
      const result = resolveEffectiveTxParams(txRequest, txParams);
      assert.strictEqual(result.recipients?.[0].address, '0xcaller');
    });

    it('preserves data field from intent recipients', function () {
      const txRequest = makeTxRequest({
        intent: {
          intentType: 'payment',
          recipients: [{ address: { address: '0xabc' }, amount: { value: '100', symbol: 'eth' }, data: '0xdeadbeef' }],
        } as any,
      });
      const result = resolveEffectiveTxParams(txRequest, {});
      assert.strictEqual(result.recipients?.[0].data, '0xdeadbeef');
    });

    describe('tokenName preservation regression tests', function () {
      it('preserves tokenName from amount.symbol when it differs from chainName', function () {
        const txRequest = makeTxRequest({
          intent: {
            intentType: 'payment',
            recipients: [
              {
                address: { address: 'UserWalletAddress111111111111111111111111111' },
                amount: { value: '1000000', symbol: 'tsol:usdc' },
              },
            ],
          } as any,
        });
        const result = resolveEffectiveTxParams(txRequest, {}, 'tsol');
        assert.strictEqual(result.recipients?.length, 1);
        assert.strictEqual(result.recipients?.[0].tokenName, 'tsol:usdc');
      });

      it('does NOT set tokenName when symbol equals chainName (native SOL transfer)', function () {
        const txRequest = makeTxRequest({
          intent: {
            intentType: 'payment',
            recipients: [
              {
                address: { address: 'RecipientAddress111111111111111111111111111' },
                amount: { value: '5000000000', symbol: 'tsol' },
              },
            ],
          } as any,
        });
        const result = resolveEffectiveTxParams(txRequest, {}, 'tsol');
        assert.strictEqual(result.recipients?.[0].tokenName, undefined);
      });

      it('prefers tokenData.tokenName over amount.symbol (uses distinct values to verify)', function () {
        const txRequest = makeTxRequest({
          intent: {
            intentType: 'payment',
            recipients: [
              {
                address: { address: 'RecipientAddress111111111111111111111111111' },
                amount: { value: '500000', symbol: 'tsol:usdc-alt' },
                tokenData: { tokenType: 'fungible', tokenQuantity: '500000', tokenName: 'canonical-token-name' },
              },
            ],
          } as any,
        });
        const result = resolveEffectiveTxParams(txRequest, {}, 'tsol');
        assert.strictEqual(result.recipients?.[0].tokenName, 'canonical-token-name');
      });

      it('falls back to amount.symbol when tokenData.tokenName is absent', function () {
        const txRequest = makeTxRequest({
          intent: {
            intentType: 'payment',
            recipients: [
              {
                address: { address: 'RecipientAddress111111111111111111111111111' },
                amount: { value: '200000', symbol: 'sol:usdc' },
                tokenData: { tokenType: 'fungible', tokenQuantity: '200000' },
              },
            ],
          } as any,
        });
        const result = resolveEffectiveTxParams(txRequest, {}, 'sol');
        assert.strictEqual(result.recipients?.[0].tokenName, 'sol:usdc');
      });

      it('falls back to amount.symbol when tokenData.tokenName is empty string', function () {
        const txRequest = makeTxRequest({
          intent: {
            intentType: 'payment',
            recipients: [
              {
                address: { address: 'RecipientAddress111111111111111111111111111' },
                amount: { value: '100000', symbol: 'tsol:usdc' },
                tokenData: { tokenType: 'fungible', tokenQuantity: '100000', tokenName: '' },
              },
            ],
          } as any,
        });
        const result = resolveEffectiveTxParams(txRequest, {}, 'tsol');
        assert.strictEqual(result.recipients?.[0].tokenName, 'tsol:usdc');
      });

      it('does NOT set tokenName when chainName is absent (legacy ECDSA callers, no tokenData)', function () {
        const txRequest = makeTxRequest({
          intent: {
            intentType: 'payment',
            recipients: [{ address: { address: '0xabc' }, amount: { value: '100', symbol: 'eth' } }],
          } as any,
        });
        const result = resolveEffectiveTxParams(txRequest, {});
        assert.strictEqual(result.recipients?.[0].tokenName, undefined);
        assert.strictEqual(result.recipients?.[0].address, '0xabc');
      });

      it('preserves tokenData.tokenName when chainName is absent (legacy ECDSA with tokenData)', function () {
        const txRequest = makeTxRequest({
          intent: {
            intentType: 'transferToken',
            recipients: [
              {
                address: { address: '0xabc' },
                amount: { value: '1000', symbol: 'erc20:usdc' },
                tokenData: { tokenType: 'fungible', tokenQuantity: '1000', tokenName: 'eth:usdc' },
              },
            ],
          } as any,
        });
        const result = resolveEffectiveTxParams(txRequest, {});
        assert.strictEqual(result.recipients?.[0].tokenName, 'eth:usdc');
      });

      it('sendMany tsol:usdc: does not throw and preserves tokenName in full round-trip', function () {
        const txRequest = makeTxRequest({
          intent: {
            intentType: 'payment',
            recipients: [
              {
                address: { address: 'SolUserWallet1111111111111111111111111111111' },
                amount: { value: '2000000', symbol: 'tsol:usdc' },
              },
              {
                address: { address: 'SolUserWallet2222222222222222222222222222222' },
                amount: { value: '3000000', symbol: 'tsol:usdc' },
              },
            ],
          } as any,
        });
        const result = resolveEffectiveTxParams(txRequest, {}, 'tsol');
        assert.strictEqual(result.recipients?.length, 2);
        result.recipients!.forEach((r) => assert.strictEqual(r.tokenName, 'tsol:usdc'));
        assert.strictEqual(result.recipients![0].amount, '2000000');
        assert.strictEqual(result.recipients![1].amount, '3000000');
      });

      it('handles mixed native + token recipients correctly', function () {
        const txRequest = makeTxRequest({
          intent: {
            intentType: 'payment',
            recipients: [
              {
                address: { address: 'SolNative111111111111111111111111111111111' },
                amount: { value: '1000000000', symbol: 'tsol' },
              },
              {
                address: { address: 'SolToken111111111111111111111111111111111' },
                amount: { value: '500000', symbol: 'tsol:usdc' },
              },
            ],
          } as any,
        });
        const result = resolveEffectiveTxParams(txRequest, {}, 'tsol');
        assert.strictEqual(result.recipients![0].tokenName, undefined);
        assert.strictEqual(result.recipients![1].tokenName, 'tsol:usdc');
      });
    });

    describe('SOL no-recipient intent types', function () {
      it('does not throw for "delegate" (solDelegateIntent)', function () {
        const txRequest = makeTxRequest({ intent: { intentType: 'delegate' } as any });
        assert.doesNotThrow(() => resolveEffectiveTxParams(txRequest, {}));
      });

      it('does not throw for "deactivate" (solDeactivateIntent)', function () {
        const txRequest = makeTxRequest({ intent: { intentType: 'deactivate' } as any });
        assert.doesNotThrow(() => resolveEffectiveTxParams(txRequest, {}));
      });

      it('does not throw for "authorize" (solAuthorizeIntent)', function () {
        const txRequest = makeTxRequest({ intent: { intentType: 'authorize' } as any });
        assert.doesNotThrow(() => resolveEffectiveTxParams(txRequest, {}));
      });

      it('throws for stakingAuthorize — must be validated at coin layer', function () {
        const txRequest = makeTxRequest({ intent: { intentType: 'stakingAuthorize' } as any });
        assert.throws(() => resolveEffectiveTxParams(txRequest, {}), InvalidTransactionError);
      });
    });
  });
});
