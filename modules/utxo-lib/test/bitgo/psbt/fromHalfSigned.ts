import * as assert from 'assert';
import { describe, it } from 'mocha';

import { BIP32Interface, getNetworkName, Network, networks } from '../../../src';
import { outputScripts, PrevOutput, UtxoPsbt, UtxoTransaction } from '../../../src/bitgo';
import { getLeafHash } from '../../../src/bitgo/outputScripts';
import { getInputUpdate } from '../../../src/bitgo/psbt/fromHalfSigned';

import { getPrevOutputs, getTransactionStages } from '../../transaction_util';
import { getDefaultWalletKeys, getKeyName } from '../../testutil';

import { readFixture } from '../../fixture.util';
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
  const signerName = getKeyName(walletKeys.triple, signer);
  const cosignerName = getKeyName(walletKeys.triple, cosigner);
  const networkName = getNetworkName(network);
  describe(`UtxoPsbt ${[
    `scriptType=${scriptType}`,
    `network=${networkName}`,
    `signer=${signerName}`,
    `cosigner=${cosignerName}`,
  ].join(',')}`, function () {
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
      it(`has getInputUpdate with expected value, stage=${stage}`, async function () {
        const tx = stage === 'unsigned' ? unsigned : halfSigned;
        const vin = 0;
        const inputUpdate = getInputUpdate(tx, vin, prevOutputs);
        assert.deepStrictEqual(
          normDefault(inputUpdate),
          await readFixture(
            `test/bitgo/fixtures/psbt/inputUpdate.${scriptType}.${stage}.${signerName}-${cosignerName}.json`,
            inputUpdate
          )
        );
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
      assert.deepStrictEqual(
        psbt.getSignatureValidationArray(walletKeys.publicKeys),
        [true, false, true] /* [true, true, false] in second call */
      );
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
  });
}

getScriptTypes().forEach((t) => {
  runTest(t, walletKeys.user, walletKeys.bitgo, networks.bitcoin);
  runTest(t, walletKeys.backup, walletKeys.user, networks.bitcoin);
});
