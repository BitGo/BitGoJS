import * as assert from 'assert';
import { BuildParams } from '../../../../src/bitgo/wallet/BuildParams';

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
});
