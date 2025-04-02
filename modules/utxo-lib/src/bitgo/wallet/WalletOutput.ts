import * as assert from 'assert';

import { Payment, taproot } from 'bitcoinjs-lib';
import { PsbtOutput, PsbtOutputUpdate } from 'bip174/src/lib/interfaces';
import { UtxoPsbt } from '../UtxoPsbt';
import { RootWalletKeys, DerivedWalletKeys } from './WalletKeys';
import { ChainCode, scriptTypeForChain } from './chains';
import { getScriptIdFromPath, ScriptId } from './ScriptId';
import { createOutputScript2of3, createPaymentP2tr, createPaymentP2trMusig2, toXOnlyPublicKey } from '../outputScripts';

/**
 * Get the BIP32 derivation data for a PSBT output.
 *
 * @param rootWalletKeys root wallet keys used for master fingerprints
 * @param walletKeys derived wallet keys for the specific chain and index
 * @param scriptType the script type to determine whether to use regular or taproot derivation
 * @param payment optional payment object for taproot scripts to calculate leaf hashes
 * @returns Object containing BIP32 derivation data
 */
export function getPsbtBip32DerivationOutputUpdate(
  rootWalletKeys: RootWalletKeys,
  walletKeys: DerivedWalletKeys,
  scriptType: string,
  payment?: Payment
): PsbtOutputUpdate {
  const update: PsbtOutputUpdate = {};

  if (scriptType === 'p2tr' || scriptType === 'p2trMusig2') {
    if (!payment || !payment.redeems) {
      throw new Error('Payment object with redeems is required for taproot derivation');
    }

    const allLeafHashes = payment.redeems.map((r) => taproot.hashTapLeaf(r.output!));

    update.tapBip32Derivation = [0, 1, 2].map((idx) => {
      const pubkey = toXOnlyPublicKey(walletKeys.triple[idx].publicKey);
      const leafHashes: Buffer[] = [];

      assert(payment.redeems);
      payment.redeems.forEach((r: any, redeemIdx: number) => {
        if (r.pubkeys!.find((pk: Buffer) => pk.equals(pubkey))) {
          leafHashes.push(allLeafHashes[redeemIdx]);
        }
      });

      return {
        leafHashes,
        pubkey,
        path: walletKeys.paths[idx],
        masterFingerprint: rootWalletKeys.triple[idx].fingerprint,
      };
    });
  } else {
    update.bip32Derivation = [0, 1, 2].map((idx) => ({
      pubkey: walletKeys.triple[idx].publicKey,
      path: walletKeys.paths[idx],
      masterFingerprint: rootWalletKeys.triple[idx].fingerprint,
    }));
  }

  return update;
}

/**
 * Get the PSBT output update object from a PSBT output and output script.
 *
 * @param output the PSBT output to get update for
 * @param outputScript the output script
 * @param rootWalletKeys keys that will be able to spend the output
 * @param chain chain code to use for deriving scripts (and to determine script type)
 * @param index derivation index for the change address
 * @returns PsbtOutputUpdate object with the required information
 */
export function getPsbtOutputUpdateFromPsbtOutput(
  output: PsbtOutput,
  outputScript: Buffer,
  rootWalletKeys: RootWalletKeys,
  chain: ChainCode,
  index: number
): PsbtOutputUpdate {
  const walletKeys = rootWalletKeys.deriveForChainAndIndex(chain, index);
  const scriptType = scriptTypeForChain(chain);
  const update: PsbtOutputUpdate = {};

  if (scriptType === 'p2tr' || scriptType === 'p2trMusig2') {
    const payment =
      scriptType === 'p2tr' ? createPaymentP2tr(walletKeys.publicKeys) : createPaymentP2trMusig2(walletKeys.publicKeys);
    if (!payment.output || !payment.output.equals(outputScript)) {
      throw new Error(`cannot update a p2tr output where the scripts do not match - Failing.`);
    }

    if (!output.tapTree) {
      update.tapTree = payment.tapTree;
    }
    if (!output.tapInternalKey) {
      update.tapInternalKey = payment.internalPubkey;
    }

    if (!output.tapBip32Derivation) {
      const derivationUpdate = getPsbtBip32DerivationOutputUpdate(rootWalletKeys, walletKeys, scriptType, payment);
      update.tapBip32Derivation = derivationUpdate.tapBip32Derivation;
    }
  } else {
    const { scriptPubKey, witnessScript, redeemScript } = createOutputScript2of3(walletKeys.publicKeys, scriptType);
    if (!scriptPubKey.equals(outputScript)) {
      throw new Error(`cannot update an output where the scripts do not match - Failing.`);
    }

    if (!output.bip32Derivation) {
      const derivationUpdate = getPsbtBip32DerivationOutputUpdate(rootWalletKeys, walletKeys, scriptType);
      update.bip32Derivation = derivationUpdate.bip32Derivation;
    }

    if (!output.witnessScript && witnessScript) {
      update.witnessScript = witnessScript;
    }
    if (!output.redeemScript && redeemScript) {
      update.redeemScript = redeemScript;
    }
  }

  return update;
}

