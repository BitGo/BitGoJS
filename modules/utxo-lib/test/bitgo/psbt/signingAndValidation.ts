import * as assert from 'assert';
import { describe, it } from 'mocha';
import * as bs58check from 'bs58check';

import { getDefaultWalletKeys, mockReplayProtectionUnspent, mockUnspents } from '../../../src/testutil';
import {
  addReplayProtectionUnspentToPsbt,
  addWalletOutputToPsbt,
  addWalletUnspentToPsbt,
  createPsbtForNetwork,
  getInternalChainCode,
  KeyName,
  outputScripts,
  UtxoPsbt,
  WalletUnspent,
} from '../../../src/bitgo';
import { getNetworkName, Network, networks } from '../../../src';
import { createOutputScriptP2shP2pk } from '../../../src/bitgo/outputScripts';

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
    let psbt: UtxoPsbt;
    before('create transaction', async function () {
      // Build a fully hydrated UtxoPsbt
      psbt = createPsbtForNetwork({ network });
      psbt.updateGlobal({
        globalXpub: walletKeys.triple.map((bip32) => {
          const extendedPubkey = bip32.neutered().toBase58();
          return {
            extendedPubkey: bs58check.decode(extendedPubkey),
            masterFingerprint: bip32.fingerprint,
            path: 'm',
          };
        }),
      });

      // Add the inputs
      if (scriptType === 'p2shP2pk') {
        const unspent = mockReplayProtectionUnspent(network, BigInt(1e8), { key: signer });
        const { redeemScript } = createOutputScriptP2shP2pk(signer.publicKey);
        assert(redeemScript);
        addReplayProtectionUnspentToPsbt(psbt, unspent, redeemScript);
      } else {
        const unspents = mockUnspents(walletKeys, [scriptType], BigInt(1e8), network) as WalletUnspent<bigint>[];
        unspents.forEach((unspent) => addWalletUnspentToPsbt(psbt, unspent, walletKeys, signerName, cosignerName));
      }

      // Add the outputs
      addWalletOutputToPsbt(psbt, walletKeys, getInternalChainCode('p2sh'), 0, BigInt(1e8 - 10000));
    });

    it('can go from unsigned to fully signed', async function () {
      if (scriptType === 'p2trMusig2' && signerName === 'user' && cosignerName === 'bitgo') {
        psbt.setAllInputsMusig2NonceHD(signer);
        psbt.setAllInputsMusig2NonceHD(cosigner);
      }
      assert.ok(psbt.getSignatureValidationArray(0).every((res) => !res));
      if (scriptType === 'p2shP2pk') {
        psbt.signAllInputs(signer);
      } else {
        psbt.signAllInputsHD(signer);
        psbt.signAllInputsHD(cosigner);
      }
      assert(psbt.validateSignaturesOfAllInputs());
      assert.deepStrictEqual(psbt.getSignatureValidationArray(0), signingKeys);
      psbt.finalizeAllInputs();
      const tx = psbt.extractTransaction();
      assert(tx);
    });
  });
}

getScriptTypes().forEach((t) => {
  runTest(t, 'user', 'bitgo', networks.bitcoin);
  runTest(t, 'backup', 'user', networks.bitcoin);
});
