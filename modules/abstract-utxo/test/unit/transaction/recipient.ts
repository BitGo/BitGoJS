import assert from 'assert';

import {
  toOutputScript,
  fromExtendedAddressFormatToScript,
  toExtendedAddressFormat,
} from '../../../src/transaction/recipient';
import { getUtxoCoin } from '../util/utxoCoins';

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

describe('toOutputScript / fromExtendedAddressFormatToScript resolveScript override', function () {
  const coin = getUtxoCoin('btc');
  const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
  const defaultScript = fromExtendedAddressFormatToScript(address, coin.name);

  it('fromExtendedAddressFormatToScript uses the default wasm-utxo resolver when none is supplied', function () {
    assert.deepStrictEqual(fromExtendedAddressFormatToScript(address, coin.name), defaultScript);
  });

  it('fromExtendedAddressFormatToScript defers to a supplied resolveScript callback', function () {
    const fakeScript = Buffer.from('deadbeef', 'hex');
    let calledWith: [string, string] | undefined;
    const script = fromExtendedAddressFormatToScript(address, coin.name, (a, c) => {
      calledWith = [a, c];
      return fakeScript;
    });
    assert.deepStrictEqual(script, fakeScript);
    assert.deepStrictEqual(calledWith, [address, coin.name]);
  });

  it('fromExtendedAddressFormatToScript never invokes resolveScript for a scriptPubKey: recipient', function () {
    let called = false;
    const script = fromExtendedAddressFormatToScript('scriptPubKey:deadbeef', coin.name, () => {
      called = true;
      return Buffer.from('');
    });
    assert.strictEqual(called, false);
    assert.deepStrictEqual(script, Buffer.from('deadbeef', 'hex'));
  });

  it('toOutputScript forwards resolveScript through for a string address', function () {
    const fakeScript = Buffer.from('cafebabe', 'hex');
    const script = toOutputScript(address, coin.name, () => fakeScript);
    assert.deepStrictEqual(script, fakeScript);
  });

  it('toOutputScript forwards resolveScript through for an { address } object', function () {
    const fakeScript = Buffer.from('cafebabe', 'hex');
    const script = toOutputScript({ address }, coin.name, () => fakeScript);
    assert.deepStrictEqual(script, fakeScript);
  });

  it('toOutputScript never invokes resolveScript for a { script } object', function () {
    let called = false;
    const script = toOutputScript({ script: 'deadbeef' }, coin.name, () => {
      called = true;
      return Buffer.from('');
    });
    assert.strictEqual(called, false);
    assert.deepStrictEqual(script, Buffer.from('deadbeef', 'hex'));
  });
});

describe('AbstractUtxoCoin.resolveOutputScript', function () {
  it('defaults to the coin-agnostic wasm-utxo address decoder', function () {
    const coin = getUtxoCoin('btc');
    const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    assert.deepStrictEqual(
      Buffer.from(coin.resolveOutputScript(address)),
      fromExtendedAddressFormatToScript(address, coin.name)
    );
  });

  it('ignores an unrecognized unifiedRecipientPreference for a non-Zcash coin', function () {
    const coin = getUtxoCoin('btc');
    const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    assert.deepStrictEqual(
      Buffer.from(coin.resolveOutputScript(address, 'shielded')),
      fromExtendedAddressFormatToScript(address, coin.name)
    );
  });
});

describe('toExtendedAddressFormat', function () {
  const zec = getUtxoCoin('zec');
  const orchardReceiver = Buffer.from(
    'd632c28aa0831d671be17709a42c9627e2eb687a1b2a55768ea470c9bae7499cd0bd3d0eb0484e307236b5',
    'hex'
  );

  it('encodes a shielded receiver as a single-receiver unified address for zec', function () {
    const extendedAddress = toExtendedAddressFormat(orchardReceiver, 'zec');
    assert.strictEqual(
      Buffer.from(zec.resolveOutputScript(extendedAddress, 'shielded')).toString('hex'),
      orchardReceiver.toString('hex')
    );
  });

  it('decodes ordinary transparent scripts for tzec without the unified-address path', function () {
    const tzec = getUtxoCoin('tzec');
    const p2pkhScript = tzec.resolveOutputScript('tmM4DvLVJKXZt5ydn1tqYTHvahpKSwgjuRk');
    assert.strictEqual(
      toExtendedAddressFormat(Buffer.from(p2pkhScript), 'tzec'),
      'tmM4DvLVJKXZt5ydn1tqYTHvahpKSwgjuRk'
    );
  });

  it('never takes the unified-address path for non-zcash coins', function () {
    // a 43-byte script is not a valid transparent scriptPubKey anywhere — for non-zcash coins
    // the UA encoder must not run, so decoding throws the ordinary decoder error
    assert.throws(() => toExtendedAddressFormat(orchardReceiver, 'btc'), /Invalid address|script/i);
  });
});
