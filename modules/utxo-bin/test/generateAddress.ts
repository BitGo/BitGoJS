import * as assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';

import {
  formatDescriptorAddress,
  formatFixedScriptAddress,
  generateDescriptorAddress,
  generateFixedScriptAddress,
  parseIndexRange,
} from '../src/generateAddress';

import { getKeyTriple } from './bip32.util';

describe('generateAddresses', function () {
  const [userKey, backupKey, bitgoKey] = getKeyTriple('generateAddress').map((k) => k.neutered().toBase58());
  // addr${chain}${index}
  const [addr00, addr10, addr01, addr11] = [
    '38FHxcU7KY4E2nDEezEVcKWGvHy9717ehF',
    '35Qg1UqVWSJdtF1ysfz9h3KRGdk9uH8iYx',
    '3ARnshsLXE9QfJemQdoKL2kp6TRqGohLDz',
    '3QxKW93NN8CQrKaNqkDsAXPyxPsrxfTYME',
  ];
  it('should generate addresses', function () {
    const lines = [];
    for (const l of generateFixedScriptAddress({
      userKey,
      backupKey,
      bitgoKey,
      index: parseIndexRange(['0-1']),
      format: '%a',
      chain: [0, 1],
    })) {
      lines.push(formatFixedScriptAddress(l, '%a'));
    }

    assert.strictEqual(lines.length, 4);
    assert.deepStrictEqual(lines, [addr00, addr10, addr01, addr11]);
  });

  it('should generate descriptor addresses', function () {
    // only generate addresses for chain 0
    const xpubs = [userKey, backupKey, bitgoKey].map((x) => x + '/0/0/0/*');
    const lines = [];
    for (const l of generateDescriptorAddress({
      network: utxolib.networks.bitcoin,
      descriptor: `sh(multi(2,${xpubs.join(',')}))`,
      index: parseIndexRange(['0-1']),
      format: '%d',
    })) {
      lines.push(formatDescriptorAddress(l, '%a'));
    }
    assert.deepStrictEqual(lines, [addr00, addr01]);
  });
});
