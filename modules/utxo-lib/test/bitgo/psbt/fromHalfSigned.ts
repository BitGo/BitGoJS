import * as assert from 'assert';
import { describe, it } from 'mocha';

import { BIP32Interface, getNetworkName, Network, networks } from '../../../src';
import { outputScripts, PrevOutput, UtxoPsbt, UtxoTransaction } from '../../../src/bitgo';
import { getDefaultWalletKeys, getKeyName } from '../../../src/testutil';
import { getLeafHash } from '../../../src/bitgo/outputScripts';
import { getInputUpdate } from '../../../src/bitgo/psbt/fromHalfSigned';

import { getPrevOutputs, getTransactionStages } from '../../transaction_util';

import { readFixture } from '../../fixture.util';
import { normDefault } from '../../testutil/normalize';
import * as bs58check from 'bs58check';

function getScriptTypes2Of3() {
  // FIXME(BG-66941): p2trMusig2 signing does not work in this test suite yet
  //  because the test suite is written with TransactionBuilder
  return outputScripts.scriptTypes2Of3.filter((scriptType) => scriptType !== 'p2trMusig2');
}

function getScriptTypes(): outputScripts.ScriptType[] {
  return [...getScriptTypes2Of3(), 'p2shP2pk'];
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
  const signingKeys = [
    signerName === 'user' || cosignerName === 'user',
    signerName === 'backup' || cosignerName === 'backup',
    signerName === 'bitgo' || cosignerName === 'bitgo',
  ];
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
        prevTx: (scriptType === 'p2sh' || scriptType === 'p2shP2pk') && getNetworkName(network) !== 'zcash',
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
      psbt.updateGlobal({
        globalXpub: walletKeys.triple.map((bip32) => {
          const masterFingerprint = Buffer.alloc(4);
          masterFingerprint.writeUInt32BE(bip32.parentFingerprint);
          const extendedPubkey = bip32.neutered().toBase58();
          return {
            extendedPubkey: bs58check.decode(extendedPubkey),
            masterFingerprint,
            path: 'm',
          };
        }),
      });
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
      assert.deepStrictEqual(psbt.getSignatureValidationArray(0), signingKeys);
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
  });
}

getScriptTypes().forEach((t) => {
  runTest(t, walletKeys.user, walletKeys.bitgo, networks.bitcoin);
  runTest(t, walletKeys.backup, walletKeys.user, networks.bitcoin);
});
