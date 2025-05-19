import * as bitcoinMessage from 'bitcoinjs-message';
import { crypto } from 'bitcoinjs-lib';
import { ProprietaryKey } from 'bip174/src/lib/proprietaryKeyVal';

import { networks } from '../../networks';
import { toBase58Check } from '../../address';
import { getPsbtOutputProprietaryKeyVals, ProprietaryKeySubtype, PSBT_PROPRIETARY_IDENTIFIER } from '../PsbtUtil';
import { UtxoPsbt } from '../UtxoPsbt';

export const PayGoAddressProofKey: ProprietaryKey = {
  identifier: PSBT_PROPRIETARY_IDENTIFIER,
  subtype: ProprietaryKeySubtype.PAYGO_ADDRESS_PROOF,
  // Is there a better way to not provide a pubkey?
  keydata: Buffer.from([]),
};

/**
 *
 * @param psbt - PSBT that we need to encode our paygo address into
 * @param inputIndex - the index of the address in our output
 * @param sig - the signature that we want to encode
 */
export function addPaygoAddressProof(psbt: UtxoPsbt, inputIndex: number, sig: Buffer): void {
  psbt.addProprietaryKeyValToInput(inputIndex, {
    key: PayGoAddressProofKey,
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
  const stored = psbt.getProprietaryKeyVals(outputIndex, {
    identifier: PSBT_PROPRIETARY_IDENTIFIER,
    subtype: ProprietaryKeySubtype.PAYGO_ADDRESS_PROOF,
  });
  if (!stored) {
    throw new Error('No address proof');
  }

  // assert stored length is 0 or 1
  if (stored.length === 0) {
    throw new Error('There is no paygo address proof encoded in the PSBT.');
  } else if (stored.length > 1) {
    throw new Error('There are multiple paygo address proofs encoded in the PSBT. Something went wrong.');
  }

  const signature = stored[0].value;
  // It doesn't matter that this is bitcoin or not, we just need to convert the public key buffer into an address format
  // for the verification
  const verifyingAddress = toBase58Check(crypto.hash160(pub), networks.bitcoin.pubKeyHash, networks.bitcoin);

  // TODO: need to figure out what the message is in this context
  if (!bitcoinMessage.verify(message, verifyingAddress, signature)) {
    throw new Error('Cannot verify the paygo address signature with the provided pubkey.');
  }
}

/** Get the output index of the paygo output if there is one. It does this by
 * checking if the metadata is on one of the outputs of the PSBT. If there is
 * no paygo output, return undefined
 *
 * @param psbt
 * @returns number - the index of the output address
 */
export function getPaygoAddressProofIndex(psbt: UtxoPsbt): number | undefined {
  const res = psbt.data.outputs.flatMap((output, outputIndex) => {
    const proprietaryKeyVals = getPsbtOutputProprietaryKeyVals(output, {
      identifier: PSBT_PROPRIETARY_IDENTIFIER,
      subtype: ProprietaryKeySubtype.PAYGO_ADDRESS_PROOF,
    });

    return proprietaryKeyVals.length === 0 ? [] : [outputIndex];
  });

  return res.length === 0 ? undefined : res[0];
}

export function psbtIncludesPaygoAddressProof(psbt: UtxoPsbt): boolean {
  return getPaygoAddressProofIndex(psbt) !== undefined;
}
