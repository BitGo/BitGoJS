/**
 * @prettier
 */

import 'should';
import { StringTextDecoder } from '../../src/lib/utils';
import { EosInputs } from '../fixtures';

describe('String Text Decoder', function () {
  const stringTextDecoder = new StringTextDecoder();
  const textDecoder = new TextDecoder();

  it('should decode in utf8', function () {
    const data = Buffer.from('abc');

    const eosDecoded = stringTextDecoder.decode(data);
    const decoded = textDecoder.decode(data);

    eosDecoded.should.equal('abc');
    eosDecoded.should.equal(decoded);
  });

  it('should have inconsistent results for non-utf8', function () {
    const data = Buffer.from([0x0001d11e]);

    const eosDecoded = stringTextDecoder.decode(data);
    const decoded = new TextDecoder('utf-16').decode(data);

    eosDecoded.should.not.equal(decoded);
  });

  it('should decode large inputs', function () {
    const largeInput = 'a'.repeat(16384);
    const data = Buffer.from(largeInput);

    const eosDecoded = stringTextDecoder.decode(data);
    const decoded = textDecoder.decode(data);

    eosDecoded.should.equal(largeInput);
    eosDecoded.should.equal(decoded);
  });

  it('should return empty string no data', function () {
    const eosDecoded = stringTextDecoder.decode();
    const decoded = textDecoder.decode();

    eosDecoded.should.equal('');
    eosDecoded.should.equal(decoded);
  });

  it('should encode and decode eos transaction', function () {
    const packedTrxHex = EosInputs.unsignedTransaction.transaction.packed_trx;

    const encoded = new TextEncoder().encode(packedTrxHex);
    const decoded = stringTextDecoder.decode(Buffer.from(encoded));
    const decoded2 = textDecoder.decode(Buffer.from(encoded));

    decoded.should.equal(packedTrxHex);
    decoded.should.equal(decoded2);
  });
});
