import assert from 'node:assert/strict';

import { AddressCodec } from '../../../src/transaction/recipient';

describe('AddressCodec', function () {
  const witnessScript = Buffer.from(`0014${'11'.repeat(20)}`, 'hex');

  it('round-trips standard testnet addresses and rejects malformed addresses', function () {
    const codec = new AddressCodec('tbtc');
    const address = codec.encode(witnessScript);

    assert.match(address, /^tb1q/);
    assert.deepStrictEqual(Buffer.from(codec.decode(address)), witnessScript);
    assert.strictEqual(codec.isValidAddress(address), true);
    assert.strictEqual(codec.isValidAddress(`${address.slice(0, -1)}0`), false);
  });

  it('supports a separate WASM codec name without changing the public coin name', function () {
    const codec = new AddressCodec('tbtc', 'tbtcreg');
    const address = codec.encode(witnessScript);

    assert.match(address, /^bcrt1q/);
    assert.deepStrictEqual(Buffer.from(codec.decode(address)), witnessScript);
    assert.strictEqual(codec.isValidAddress(address), true);
  });

  it('does not treat cashaddr as a general address format', function () {
    const codec = new AddressCodec('bch');

    assert.strictEqual(codec.isValidAddress('bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a'), false);
  });
});
