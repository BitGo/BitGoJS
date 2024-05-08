import { DecodedUtxoObj, SECP256K1_Transfer_Output } from './iface';
import { BN, Buffer as BufferAvax } from 'avalanche';
import { Signature } from 'avalanche/dist/common';
import utils from './utils';
import { BuildTransactionError } from '@bitgo/sdk-core';
import { StandardAmountInput, StandardTransferableInput } from 'avalanche/dist/common/input';
import { avaxSerial } from '@bitgo-forks/avalanchejs';

export interface InputData {
  amount: BN;
  txidBuf: BufferAvax;
  outputIdx: BufferAvax;
  signaturesIdx: number[];
  signatures: Signature[];
}

/**
 * Inputs can be controlled but outputs get reordered in transactions
 * In order to make sure that the mapping is always correct we create an addressIndex which matches to the appropriate
 * signatureIdx
 * @param {StandardTransferableInput[]} utxos as transaction ins.
 * @returns the list of UTXOs
 */
export function deprecatedRecoverUtxos(utxos: StandardTransferableInput[]): DecodedUtxoObj[] {
  return utxos.map((utxo) => {
    const secpInput = utxo.getInput() as StandardAmountInput;

    // use the same addressesIndex as existing ones in the inputs
    const addressesIndex: number[] = secpInput.getSigIdxs().map((s) => s.toBuffer().readUInt32BE(0));

    return {
      outputID: SECP256K1_Transfer_Output,
      outputidx: utils.outputidxBufferToNumber(utxo.getOutputIdx()),
      txid: utils.cb58Encode(utxo.getTxID()),
      amount: secpInput.getAmount().toString(),
      threshold: addressesIndex.length,
      addresses: [], // this is empty since the inputs from deserialized transaction don't contain addresses
      addressesIndex,
    };
  });
}

/**
 * Inputs can be controlled but outputs get reordered in transactions
 * In order to make sure that the mapping is always correct we create an addressIndex which matches to the appropriate
 * signatureIdx
 * @param {avaxSerial.TransferableInput[]} utxos as transaction ins.
 * @returns the list of UTXOs
 */
export function recoverUtxos(utxos: avaxSerial.TransferableInput[]): DecodedUtxoObj[] {
  return utxos.map((utxo) => {
    const input = utxo.input;

    // use the same addressesIndex as existing ones in the inputs
    const addressesIndex: number[] = utxo.sigIndicies();

    return {
      outputID: SECP256K1_Transfer_Output,
      outputidx: utxo.utxoID.outputIdx.value().toString(),
      txid: utxo.utxoID.txID.value(),
      amount: input.amount().toString(),
      threshold: addressesIndex.length,
      addresses: [], // this is empty since the inputs from deserialized transaction don't contain addresses
      addressesIndex,
    };
  });
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

      const txidBuf: BufferAvax = utils.cb58Decode(utxo.txid);
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
        utils.createSig(senderIndex == 1 ? '' : sender[senderIndex].toString('hex'))
      );
      const signaturesIdx = signers.map(({ utxoIndex }) => utxoIndex);

      return { amount, txidBuf, outputIdx, signaturesIdx, signatures };
    });

  return { inputs, amount: currentTotal };
}
