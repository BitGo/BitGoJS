import 'should';
import * as assert from 'assert';

// Import directly from source so no top-level export change is needed
const getModule = () => require('../../../../../src/bitgo/utils/tss/recipientUtils');

function makeTxRequest(
  intentRecipients?: { address: { address: string }; amount: { value: string }; data?: string }[]
): any {
  return {
    txRequestId: 'test-req-id',
    intent: intentRecipients ? { intentType: 'contractCall', recipients: intentRecipients } : { intentType: 'payment' },
    transactions: [],
    unsignedTxs: [],
    state: 'pendingUserSignature',
    walletType: 'hot',
    walletId: 'walletId',
    policiesChecked: true,
    version: 1,
    userId: 'userId',
  };
}

describe('recipientUtils', function () {
  describe('NO_RECIPIENT_TX_TYPES', function () {
    it('contains all ECDSA exempted types', function () {
      const { NO_RECIPIENT_TX_TYPES } = getModule();
      const ecdsaTypes = [
        'acceleration',
        'fillNonce',
        'transferToken',
        'tokenApproval',
        'consolidate',
        'bridgeFunds',
        'enableToken',
        'customTx',
      ];
      ecdsaTypes.forEach((t) => assert.ok(NO_RECIPIENT_TX_TYPES.has(t), `${t} should be in NO_RECIPIENT_TX_TYPES`));
    });

    it('contains EdDSA staking types', function () {
      const { NO_RECIPIENT_TX_TYPES } = getModule();
      const stakingTypes = [
        'stakingActivate',
        'stakingDeactivate',
        'stakingWithdraw',
        'stakingClaim',
        'stakingDelegate',
        'walletInitialization',
      ];
      stakingTypes.forEach((t) => assert.ok(NO_RECIPIENT_TX_TYPES.has(t), `${t} should be in NO_RECIPIENT_TX_TYPES`));
    });

    it('contains CANTON transfer flow types', function () {
      const { NO_RECIPIENT_TX_TYPES } = getModule();
      const cantonTypes = [
        'transferAccept',
        'transferReject',
        'transferAcknowledge',
        'transferOfferWithdrawn',
        'oneStepPreApproval',
      ];
      cantonTypes.forEach((t) => assert.ok(NO_RECIPIENT_TX_TYPES.has(t), `${t} should be in NO_RECIPIENT_TX_TYPES`));
    });
  });

  describe('resolveEffectiveTxParams', function () {
    it('uses txParams.recipients when provided', function () {
      const { resolveEffectiveTxParams } = getModule();
      const txRequest = makeTxRequest();
      const result = resolveEffectiveTxParams(txRequest, { recipients: [{ address: '0xabc', amount: '100' }] });
      result.recipients[0].address.should.equal('0xabc');
      result.recipients[0].amount.should.equal('100');
    });

    it('falls back to intent.recipients when txParams has no recipients', function () {
      const { resolveEffectiveTxParams } = getModule();
      const txRequest = makeTxRequest([{ address: { address: '0xintent' }, amount: { value: '500' } }]);
      const result = resolveEffectiveTxParams(txRequest, {});
      result.recipients[0].address.should.equal('0xintent');
      result.recipients[0].amount.should.equal('500');
    });

    it('falls back to intent.recipients when txParams is undefined', function () {
      const { resolveEffectiveTxParams } = getModule();
      const txRequest = makeTxRequest([{ address: { address: '0xintent' }, amount: { value: '999' } }]);
      const result = resolveEffectiveTxParams(txRequest, undefined);
      result.recipients[0].address.should.equal('0xintent');
    });

    it('prefers txParams.recipients over intent.recipients when both present', function () {
      const { resolveEffectiveTxParams } = getModule();
      const txRequest = makeTxRequest([{ address: { address: '0xintent' }, amount: { value: '9999' } }]);
      const result = resolveEffectiveTxParams(txRequest, { recipients: [{ address: '0xexplicit', amount: '1' }] });
      result.recipients[0].address.should.equal('0xexplicit');
    });

    it('maps intent.data field through to the recipient', function () {
      const { resolveEffectiveTxParams } = getModule();
      const txRequest = makeTxRequest([
        { address: { address: '0xcontract' }, amount: { value: '0' }, data: '0xabcdef' },
      ]);
      const result = resolveEffectiveTxParams(txRequest, undefined);
      result.recipients[0].data.should.equal('0xabcdef');
    });

    it('throws InvalidTransactionError when no recipients and type is not exempted', function () {
      const { resolveEffectiveTxParams } = getModule();
      const txRequest = makeTxRequest();
      assert.throws(
        () => resolveEffectiveTxParams(txRequest, {}),
        /Recipient details are required to verify this transaction before signing/
      );
    });

    it('throws when txParams is undefined and intent has no recipients', function () {
      const { resolveEffectiveTxParams } = getModule();
      const txRequest = makeTxRequest();
      assert.throws(
        () => resolveEffectiveTxParams(txRequest, undefined),
        /Recipient details are required to verify this transaction before signing/
      );
    });

    it('allows empty recipients when txParams.type is a no-recipient type', function () {
      const { resolveEffectiveTxParams } = getModule();
      const txRequest = makeTxRequest();
      const result = resolveEffectiveTxParams(txRequest, { type: 'stakingActivate' });
      result.type.should.equal('stakingActivate');
    });

    it('allows empty recipients when intent.intentType is a no-recipient type (EdDSA fallback)', function () {
      const { resolveEffectiveTxParams } = getModule();
      const txRequest = { ...makeTxRequest(), intent: { intentType: 'walletInitialization' } };
      // No txParams.type — guard must fall back to intent.intentType
      const result = resolveEffectiveTxParams(txRequest, undefined);
      assert.ok(!result.recipients?.length, 'No recipients expected');
    });

    const ECDSA_NO_RECIPIENT_TYPES = [
      'acceleration',
      'fillNonce',
      'transferToken',
      'tokenApproval',
      'consolidate',
      'bridgeFunds',
      'enableToken', // TSS wallets do not populate recipients for token enablement
      'customTx', // DeFi/WalletConnect smart contract interactions have no traditional recipients
    ];

    ECDSA_NO_RECIPIENT_TYPES.forEach((type) => {
      it(`allows empty recipients for no-recipient tx type: ${type}`, function () {
        const { resolveEffectiveTxParams } = getModule();
        const txRequest = makeTxRequest();
        const result = resolveEffectiveTxParams(txRequest, { type });
        result.type.should.equal(type);
      });
    });
  });
});
