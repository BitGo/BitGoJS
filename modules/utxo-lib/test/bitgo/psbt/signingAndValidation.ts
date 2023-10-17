import * as assert from 'assert';
import { describe, it } from 'mocha';
import * as bs58check from 'bs58check';

import { constructPsbt, getDefaultWalletKeys } from '../../../src/testutil';
import { getSignatureValidationArrayPsbt, KeyName, outputScripts, UtxoPsbt } from '../../../src/bitgo';
import { getNetworkName, Network, networks } from '../../../src';

function getScriptTypes(): outputScripts.ScriptType[] {
  return [...outputScripts.scriptTypes2Of3, 'p2shP2pk'];
}

const walletKeys = getDefaultWalletKeys();
function runTest(scriptType: outputScripts.ScriptType, signerName: KeyName, cosignerName: KeyName, network: Network) {
  const signer = walletKeys[signerName];
  const cosigner = walletKeys[cosignerName];

  const networkName = getNetworkName(network);
  const signingKeys = [
    signerName === 'user' || (cosignerName === 'user' && scriptType !== 'p2shP2pk'),
    signerName === 'backup' || (cosignerName === 'backup' && scriptType !== 'p2shP2pk'),
    signerName === 'bitgo' || (cosignerName === 'bitgo' && scriptType !== 'p2shP2pk'),
  ];

  describe(`UtxoPsbt ${[
    `scriptType=${scriptType}`,
    `network=${networkName}`,
    `signer=${signerName}`,
    `cosigner=${cosignerName}`,
  ].join(',')}`, function () {
    let psbtBase: UtxoPsbt;
    before('create transaction', async function () {
      // Build a fully hydrated UtxoPsbt
      psbtBase = constructPsbt(
        [{ scriptType, value: BigInt(1e8) }],
        [{ scriptType: 'p2sh', value: BigInt(1e8 - 10000) }],
        network,
        walletKeys,
        'unsigned',
        {
          signers: { signerName, cosignerName },
        }
      );
      psbtBase.updateGlobal({
        globalXpub: walletKeys.triple.map((bip32) => {
          const extendedPubkey = bip32.neutered().toBase58();
          return {
            extendedPubkey: bs58check.decode(extendedPubkey),
            masterFingerprint: bip32.fingerprint,
            path: 'm',
          };
        }),
      });
    });

    it('can go from unsigned to fully signed', async function () {
      const psbt = psbtBase.clone();
      if (scriptType === 'p2trMusig2' && signerName === 'user' && cosignerName === 'bitgo') {
        psbt.setAllInputsMusig2NonceHD(signer);
        psbt.setAllInputsMusig2NonceHD(cosigner);
      }
      assert.ok(psbt.getSignatureValidationArray(0).every((res) => !res));
      psbt.signAllInputsHD(signer);
      if (scriptType !== 'p2shP2pk') {
        psbt.signAllInputsHD(cosigner);
      }
      assert(psbt.validateSignaturesOfAllInputs());
      if (scriptType !== 'p2shP2pk') {
        assert.deepStrictEqual(getSignatureValidationArrayPsbt(psbt, walletKeys)[0], [0, signingKeys]);
      }
      psbt.finalizeAllInputs();
      const tx = psbt.extractTransaction();
      assert(tx);
    });
  });
}

getScriptTypes().forEach((t) => {
  runTest(t, 'user', 'bitgo', networks.bitcoin);
  runTest(t, 'backup', 'user', networks.bitcoin);
  if (t === 'p2sh') {
    runTest(t, 'user', 'backup', networks.litecoin);
    runTest(t, 'user', 'backup', networks.zcash);
    runTest(t, 'user', 'backup', networks.bitcoincash);
    runTest(t, 'user', 'backup', networks.bitcoingold);
    runTest(t, 'user', 'backup', networks.dash);
  }
});
