import { fromOutputScriptWithFormat, toOutputScriptWithFormat } from '../../../src/addressFormat';
import { networks } from '../../../src/networks';
import * as assert from 'assert';

// Addresses used from https://www.npmjs.com/package/ecashaddrjs
const ecashAddress = 'ecash:qpadrekpz6gjd8w0zfedmtqyld0r2j4qmuthccqd8d',
  bitcoinCashAddress = 'bitcoincash:qpadrekpz6gjd8w0zfedmtqyld0r2j4qmuj6vnmhp6',
  outputScriptHex = '76a9147ad1e6c11691269dcf1272ddac04fb5e354aa0df88ac';

describe('ecash address', function () {
  it('decode and encode the address', function () {
    const script = toOutputScriptWithFormat(ecashAddress, 'cashaddr', networks.ecash);
    assert.strictEqual(script.toString('hex'), outputScriptHex);
    assert.strictEqual(fromOutputScriptWithFormat(script, 'cashaddr', networks.ecash), ecashAddress);
    assert.strictEqual(fromOutputScriptWithFormat(script, 'cashaddr', networks.bitcoincash), bitcoinCashAddress);
  });
});
