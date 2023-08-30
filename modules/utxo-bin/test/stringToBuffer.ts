import * as assert from 'assert';

import { stringToBuffer } from '../src/parseString';

describe('stringToBuffer', function () {
  const bytes = Buffer.alloc(32, 42);
  it('converts hex and base64', function () {
    for (const e of ['hex', 'base64'] as BufferEncoding[]) {
      const str = bytes.toString(e);
      assert.deepStrictEqual(stringToBuffer(str, ['hex', 'base64']), bytes);

      const strNl = [str.slice(0, 4), str.slice(4)].join('\n');
      assert.deepStrictEqual(stringToBuffer(strNl, ['hex', 'base64']), bytes);
    }
  });
});
