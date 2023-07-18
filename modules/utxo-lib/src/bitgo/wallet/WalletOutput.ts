import { taproot } from 'bitcoinjs-lib';
import { PsbtOutputUpdate } from 'bip174/src/lib/interfaces';
import { UtxoPsbt } from '../UtxoPsbt';
import { RootWalletKeys } from './WalletKeys';
import { ChainCode, scriptTypeForChain } from './chains';
import { createOutputScript2of3, createPaymentP2tr, createPaymentP2trMusig2, toXOnlyPublicKey } from '../outputScripts';

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
 * @param value value of the change output
 */
export function updateWalletOutputForPsbt(
  psbt: UtxoPsbt,
  rootWalletKeys: RootWalletKeys,
  outputIndex: number,
  chain: ChainCode,
  index: number
): void {
  if (psbt.data.outputs.length <= outputIndex) {
    throw new Error(
      `outputIndex (${outputIndex}) is too large for the number of outputs (${psbt.data.outputs.length})`
    );
  }

  const outputScript = psbt.getOutputScript(outputIndex);

  const walletKeys = rootWalletKeys.deriveForChainAndIndex(chain, index);
  const scriptType = scriptTypeForChain(chain);
  const output = psbt.data.outputs[outputIndex];
  const update: PsbtOutputUpdate = {};
  if (scriptType === 'p2tr' || scriptType === 'p2trMusig2') {
    const payment =
      scriptType === 'p2tr' ? createPaymentP2tr(walletKeys.publicKeys) : createPaymentP2trMusig2(walletKeys.publicKeys);
    if (!payment.output || !payment.output.equals(outputScript)) {
      throw new Error(`cannot update a p2tr output where the scripts do not match - Failing.`);
    }
    const allLeafHashes = payment.redeems!.map((r) => taproot.hashTapLeaf(r.output!));

    if (!output.tapTree) {
      update.tapTree = payment.tapTree;
    }
    if (!output.tapInternalKey) {
      update.tapInternalKey = payment.internalPubkey;
    }
    if (!output.tapBip32Derivation) {
      update.tapBip32Derivation = [0, 1, 2].map((idx) => {
        const pubkey = toXOnlyPublicKey(walletKeys.triple[idx].publicKey);
        const leafHashes: Buffer[] = [];
        payment.redeems!.forEach((r, idx) => {
          if (r.pubkeys!.find((pk) => pk.equals(pubkey))) {
            leafHashes.push(allLeafHashes[idx]);
          }
        });
        return {
          leafHashes,
          pubkey,
          path: walletKeys.paths[idx],
          masterFingerprint: rootWalletKeys.triple[idx].fingerprint,
        };
      });
    }
  } else {
    const { scriptPubKey, witnessScript, redeemScript } = createOutputScript2of3(walletKeys.publicKeys, scriptType);
    if (!scriptPubKey.equals(outputScript)) {
      throw new Error(`cannot update an output where the scripts do not match - Failing.`);
    }
    if (!output.bip32Derivation) {
      update.bip32Derivation = [0, 1, 2].map((idx) => ({
        pubkey: walletKeys.triple[idx].publicKey,
        path: walletKeys.paths[idx],
        masterFingerprint: rootWalletKeys.triple[idx].fingerprint,
      }));
    }
    if (!output.witnessScript && witnessScript) {
      update.witnessScript = witnessScript;
    }
    if (!output.redeemScript && redeemScript) {
      update.redeemScript = redeemScript;
    }
  }
  psbt.updateOutput(outputIndex, update);
}
