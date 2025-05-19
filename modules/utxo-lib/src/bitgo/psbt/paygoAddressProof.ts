import * as assert from 'assert';
import * as bitcoinMessage from 'bitcoinjs-message';
import { crypto } from 'bitcoinjs-lib';

import { address } from '../..';
import { networks } from '../../networks';
import { toBase58Check } from '../../address';
import { getPsbtOutputProprietaryKeyVals, ProprietaryKeySubtype, PSBT_PROPRIETARY_IDENTIFIER } from '../PsbtUtil';
import { UtxoPsbt } from '../UtxoPsbt';

/** The function consumes the signature as a parameter and adds the PayGo address to the 
 * PSBT output at the output index where the signature is of the format:
 * 0x18Bitcoin Signed Message:\n<varint_length><ENTROPY><ADDRESS><UUID> signed by
 * the HSM beforehand.
 *
 * @param psbt - PSBT that we need to encode our paygo address into
 * @param outputIndex - the index of the address in our output
 * @param sig - the signature that we want to encode
 */
export function addPaygoAddressProof(psbt: UtxoPsbt, outputIndex: number, sig: Buffer, pub: Buffer): void {
  psbt.addProprietaryKeyValToOutput(outputIndex, {
    key: {
      identifier: PSBT_PROPRIETARY_IDENTIFIER,
      subtype: ProprietaryKeySubtype.PAYGO_ADDRESS_ATTESTATION_PROOF,
      keydata: Buffer.from(pub)
    },
    value: sig,
  });
}

/** Verify the paygo address signature is valid using BitGoJs statics
 *
 * @param psbt - PSBT we want to verify that the paygo address is in
 * @param outputIndex - we have the output index that address is in
 * @param pub - The public key that we want to verify the proof with
 * @returns
 */
export function verifyPaygoAddressProof(psbt: UtxoPsbt, outputIndex: number, pub: Buffer): void {
  const stored = psbt.getOutputProprietaryKeyVals(outputIndex, {
    identifier: PSBT_PROPRIETARY_IDENTIFIER,
    subtype: ProprietaryKeySubtype.PAYGO_ADDRESS_ATTESTATION_PROOF,
  });
  if (!stored) {
    throw new Error('No address proof');
  }

  // assert stored length is 0 or 1
  if (stored.length === 0) {
    throw new Error(`There is no paygo address proof encoded in the PSBT at output ${outputIndex}.`);
  } else if (stored.length > 1) {
    throw new Error('There are multiple paygo address proofs encoded in the PSBT. Something went wrong.');
  }

  const signature = stored[0].value;
  // It doesn't matter that this is bitcoin or not, we just need to convert the public key buffer into an address format
  // for the verification
  const messageToVerify = toBase58Check(crypto.hash160(pub), networks.bitcoin.pubKeyHash, networks.bitcoin);

  // TODO: need to figure out what the message is in this context
  // Are we verifying the address of the PayGo? we can call getAddressFromScript given output index.
  if (!bitcoinMessage.verify(message, messageToVerify, signature)) {
    throw new Error('Cannot verify the paygo address signature with the provided pubkey.');
  }

  const out = psbt.txOutputs[outputIndex];
  assert(out);
  const addressFromOutput = address.fromOutputScript(out.script, psbt.network);
  const addressFromProof = extractAddressFromPayGoAttestationProof(message, addressFromOutput.length);
  
  if (addressFromProof !== addressFromOutput) {
    throw new Error(`The address from the output (${addressFromOutput}) does not match the address that is in the proof (${addressFromProof}).`)
  }
}

/** Get the output index of the paygo output if there is one. It does this by
 * checking if the metadata is on one of the outputs of the PSBT. If there is
 * no paygo output, return undefined
 *
 * @param psbt
 * @returns number - the index of the output address
 */
export function getPaygoAddressProofOutputIndex(psbt: UtxoPsbt): number | undefined {
  const res = psbt.data.outputs.flatMap((output, outputIndex) => {
    const proprietaryKeyVals = getPsbtOutputProprietaryKeyVals(output, {
      identifier: PSBT_PROPRIETARY_IDENTIFIER,
      subtype: ProprietaryKeySubtype.PAYGO_ADDRESS_ATTESTATION_PROOF,
    });

    return proprietaryKeyVals.length === 0 ? [] : [outputIndex];
  });

  return res.length === 0 ? undefined : res[0];
}

export function psbtOutputIncludesPaygoAddressProof(psbt: UtxoPsbt): boolean {
  return getPaygoAddressProofOutputIndex(psbt) !== undefined;
}
