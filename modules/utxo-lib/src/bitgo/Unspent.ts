import { TxOutput, taproot } from 'bitcoinjs-lib';
import { Network } from '..';
import { toOutputScript } from '../address';
import { createOutputScript2of3, createSpendScriptP2tr, createPaymentP2tr, toXOnlyPublicKey } from './outputScripts';
import { UtxoPsbt } from './UtxoPsbt';
import { UtxoTransaction } from './UtxoTransaction';
import { UtxoTransactionBuilder } from './UtxoTransactionBuilder';
import { isSegwit, ChainCode, RootWalletKeys, scriptTypeForChain, WalletUnspent, KeyName } from './wallet';

/**
 * Public unspent data in BitGo-specific representation.
 */
export interface Unspent<TNumber extends number | bigint = number> {
  /**
   * Format: ${txid}:${vout}.
   * Use `parseOutputId(id)` to parse.
   */
  id: string;
  /**
   * The network-specific encoded address.
   * Use `toOutputScript(address, network)` to obtain scriptPubKey.
   */
  address: string;
  /**
   * The amount in satoshi.
   */
  value: TNumber;
}

export interface NonWitnessUnspent<TNumber extends number | bigint = number> extends Unspent<TNumber> {
  prevTx: Buffer;
}

export function isNonWitnessUnspent<TNumber extends number | bigint = number>(
  u: Unspent<TNumber>
): u is NonWitnessUnspent<TNumber> {
  return Buffer.isBuffer((u as NonWitnessUnspent<TNumber>).prevTx);
}

/**
 * @return TxOutput from Unspent
 */
export function toOutput<TNumber extends number | bigint>(u: Unspent<TNumber>, network: Network): TxOutput<TNumber> {
  return {
    script: toOutputScript(u.address, network),
    value: u.value,
  };
}

/**
 * @param outputId
 * @return TxOutPoint
 */
export function parseOutputId(outputId: string): TxOutPoint {
  const parts = outputId.split(':');
  if (parts.length !== 2) {
    throw new Error(`invalid outputId, must have format txid:vout`);
  }
  const [txid, voutStr] = parts;
  const vout = Number(voutStr);
  if (txid.length !== 64) {
    throw new Error(`invalid txid ${txid} ${txid.length}`);
  }
  if (Number.isNaN(vout) || vout < 0 || !Number.isSafeInteger(vout)) {
    throw new Error(`invalid vout: must be integer >= 0`);
  }
  return { txid, vout };
}

/**
 * @param txid
 * @param vout
 * @return outputId
 */
export function formatOutputId({ txid, vout }: TxOutPoint): string {
  return `${txid}:${vout}`;
}

export function getOutputIdForInput(i: { hash: Buffer; index: number }): TxOutPoint {
  return {
    txid: Buffer.from(i.hash).reverse().toString('hex'),
    vout: i.index,
  };
}

/**
 * Reference to output of an existing transaction
 */
export type TxOutPoint = {
  txid: string;
  vout: number;
};

/**
 * Output reference and script data.
 * Suitable for use for `txb.addInput()`
 */
export type PrevOutput<TNumber extends number | bigint = number> = TxOutPoint & TxOutput<TNumber>;

/**
 * @return PrevOutput from Unspent
 */
export function toPrevOutput<TNumber extends number | bigint>(
  u: Unspent<TNumber>,
  network: Network
): PrevOutput<TNumber> {
  return {
    ...parseOutputId(u.id),
    ...toOutput(u, network),
  };
}

/**
 * @param txb
 * @param u
 * @param sequence - sequenceId
 */
export function addToTransactionBuilder<TNumber extends number | bigint>(
  txb: UtxoTransactionBuilder<TNumber>,
  u: Unspent<TNumber>,
  sequence?: number
): void {
  const { txid, vout, script, value } = toPrevOutput(u, txb.network as Network);
  txb.addInput(txid, vout, sequence, script, value);
}

/**
 * Add a verifiable change output to the PSBT. The change output and all data
 * needed to verify it from public keys only are added to the PSBT.
 *
 * @param psbt the PSBT to add change output to
 * @param rootWalletKeys keys that will be able to spend the output
 * @param chain chain code to use for deriving scripts (and to determine script
 *              type) chain is an API parameter in the BitGo API, and may be
 *              any valid ChainCode
 * @param index derivation index for the change address
 * @param value value of the change output
 */
export function addChangeOutputToPsbt(
  psbt: UtxoPsbt<UtxoTransaction<bigint>>,
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

export function addToPsbt(
  psbt: UtxoPsbt<UtxoTransaction<bigint>>,
  u: WalletUnspent<bigint>,
  rootWalletKeys: RootWalletKeys,
  signer: KeyName,
  cosigner: KeyName,
  network: Network
): void {
  const { txid, vout, script, value } = toPrevOutput(u, network);
  const walletKeys = rootWalletKeys.deriveForChainAndIndex(u.chain, u.index);
  const scriptType = scriptTypeForChain(u.chain);
  psbt.addInput({
    hash: txid,
    index: vout,
    witnessUtxo: {
      script,
      value,
    },
  });
  const inputIndex = psbt.inputCount - 1;
  if (!isSegwit(u.chain)) {
    if (!isNonWitnessUnspent(u)) {
      throw new Error('Error, require previous tx to add to PSBT');
    }
    psbt.updateInput(inputIndex, { nonWitnessUtxo: u.prevTx });
  }

  if (scriptType === 'p2tr') {
    const { controlBlock, witnessScript, leafVersion, leafHash } = createSpendScriptP2tr(walletKeys.publicKeys, [
      walletKeys[signer].publicKey,
      walletKeys[cosigner].publicKey,
    ]);
    psbt.updateInput(inputIndex, {
      tapLeafScript: [{ controlBlock, script: witnessScript, leafVersion }],
      tapBip32Derivation: [signer, cosigner].map((key) => ({
        leafHashes: [leafHash],
        pubkey: walletKeys[key].publicKey.slice(1), // 32-byte x-only
        path: rootWalletKeys.getDerivationPath(rootWalletKeys[key], u.chain, u.index),
        masterFingerprint: rootWalletKeys[key].fingerprint,
      })),
    });
  } else {
    const { witnessScript, redeemScript } = createOutputScript2of3(walletKeys.publicKeys, scriptType);
    psbt.updateInput(inputIndex, {
      bip32Derivation: [0, 1, 2].map((idx) => ({
        pubkey: walletKeys.triple[idx].publicKey,
        path: walletKeys.paths[idx],
        masterFingerprint: rootWalletKeys.triple[idx].fingerprint,
      })),
    });
    if (witnessScript) {
      psbt.updateInput(inputIndex, { witnessScript });
    }
    if (redeemScript) {
      psbt.updateInput(inputIndex, { redeemScript });
    }
  }
}

/**
 * Sum the values of the unspents.
 * Throws error if sum is not a safe integer value, or if unspent amount types do not match `amountType`
 * @param unspents - array of unspents to sum
 * @param amountType - expected value type of unspents
 * @return unspentSum - type matches amountType
 */
export function unspentSum<TNumber extends number | bigint>(
  unspents: Unspent<TNumber>[],
  amountType: 'number' | 'bigint' = 'number'
): TNumber {
  if (amountType === 'bigint') {
    return unspents.reduce((sum, u) => sum + (u.value as bigint), BigInt(0)) as TNumber;
  } else {
    const sum = unspents.reduce((sum, u) => sum + (u.value as number), Number(0));
    if (!Number.isSafeInteger(sum)) {
      throw new Error('unspent sum is not a safe integer number, consider using bigint');
    }
    return sum as TNumber;
  }
}
