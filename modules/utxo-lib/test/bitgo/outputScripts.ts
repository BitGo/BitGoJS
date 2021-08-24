/**
 * @prettier
 */
import * as assert from 'assert';

import { createOutputScript2of3, scriptTypes2Of3 } from '../../src/bitgo/outputScripts';

import { getKeyTriple } from '../integration_local_rpc/generate/outputScripts.util';

describe('createOutputScript2of3()', function () {
  const keys = getKeyTriple('utxo');

  scriptTypes2Of3.forEach((scriptType) => {
    it(`creates output script (type=${scriptType})`, function () {
      const p2ms =
        '522103f1667be6e8b8eb0c980155dfcda742affeeb0b0ca10969c54152713185' +
        '6d65c9210305902cf20a0bbc9274e62414aa4afea8c96e3e83abb5233d72355c' +
        '27d7de660a2103c79183d6641585179d25bbc091b2a7fce86c9f15d311e5aca0' +
        'a020478d8f208753ae';

      const p2wsh = '002095ecaacb606b9ece3821c0111c0a1208dd1d35192809bf8cf6cbad4bbeaca67f';

      const { scriptPubKey, redeemScript, witnessScript } = createOutputScript2of3(
        keys.map((k) => k.publicKey),
        scriptType
      );

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
        default:
          throw new Error(`unexpected type ${scriptType}`);
      }
    });
  });
});
