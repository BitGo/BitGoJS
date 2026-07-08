import * as assert from 'assert';
import * as t from 'io-ts';
import { TxSendBody } from '@bitgo/public-types';
import { AttestationPayload } from '../../../../src/bitgo/wallet/BuildParams';

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

  it('TxSendBody alone drops attestation (upstream codec has no such field yet — TODO(WCN-541))', function () {
    assert.deepStrictEqual(
      TxSendBody.encode({
        txHex: '00',
        attestation: { signature: 'sig', credentialId: 'c', clientDataJSON: 'cd', authenticatorData: 'ad' },
      } as any),
      { txHex: '00' }
    );
  });

  it('the local intersection used by wallet.sendTransaction/initiateTransaction preserves attestation', function () {
    // Mirrors the codec built inline in Wallet#sendTransaction/#initiateTransaction (WCN-539):
    // TxSendBody is `t.exact` and strips unknown keys, so attestation is re-added via a sibling
    // t.partial in the same intersection until @bitgo/public-types declares it upstream.
    //
    // Note: by the time this codec runs, the caller has already done
    // `_.pick(params, whitelistedSendParams)`, so the object passed to `.encode()` never carries
    // arbitrary unknown keys in production — this test reflects that, not raw request bodies.
    const attestation = { signature: 'sig', credentialId: 'c', clientDataJSON: 'cd', authenticatorData: 'ad' };
    const sendBodyWithAttestation = t.intersection([TxSendBody, t.partial({ attestation: AttestationPayload })]);

    assert.deepStrictEqual(sendBodyWithAttestation.encode({ txHex: '00', attestation } as any), {
      txHex: '00',
      attestation,
    });
  });
});
