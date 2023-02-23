import { taproot } from 'bitcoinjs-lib';
import { UtxoPsbt } from '../UtxoPsbt';
import { RootWalletKeys } from './WalletKeys';
import { ChainCode, scriptTypeForChain } from './chains';
import { createOutputScript2of3, createPaymentP2tr, toXOnlyPublicKey } from '../outputScripts';

/**
 * Add a verifiable wallet output to the PSBT. The output and all data
 * needed to verify it from public keys only are added to the PSBT.
 * Typically these are change outputs
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
  if (scriptType === 'p2tr') {
    const payment = createPaymentP2tr(walletKeys.publicKeys);
    const allLeafHashes = payment.redeems!.map((r) => taproot.hashTapLeaf(r.output!));

    psbt.addOutput({
      script: payment.output!,
      value,
      tapTree: payment.tapTree,
      tapInternalKey: payment.internalPubkey,
      tapBip32Derivation: [0, 1, 2].map((idx) => {
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
      }),
    });
  } else {
    const { scriptPubKey, witnessScript, redeemScript } = createOutputScript2of3(walletKeys.publicKeys, scriptType);
    psbt.addOutput({
      script: scriptPubKey,
      value,
      bip32Derivation: [0, 1, 2].map((idx) => ({
        pubkey: walletKeys.triple[idx].publicKey,
        path: walletKeys.paths[idx],
        masterFingerprint: rootWalletKeys.triple[idx].fingerprint,
      })),
    });
    const outputIndex = psbt.txOutputs.length - 1;
    if (witnessScript) {
      psbt.updateOutput(outputIndex, { witnessScript });
    }
    if (redeemScript) {
      psbt.updateOutput(outputIndex, { redeemScript });
    }
  }
}
