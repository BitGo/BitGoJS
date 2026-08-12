import * as assert from 'assert';
import { TxSendBody } from '@bitgo/public-types';

describe('SendTransactionRequest', function () {
  it('enforces codec', function () {
    assert.deepStrictEqual(
      TxSendBody.encode({
        addressType: 'p2sh',
        txFormat: 'psbt',
        comment: 'foo',
        unknown: 'bar',
      } as any),
      {
        addressType: 'p2sh',
        txFormat: 'psbt',
        comment: 'foo',
        // drops unknown properties
      }
    );

    assert.deepStrictEqual(TxSendBody.encode({ txHex: '00' }), { txHex: '00' });
    assert.deepStrictEqual(TxSendBody.encode({ txHex: '00', addressType: 'p2sh', bar: 'omit' } as any), {
      txHex: '00',
      addressType: 'p2sh',
    });
  });

  it('preserves attestation (WCN-539: @bitgo/public-types TxSendBody declares it natively)', function () {
    const attestation = { signature: 'sig', credentialId: 'c', clientDataJSON: 'cd', authenticatorData: 'ad' };

    assert.deepStrictEqual(TxSendBody.encode({ txHex: '00', attestation } as any), {
      txHex: '00',
      attestation,
    });
  });

  it('preserves bridgingParams (CSHLD-1456: @bitgo/public-types TxSendBody declares it natively)', function () {
    const bridgingParams = {
      sbtc: {
        amount: '100000',
        stacksRecipient: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        maxFee: '5000',
        lockTime: 144,
      },
    };

    assert.deepStrictEqual(TxSendBody.encode({ txHex: '00', bridgingParams } as any), {
      txHex: '00',
      bridgingParams,
    });
  });

  it('preserves sbtcWithdrawParams (CSHLD-1456: @bitgo/public-types TxSendBody declares it natively)', function () {
    const sbtcWithdrawParams = { amount: '100000', btcAddress: 'mtbtcaddr', maxFee: '5000' };

    assert.deepStrictEqual(TxSendBody.encode({ txHex: '00', sbtcWithdrawParams } as any), {
      txHex: '00',
      sbtcWithdrawParams,
    });
  });

  it('validates bridgingParams.sbtc as a complete shape', function () {
    const valid = {
      sbtc: {
        amount: '100000',
        stacksRecipient: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        maxFee: '5000',
        lockTime: 144,
      },
    };
    assert.strictEqual(TxSendBody.is({ bridgingParams: valid }), true);
    assert.strictEqual(TxSendBody.is({}), true); // bridgingParams itself is optional
    assert.strictEqual(TxSendBody.is({ bridgingParams: {} }), true); // sbtc is optional within bridgingParams

    // amount/maxFee accept string or number
    assert.strictEqual(
      TxSendBody.is({ bridgingParams: { sbtc: { ...valid.sbtc, amount: 100000, maxFee: 5000 } } }),
      true
    );

    // sbtc, once present, requires all four fields
    const missingAmount = {
      stacksRecipient: valid.sbtc.stacksRecipient,
      maxFee: valid.sbtc.maxFee,
      lockTime: valid.sbtc.lockTime,
    };
    assert.strictEqual(TxSendBody.is({ bridgingParams: { sbtc: missingAmount } }), false);
  });

  it('validates sbtcWithdrawParams fields as strings', function () {
    const valid = { amount: '100000', btcAddress: 'mtbtcaddr', maxFee: '5000' };
    assert.strictEqual(TxSendBody.is({ sbtcWithdrawParams: valid }), true);
    assert.strictEqual(TxSendBody.is({ sbtcWithdrawParams: {} }), true); // all fields optional
    assert.strictEqual(TxSendBody.is({ sbtcWithdrawParams: { ...valid, amount: 100000 } }), false); // must be string
  });
});
