import assert from 'node:assert/strict';

import { BitGoAPI } from '@bitgo/sdk-api';
import { fixedScriptWallet } from '@bitgo/wasm-utxo';

import {
  Zec,
  Tzec,
  ZecAddressCodec,
  getZcashAddressKind,
  isShieldedZcashAddress,
  isValidZcashAddress,
} from '../../../../../src/impl/zec';

// ZIP-316 unified-address test vectors, copied from
// BitGoWASM/packages/wasm-utxo/test/fixtures/zcash/unified_address.json so
// both repos test against the same known-good data.
const zip316Mainnet = {
  unified:
    'u1pg2aaph7jp8rpf6yhsza25722sg5fcn3vaca6ze27hqjw7jvvhhuxkpcg0ge9xh6drsgdkda8qjq5chpehkcpxf87rnjryjqwymdheptpvnljqqrjqzjwkc2ma6hcq666kgwfytxwac8eyex6ndgr6ezte66706e3vaqrd25dzvzkc69kw0jgywtd0cmq52q5lkw6uh7hyvzjse8ksx',
};
const testnetWallet = {
  unified:
    'utest1w5m0qcnp8egl8qa296n70n8nvj0tqnzk90p7f48v7mjhhdrdqs8vgqydslg5plmzefawefnpmgmlm6hcy38m972erwxs04s02cq2prhguz8kqly75m6zjy56m08d5jnycgtpqtjeprte576gkmrxyszepgx76yzuwhh7m4lfz9jaq7unjk0x5ant46juxz73hsc6q4v3dqtzww00vps',
  transparentAddress: 'tmM4DvLVJKXZt5ydn1tqYTHvahpKSwgjuRk',
};

describe('Zcash address validation', function () {
  let bitgo: BitGoAPI;
  let zec;
  let tzec;

  before(function () {
    bitgo = new BitGoAPI({ env: 'mock' });
    bitgo.register('zec', Zec.createInstance);
    bitgo.register('tzec', Tzec.createInstance);
    zec = bitgo.coin('zec');
    tzec = bitgo.coin('tzec');
  });

  it('recognizes a mainnet unified address as shielded', function () {
    assert.strictEqual(zec.isValidAddress(zip316Mainnet.unified), true);
    assert.strictEqual(getZcashAddressKind(zip316Mainnet.unified, 'zec'), 'shielded');
    assert.strictEqual(isShieldedZcashAddress(zip316Mainnet.unified, 'zec'), true);
    assert.strictEqual(isValidZcashAddress(zip316Mainnet.unified, 'zec'), true);
  });

  it('recognizes a testnet unified address as shielded', function () {
    assert.strictEqual(tzec.isValidAddress(testnetWallet.unified), true);
    assert.strictEqual(getZcashAddressKind(testnetWallet.unified, 'tzec'), 'shielded');
    assert.strictEqual(isShieldedZcashAddress(testnetWallet.unified, 'tzec'), true);
    assert.strictEqual(isValidZcashAddress(testnetWallet.unified, 'tzec'), true);
  });

  it('recognizes a testnet transparent address as transparent', function () {
    assert.strictEqual(tzec.isValidAddress(testnetWallet.transparentAddress), true);
    assert.strictEqual(getZcashAddressKind(testnetWallet.transparentAddress, 'tzec'), 'transparent');
    assert.strictEqual(isValidZcashAddress(testnetWallet.transparentAddress, 'tzec'), true);
  });

  it('recognizes a mainnet transparent (P2PKH) address as transparent', function () {
    const address = 't1cN2ZVWzWcVRrnfeQzmkpLhzQ4dYRv8yRY';
    assert.strictEqual(zec.isValidAddress(address), true);
    assert.strictEqual(getZcashAddressKind(address, 'zec'), 'transparent');
    assert.strictEqual(isValidZcashAddress(address, 'zec'), true);
  });

  it('rejects a garbage string', function () {
    const garbage = 'not-a-real-address';
    assert.strictEqual(zec.isValidAddress(garbage), false);
    assert.strictEqual(getZcashAddressKind(garbage, 'zec'), undefined);
    assert.strictEqual(isValidZcashAddress(garbage, 'zec'), false);
  });

  it('rejects a unified address checked against the wrong network', function () {
    assert.strictEqual(tzec.isValidAddress(zip316Mainnet.unified), false);
    assert.strictEqual(getZcashAddressKind(zip316Mainnet.unified, 'tzec'), undefined);
    assert.strictEqual(isShieldedZcashAddress(zip316Mainnet.unified, 'tzec'), false);
    assert.strictEqual(isValidZcashAddress(zip316Mainnet.unified, 'tzec'), false);
  });
});

