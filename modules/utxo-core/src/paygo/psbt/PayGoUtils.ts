import * as utxolib from '@bitgo/utxo-lib';
import { checkForOutput } from 'bip174/src/lib/utils';

import { verifyMessage } from '../../bip32utils';

import {
  ErrorMultiplePayGoProof,
  ErrorMultiplePayGoProofAtPsbtIndex,
  ErrorNoPayGoProof,
  ErrorOutputIndexOutOfBounds,
  ErrorPayGoAddressProofFailedVerification,
} from './Errors';

const NILLUUID = '00000000-0000-0000-0000-000000000000';

/** This function adds the entropy and signature into the PSBT output unknown key vals.
 * We store the entropy so that we reconstruct the message <ENTROPY><ADDRESS><UUID>
 * to later verify.
 *
 * @param psbt - PSBT that we need to encode our paygo address into
 * @param outputIndex - the index of the address in our output
 * @param sig - the signature that we want to encode
 */
export function addPayGoAddressProof(
  psbt: utxolib.bitgo.UtxoPsbt,
  outputIndex: number,
  sig: Buffer,
  entropy: Buffer
): void {
  utxolib.bitgo.addProprietaryKeyValuesFromUnknownKeyValues(psbt, 'output', outputIndex, {
    key: {
      identifier: utxolib.bitgo.PSBT_PROPRIETARY_IDENTIFIER,
      subtype: utxolib.bitgo.ProprietaryKeySubtype.PAYGO_ADDRESS_ATTESTATION_PROOF,
      keydata: entropy,
    },
    value: sig,
  });
}

/** Verify the paygo address signature is valid using verification pub key.
 *
 * @param psbt - PSBT we want to verify that the paygo address is in
 * @param outputIndex - we have the output index that address is in
 * @param uuid
 * @returns
 */
export function verifyPayGoAddressProof(
  psbt: utxolib.bitgo.UtxoPsbt,
  outputIndex: number,
  verificationPubkey: Buffer
): void {
  const psbtOutputs = checkForOutput(psbt.data.outputs, outputIndex);
  const stored = utxolib.bitgo.getProprietaryKeyValuesFromUnknownKeyValues(psbtOutputs, {
    identifier: utxolib.bitgo.PSBT_PROPRIETARY_IDENTIFIER,
    subtype: utxolib.bitgo.ProprietaryKeySubtype.PAYGO_ADDRESS_ATTESTATION_PROOF,
  });

  // assert stored length is 0 or 1
  if (stored.length === 0) {
    throw new ErrorNoPayGoProof(outputIndex);
  } else if (stored.length > 1) {
    throw new ErrorMultiplePayGoProof();
  }

  // We get the signature and entropy from our PSBT unknown key vals
  const signature = stored[0].value;
  const entropy = stored[0].key.keydata;

  // Get the the PayGo address from the txOutputs
  const txOutputs = psbt.txOutputs;
  if (outputIndex >= txOutputs.length) {
    throw new ErrorOutputIndexOutOfBounds(outputIndex);
  }
  const output = txOutputs[outputIndex];
  const addressFromOutput = utxolib.address.fromOutputScript(output.script, psbt.network);

  // We construct our message <ENTROPY><ADDRESS><UUID>
  const message = createPayGoAttestationBuffer(addressFromOutput, entropy);

  if (!verifyMessage(message.toString(), verificationPubkey, signature, utxolib.networks.bitcoin)) {
    throw new ErrorPayGoAddressProofFailedVerification();
  }
}

/** Get the output index of the paygo output if there is one. It does this by
 * checking if the metadata is on one of the outputs of the PSBT. If there is
 * no paygo output, return undefined
 *
 * @param psbt
 * @returns number - the index of the output address
 */
export function getPayGoAddressProofOutputIndex(psbt: utxolib.bitgo.UtxoPsbt): number | undefined {
  const res = psbt.data.outputs.flatMap((output, outputIndex) => {
    const proprietaryKeyVals = utxolib.bitgo.getPsbtOutputProprietaryKeyVals(output, {
      identifier: utxolib.bitgo.PSBT_PROPRIETARY_IDENTIFIER,
      subtype: utxolib.bitgo.ProprietaryKeySubtype.PAYGO_ADDRESS_ATTESTATION_PROOF,
    });

    if (proprietaryKeyVals.length > 1) {
      throw new ErrorMultiplePayGoProofAtPsbtIndex(outputIndex);
    }

    return proprietaryKeyVals.length === 0 ? [] : [outputIndex];
  });

  return res.length === 0 ? undefined : res[0];
}

export function psbtOutputIncludesPaygoAddressProof(psbt: utxolib.bitgo.UtxoPsbt): boolean {
  return getPayGoAddressProofOutputIndex(psbt) !== undefined;
}

/** This function reconstructs the proof <ENTROPY><ADDRESS><UUID>
 * given the address and entropy.
 *
 * @param address
 * @param entropy
 * @returns
 */
export function createPayGoAttestationBuffer(address: string, entropy: Buffer): Buffer {
  const addressBuffer = Buffer.from(address);
  return Buffer.concat([entropy, addressBuffer, Buffer.from(NILLUUID)]);
}
