/**
 * Contains helper methods for getting and sorting root nodes from a PSBT.
 */

import * as assert from 'assert';
import * as bs58check from 'bs58check';

import { UtxoPsbt } from '../../UtxoPsbt';
import { isTriple, Triple } from '../../types';
import { BIP32Factory, BIP32Interface } from 'bip32';
import { ecc as eccLib } from '../../../noble_ecc';
import { ParsedScriptType2Of3 } from '../../parseInput';
import { Network } from '../../../networks';
import { createOutputScript2of3 } from '../../outputScripts';
import { PsbtInput } from 'bip174/src/lib/interfaces';
import { createTransactionFromBuffer } from '../../transaction';
import { getPsbtInputScriptType, toScriptType2Of3s } from '../Psbt';

/**
 * Error thrown when no multi-sig input is found in a PSBT.
 * */
export class ErrorNoMultiSigInputFound extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Retrieves unsorted root BIP32Interface nodes from a PSBT if available.
 * @param psbt - The PSBT from which to extract the global Xpubs.
 * @returns An array of BIP32Interface objects or undefined if not available.
 */
export function getUnsortedRootNodes(psbt: UtxoPsbt): Triple<BIP32Interface> | undefined {
  const bip32s = psbt.data.globalMap.globalXpub?.map((xpub) =>
    BIP32Factory(eccLib).fromBase58(bs58check.encode(xpub.extendedPubkey))
  );
  assert(!bip32s || isTriple(bip32s), `Invalid globalXpubs in PSBT. Expected 3 or none. Got ${bip32s?.length}`);
  return bip32s;
}

/**
 * Determines if the given public keys' permutation matches a specified script.
 * @param params - Object containing public keys, permutation, script public key, script type, and network.
 * @returns A boolean indicating if the permutation matches the script.
 */
function matchesScript({
  pubKeys,
  perm,
  scriptPubKey,
  parsedScriptType,
  network,
}: {
  pubKeys: Buffer[];
  perm: Triple<number>;
  scriptPubKey: Buffer;
  parsedScriptType: ParsedScriptType2Of3;
  network: Network;
}): boolean {
  const pubKeysPerm: Triple<Buffer> = [pubKeys[perm[0]], pubKeys[perm[1]], pubKeys[perm[2]]];
  const scriptTypes = toScriptType2Of3s(parsedScriptType);
  return scriptTypes.some((scriptType) =>
    createOutputScript2of3(pubKeysPerm, scriptType, network).scriptPubKey.equals(scriptPubKey)
  );
}

/**
 * Finds the correct order of public keys to match a given script.
 * @param pubKeys - Array of public keys involved in the script.
 * @param scriptPubKey - The script public key to match against.
 * @param parsedScriptType - The parsed script type.
 * @param network - Bitcoin network.
 * @returns The order of public keys that match the script.
 */
function findSortOrderOfPubKeys(
  pubKeys: Triple<Buffer>,
  scriptPubKey: Buffer,
  parsedScriptType: ParsedScriptType2Of3,
  network: Network
): Triple<number> {
  const permutations: Array<Triple<number>> = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ];

  const order = permutations.find((perm) => matchesScript({ pubKeys, perm, scriptPubKey, parsedScriptType, network }));
  assert(order, 'Could not find sort order of multi sig public keys');
  return order;
}

/**
 * Extracts multi-sig input data, including script type, script public key, and derivation path, from the first relevant PSBT input.
 * @param psbt - The PSBT to extract data from.
 * @returns An object containing the parsed script type, script public key, and derivation path.
 */
function getFirstMultiSigInputData(psbt: UtxoPsbt): {
  parsedScriptType: ParsedScriptType2Of3;
  scriptPubKey: Buffer;
  derivationPath: string;
} {
  function getScriptPubKey(input: PsbtInput, prevOutIndex: number) {
    const scriptPubKey =
      input.witnessUtxo?.script ??
      (input.nonWitnessUtxo
        ? createTransactionFromBuffer(input.nonWitnessUtxo, psbt.network, { amountType: 'bigint' }).outs[prevOutIndex]
            .script
        : undefined);
    assert(scriptPubKey, 'Input scriptPubKey can not be found');
    return scriptPubKey;
  }

  function getDerivationPath(input: PsbtInput) {
    const bip32Dv = input?.bip32Derivation ?? input?.tapBip32Derivation;
    assert(bip32Dv?.length, 'Input Bip32Derivation can not be found');
    return bip32Dv[0].path;
  }

  const txInputs = psbt.txInputs;

  for (let i = 0; i < psbt.data.inputs.length; i++) {
    const input = psbt.data.inputs[i];
    const parsedScriptType = getPsbtInputScriptType(input);
    if (parsedScriptType === 'p2shP2pk') {
      continue;
    }
    const scriptPubKey = getScriptPubKey(input, txInputs[i].index);
    const derivationPath = getDerivationPath(input);
    return { parsedScriptType, scriptPubKey, derivationPath };
  }

  throw new ErrorNoMultiSigInputFound('No multi sig input found');
}

/**
 * Sorts given root nodes based on the script compatibility with the PSBT's multi-sig inputs.
 * @param psbt - The PSBT containing multi-sig inputs.
 * @param rootNodes - Array of root nodes to sort.
 * @returns An array of BIP32Interface objects in the order that matches the multi-sig script.
 */
export function sortRootNodes(psbt: UtxoPsbt, rootNodes: Triple<BIP32Interface>): Triple<BIP32Interface> {
  const { parsedScriptType, scriptPubKey, derivationPath } = getFirstMultiSigInputData(psbt);
  const pubKeys = rootNodes.map((rootNode) => rootNode.derivePath(derivationPath).publicKey) as Triple<Buffer>;
  const order = findSortOrderOfPubKeys(pubKeys, scriptPubKey, parsedScriptType, psbt.network);
  return order.map((i) => rootNodes[i]) as Triple<BIP32Interface>;
}

/**
 * Retrieves sorted root nodes from a PSBT, ensuring they are ordered according to script compatibility.
 * @param psbt - The PSBT to extract and sort root nodes from.
 * @returns An array of sorted BIP32Interface root nodes.
 */
export function getSortedRootNodes(psbt: UtxoPsbt): Triple<BIP32Interface> {
  const unsortedRootNodes = getUnsortedRootNodes(psbt);
  assert(unsortedRootNodes, 'Could not find root nodes in PSBT');
  return sortRootNodes(psbt, unsortedRootNodes);
}
