import assert from 'node:assert/strict';

import * as utxolib from '@bitgo/utxo-lib';

import { Musig2Participant, signPsbtWithMusig2Participant } from '../../../../src/transaction/fixedScript/signPsbt';

function describeSignPsbtWithMusig2Participant(acidTest: utxolib.testutil.AcidTest) {
  describe(`${acidTest.name}`, function () {
    it('should sign unsigned psbt to halfsigned', async function () {
      // Create unsigned PSBT
      const psbt = acidTest.createPsbt();

      // Create mock Musig2Participant that sets BitGo nonces
      const mockCoin: Musig2Participant = {
        async getMusig2Nonces(psbt: utxolib.bitgo.UtxoPsbt, walletId: string): Promise<utxolib.bitgo.UtxoPsbt> {
          psbt.setAllInputsMusig2NonceHD(acidTest.rootWalletKeys.bitgo, { deterministic: true });
          return psbt;
        },
      };

      // Sign with user key through signPsbtWithMusig2Participant
      const result = await signPsbtWithMusig2Participant(mockCoin, psbt, acidTest.rootWalletKeys.user, {
        isLastSignature: false,
        signingStep: undefined,
        walletId: 'test-wallet-id',
      });

      // Result should be a PSBT (not finalized)
      assert(result instanceof utxolib.bitgo.UtxoPsbt, 'should return UtxoPsbt when not last signature');

      // Verify that all wallet inputs have been signed by user key
      result.data.inputs.forEach((input, inputIndex) => {
        const { scriptType } = utxolib.bitgo.parsePsbtInput(input);

        // Skip replay protection inputs (p2shP2pk)
        if (scriptType === 'p2shP2pk') {
          return;
        }

        // Verify user signature is present
        const isValid = result.validateSignaturesOfInputHD(inputIndex, acidTest.rootWalletKeys.user);
        assert(isValid, `input ${inputIndex} should have valid user signature`);
      });
    });
  });
}

describe('signPsbtWithMusig2Participant', function () {
  // Create test suite with includeP2trMusig2ScriptPath set to false
  // p2trMusig2 script path inputs are signed by user and backup keys,
  // which is not the typical signing pattern and makes testing more complex
  utxolib.testutil.AcidTest.suite({ includeP2trMusig2ScriptPath: false })
    .filter((test) => test.signStage === 'unsigned')
    .forEach((test) => {
      describeSignPsbtWithMusig2Participant(test);
    });
});
