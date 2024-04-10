/**
 * Contains helper methods for determining if a transaction output belongs to a given BitGo wallet
 */

import { isBufferArray, Triple } from '../../types';
import { createOutputScript2of3, scriptTypes2Of3 } from '../../outputScripts';
import { UtxoPsbt } from '../../UtxoPsbt';
import { BIP32Interface } from 'bip32';
import { checkForOutput } from 'bip174/src/lib/utils';
import { PsbtOutput } from 'bip174/src/lib/interfaces';
import { getSortedRootNodes } from './RootNodes';

/**
 * Derives the appropriate BIP32 key pair for a given output.
 * It uses either tapBip32Derivation or bip32Derivation paths from the output.
 * @param bip32 - The BIP32Interface object to derive from.
 * @param output - The specific PSBT output to derive for.
 * @returns The derived BIP32 key pair if master fingerprint matches, or undefined.
 */
export function deriveKeyPairForOutput(bip32: BIP32Interface, output: PsbtOutput): BIP32Interface | undefined {
  return output.tapBip32Derivation?.length
    ? UtxoPsbt.deriveKeyPair(bip32, output.tapBip32Derivation, { ignoreY: true })
    : output.bip32Derivation?.length
    ? UtxoPsbt.deriveKeyPair(bip32, output.bip32Derivation, { ignoreY: false })
    : undefined;
}

/**
 * Determines if a specified output in a PSBT is an output of the wallet represented by the given root nodes.
 * @param psbt - The PSBT to check.
 * @param outputIndex - The index of the output to check.
 * @param rootWalletNodes - The root nodes representing the wallet.
 * @returns A boolean indicating if the output belongs to the wallet.
 */
export function isWalletOutput(psbt: UtxoPsbt, outputIndex: number, rootWalletNodes: Triple<BIP32Interface>): boolean {
  const output = checkForOutput(psbt.data.outputs, outputIndex);

  const pubKeys = rootWalletNodes.map((rootNode) => deriveKeyPairForOutput(rootNode, output)?.publicKey);

  if (!isBufferArray(pubKeys)) {
    return false;
  }

  const outputScript = psbt.getOutputScript(outputIndex);
  return scriptTypes2Of3.some((scriptType) =>
    createOutputScript2of3(pubKeys, scriptType).scriptPubKey.equals(outputScript)
  );
}

/**
 * Finds indices of all outputs in a PSBT that belong to the wallet represented by the given root nodes.
 * @param psbt - The PSBT to search through.
 * @param rootWalletNodes - The root nodes representing the wallet.
 * @returns An array of indices corresponding to wallet outputs.
 */
export function findWalletOutputIndices(psbt: UtxoPsbt, rootWalletNodes: Triple<BIP32Interface>): number[] {
  return psbt.data.outputs.flatMap((_, i) => (isWalletOutput(psbt, i, rootWalletNodes) ? [i] : []));
}

/**
 * Calculates the total amount of all wallet outputs in a PSBT for the wallet represented by the given root nodes.
 * @param psbt - The PSBT to calculate for.
 * @param rootWalletNodes - The root nodes representing the wallet.
 * @returns The total amount of wallet outputs.
 */
export function getTotalAmountOfWalletOutputs(psbt: UtxoPsbt, rootWalletNodes: Triple<BIP32Interface>): bigint {
  const indices = findWalletOutputIndices(psbt, rootWalletNodes);
  const txOutputs = psbt.txOutputs;
  return indices.reduce((sum, i) => sum + txOutputs[i].value, BigInt(0));
}

/**
 * Finds indices of all internal outputs in a PSBT, identified as outputs belonging to the wallet's root nodes within the PSBT.
 * @param psbt - The PSBT containing the wallet's root nodes as indicated by global Xpubs.
 * @returns An array of indices of internal outputs.
 */
export function findInternalOutputIndices(psbt: UtxoPsbt): number[] {
  const rootNodes = getSortedRootNodes(psbt);
  return findWalletOutputIndices(psbt, rootNodes);
}

/**
 * Calculates the total amount of all internal outputs in a PSBT, identified as outputs belonging to the wallet's root nodes within the PSBT.
 * @param psbt - The PSBT containing the wallet's root nodes as indicated by global Xpubs.
 * @returns The total amount of internal outputs.
 */
export function getTotalAmountOfInternalOutputs(psbt: UtxoPsbt): bigint {
  const rootNodes = getSortedRootNodes(psbt);
  return getTotalAmountOfWalletOutputs(psbt, rootNodes);
}