describe('ZecAddressCodec', function () {
  // -- instantiation ----------------------------------------------------------

  let bitgo: BitGoAPI;
  let zec;
  let tzec;

  before(function () {
    bitgo = new BitGoAPI({ env: 'mock' });
    bitgo.register('zec', Zec.createInstance);
    bitgo.register('tzec', Tzec.createInstance);
    zec = bitgo.coin('zec');
    tzec = bitgo.coin('tzec');
  });

  it('constructs for zec and tzec', function () {
    const mainnet = new ZecAddressCodec('zec', 'zec');
    const testnet = new ZecAddressCodec('tzec', 'tzec');
    assert.strictEqual(mainnet.coinName, 'zec');
    assert.strictEqual(testnet.coinName, 'tzec');
  });

  // -- isValidAddress --------------------------------------------------------

  it('isValidAddress: accepts mainnet UA', function () {
    assert.strictEqual(new ZecAddressCodec('zec', 'zec').isValidAddress(zip316Mainnet.unified), true);
  });

  it('isValidAddress: accepts testnet UA', function () {
    assert.strictEqual(new ZecAddressCodec('tzec', 'tzec').isValidAddress(testnetWallet.unified), true);
  });

  it('isValidAddress: accepts mainnet P2PKH', function () {
    assert.strictEqual(new ZecAddressCodec('zec', 'zec').isValidAddress('t1cN2ZVWzWcVRrnfeQzmkpLhzQ4dYRv8yRY'), true);
  });

  it('isValidAddress: accepts testnet transparent address', function () {
    assert.strictEqual(new ZecAddressCodec('tzec', 'tzec').isValidAddress(testnetWallet.transparentAddress), true);
  });

  it('isValidAddress: rejects wrong-network UA', function () {
    assert.strictEqual(new ZecAddressCodec('tzec', 'tzec').isValidAddress(zip316Mainnet.unified), false);
  });

  it('isValidAddress: rejects garbage', function () {
    assert.strictEqual(new ZecAddressCodec('tzec', 'tzec').isValidAddress('not-a-real-address'), false);
  });

  // -- decode ----------------------------------------------------------------

  it('decode: plain transparent address decodes to P2PKH script', function () {
    const codec = new ZecAddressCodec('tzec', 'tzec');
    const script = Buffer.from(codec.decode(testnetWallet.transparentAddress));
    // P2PKH: OP_DUP OP_HASH160 <20-byte hash> OP_EQUALVERIFY OP_CHECKSIG
    assert.strictEqual(script[0], 0x76); // OP_DUP
    assert.strictEqual(script[1], 0xa9); // OP_HASH160
    assert.strictEqual(script[2], 0x14); // push 20 bytes
    assert.strictEqual(script.length, 25); // total P2PKH length
  });

  it('decode: UA with transparent receiver decodes to the same transparent script', function () {
    const codec = new ZecAddressCodec('tzec', 'tzec');
    // The testnet UA carries a transparent receiver; it should decode to the
    // same scriptPubKey as the standalone transparent address.
    const uaScript = Buffer.from(codec.decode(testnetWallet.unified));
    const tAddrScript = Buffer.from(codec.decode(testnetWallet.transparentAddress));
    assert.deepStrictEqual(uaScript, tAddrScript);
  });

  it('decode: UA with transparent receiver decodes on mainnet', function () {
    const codec = new ZecAddressCodec('zec', 'zec');
    const script = Buffer.from(codec.decode(zip316Mainnet.unified));
    // P2PKH structure test
    assert.strictEqual(script[0], 0x76);
    assert.strictEqual(script[1], 0xa9);
    assert.strictEqual(script[2], 0x14);
  });

  it('decode: throws for a UA without a transparent receiver (orchard-only)', function () {
    // Construct an Orchard-only UA by encoding a dummy receiver
    const orchardOnly = fixedScriptWallet.ZcashUnifiedAddress.encodeOrchardReceiver(
      new Uint8Array(43).fill(0x42),
      'tzec'
    );
    const codec = new ZecAddressCodec('tzec', 'tzec');
    assert.throws(() => codec.decode(orchardOnly));
  });

  it('decode: explicit transparent-bound codec returns the transparent script', function () {
    const codec = new ZecAddressCodec('tzec', 'tzec', 'transparent');
    const script = Buffer.from(codec.decode(testnetWallet.unified));
    const tAddrScript = Buffer.from(codec.decode(testnetWallet.transparentAddress));
    assert.deepStrictEqual(script, tAddrScript);
  });

  it('decode: shielded-bound codec returns the raw 43-byte Orchard receiver', function () {
    const codec = new ZecAddressCodec('tzec', 'tzec', 'shielded');
    const receiver = Buffer.from(codec.decode(testnetWallet.unified));
    assert.strictEqual(receiver.length, 43);
    const parsed = fixedScriptWallet.ZcashUnifiedAddress.parse(testnetWallet.unified, 'tzec');
    assert.deepStrictEqual(receiver, Buffer.from(parsed.orchardReceiver as Uint8Array));
  });

  it('decode: shielded-bound codec on mainnet returns the raw 43-byte Orchard receiver', function () {
    const codec = new ZecAddressCodec('zec', 'zec', 'shielded');
    const receiver = Buffer.from(codec.decode(zip316Mainnet.unified));
    assert.strictEqual(receiver.length, 43);
    const parsed = fixedScriptWallet.ZcashUnifiedAddress.parse(zip316Mainnet.unified, 'zec');
    assert.deepStrictEqual(receiver, Buffer.from(parsed.orchardReceiver as Uint8Array));
  });

  it('decode: shielded-bound codec resolves an Orchard-only UA to its receiver', function () {
    const orchardOnly = fixedScriptWallet.ZcashUnifiedAddress.encodeOrchardReceiver(
      new Uint8Array(43).fill(0x42),
      'tzec'
    );
    const codec = new ZecAddressCodec('tzec', 'tzec', 'shielded');
    const receiver = Buffer.from(codec.decode(orchardOnly));
    assert.strictEqual(receiver.length, 43);
    assert.deepStrictEqual(receiver, Buffer.from(new Uint8Array(43).fill(0x42)));
  });

  it('decode: shielded-bound codec throws invalid-address error for a plain transparent address', function () {
    const codec = new ZecAddressCodec('tzec', 'tzec', 'shielded');
    assert.throws(() => codec.decode(testnetWallet.transparentAddress), /is not a valid address for network/);
  });

  it('decode: shielded-bound codec throws invalid-address error for a wrong-network UA', function () {
    const codec = new ZecAddressCodec('tzec', 'tzec', 'shielded');
    assert.throws(() => codec.decode(zip316Mainnet.unified), /is not a valid address for network/);
  });

  it('decode: shielded-bound codec throws invalid-address error for garbage', function () {
    const codec = new ZecAddressCodec('tzec', 'tzec', 'shielded');
    assert.throws(() => codec.decode('not-a-real-address'), /is not a valid address for network/);
  });

  it('decode: throws for garbage', function () {
    const codec = new ZecAddressCodec('tzec', 'tzec');
    assert.throws(() => codec.decode('not-a-real-address'));
  });

  // -- encode (inherited) ----------------------------------------------------

  it('encode: round-trips a transparent script to address', function () {
    const codec = new ZecAddressCodec('tzec', 'tzec');
    const script = codec.decode(testnetWallet.transparentAddress);
    const address = codec.encode(script);
    assert.strictEqual(address, testnetWallet.transparentAddress);
  });

  it('encode: round-trips on mainnet', function () {
    const codec = new ZecAddressCodec('zec', 'zec');
    const address = 't1cN2ZVWzWcVRrnfeQzmkpLhzQ4dYRv8yRY';
    const script = codec.decode(address);
    assert.strictEqual(codec.encode(script), address);
  });

  // -- integration: coin.addressCodec ----------------------------------------

  it('coin.addressCodec: zec returns ZecAddressCodec', function () {
    assert.ok(zec.addressCodec instanceof ZecAddressCodec);
  });

  it('coin.addressCodec: tzec returns ZecAddressCodec', function () {
    assert.ok(tzec.addressCodec instanceof ZecAddressCodec);
  });

  it('coin.addressCodec.isValidAddress matches Zec.isValidAddress', function () {
    assert.strictEqual(
      zec.addressCodec.isValidAddress(zip316Mainnet.unified),
      zec.isValidAddress(zip316Mainnet.unified)
    );
    assert.strictEqual(
      zec.addressCodec.isValidAddress('t1cN2ZVWzWcVRrnfeQzmkpLhzQ4dYRv8yRY'),
      zec.isValidAddress('t1cN2ZVWzWcVRrnfeQzmkpLhzQ4dYRv8yRY')
    );
    assert.strictEqual(zec.addressCodec.isValidAddress('not-a-real-address'), zec.isValidAddress('not-a-real-address'));
  });
});
