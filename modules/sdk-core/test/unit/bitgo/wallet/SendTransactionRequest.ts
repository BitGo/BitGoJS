import * as assert from 'assert';
import { SendTransactionRequest } from '../../../../src/bitgo/wallet/SendTransactionRequest';
import { BuildParams } from '../../../../src/bitgo/wallet/BuildParams';
import { getCodecProperties } from '../../../../src/bitgo/utils/codecProps';

describe('SendTransactionRequest', function () {
  it('has expected property count', function () {
    assert.strictEqual(getCodecProperties(BuildParams).length, 54);
  });
  it('enforces codec', function () {
    assert.deepStrictEqual(SendTransactionRequest.encode({ txHex: '00' }), { txHex: '00' });
    assert.deepStrictEqual(SendTransactionRequest.encode({ txHex: '00', addressType: 'p2sh', bar: 'omit' } as any), {
      txHex: '00',
      addressType: 'p2sh',
    });
  });
});
