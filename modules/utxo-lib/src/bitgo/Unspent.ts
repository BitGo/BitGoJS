import { TxOutput } from 'bitcoinjs-lib';
import { Network } from '..';
import { toOutputScript } from '../address';
import { createOutputScript2of3, createSpendScriptP2tr } from './outputScripts';
import { UtxoPsbt } from './UtxoPsbt';
import { UtxoTransaction } from './UtxoTransaction';
import { UtxoTransactionBuilder } from './UtxoTransactionBuilder';
import { isSegwit, RootWalletKeys, scriptTypeForChain, WalletUnspent, WalletUnspentSigner } from './wallet';

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

export function addToPsbt(
  psbt: UtxoPsbt<UtxoTransaction<bigint>>,
  u: WalletUnspent<bigint>,
  rootSigner: WalletUnspentSigner<RootWalletKeys>,
  network: Network
): void {
  const { txid, vout, script, value } = toPrevOutput(u, network);
  const { walletKeys, signerIndex, cosignerIndex } = rootSigner.deriveForChainAndIndex(u.chain, u.index);
  const scriptType = scriptTypeForChain(u.chain);
  const input = {
    hash: txid,
    index: vout,
  };
  psbt.addInput(input);
  const inputIndex = psbt.inputCount - 1;
  if (isSegwit(u.chain)) {
    psbt.updateInput(inputIndex, {
      witnessUtxo: {
        script,
        value,
      },
    });
  } else {
    if (!isNonWitnessUnspent(u)) {
      throw new Error('Error, require previous tx to add to PSBT');
    }
    psbt.updateInput(inputIndex, { nonWitnessUtxo: u.prevTx });
  }

  if (scriptType === 'p2tr') {
    const { controlBlock, witnessScript, leafVersion, leafHash } = createSpendScriptP2tr(walletKeys.publicKeys, [
      walletKeys.triple[signerIndex].publicKey,
      walletKeys.triple[cosignerIndex].publicKey,
    ]);
    psbt.updateInput(inputIndex, {
      tapLeafScript: [{ controlBlock, script: witnessScript, leafVersion }],
      tapBip32Derivation: [signerIndex, cosignerIndex].map((idx) => ({
        leafHashes: [leafHash],
        pubkey: walletKeys.triple[idx].publicKey.slice(1), // 32-byte x-only
        path: walletKeys.paths[idx],
        masterFingerprint: rootSigner.walletKeys.triple[idx].fingerprint,
      })),
    });
  } else {
    const { witnessScript, redeemScript } = createOutputScript2of3(walletKeys.publicKeys, scriptType);
    psbt.updateInput(inputIndex, {
      bip32Derivation: [signerIndex, cosignerIndex].map((idx) => ({
        pubkey: walletKeys.triple[idx].publicKey,
        path: walletKeys.paths[idx],
        masterFingerprint: rootSigner.walletKeys.triple[idx].fingerprint,
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