/**
 * Get the PSBT output update object with the required information.
 *
 * @param psbt the PSBT to get output update for
 * @param rootWalletKeys keys that will be able to spend the output
 * @param outputIndex output index where to update the output
 * @param chain chain code to use for deriving scripts (and to determine script
 *              type) chain is an API parameter in the BitGo API, and may be
 *              any valid ChainCode
 * @param index derivation index for the change address
 * @returns PsbtOutputUpdate object with the required information
 */
export function getPsbtOutputUpdate(
  psbt: UtxoPsbt,
  rootWalletKeys: RootWalletKeys,
  outputIndex: number,
  chain: ChainCode,
  index: number
): PsbtOutputUpdate {
  if (psbt.data.outputs.length <= outputIndex) {
    throw new Error(
      `outputIndex (${outputIndex}) is too large for the number of outputs (${psbt.data.outputs.length})`
    );
  }

  const outputScript = psbt.getOutputScript(outputIndex);
  const output = psbt.data.outputs[outputIndex];

  return getPsbtOutputUpdateFromPsbtOutput(output, outputScript, rootWalletKeys, chain, index);
}

/**
 * Update the wallet output with the required information when necessary. If the
 * information is there already, it will skip over it.
 *
 * This function assumes that the output script and value have already been set.
 *
 * @param psbt the PSBT to update change output at
 * @param rootWalletKeys keys that will be able to spend the output
 * @param outputIndex output index where to update the output
 * @param chain chain code to use for deriving scripts (and to determine script
 *              type) chain is an API parameter in the BitGo API, and may be
 *              any valid ChainCode
 * @param index derivation index for the change address
 */
export function updateWalletOutputForPsbt(
  psbt: UtxoPsbt,
  rootWalletKeys: RootWalletKeys,
  outputIndex: number,
  chain: ChainCode,
  index: number
): void {
  psbt.updateOutput(outputIndex, getPsbtOutputUpdate(psbt, rootWalletKeys, outputIndex, chain, index));
}

/**
 * Add a verifiable wallet output to the PSBT. The output and all data
 * needed to verify it from public keys only are added to the PSBT.
 * Typically these are change outputs.
 *
 * @param psbt the PSBT to add change output to
 * @param rootWalletKeys keys that will be able to spend the output
 * @param chain chain code to use for deriving scripts (and to determine script
 *              type) chain is an API parameter in the BitGo API, and may be
 *              any valid ChainCode
 * @param index derivation index for the change address
 * @param value value of the change output
 */
export function addWalletOutputToPsbt(
  psbt: UtxoPsbt,
  rootWalletKeys: RootWalletKeys,
  chain: ChainCode,
  index: number,
  value: bigint
): void {
  const walletKeys = rootWalletKeys.deriveForChainAndIndex(chain, index);
  const scriptType = scriptTypeForChain(chain);
  if (scriptType === 'p2tr' || scriptType === 'p2trMusig2') {
    const payment =
      scriptType === 'p2tr' ? createPaymentP2tr(walletKeys.publicKeys) : createPaymentP2trMusig2(walletKeys.publicKeys);
    psbt.addOutput({ script: payment.output!, value });
  } else {
    const { scriptPubKey: script } = createOutputScript2of3(walletKeys.publicKeys, scriptType);
    psbt.addOutput({ script, value });
  }
  updateWalletOutputForPsbt(psbt, rootWalletKeys, psbt.data.outputs.length - 1, chain, index);
}

/**
 * Fold the script ids into a single script id, if they are all the same.
 * @param scriptIds
 */
function foldScriptIds(scriptIds: ScriptId[]): ScriptId {
  if (scriptIds.length === 0) {
    throw new Error('cannot fold empty script ids');
  }
  scriptIds.forEach((scriptId, i) => {
    if (scriptId.chain !== scriptIds[0].chain) {
      throw new Error(`chain mismatch: ${scriptId.chain} != ${scriptIds[0].chain}`);
    }
    if (scriptId.index !== scriptIds[0].index) {
      throw new Error(`index mismatch: ${scriptId.index} != ${scriptIds[0].index}`);
    }
  });
  return scriptIds[0];
}

/**
 * Get the script id from the output.
 * The output can have either bip32Derivation or tapBip32Derivation, but not both.
 * @param output
 * @throws Error if neither or both bip32Derivation and tapBip32Derivation are present
 * @throws Error if the output is empty
 * @throws Error if we cannot fold the script ids into a single script id
 */
export function getScriptIdFromOutput(output: {
  bip32Derivation?: { path: string }[];
  tapBip32Derivation?: { path: string }[];
}): ScriptId {
  if (output.bip32Derivation && output.tapBip32Derivation) {
    throw new Error('cannot get script id from output with both bip32Derivation and tapBip32Derivation');
  }
  if (output.bip32Derivation) {
    return foldScriptIds(output.bip32Derivation.map((d) => getScriptIdFromPath(d.path)));
  }
  if (output.tapBip32Derivation) {
    return foldScriptIds(output.tapBip32Derivation.map((d) => getScriptIdFromPath(d.path)));
  }
  throw new Error('cannot get script id from output without bip32Derivation or tapBip32Derivation');
}
