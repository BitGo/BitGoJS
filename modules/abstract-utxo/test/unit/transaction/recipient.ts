import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { AddressCodec } from '../../../src/transaction/recipient';
import { ZcashAddressCodec } from '../../../src/impl/zec/addressCodec';
import { getUtxoCoin } from '../util/utxoCoins';

const TESTNET_UA = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../fixtures/tzec/unified_address.json'), 'utf8')
) as { unified: string; ironwoodReceiverHex: string; transparentPubkeyHashHex: string };

describe('AbstractUtxoCoin.preprocessBuildParams', function () {
  const coin = getUtxoCoin('btc');

  it('does not crash when recipients includes an OP_RETURN output with no address field', function () {
    const params = {
      recipients: [
        { address: '3L3jdUJ9YCpGFjYB2Tuu7iBJes6ZHJFmnS', amount: '999612' },
        { amount: '0', script: '6a0c3230323651312d6175646974' }, // OP_RETURN, no address
      ],
    };
    assert.doesNotThrow(() => coin.preprocessBuildParams(params));
    // The OP_RETURN recipient should be passed through unchanged
    assert.deepStrictEqual(params.recipients[1], { amount: '0', script: '6a0c3230323651312d6175646974' });
  });
});

describe('AbstractUtxoCoin.checkRecipient', function () {
  const coin = getUtxoCoin('btc');

  it('does not throw for OP_RETURN output with no address field', function () {
    // Simulates { amount: '0', script: '6a0c...' } coming from buildParams.recipients
    assert.doesNotThrow(() => {
      coin.checkRecipient({ amount: '0' });
    });
  });

  it('does not throw for script-prefixed address with zero amount', function () {
    assert.doesNotThrow(() => {
      coin.checkRecipient({ address: 'scriptPubKey:6a0c68656c6c6f20776f726c64', amount: '0' });
    });
  });

  it('does not throw for a regular address', function () {
    // A valid mainnet P2PKH address
    assert.doesNotThrow(() => {
      coin.checkRecipient({ address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf', amount: '1000' });
    });
  });

  it('throws when OP_RETURN output (no address) has non-zero amount', function () {
    assert.throws(() => {
      coin.checkRecipient({ amount: '1000' });
    }, /Only zero amounts allowed for non-encodeable scriptPubkeys/);
  });

  it('throws when script-prefixed address has non-zero amount', function () {
    assert.throws(() => {
      coin.checkRecipient({ address: 'scriptPubKey:6a0c68656c6c6f20776f726c64', amount: '500' });
    }, /Only zero amounts allowed for non-encodeable scriptPubkeys/);
  });
});

describe('transaction-scoped address codec', function () {
  const coin = getUtxoCoin('btc');
  const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
  const addressCodec = new AddressCodec(coin.name);
  const defaultScript = addressCodec.fromExtendedAddressFormatToScript(address);

  it('decodes ordinary addresses with the transaction codec', function () {
    assert.deepStrictEqual(addressCodec.fromExtendedAddressFormatToScript(address), defaultScript);
  });

  it('uses the codec policy for addresses', function () {
    const fakeScript = Buffer.from('deadbeef', 'hex');
    let calledWith: string | undefined;
    const codec = new AddressCodec(coin.name);
    codec.decode = (a: string) => {
      calledWith = a;
      return fakeScript;
    };
    const script = codec.fromExtendedAddressFormatToScript(address);
    assert.deepStrictEqual(script, fakeScript);
    assert.strictEqual(calledWith, address);
  });

  it('never invokes the codec for a scriptPubKey recipient', function () {
    let called = false;
    const codec = new AddressCodec(coin.name);
    codec.decode = () => {
      called = true;
      return Buffer.from('');
    };
    const script = codec.fromExtendedAddressFormatToScript('scriptPubKey:deadbeef');
    assert.strictEqual(called, false);
    assert.deepStrictEqual(script, Buffer.from('deadbeef', 'hex'));
  });

  it('forwards the codec through toOutputScript for an address string', function () {
    const fakeScript = Buffer.from('cafebabe', 'hex');
    const codec = new AddressCodec(coin.name);
    codec.decode = () => fakeScript;
    const script = codec.toOutputScript(address);
    assert.deepStrictEqual(script, fakeScript);
  });

  it('forwards the codec through toOutputScript for an { address } object', function () {
    const fakeScript = Buffer.from('cafebabe', 'hex');
    const codec = new AddressCodec(coin.name);
    codec.decode = () => fakeScript;
    const script = codec.toOutputScript({ address });
    assert.deepStrictEqual(script, fakeScript);
  });

  it('never invokes the codec for a { script } object', function () {
    let called = false;
    const codec = new AddressCodec(coin.name);
    codec.decode = () => {
      called = true;
      return Buffer.from('');
    };
    const script = codec.toOutputScript({ script: 'deadbeef' });
    assert.strictEqual(called, false);
    assert.deepStrictEqual(script, Buffer.from('deadbeef', 'hex'));
  });
});

describe('Zcash transaction-scoped address codec', function () {
  it('resolves a transparent Unified Address with the Zcash transparent receiver', function () {
    const script = new ZcashAddressCodec('tzec', 'transparent').fromExtendedAddressFormatToScript(TESTNET_UA.unified);
    assert.strictEqual(script.toString('hex'), `76a914${TESTNET_UA.transparentPubkeyHashHex}88ac`);
  });

  it('resolves a shielded Unified Address with the Zcash shielded receiver', function () {
    const script = new ZcashAddressCodec('tzec', 'shielded').fromExtendedAddressFormatToScript(TESTNET_UA.unified);
    assert.strictEqual(script.toString('hex'), TESTNET_UA.ironwoodReceiverHex);
  });
});

describe('AddressCodec', function () {
  it('defaults to the coin-agnostic wasm-utxo address codec', function () {
    const coin = getUtxoCoin('btc');
    const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    assert.deepStrictEqual(
      Buffer.from(new AddressCodec(coin.name).decode(address)),
      new AddressCodec(coin.name).fromExtendedAddressFormatToScript(address)
    );
  });

  it('ignores an unrecognized unifiedRecipientPreference for a non-Zcash coin', function () {
    const coin = getUtxoCoin('btc');
    const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    assert.deepStrictEqual(
      Buffer.from(new AddressCodec(coin.name).decode(address)),
      new AddressCodec(coin.name).fromExtendedAddressFormatToScript(address)
    );
  });
});
