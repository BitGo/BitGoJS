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
});
