import assert from 'node:assert/strict';

import * as utxolib from '@bitgo/utxo-lib';
import { BIP32, fixedScriptWallet } from '@bitgo/wasm-utxo';

import { decodePsbtWith } from '../../../../src/transaction/decode';
import { Musig2Participant } from '../../../../src/transaction/fixedScript/musig2';
import { signPsbtWithMusig2ParticipantUtxolib } from '../../../../src/transaction/fixedScript/signPsbtUtxolib';
import {
  ReplayProtectionKeys,
  signPsbtWithMusig2ParticipantWasm,
} from '../../../../src/transaction/fixedScript/signPsbtWasm';
import { SdkBackend } from '../../../../src/transaction/types';

import { hasWasmUtxoSupport } from './util';

function getMockCoinUtxolib(keys: utxolib.bitgo.RootWalletKeys): Musig2Participant<utxolib.bitgo.UtxoPsbt> {
  return {
    async getMusig2Nonces(psbt: utxolib.bitgo.UtxoPsbt, walletId: string): Promise<utxolib.bitgo.UtxoPsbt> {
      psbt.setAllInputsMusig2NonceHD(keys.bitgo, { deterministic: true });
      return psbt;
    },
  };
}

function getMockCoinWasm(
  keys: utxolib.bitgo.RootWalletKeys,
  network: utxolib.Network
): Musig2Participant<fixedScriptWallet.BitGoPsbt> {
  // Convert utxolib RootWalletKeys to wasm BIP32 using base58 string
  // This ensures the private key is properly transferred
  const bitgoXprv = keys.bitgo.toBase58();
  const bitgoKey = BIP32.fromBase58(bitgoXprv);
  const networkName = utxolib.getNetworkName(network);
  assert(networkName, 'network name is required');
  return {
    async getMusig2Nonces(psbt: fixedScriptWallet.BitGoPsbt, walletId: string): Promise<fixedScriptWallet.BitGoPsbt> {
      // Generate nonces using the bitgo key
      psbt.generateMusig2Nonces(bitgoKey);
      // Serialize and deserialize to simulate remote response
      // This creates a new object so we don't get "recursive use of an object" error
      return fixedScriptWallet.BitGoPsbt.fromBytes(psbt.serialize(), networkName);
    },
  };
}

function assertSignedUtxolib(psbt: utxolib.bitgo.UtxoPsbt, userKey: utxolib.BIP32Interface): void {
  // Verify that all wallet inputs have been signed by user key
  psbt.data.inputs.forEach((input, inputIndex) => {
    const { scriptType } = utxolib.bitgo.parsePsbtInput(input);

    // Skip replay protection inputs (p2shP2pk)
    if (scriptType === 'p2shP2pk') {
      return;
    }

    // Verify user signature is present
    const isValid = psbt.validateSignaturesOfInputHD(inputIndex, userKey);
    assert(isValid, `input ${inputIndex} should have valid user signature`);
  });
}

function assertSignedWasm(
  psbt: fixedScriptWallet.BitGoPsbt,
  userKey: utxolib.BIP32Interface,
  rootWalletKeys: fixedScriptWallet.IWalletKeys,
  replayProtection: ReplayProtectionKeys
): void {
  const wasmUserKey = BIP32.from(userKey);
  const parsed = psbt.parseTransactionWithWalletKeys(rootWalletKeys, replayProtection);

  // Verify that all wallet inputs have been signed by user key
  parsed.inputs.forEach((input, inputIndex) => {
    // Skip replay protection inputs (p2shP2pk)
    if (input.scriptType === 'p2shP2pk') {
      return;
    }

    // Verify user signature is present
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
  // Replay protection inputs use the underived user public key
  return {
    publicKeys: [keys.user.publicKey],
  };
}

function describeSignPsbtWithMusig2Participant(
  acidTest: utxolib.testutil.AcidTest,
  { decodeWith }: { decodeWith: SdkBackend }
) {
  describe(`${acidTest.name} ${decodeWith}`, function () {
    it('should sign unsigned psbt to halfsigned', async function () {
      // Create unsigned PSBT
      const psbt = decodePsbtWith(acidTest.createPsbt().toBuffer(), acidTest.network, decodeWith);

      let result;
      if (decodeWith === 'utxolib') {
        assert(psbt instanceof utxolib.bitgo.UtxoPsbt, 'psbt should be a UtxoPsbt');
        result = await signPsbtWithMusig2ParticipantUtxolib(
          getMockCoinUtxolib(acidTest.rootWalletKeys),
          psbt,
          acidTest.rootWalletKeys.user,
          {
            signingStep: undefined,
            walletId: 'test-wallet-id',
          }
        );
        // Result should be a PSBT (not finalized)
        assert(result instanceof utxolib.bitgo.UtxoPsbt, 'should return UtxoPsbt when not last signature');

        assertSignedUtxolib(result, acidTest.rootWalletKeys.user);
      } else {
        assert(psbt instanceof fixedScriptWallet.BitGoPsbt, 'psbt should be a BitGoPsbt');
        const wasmWalletKeys = toWasmWalletKeys(acidTest.rootWalletKeys);
        const replayProtection = getReplayProtectionKeys(acidTest.rootWalletKeys);
        result = await signPsbtWithMusig2ParticipantWasm(
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
        // Result should be a PSBT (not finalized)
        assert(result instanceof fixedScriptWallet.BitGoPsbt, 'should return BitGoPsbt when not last signature');

        assertSignedWasm(result, acidTest.rootWalletKeys.user, wasmWalletKeys, replayProtection);
      }
    });
  });
}

describe('signPsbtWithMusig2ParticipantUtxolib', function () {
  // Create test suite with includeP2trMusig2ScriptPath set to false
  // p2trMusig2 script path inputs are signed by user and backup keys,
  // which is not the typical signing pattern and makes testing more complex
  utxolib.testutil.AcidTest.suite({ includeP2trMusig2ScriptPath: false })
    .filter((test) => test.signStage === 'unsigned')
    .forEach((test) => {
      describeSignPsbtWithMusig2Participant(test, { decodeWith: 'utxolib' });
      if (hasWasmUtxoSupport(test.network)) {
        describeSignPsbtWithMusig2Participant(test, { decodeWith: 'wasm-utxo' });
      }
    });
});
