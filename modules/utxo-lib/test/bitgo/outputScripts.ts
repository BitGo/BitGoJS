import { networks } from 'bitcoinjs-lib';
import * as assert from 'assert';

import {
  createOutputScript2of3,
  createOutputScriptP2shP2pk,
  createPaymentP2tr,
  isSupportedScriptType,
  scriptTypes2Of3,
} from '../../src/bitgo/outputScripts';
import { ECPair, getNetworkName, getNetworkList } from '../../src';
import { getKeyTriple } from '../../src/testutil';

const keys = getKeyTriple('utxo');
const pubkeys = keys.map((k) => k.publicKey) as [Buffer, Buffer, Buffer];

describe('output script support', function () {
  it('has expected values for each network', function () {
    assert.deepStrictEqual(
      getNetworkList().map((n) => [getNetworkName(n), scriptTypes2Of3.filter((t) => isSupportedScriptType(n, t))]),
      [
        ['bitcoin', ['p2sh', 'p2shP2wsh', 'p2wsh', 'p2tr', 'p2trMusig2']],
        ['testnet', ['p2sh', 'p2shP2wsh', 'p2wsh', 'p2tr', 'p2trMusig2']],
        ['bitcoincash', ['p2sh']],
        ['bitcoincashTestnet', ['p2sh']],
        ['bitcoingold', ['p2sh', 'p2shP2wsh', 'p2wsh']],
        ['bitcoingoldTestnet', ['p2sh', 'p2shP2wsh', 'p2wsh']],
        ['bitcoinsv', ['p2sh']],
        ['bitcoinsvTestnet', ['p2sh']],
        ['dash', ['p2sh']],
        ['dashTest', ['p2sh']],
        ['dogecoin', ['p2sh']],
        ['dogecoinTest', ['p2sh']],
        ['ecash', ['p2sh']],
        ['ecashTest', ['p2sh']],
        ['litecoin', ['p2sh', 'p2shP2wsh', 'p2wsh']],
        ['litecoinTest', ['p2sh', 'p2shP2wsh', 'p2wsh']],
        ['zcash', ['p2sh']],
        ['zcashTest', ['p2sh']],
      ]
    );
  });

  it('does not allow unsupported scripts when network parameter is provided', function () {
    getNetworkList().forEach((n) => {
      scriptTypes2Of3
        .filter((t) => !isSupportedScriptType(n, t))
        .forEach((t) =>
          assert.throws(
            () => createOutputScript2of3(pubkeys, t, n),
            (err) => !!(err instanceof Error && err.message.match(/^unsupported script type/))
          )
        );
    });
  });
});

describe('createOutputScript2of3()', function () {
  const p2ms =
    '522103f1667be6e8b8eb0c980155dfcda742affeeb0b0ca10969c54152713185' +
    '6d65c9210305902cf20a0bbc9274e62414aa4afea8c96e3e83abb5233d72355c' +
    '27d7de660a2103c79183d6641585179d25bbc091b2a7fce86c9f15d311e5aca0' +
    'a020478d8f208753ae';
  const p2wsh = '002095ecaacb606b9ece3821c0111c0a1208dd1d35192809bf8cf6cbad4bbeaca67f';
  const p2tr = '5120a4ce7d122bdc05224b27415228728e5d5bf485961a07493d068ddbb4d4569059';
  const p2trMusig2 = '51207cd79799a4cf6183b018a29960ffe8351e90afdb2383b9b9dcd3ec07929c72e3';

  scriptTypes2Of3.forEach((scriptType) => {
    it(`creates output script (type=${scriptType})`, function () {
      const { scriptPubKey, redeemScript, witnessScript } = createOutputScript2of3(pubkeys, scriptType);

      switch (scriptType) {
        case 'p2sh':
          assert.strictEqual(scriptPubKey.toString('hex'), 'a91491590bed8198ea7ca57ba68ab7cbfabc656cbbaf87');
          assert.strictEqual(redeemScript && redeemScript.toString('hex'), p2ms);
          assert.strictEqual(witnessScript, undefined);
          break;
        case 'p2shP2wsh':
          assert.strictEqual(scriptPubKey.toString('hex'), 'a9140312dd6f801ab11d53c35f6a2bdac9c602a55d9d87');
          assert.strictEqual(redeemScript && redeemScript.toString('hex'), p2wsh);
          assert.strictEqual(witnessScript && witnessScript.toString('hex'), p2ms);
          break;
        case 'p2wsh':
          assert.strictEqual(scriptPubKey.toString('hex'), p2wsh);
          assert.strictEqual(redeemScript, undefined);
          assert.strictEqual(witnessScript && witnessScript.toString('hex'), p2ms);
          break;
        case 'p2tr':
          assert.strictEqual(scriptPubKey.toString('hex'), p2tr);
          // TODO: validate script control blocks once they are returned by payments.p2tr()
          break;
        case 'p2trMusig2':
          assert.strictEqual(scriptPubKey.toString('hex'), p2trMusig2);
          break;
        default:
          throw new Error(`unexpected type ${scriptType}`);
      }
    });
  });
});

describe('createOutputScriptP2shP2pk', function () {
  it('create output script p2shP2pk', function () {
    const keypair = ECPair.fromWIF('cTLxw4KC55LQfFj3eZz51NpWX1j2ja4WkbQFbHaTuaRkSFGeJ4yS', networks.testnet);
    const { scriptPubKey, redeemScript, witnessScript } = createOutputScriptP2shP2pk(keypair.publicKey);
    assert.strictEqual(scriptPubKey.toString('hex'), 'a914172dcc4e025361d951a9511c670973a4e3720c9887');
    assert.strictEqual(
      redeemScript?.toString('hex'),
      '210219da48412c2268865fe8c126327d1b12eee350a3b69eb09e3323cc9a11828945ac'
    );
    assert.strictEqual(witnessScript, undefined);
  });
});

describe('createPaymentP2tr', () => {
  const controlBlocks = [
    'c1aa3303d48847f4d54aa02a4ff97448f1f430b07eecd632c41f390e3f8431a166487df024a0eb38aeb56b5263cf22c84a2c9c7daad9a8e55cce2e3cac87c52a0a',
    'c1aa3303d48847f4d54aa02a4ff97448f1f430b07eecd632c41f390e3f8431a1660a75f62db677b9c1974741735aa4b0c2c8718796c82578b960e1fa0986d4f25cf0b2127669c12ad75a079c25502a5456764de23f30df1fcdb88418fe970834d7',
    'c1aa3303d48847f4d54aa02a4ff97448f1f430b07eecd632c41f390e3f8431a1669c039366a9ce89ad30c9935268a10110cb1a4b6357dcc2c651e9de38639c206af0b2127669c12ad75a079c25502a5456764de23f30df1fcdb88418fe970834d7',
  ];

  it('allows no redeemIndex', () => {
    const p2tr = createPaymentP2tr(pubkeys);
    assert.strictEqual(p2tr.controlBlock, undefined);
  });

  for (let i = 0; i < 3; i++) {
    it(`creates controlBlock for redeemIndex ${i}`, () => {
      const p2tr = createPaymentP2tr(pubkeys, i);
      assert.strictEqual(p2tr.controlBlock?.toString('hex'), controlBlocks[i]);
    });
  }
});
