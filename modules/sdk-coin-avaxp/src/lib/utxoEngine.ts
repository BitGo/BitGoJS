import { DecodedUtxoObj, SECP256K1_Transfer_Output } from './iface';
import { BN, Buffer as BufferAvax } from 'avalanche';
import { Signature, Input } from 'avalanche/dist/common';
import utils from './utils';
import { BuildTransactionError } from '@bitgo/sdk-core';

export interface InputData {
  amount: BN;
  txidBuf: BufferAvax;
  outputIdx: BufferAvax;
  signaturesIdx: number[];
  signatures: Signature[];
}

/**
 * Convert Utxos into inputs data. Input Objects changes regarding chains. This method return a plain object to be mapped late in chain input.
 * Sender is a list of owners address and utxo address must contains all of them.
 * Signers is a list of sender cut it in threshold size. Firsts senders are the signers.
 *
 * Output always get reordered we want to make sure we can always add signatures in the correct location.
 * Signatures array store signers address of the expected signature. Tx sign replace the address for the signature.
 * So the location of the signatures is guaranteed.
 *
 * To find the correct location for the signature, we use the output's addresses to create the signatureIdx in the order that we desire
 * 0: user key, 1: hsm key, 2: recovery key
 *
 * @param utxos
 * @param sender array of addresses
 * @param threshold number of signatures required
 * @return {
 *   inputs: InputData[];
 *   amount: BN;
 * } as total amount and inputs with signatures as signers address to be replaced.
 */
export function utxoToInput(
  utxos: DecodedUtxoObj[],
  sender: BufferAvax[],
  threshold = 2
): {
  inputs: InputData[];
  amount: BN;
} {
  // amount spent so far
  let currentTotal: BN = new BN(0);

  const inputs = utxos
    .filter((utxo) => utxo && utxo.outputID === SECP256K1_Transfer_Output)
    .map((utxo) => {
      // validate the utxos
      const utxoAddresses: BufferAvax[] = utxo.addresses.map((a) => utils.parseAddress(a));
      const addressesIndex = sender.map((a) => utxoAddresses.findIndex((u) => a.equals(u)));
      // addressesIndex should never have a mismatch
      if (addressesIndex.includes(-1)) {
        throw new BuildTransactionError('Addresses are inconsistent: ' + utxo.txid);
      }
      if (utxo.threshold !== threshold) {
        throw new BuildTransactionError('Threshold is inconsistent');
      }

      const txidBuf: BufferAvax = utils.binTools.cb58Decode(utxo.txid);
      const amount: BN = new BN(utxo.amount);
      const outputIdx: BufferAvax = utils.outputidxNumberToBuffer(utxo.outputidx);

      currentTotal = currentTotal.add(amount);

      const signers = addressesIndex
        .slice(0, threshold)
        .map((utxoIndex, senderIndex) => ({ utxoIndex, senderIndex }))
        .sort((a, b) => a.utxoIndex - b.utxoIndex);
      const signatures = signers.map(({ senderIndex }) =>
        // TODO(BG-56700):  Improve canSign by check in addresses in empty credentials match signer
        // HSM require empty signature.
        utils.createSig(senderIndex === 1 ? '' : sender[senderIndex].toString('hex'))
      );
      const signaturesIdx = signers.map(({ utxoIndex }) => utxoIndex);

      return { amount, txidBuf, outputIdx, signaturesIdx, signatures };
    });

  return { inputs, amount: currentTotal };
}

/**
 * Create inputs by mapping {@see utxoEngine.utxoToInput} result.
 * Reorder sender to handle recover signer.
 * TransferableInput is a EVM Tx.
 * @return {
 *     inputs: TransferableInput[];
 *     credentials: Credential[];
 *     amount: BN;
 *   } where amount is the sum of inputs amount and credentials has signer address to be replaced with correct signature.
 * @protected
 *
 */
export function createInputs<T, I extends Input, C>(
  TransferableClass: new (txid?: BufferAvax, outputidx?: BufferAvax, assetID?: BufferAvax, input?: I) => T,
  InputClase: new (amount: BN) => I,
  CredentialClass: (credid: number, ...args: any[]) => C
): (
  assetID: BufferAvax,
  utxos: DecodedUtxoObj[],
  sender: BufferAvax[],
  threshold?: number
) => { amount: BN; inputs: T[]; credentials: C[] } {
  return (
    assetID: BufferAvax,
    utxos: DecodedUtxoObj[],
    sender: BufferAvax[],
    threshold = 2
  ): { amount: BN; inputs: T[]; credentials: C[] } => {
    const { inputs, amount } = utxoToInput(utxos, sender, threshold);
    const result: {
      inputs: T[];
      credentials: C[];
    } = { inputs: [], credentials: [] };

    inputs.forEach((input) => {
      const secpTransferInput = new InputClase(input.amount);
      input.signaturesIdx.forEach((signatureIdx, arrayIndex) =>
        secpTransferInput.addSignatureIdx(signatureIdx, sender[arrayIndex])
      );
      result.inputs.push(new TransferableClass(input.txidBuf, input.outputIdx, assetID, secpTransferInput));

      result.credentials.push(CredentialClass(secpTransferInput.getCredentialID(), input.signatures));
    });

    return { ...result, amount };
  };
}
