import assert from 'node:assert/strict';

import * as utxolib from '@bitgo/utxo-lib';

import { signAndVerifyPsbt } from '../../../../src/transaction/fixedScript/signPsbt';

function describeSignAndVerifyPsbt(acidTest: utxolib.testutil.AcidTest) {
  describe(`${acidTest.name}`, function () {
    it('should sign unsigned psbt to halfsigned', function () {
      // Create unsigned PSBT
      const psbt = acidTest.createPsbt();

      // Set musig2 nonces for taproot inputs before signing
      const sessionId = Buffer.alloc(32);
      psbt.setAllInputsMusig2NonceHD(acidTest.rootWalletKeys.user, { sessionId });
      psbt.setAllInputsMusig2NonceHD(acidTest.rootWalletKeys.bitgo, { deterministic: true });

      // Sign with user key
      const result = signAndVerifyPsbt(psbt, acidTest.rootWalletKeys.user, {
        isLastSignature: false,
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

describe('signAndVerifyPsbt', function () {
  // Create test suite with includeP2trMusig2ScriptPath set to false
  // p2trMusig2 script path inputs are signed by user and backup keys,
  // which is not the typical signing pattern and makes testing more complex
  utxolib.testutil.AcidTest.suite({ includeP2trMusig2ScriptPath: false })
    .filter((test) => test.signStage === 'unsigned')
    .forEach((test) => {
      describeSignAndVerifyPsbt(test);
    });
});
