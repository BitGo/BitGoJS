import * as assert from 'assert';
import { formatAddressWithFormatString, generateAddress, parseIndexRange } from '../src/generateAddress';
import { getKeyTriple } from './parseAddress';

describe('generateAddresses', function () {
  it('should generate addresses', function () {
    const [userKey, backupKey, bitgoKey] = getKeyTriple('generateAddress').map((k) => k.neutered().toBase58());
    const lines = [];
    for (const l of generateAddress({
      userKey,
      backupKey,
      bitgoKey,
      index: parseIndexRange(['0-1']),
      format: '%a',
      chain: [0, 1],
    })) {
      lines.push(formatAddressWithFormatString(l, '%a'));
    }

    assert.strictEqual(lines.length, 4);
    assert.deepStrictEqual(lines, [
      '38FHxcU7KY4E2nDEezEVcKWGvHy9717ehF',
      '35Qg1UqVWSJdtF1ysfz9h3KRGdk9uH8iYx',
      '3ARnshsLXE9QfJemQdoKL2kp6TRqGohLDz',
      '3QxKW93NN8CQrKaNqkDsAXPyxPsrxfTYME',
    ]);
  });
});
