import assert from 'node:assert/strict';

import * as utxolib from '@bitgo/utxo-lib';
import { BIP32, fixedScriptWallet } from '@bitgo/wasm-utxo';

import { Musig2Participant } from '../../../../src/transaction/fixedScript/musig2';
import {
  ReplayProtectionKeys,
  signPsbtWithMusig2ParticipantWasm,
} from '../../../../src/transaction/fixedScript/signPsbtWasm';

function getMockCoinWasm(
  keys: utxolib.bitgo.RootWalletKeys,
  network: utxolib.Network
): Musig2Participant<fixedScriptWallet.BitGoPsbt> {
  const bitgoKey = BIP32.fromBase58(keys.bitgo.toBase58());
  const networkName = utxolib.getNetworkName(network);
  assert(networkName, 'network name is required');
  return {
    async getMusig2Nonces(psbt: fixedScriptWallet.BitGoPsbt): Promise<fixedScriptWallet.BitGoPsbt> {
      psbt.generateMusig2Nonces(bitgoKey);
      // Serialize/deserialize to simulate remote response (avoids "recursive use of object" error)
      return fixedScriptWallet.BitGoPsbt.fromBytes(psbt.serialize(), networkName);
    },
  };
}

function assertSignedWasm(
  psbt: fixedScriptWallet.BitGoPsbt,
  userKey: utxolib.BIP32Interface,
  rootWalletKeys: fixedScriptWallet.IWalletKeys,
  replayProtection: ReplayProtectionKeys
): void {
  const wasmUserKey = BIP32.from(userKey);
  const parsed = psbt.parseTransactionWithWalletKeys(rootWalletKeys, { replayProtection });
  parsed.inputs.forEach((input, inputIndex) => {
    if (input.scriptType === 'p2shP2pk') {
      return;
    }
    const isValid = psbt.verifySignature(inputIndex, wasmUserKey);
    assert(isValid, `input ${inputIndex} should have valid user signature (scriptType=${input.scriptType})`);
  });
}

function toWasmWalletKeys(keys: utxolib.bitgo.RootWalletKeys): fixedScriptWallet.IWalletKeys {
  return {
    triple: [keys.user, keys.backup, keys.bitgo],
    derivationPrefixes: keys.derivationPrefixes,
  };
}

function getReplayProtectionKeys(keys: utxolib.bitgo.RootWalletKeys): ReplayProtectionKeys {
  return { publicKeys: [keys.user.publicKey] };
}

function describeSignPsbtWithMusig2Participant(acidTest: utxolib.testutil.AcidTest) {
  describe(acidTest.name, function () {
    it('should sign unsigned psbt to halfsigned', async function () {
      const networkName = utxolib.getNetworkName(acidTest.network);
      assert(networkName, 'network name is required');
      const psbt = fixedScriptWallet.BitGoPsbt.fromBytes(acidTest.createPsbt().toBuffer(), networkName);
      const wasmWalletKeys = toWasmWalletKeys(acidTest.rootWalletKeys);
      const replayProtection = getReplayProtectionKeys(acidTest.rootWalletKeys);
      const result = await signPsbtWithMusig2ParticipantWasm(
        getMockCoinWasm(acidTest.rootWalletKeys, acidTest.network),
        psbt,
        acidTest.rootWalletKeys.user,
        fixedScriptWallet.RootWalletKeys.from(acidTest.rootWalletKeys),
        {
          replayProtection,
          signingStep: undefined,
          walletId: 'test-wallet-id',
        }
      );
      assert(result instanceof fixedScriptWallet.BitGoPsbt, 'should return BitGoPsbt when not last signature');
      assertSignedWasm(result, acidTest.rootWalletKeys.user, wasmWalletKeys, replayProtection);
    });
  });
}

describe('signPsbtWithMusig2Participant', function () {
  utxolib.testutil.AcidTest.suite({ includeP2trMusig2ScriptPath: false })
    .filter((test) => test.signStage === 'unsigned')
    .forEach((test) => describeSignPsbtWithMusig2Participant(test));
});
