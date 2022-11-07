import * as assert from 'assert';
import { ecc as eccLib, getNetworkName, Network, networks, taproot } from '../../../src';
import {
  isPlaceholderSignature,
  outputScripts,
  ParsedSignatureScriptTaprootScriptPath,
  parseSignatureScript,
  verifySignatureWithPublicKey,
} from '../../../src/bitgo';
import { getHalfSignedTransaction2Of3, getPrevOutputs } from '../../transaction_util';
import { getDefaultWalletKeys } from '../../testutil';
import { getInputUpdate } from '../../../src/bitgo/psbt/fromHalfSigned';
import { createOutputScript2of3 } from '../../../src/bitgo/outputScripts';
import { normDefault } from '../../testutil/normalize';
type InputType = outputScripts.ScriptType2Of3 | 'p2shP2pk';
function getInputScripts(): InputType[] {
  return [...outputScripts.scriptTypes2Of3, 'p2shP2pk'];
}

function runTest(scriptType: InputType, network: Network) {
  const walletKeys = getDefaultWalletKeys();
  describe(`getInputUpdate scriptType=${scriptType}, network=${getNetworkName(network)}`, function () {
    let prevOutputs;
    let tx;
    before('create transaction', function () {
      prevOutputs = getPrevOutputs(scriptType, BigInt(1e8), walletKeys.triple);
      tx = getHalfSignedTransaction2Of3(walletKeys.triple, walletKeys.user, walletKeys.bitgo, scriptType, network, {
        prevOutputs,
      });
    });
    it('matches expected value', function () {
      const vin = 0;

      const result = getInputUpdate(tx.clone() /* FIXME: make getInputUpdate non-destructive */, vin, prevOutputs[0]);
      const parsed = parseSignatureScript(tx.ins[vin]);
      assert(parsed.scriptType !== undefined);

      function getTaprootUpdate(parsed: ParsedSignatureScriptTaprootScriptPath, pubkey: Buffer, signature: Buffer) {
        return {
          tapLeafScript: [
            {
              controlBlock: parsed.controlBlock,
              script: parsed.pubScript,
              leafVersion: parsed.leafVersion,
            },
          ],
          tapScriptSig: [
            {
              leafHash: taproot.getTapleafHash(eccLib, parsed.controlBlock, parsed.pubScript),
              pubkey,
              signature,
            },
          ],
        };
      }

      switch (scriptType) {
        case 'p2shP2pk':
          break;
        case 'p2sh':
        case 'p2shP2wsh':
        case 'p2wsh':
        case 'p2tr':
          assert(parsed.scriptType === scriptType);
          const { redeemScript, witnessScript } = createOutputScript2of3(walletKeys.publicKeys, scriptType);
          const parsedSignatures = parsed.signatures.filter((s) => !isPlaceholderSignature(s));
          const signedBy = walletKeys.publicKeys.filter((k) => verifySignatureWithPublicKey(tx, vin, prevOutputs, k));

          assert.strictEqual(parsedSignatures.length, 1);
          assert.strictEqual(signedBy.length, 1);
          assert(Buffer.isBuffer(parsedSignatures[0]));
          assert.deepStrictEqual(
            normDefault(result),
            normDefault({
              partialSig:
                scriptType === 'p2tr'
                  ? undefined
                  : [
                      {
                        pubkey: signedBy[0],
                        signature: parsedSignatures[0],
                      },
                    ],
              redeemScript,
              witnessScript,
              ...(parsed.scriptType === 'p2tr' && 'controlBlock' in parsed
                ? getTaprootUpdate(parsed, signedBy[0].slice(1), parsedSignatures[0])
                : {}),
            })
          );
      }
    });
  });
}

getInputScripts().forEach((t) => {
  runTest(t, networks.bitcoin);
});
