import * as assert from 'assert';
import { describe, it } from 'mocha';

import { BIP32Interface, ecc as eccLib, getNetworkName, Network, networks, taproot } from '../../../src';
import {
  isPlaceholderSignature,
  outputScripts,
  ParsedSignatureScriptTaprootScriptPath,
  parseSignatureScript,
  PrevOutput,
  UtxoPsbt,
  UtxoTransaction,
  verifySignatureWithPublicKey,
} from '../../../src/bitgo';
import { createOutputScript2of3, getLeafHash } from '../../../src/bitgo/outputScripts';
import { getInputUpdate } from '../../../src/bitgo/psbt/fromHalfSigned';

import { getPrevOutputs, getTransactionStages } from '../../transaction_util';
import { getDefaultWalletKeys, getKeyName } from '../../testutil';
import { normDefault } from '../../testutil/normalize';

function getScriptTypes(): outputScripts.ScriptType[] {
  return [...outputScripts.scriptTypes2Of3, 'p2shP2pk'];
}

const walletKeys = getDefaultWalletKeys();

function runTest(
  scriptType: outputScripts.ScriptType,
  signer: BIP32Interface,
  cosigner: BIP32Interface,
  network: Network
) {
  describe(
    `UtxoPsbt scriptType=${scriptType}, network=${getNetworkName(network)} ` +
      `signer=${getKeyName(walletKeys.triple, signer)} ` +
      `cosigner=${getKeyName(walletKeys.triple, cosigner)}`,
    function () {
      let prevOutputs: PrevOutput<bigint>[];
      let unsigned: UtxoTransaction<bigint>;
      let halfSigned: UtxoTransaction<bigint>;
      let fullSigned: UtxoTransaction<bigint>;
      before('create transaction', function () {
        prevOutputs = getPrevOutputs(scriptType, BigInt(1e8), network, {
          keys: walletKeys.triple,
          prevTx: scriptType === 'p2sh' || scriptType === 'p2shP2pk',
        });
        ({ unsigned, halfSigned, fullSigned } = getTransactionStages(
          walletKeys.triple,
          signer,
          cosigner,
          scriptType,
          network,
          {
            amountType: 'bigint',
            outputAmount: BigInt(1e8),
            prevOutputs,
          }
        ));
      });

      function testGetInputUpdateForStage(stage: 'unsigned' | 'halfSigned') {
        it(`has getInputUpdate with expected value, stage=${stage}`, function () {
          if (scriptType === 'p2shP2pk') {
            this.skip();
          }
          const tx = stage === 'unsigned' ? unsigned : halfSigned;
          const vin = 0;
          const nonWitnessUtxo = scriptType === 'p2sh' ? prevOutputs[vin].prevTx : undefined;

          const result = getInputUpdate(
            tx.clone() /* FIXME: make getInputUpdate non-destructive */,
            vin,
            prevOutputs[0]
          );

          if (stage === 'unsigned') {
            assert.deepStrictEqual(
              normDefault(result),
              normDefault({
                nonWitnessUtxo,
              })
            );
            return;
          }

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
            case 'p2sh':
            case 'p2shP2wsh':
            case 'p2wsh':
            case 'p2tr':
              assert(parsed.scriptType === scriptType);
              const { redeemScript, witnessScript } = createOutputScript2of3(walletKeys.publicKeys, scriptType);
              const parsedSignatures = parsed.signatures.filter((s) => !isPlaceholderSignature(s));
              const signedBy = walletKeys.publicKeys.filter((k) =>
                verifySignatureWithPublicKey(tx, vin, prevOutputs, k)
              );

              assert.strictEqual(parsedSignatures.length, 1);
              assert.strictEqual(signedBy.length, 1);
              assert.strictEqual(signedBy[0], signer.publicKey);
              assert(Buffer.isBuffer(parsedSignatures[0]));
              assert.deepStrictEqual(
                normDefault(result),
                normDefault({
                  nonWitnessUtxo,
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
      }

      testGetInputUpdateForStage('unsigned');
      testGetInputUpdateForStage('halfSigned');

      it('has equal unsigned tx', function () {
        assert.strictEqual(
          UtxoPsbt.fromTransaction(unsigned, prevOutputs).getUnsignedTx().toBuffer().toString('hex'),
          unsigned.toBuffer().toString('hex')
        );

        if (scriptType !== 'p2shP2pk') {
          assert.strictEqual(
            UtxoPsbt.fromTransaction(halfSigned, prevOutputs).getUnsignedTx().toBuffer().toString('hex'),
            unsigned.toBuffer().toString('hex')
          );
        }
      });

      function signPsbt(startTx: UtxoTransaction<bigint>, signers: BIP32Interface[]) {
        const psbt = UtxoPsbt.fromTransaction(startTx, prevOutputs);
        signers.forEach((s) => {
          if (scriptType === 'p2tr') {
            psbt.signTaprootInput(0, s, [
              getLeafHash({
                publicKeys: walletKeys.publicKeys,
                signer: signer.publicKey,
                cosigner: cosigner.publicKey,
              }),
            ]);
          } else {
            psbt.signAllInputs(s);
          }
        });
        psbt.finalizeAllInputs();
        return psbt.extractTransaction();
      }

      it('can go from unsigned to full-signed', function () {
        // TODO(BG-57748): inputs lack some required information
        this.skip();
        assert.deepStrictEqual(
          signPsbt(unsigned, [signer, cosigner]).toBuffer().toString('hex'),
          fullSigned.toBuffer().toString('hex')
        );
      });

      it('can go from half-signed to full-signed', function () {
        if (scriptType === 'p2shP2pk') {
          this.skip();
        }
        assert.deepStrictEqual(
          signPsbt(halfSigned, [cosigner]).toBuffer().toString('hex'),
          fullSigned.toBuffer().toString('hex')
        );
      });
    }
  );
}

getScriptTypes().forEach((t) => {
  runTest(t, walletKeys.user, walletKeys.bitgo, networks.bitcoin);
  runTest(t, walletKeys.backup, walletKeys.user, networks.bitcoin);
});
