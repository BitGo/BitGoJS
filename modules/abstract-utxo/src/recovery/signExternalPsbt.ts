import { BIP32, bip32, fixedScriptWallet, type CoinName } from '@bitgo/wasm-utxo';

import { toWasmUtxoCoinName, type UtxoCoinName } from '../names';

/**
 * The network an externally supplied PSBT is signed on: a wasm-utxo coin
 * name or an SDK UTXO coin name (normalized with toWasmUtxoCoinName).
 */
export type ExternalPsbtCoinName = CoinName | UtxoCoinName;

/** The result of signing an externally supplied PSBT. */
export type SignedExternalPsbt = {
  /** The signed PSBT, serialized as hex. */
  psbtHex: string;
  /** The input indexes that carry a valid signature by the signer key. */
  signedInputIndexes: number[];
};

type PsbtOutput = { script: Uint8Array; value: bigint };

/**
 * A key that can sign an externally supplied PSBT: a base58-encoded xprv, a
 * wasm-utxo BIP32/WasmBIP32 instance, or a BIP32Interface-compatible
 * (utxolib) key. Normalized with BIP32.from.
 */
export type ExternalPsbtSigner = bip32.BIP32Arg;

function snapshotOutputs(psbt: fixedScriptWallet.BitGoPsbt): PsbtOutput[] {
  return psbt.getOutputs().map(({ script, value }) => ({ script: Buffer.from(script), value }));
}

function assertOutputsUnchanged(expected: PsbtOutput[], actual: PsbtOutput[]): void {
  if (
    expected.length !== actual.length ||
    expected.some(
      (output, index) =>
        output.value !== actual[index].value || !Buffer.from(output.script).equals(Buffer.from(actual[index].script))
    )
  ) {
    throw new Error('PSBT outputs changed after signing');
  }
}

/**
 * Asserts the sighash policy for an externally supplied PSBT before handing it
 * to a signer.
 *
 * Every input must commit to the entire transaction: the declared per-input
 * sighash type (BIP-174 PSBT_IN_SIGHASH_TYPE) and every signature already
 * present in the PSBT must be SIGHASH_ALL (or the network's full-commitment
 * equivalent: SIGHASH_ALL|SIGHASH_FORKID on BCH-family coins, SIGHASH_DEFAULT
 * or SIGHASH_ALL on Taproot inputs). An absent sighash type is accepted and
 * uses the signer default. SIGHASH_NONE, SIGHASH_SINGLE, SIGHASH_ANYONECANPAY,
 * and combinations thereof are rejected because signatures produced under
 * them do not bind the signer to the transaction outputs — see WCN-1994.
 *
 * @param psbtHex - The externally supplied PSBT, hex-encoded
 * @param coinName - The network the PSBT is signed on
 * @throws Error naming the offending input if the PSBT violates the policy
 */
export function assertExternalPsbtSighashPolicy(psbtHex: string, coinName: ExternalPsbtCoinName): void {
  fixedScriptWallet.BitGoPsbt.fromBytes(
    Buffer.from(psbtHex, 'hex'),
    toWasmUtxoCoinName(coinName)
  ).assertSighashAllPolicy();
}

/**
 * Signs an externally supplied (untrusted) PSBT with a single signer key under
 * the SIGHASH_ALL-only policy.
 *
 * A foreign PSBT controls its own per-input sighash types, so signing it
 * blindly lets the PSBT author request SIGHASH_NONE/SINGLE/ANYONECANPAY and
 * produce a signature that does not bind the signer to the outputs — the
 * output-swap drain demonstrated in WCN-1994. This helper closes that hole
 * by enforcing, in order:
 *
 * 1. the sighash policy before signing (see {@link assertExternalPsbtSighashPolicy});
 * 2. that signing leaves the output set byte-identical to the snapshot taken
 *    before signing;
 * 3. the sighash policy again on the re-parsed serialized result, so every
 *    signature in the exported PSBT commits to the entire transaction;
 * 4. that the signer's signature cryptographically validates on the re-parsed
 *    result for at least one input (BitGoPsbt.sign reports every attempted
 *    input, including inputs the key does not match, so signed inputs are
 *    determined by verifying the signatures).
 *
 * @param psbtHex - The externally supplied PSBT, hex-encoded
 * @param coinName - The network the PSBT is signed on
 * @param signer - The signer key (xprv)
 * @returns The signed PSBT hex and the input indexes that carry a valid
 *          signature by the signer key
 * @throws Error if the PSBT violates the sighash policy, the outputs changed
 *         during signing, or the signer key produced no valid signature
 */
export function signExternalPsbt(
  psbtHex: string,
  coinName: ExternalPsbtCoinName,
  signer: ExternalPsbtSigner
): SignedExternalPsbt {
  const wasmCoinName = toWasmUtxoCoinName(coinName);
  const psbt = fixedScriptWallet.BitGoPsbt.fromBytes(Buffer.from(psbtHex, 'hex'), wasmCoinName);
  psbt.assertSighashAllPolicy();

  const signerBIP32 = BIP32.from(signer);
  const expectedOutputs = snapshotOutputs(psbt);

  psbt.sign(signerBIP32);

  const signedPsbtHex = Buffer.from(psbt.serialize()).toString('hex');
  // Re-parse the serialized bytes so the checks below run against exactly
  // what callers will export.
  const signedPsbt = fixedScriptWallet.BitGoPsbt.fromBytes(Buffer.from(signedPsbtHex, 'hex'), wasmCoinName);

  signedPsbt.assertSighashAllPolicy();
  assertOutputsUnchanged(expectedOutputs, signedPsbt.getOutputs());

  const signerXpub = signerBIP32.neutered();
  const signedInputIndexes: number[] = [];
  for (let inputIndex = 0; inputIndex < signedPsbt.inputCount(); inputIndex++) {
    try {
      if (signedPsbt.verifySignature(inputIndex, signerXpub)) {
        signedInputIndexes.push(inputIndex);
      }
    } catch {
      // a malformed or non-matching signature counts as not signed
    }
  }
  if (signedInputIndexes.length === 0) {
    throw new Error('No PSBT inputs were signed with the signer key');
  }

  return { psbtHex: signedPsbtHex, signedInputIndexes };
}
