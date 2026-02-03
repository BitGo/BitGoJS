import assert from 'assert';

import { getKeyTriple } from '@bitgo/utxo-core/testutil';
import { getDescriptorMap, mockPsbtDefaultWithDescriptorTemplate } from '@bitgo/utxo-core/testutil/descriptor';
import { Psbt } from '@bitgo/wasm-utxo';

import { signPsbt } from '../../../../src/transaction/descriptor';
import { ErrorUnknownInput } from '../../../../src/transaction/descriptor/signPsbt';
import { toWasmPsbt } from '../../../../src/wasmUtil';

function assertInputHasValidSignatures(psbt: Psbt, inputIndex: number) {
  assert(psbt.hasPartialSignatures(inputIndex));
  const partialSigs = psbt.getPartialSignatures(inputIndex);
  assert(partialSigs.length > 0);
  for (const sig of partialSigs) {
    assert(psbt.validateSignatureAtInput(inputIndex, sig.pubkey));
  }
}

describe('sign', function () {
  const psbtUnsigned = toWasmPsbt(mockPsbtDefaultWithDescriptorTemplate('Wsh2Of3'));
  const keychain = getKeyTriple('a');
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
