import * as assert from 'assert';
import { BuildParams, buildParamKeys, AttestationPayload } from '../../../../src/bitgo/wallet/BuildParams';

describe('BuildParams', function () {
  it('enforces codec', function () {
    assert.deepStrictEqual(
      BuildParams.encode({
        addressType: 'p2sh',
        txFormat: 'psbt',
        isReplaceableByFee: true,
        recipients: [
          {
            amount: '10000',
            address: '2N9Ego9KidiZR8tMP82g6RaggQtcbR9zNzH',
          },
        ],
      } as any),
      {
        addressType: 'p2sh',
        txFormat: 'psbt',
        isReplaceableByFee: true,
        recipients: [
          {
            amount: '10000',
            address: '2N9Ego9KidiZR8tMP82g6RaggQtcbR9zNzH',
          },
        ],
      }
    );

    assert.deepStrictEqual(
      BuildParams.encode({
        rbfTxIds: ['tx1'],
      } as any),
      {
        rbfTxIds: ['tx1'],
      }
    );
  });

  it('should whitelist bridgingParams', function () {
    const bridgingParams = {
      sbtc: {
        amount: 100000,
        stacksRecipient: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        maxFee: 5000,
        lockTime: 144,
      },
    };
    assert.deepStrictEqual(
      BuildParams.encode({
        type: 'bridging',
        txFormat: 'psbt',
        recipients: [],
        bridgingParams,
      } as any),
      {
        type: 'bridging',
        txFormat: 'psbt',
        recipients: [],
        bridgingParams,
      }
    );
  });

  it('should strip unknown params while keeping bridgingParams', function () {
    assert.deepStrictEqual(
      BuildParams.encode({
        bridgingParams: { sbtc: { amount: 50000, stacksRecipient: 'SP123', maxFee: 1000, lockTime: 100 } },
        unknownField: 'should be stripped',
      } as any),
      {
        bridgingParams: { sbtc: { amount: 50000, stacksRecipient: 'SP123', maxFee: 1000, lockTime: 100 } },
      }
    );
  });

  it('should whitelist attestation (WCN-539) while stripping unrelated unknown params', function () {
    const attestation = {
      signature: 'sig',
      credentialId: 'cred-id',
      clientDataJSON: 'client-data',
      authenticatorData: 'auth-data',
    };
    assert.deepStrictEqual(
      BuildParams.encode({
        recipients: [{ amount: '10000', address: '2N9Ego9KidiZR8tMP82g6RaggQtcbR9zNzH' }],
        attestation,
        unknownField: 'should be stripped',
      } as any),
      {
        recipients: [{ amount: '10000', address: '2N9Ego9KidiZR8tMP82g6RaggQtcbR9zNzH' }],
        attestation,
      }
    );
    assert.ok(buildParamKeys.includes('attestation'), 'buildParamKeys must include attestation');
  });

  it('AttestationPayload codec requires all four fields', function () {
    const valid = {
      signature: 'sig',
      credentialId: 'cred-id',
      clientDataJSON: 'client-data',
      authenticatorData: 'auth-data',
    };
    assert.strictEqual(AttestationPayload.is(valid), true);
    assert.strictEqual(AttestationPayload.is({ ...valid, signature: undefined }), false);
  });
});
