import assert from 'assert';

import { Psbt } from '@bitgo/wasm-utxo';
import * as testutils from '@bitgo/wasm-utxo/testutils';

import { signPsbt } from '../../../../src/transaction/descriptor';
import { ErrorUnknownInput } from '../../../../src/transaction/descriptor/signPsbt';

const { getDescriptorMap, mockPsbtDefaultWithDescriptorTemplate } = testutils.descriptor;

function assertInputHasValidSignatures(psbt: Psbt, inputIndex: number) {
  assert(psbt.hasPartialSignatures(inputIndex));
  const partialSigs = psbt.getPartialSignatures(inputIndex);
  assert(partialSigs.length > 0);
  for (const sig of partialSigs) {
    assert(psbt.validateSignatureAtInput(inputIndex, sig.pubkey));
  }
}

describe('sign', function () {
  const psbtUnsigned = mockPsbtDefaultWithDescriptorTemplate('Wsh2Of3');
  const keychain = testutils.getKeyTriple('a');
  const descriptorMap = getDescriptorMap('Wsh2Of3', keychain);
  const emptyDescriptorMap = new Map();

  it('should sign a transaction', async function () {
    const psbt = Psbt.deserialize(psbtUnsigned.serialize());
    signPsbt(psbt, descriptorMap, keychain[0], { onUnknownInput: 'throw' });
    assertInputHasValidSignatures(psbt, 0);
    assertInputHasValidSignatures(psbt, 1);
  });

  it('should be sensitive to onUnknownInput', async function () {
    const psbt = Psbt.deserialize(psbtUnsigned.serialize());
    assert.throws(() => {
      signPsbt(psbt, emptyDescriptorMap, keychain[0], { onUnknownInput: 'throw' });
    }, new ErrorUnknownInput(0));
    signPsbt(psbt, emptyDescriptorMap, keychain[0], { onUnknownInput: 'skip' });
    assert(!psbt.hasPartialSignatures(0));
    signPsbt(psbt, emptyDescriptorMap, keychain[0], { onUnknownInput: 'sign' });
    assertInputHasValidSignatures(psbt, 0);
    assertInputHasValidSignatures(psbt, 1);
  });
});
