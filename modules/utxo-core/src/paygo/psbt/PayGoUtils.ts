import * as utxolib from '@bitgo/utxo-lib';
import * as bitcoinMessage from 'bitcoinjs-message';
import { checkForOutput } from 'bip174/src/lib/utils';

import { extractAddressBufferFromPayGoAttestationProof } from '../ExtractAddressPayGoAttestation';

/** The function consumes the signature as a parameter and adds the PayGo address to the
 * PSBT output at the output index where the signature is of the format:
 * 0x18Bitcoin Signed Message:\n<varint_length><ENTROPY><ADDRESS><UUID> signed by
 * the HSM beforehand.
 *
 * @param psbt - PSBT that we need to encode our paygo address into
 * @param outputIndex - the index of the address in our output
 * @param sig - the signature that we want to encode
 */
export function addPaygoAddressProof(
  psbt: utxolib.bitgo.UtxoPsbt,
  outputIndex: number,
  sig: Buffer,
  pub: Buffer
): void {
  utxolib.bitgo.addProprietaryKeyValuesFromUnknownKeyValues(psbt, 'output', outputIndex, {
    key: {
      identifier: utxolib.bitgo.PSBT_PROPRIETARY_IDENTIFIER,
      subtype: utxolib.bitgo.ProprietaryKeySubtype.PAYGO_ADDRESS_ATTESTATION_PROOF,
      keydata: pub,
    },
    value: sig,
  });
}

/** Verify the paygo address signature is valid using BitGoJs statics
 *
 * @param psbt - PSBT we want to verify that the paygo address is in
 * @param outputIndex - we have the output index that address is in
 * @param pub - The public key that we want to verify the proof with
 * @param message - The message we want to verify corresponding to sig
 * @returns
 */
export function verifyPaygoAddressProof(
  psbt: utxolib.bitgo.UtxoPsbt,
  outputIndex: number,
  message: Buffer,
  attestationPubKey: Buffer
): void {
  const psbtOutputs = checkForOutput(psbt.data.outputs, outputIndex);
  const stored = utxolib.bitgo.getProprietaryKeyValuesFromUnknownKeyValues(psbtOutputs, {
    identifier: utxolib.bitgo.PSBT_PROPRIETARY_IDENTIFIER,
    subtype: utxolib.bitgo.ProprietaryKeySubtype.PAYGO_ADDRESS_ATTESTATION_PROOF,
  });
  if (!stored) {
    throw new Error(`No address proof.`);
  }

  // assert stored length is 0 or 1
  if (stored.length === 0) {
    throw new Error(`There is no paygo address proof encoded in the PSBT at output ${outputIndex}.`);
  } else if (stored.length > 1) {
    throw new Error('There are multiple paygo address proofs encoded in the PSBT. Something went wrong.');
  }

  const signature = stored[0].value;
  const pub = stored[0].key.keydata;

  // Check that the keydata pubkey is the same as the one we are verifying against
  if (Buffer.compare(pub, attestationPubKey) !== 0) {
    throw new Error('The public key in the PSBT does not match the provided public key.');
  }

  // It doesn't matter that this is bitcoin or not, we just need to convert the public key buffer into an address format
  // for the verification
  const messageToVerify = utxolib.address.toBase58Check(
    utxolib.crypto.hash160(pub),
    utxolib.networks.bitcoin.pubKeyHash,
    utxolib.networks.bitcoin
  );

  if (!bitcoinMessage.verify(message, messageToVerify, signature, utxolib.networks.bitcoin.messagePrefix)) {
    throw new Error('Cannot verify the paygo address signature with the provided pubkey.');
  }
  // We should be verifying the address that was encoded into our message.
  const addressFromProof = extractAddressBufferFromPayGoAttestationProof(message).toString();

  // Check that the address from the proof matches what is in the PSBT
  const txOutputs = psbt.txOutputs;
  if (outputIndex >= txOutputs.length) {
    throw new Error(`Output index ${outputIndex} is out of bounds for PSBT outputs.`);
  }
  const output = txOutputs[outputIndex];
  const addressFromOutput = utxolib.address.fromOutputScript(output.script, psbt.network);

  if (addressFromProof !== addressFromOutput) {
    throw new Error(
      `The address from the output (${addressFromOutput}) does not match the address that is in the proof (${addressFromProof}).`
    );
  }
}

/** Get the output index of the paygo output if there is one. It does this by
 * checking if the metadata is on one of the outputs of the PSBT. If there is
 * no paygo output, return undefined
 *
 * @param psbt
 * @returns number - the index of the output address
 */
export function getPaygoAddressProofOutputIndex(psbt: utxolib.bitgo.UtxoPsbt): number | undefined {
  const res = psbt.data.outputs.flatMap((output, outputIndex) => {
    const proprietaryKeyVals = utxolib.bitgo.getPsbtOutputProprietaryKeyVals(output, {
      identifier: utxolib.bitgo.PSBT_PROPRIETARY_IDENTIFIER,
      subtype: utxolib.bitgo.ProprietaryKeySubtype.PAYGO_ADDRESS_ATTESTATION_PROOF,
    });

    if (proprietaryKeyVals.length > 1) {
      throw new Error(`There are multiple PayGo addresses in the PSBT output ${outputIndex}.`);
    }

    return proprietaryKeyVals.length === 0 ? [] : [outputIndex];
  });

  return res.length === 0 ? undefined : res[0];
}

export function psbtOutputIncludesPaygoAddressProof(psbt: utxolib.bitgo.UtxoPsbt): boolean {
  return getPaygoAddressProofOutputIndex(psbt) !== undefined;
}
