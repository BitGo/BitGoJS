import assert from 'assert';
import { NO_RECIPIENT_TX_TYPES, resolveEffectiveTxParams } from '../../../../../src/bitgo/utils/tss/recipientUtils';
import { InvalidTransactionError } from '../../../../../src/bitgo/errors';
import { TxRequest } from '../../../../../src/bitgo/utils/tss/baseTypes';

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
        'disabletoken',
        'customTx',
        'defiApprove',
        'defiDeposit',
        'defiWithdraw',
        'contractCall',
        // Staking
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
        'transferAccept',
        'transferReject',
        'transferOfferWithdrawn',
        'cantonCommand',
        'pledge',
        // Avalanche / Flare cross-chain atomic imports
        'import',
        'importtoc',
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
          recipients: [
            {
              address: { address: '0xabc' },
              amount: { value: '500', symbol: 'eth' },
            },
          ],
        } as any,
      });
      const result = resolveEffectiveTxParams(txRequest, {});
      assert.strictEqual(result.recipients?.length, 1);
      assert.strictEqual(result.recipients?.[0].address, '0xabc');
      assert.strictEqual(result.recipients?.[0].amount, '500');
    });

    it('resolves txType from intent.intentType when txParams.type is absent', function () {
      const txRequest = makeTxRequest({
        intent: { intentType: 'consolidate' } as any,
      });
      const result = resolveEffectiveTxParams(txRequest, {});
      assert.strictEqual(result.type, 'consolidate');
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
      ]) {
        const txRequest = makeTxRequest();
        assert.doesNotThrow(() => resolveEffectiveTxParams(txRequest, { type: txType }));
      }
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
  });
});
