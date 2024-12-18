import * as utxolib from '@bitgo/utxo-lib';

import { DescriptorMap } from '../../core/descriptor';
import { findDescriptorForInput } from '../../core/descriptor/psbt/findDescriptors';

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
 *
 * @param tx - psbt to sign
 * @param descriptorMap - map of input index to descriptor
 * @param signerKeychain - key to sign with
 * @param params - onUnknownInput: 'throw' | 'skip' | 'sign'.
 *                 Determines what to do when an input is not found in the
 *                 descriptor map.
 */
export function signPsbt(
  tx: utxolib.Psbt,
  descriptorMap: DescriptorMap,
  signerKeychain: utxolib.BIP32Interface,
  params: {
    onUnknownInput: 'throw' | 'skip' | 'sign';
  }
): void {
  for (const [vin, input] of tx.data.inputs.entries()) {
    if (!findDescriptorForInput(input, descriptorMap)) {
      switch (params.onUnknownInput) {
        case 'skip':
          continue;
        case 'throw':
          throw new ErrorUnknownInput(vin);
        case 'sign':
          break;
      }
    }
    tx.signInputHD(vin, signerKeychain);
  }
}
