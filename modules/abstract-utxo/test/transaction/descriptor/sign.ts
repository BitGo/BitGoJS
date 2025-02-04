import assert from 'assert';

import { getKeyTriple } from '@bitgo/utxo-core/testutil';
import { getDescriptorMap, mockPsbtDefaultWithDescriptorTemplate } from '@bitgo/utxo-core/testutil/descriptor';

import { signPsbt } from '../../../src/transaction/descriptor';
import { ErrorUnknownInput } from '../../../src/transaction/descriptor/signPsbt';

describe('sign', function () {
  const psbtUnsigned = mockPsbtDefaultWithDescriptorTemplate('Wsh2Of3');
  const keychain = getKeyTriple('a');
  const descriptorMap = getDescriptorMap('Wsh2Of3', keychain);
  const emptyDescriptorMap = new Map();

  it('should sign a transaction', async function () {
    const psbt = psbtUnsigned.clone();
    signPsbt(psbt, descriptorMap, keychain[0], { onUnknownInput: 'throw' });
    assert(psbt.validateSignaturesOfAllInputs());
  });

  it('should be sensitive to onUnknownInput', async function () {
    const psbt = psbtUnsigned.clone();
    assert.throws(() => {
      signPsbt(psbt, emptyDescriptorMap, keychain[0], { onUnknownInput: 'throw' });
    }, new ErrorUnknownInput(0));
    signPsbt(psbt, emptyDescriptorMap, keychain[0], { onUnknownInput: 'skip' });
    assert(psbt.data.inputs[0].partialSig === undefined);
    signPsbt(psbt, emptyDescriptorMap, keychain[0], { onUnknownInput: 'sign' });
    assert(psbt.validateSignaturesOfAllInputs());
  });
});
