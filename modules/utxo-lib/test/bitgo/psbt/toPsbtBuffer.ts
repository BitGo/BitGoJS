import * as assert from 'assert';

import { toPsbtBuffer } from '../../../src/bitgo';

describe('bufferUtil', function () {
  function variants(data: Buffer | string): (Buffer | string)[] {
    return [
      data,
      data.toString('hex'),
      Buffer.from(data.toString('hex')),
      data.toString('base64'),
      Buffer.from(data.toString('base64')),
    ];
  }

  it('should convert a buffer to a string', function () {
    const psbt = Buffer.from('psbt\xff', 'ascii');
    for (const v of variants(psbt)) {
      assert.ok(toPsbtBuffer(v).equals(psbt));
    }

    const nonPsbt = Buffer.from('hello world', 'ascii');
    for (const v of variants(nonPsbt)) {
      assert.throws(() => toPsbtBuffer(v));
    }
  });
});
