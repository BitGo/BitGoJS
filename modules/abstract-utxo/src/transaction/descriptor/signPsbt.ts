import { Psbt, descriptorWallet } from '@bitgo/wasm-utxo';

import type { SignerKey } from '../../wasmUtil';

export class ErrorUnknownInput extends Error {
  constructor(public vin: number) {
    super(`missing descriptor for input ${vin}`);
  }
}

/**
 * Sign a PSBT with the given keychain.
 *
 * Checks the descriptor map for each input in the PSBT. If the input is not
 * found in the descriptor map, the behavior is determined by the `onUnknownInput`
 * parameter.
 *
 * @param psbt - psbt to sign
 * @param descriptorMap - map of descriptor name to descriptor
 * @param signerKey - key to sign with (BIP32 or ECPair)
 * @param params - onUnknownInput: 'throw' | 'skip' | 'sign'.
 *                 Determines what to do when an input is not found in the
 *                 descriptor map.
 */
export function signPsbt(
  psbt: Psbt,
  descriptorMap: descriptorWallet.DescriptorMap,
  signerKey: SignerKey,
  params: {
    onUnknownInput: 'throw' | 'skip' | 'sign';
  }
): void {
  const inputs = psbt.getInputs();
  const unknownInputs = inputs
    .map((input, vin) => ({ input, vin }))
    .filter(({ input }) => !descriptorWallet.findDescriptorForInput(input, descriptorMap));

  if (unknownInputs.length > 0) {
    switch (params.onUnknownInput) {
      case 'skip':
        return;
      case 'throw':
        throw new ErrorUnknownInput(unknownInputs[0].vin);
      case 'sign':
        break;
    }
  }
  descriptorWallet.signWithKey(psbt, signerKey);
}
