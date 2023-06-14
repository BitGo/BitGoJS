import { getMainnet, Network, networks } from '../..';
import { UtxoTransactionBuilder } from '../UtxoTransactionBuilder';
import {
  createKeyPathP2trMusig2,
  createOutputScript2of3,
  createSpendScriptP2tr,
  createSpendScriptP2trMusig2,
  scriptTypeForChain,
  toXOnlyPublicKey,
} from '../outputScripts';
import { toOutputScript } from '../../address';
import {
  getDefaultSigHash,
  getSignatureVerifications,
  signInput2Of3,
  verifySignatureWithPublicKeys,
} from '../signature';
import { WalletUnspentSigner } from './WalletUnspentSigner';
import { KeyName, RootWalletKeys } from './WalletKeys';
import { UtxoTransaction } from '../UtxoTransaction';
import { Triple } from '../types';
import {
  toOutput,
  UnspentWithPrevTx,
  Unspent,
  isUnspentWithPrevTx,
  toPrevOutput,
  parseOutputId,
  getOutputIdForInput,
} from '../Unspent';
import { ChainCode, isSegwit } from './chains';
import { UtxoPsbt } from '../UtxoPsbt';
import { encodePsbtMusig2Participants } from '../Musig2';
import { createTransactionFromBuffer } from '../transaction';
import { parseSignatureScript } from '../parseInput';
import { checkForInput } from 'bip174/src/lib/utils';
import { ProprietaryKeySubtype, PSBT_PROPRIETARY_IDENTIFIER } from '../PsbtUtil';

export interface WalletUnspent<TNumber extends number | bigint = number> extends Unspent<TNumber> {
  chain: ChainCode;
  index: number;
  witnessScript?: string;
  valueString?: string;
}

export interface NonWitnessWalletUnspent<TNumber extends number | bigint = number>
  extends UnspentWithPrevTx<TNumber>,
    WalletUnspent<TNumber> {}

export function isWalletUnspent<TNumber extends number | bigint>(u: Unspent<TNumber>): u is WalletUnspent<TNumber> {
  return (u as WalletUnspent<TNumber>).chain !== undefined;
}

export function signInputWithUnspent<TNumber extends number | bigint>(
  txBuilder: UtxoTransactionBuilder<TNumber>,
  inputIndex: number,
  unspent: WalletUnspent<TNumber>,
  unspentSigner: WalletUnspentSigner<RootWalletKeys>
): void {
  const { walletKeys, signer, cosigner } = unspentSigner.deriveForChainAndIndex(unspent.chain, unspent.index);
  const scriptType = scriptTypeForChain(unspent.chain);
  const pubScript = createOutputScript2of3(walletKeys.publicKeys, scriptType).scriptPubKey;
  const pubScriptExpected = toOutputScript(unspent.address, txBuilder.network as Network);
  if (!pubScript.equals(pubScriptExpected)) {
    throw new Error(
      `pubscript mismatch: expected ${pubScriptExpected.toString('hex')} got ${pubScript.toString('hex')}`
    );
  }
  signInput2Of3<TNumber>(
    txBuilder,
    inputIndex,
    scriptType,
    walletKeys.publicKeys,
    signer,
    cosigner.publicKey,
    unspent.value
  );
}

/**
 * @param tx
 * @param inputIndex
 * @param unspents
 * @param walletKeys
 * @return triple of booleans indicating a valid signature for each pubkey
 */
export function verifySignatureWithUnspent<TNumber extends number | bigint>(
  tx: UtxoTransaction<TNumber>,
  inputIndex: number,
  unspents: Unspent<TNumber>[],
  walletKeys: RootWalletKeys
): Triple<boolean> {
  if (tx.ins.length !== unspents.length) {
    throw new Error(`input length must match unspents length`);
  }

  const input = tx.ins[inputIndex];
  /* istanbul ignore next */
  if (!input) {
    throw new Error(`no input at index ${inputIndex}`);
  }

  const unspent = unspents[inputIndex];
  if (!isWalletUnspent(unspent) || (!input.script?.length && !input.witness?.length)) {
    return [false, false, false];
  }

  const parsedInput = parseSignatureScript(input);
  const prevOutputs = unspents.map((u) => toOutput(u, tx.network));

  // If it is a taproot keyPathSpend input, the only valid signature combinations is user-bitgo. We can
  // only verify that the aggregated signature is valid, not that the individual partial-signature is valid.
  // Therefore, we can only say that either all partial signatures are valid, or none are.
  if (parsedInput.scriptType === 'taprootKeyPathSpend') {
    const result = getSignatureVerifications(tx, inputIndex, unspent.value, undefined, prevOutputs);
    return result.length === 1 && result[0].signature ? [true, false, true] : [false, false, false];
  }

  return verifySignatureWithPublicKeys(
    tx,
    inputIndex,
    prevOutputs,
    walletKeys.deriveForChainAndIndex(unspent.chain, unspent.index).publicKeys
  ) as Triple<boolean>;
}

/**
 * @deprecated
 * Used in certain legacy signing methods that do not derive signing data from index/chain
 */
export interface WalletUnspentLegacy<TNumber extends number | bigint = number> extends WalletUnspent<TNumber> {
  /** @deprecated - obviated by signWithUnspent */
  redeemScript?: string;
  /** @deprecated - obviated by verifyWithUnspent */
  witnessScript?: string;
}

/**
 * @param psbt
 * @param inputIndex
 * @param id Unspent ID
 * @returns true iff the unspent ID on the unspent and psbt input match
 */
export function psbtIncludesUnspentAtIndex(psbt: UtxoPsbt, inputIndex: number, id: string): boolean {
  checkForInput(psbt.data.inputs, inputIndex);

  const { txid, vout } = parseOutputId(id);
  const psbtOutPoint = getOutputIdForInput(psbt.txInputs[inputIndex]);
  return psbtOutPoint.txid === txid && psbtOutPoint.vout === vout;
}

/**
 * Update the psbt input at the given index
 * @param psbt
 * @param inputIndex
 * @param u
 * @param redeemScript Only overrides if there is no redeemScript in the input currently
 */
export function updateReplayProtectionUnspentToPsbt(
  psbt: UtxoPsbt,
  inputIndex: number,
  u: Unspent<bigint>,
  redeemScript?: Buffer
): void {
  if (!psbtIncludesUnspentAtIndex(psbt, inputIndex, u.id)) {
    throw new Error(`unspent does not correspond to psbt input`);
  }
  const input = checkForInput(psbt.data.inputs, inputIndex);

  if (redeemScript && !input.redeemScript) {
    psbt.updateInput(inputIndex, { redeemScript });
  }

  // Because Zcash directly hashes the value for non-segwit transactions, we do not need to check indirectly
  // with the previous transaction. Therefore, we can treat Zcash non-segwit transactions as Bitcoin
  // segwit transactions
  const isZcash = getMainnet(psbt.network) === networks.zcash;
  if (!isUnspentWithPrevTx(u) && !isZcash) {
    throw new Error('Error, require previous tx to add to PSBT');
  }
  if (isZcash && !input.witnessUtxo) {
    const { script, value } = toPrevOutput(u, psbt.network);
    psbt.updateInput(inputIndex, { witnessUtxo: { script, value } });
  } else if (!isZcash && !input.nonWitnessUtxo) {
    psbt.updateInput(inputIndex, { nonWitnessUtxo: (u as UnspentWithPrevTx<bigint>).prevTx });
  }
}

function addUnspentToPsbt(psbt: UtxoPsbt, id: string): void {
  const { txid, vout } = parseOutputId(id);
  psbt.addInput({
    hash: txid,
    index: vout,
  });
}

export function addReplayProtectionUnspentToPsbt(
  psbt: UtxoPsbt,
  u: Unspent<bigint>,
  redeemScript: Buffer,
  /**
   * @deprecated
   */
  network: Network = psbt.network
): void {
  if (psbt.network !== network) {
    throw new Error('psbt network does not match network');
  }
  addUnspentToPsbt(psbt, u.id);
  updateReplayProtectionUnspentToPsbt(psbt, psbt.inputCount - 1, u, redeemScript);
}

/**
 * Update the PSBT with the unspent data for the input at the given index if the data is not there already.
 *
 * @param psbt
 * @param inputIndex
 * @param u
 * @param rootWalletKeys
 * @param signer
 * @param cosigner
 */
export function updateWalletUnspentForPsbt(
  psbt: UtxoPsbt,
  inputIndex: number,
  u: WalletUnspent<bigint>,
  rootWalletKeys: RootWalletKeys,
  signer: KeyName,
  cosigner: KeyName
): void {
  if (!psbtIncludesUnspentAtIndex(psbt, inputIndex, u.id)) {
    throw new Error(`unspent does not correspond to psbt input`);
  }
  const input = checkForInput(psbt.data.inputs, inputIndex);

  // Because Zcash directly hashes the value for non-segwit transactions, we do not need to check indirectly
  // with the previous transaction. Therefore, we can treat Zcash non-segwit transactions as Bitcoin
  // segwit transactions
  const isZcashOrSegwit = isSegwit(u.chain) || getMainnet(psbt.network) === networks.zcash;
  if (isZcashOrSegwit && !input.witnessUtxo) {
    const { script, value } = toPrevOutput(u, psbt.network);
    psbt.updateInput(inputIndex, { witnessUtxo: { script, value } });
  } else if (!isZcashOrSegwit) {
    if (!isUnspentWithPrevTx(u)) {
      throw new Error('Error, require previous tx to add to PSBT');
    }

    if (!input.witnessUtxo && !input.nonWitnessUtxo) {
      // Force the litecoin transaction to have no MWEB advanced transaction flag
      if (getMainnet(psbt.network) === networks.litecoin) {
        u.prevTx = createTransactionFromBuffer(u.prevTx, psbt.network, { amountType: 'bigint' }).toBuffer();
      }

      psbt.updateInput(inputIndex, { nonWitnessUtxo: u.prevTx });
    }
  }

  const walletKeys = rootWalletKeys.deriveForChainAndIndex(u.chain, u.index);
  const scriptType = scriptTypeForChain(u.chain);
  const sighashType = getDefaultSigHash(psbt.network, scriptType);
  if (psbt.data.inputs[inputIndex].sighashType === undefined) {
    psbt.updateInput(inputIndex, { sighashType });
  }
  const isBackupFlow = signer === 'backup' || cosigner === 'backup';

  if (scriptType === 'p2tr' || (scriptType === 'p2trMusig2' && isBackupFlow)) {
    if (input.tapLeafScript && input.tapBip32Derivation) {
      return;
    }
    const createSpendScriptP2trFn = scriptType === 'p2tr' ? createSpendScriptP2tr : createSpendScriptP2trMusig2;
    const { controlBlock, witnessScript, leafVersion, leafHash } = createSpendScriptP2trFn(walletKeys.publicKeys, [
      walletKeys[signer].publicKey,
      walletKeys[cosigner].publicKey,
    ]);
    if (!input.tapLeafScript) {
      psbt.updateInput(inputIndex, {
        tapLeafScript: [{ controlBlock, script: witnessScript, leafVersion }],
      });
    }
    if (!input.tapBip32Derivation) {
      psbt.updateInput(inputIndex, {
        tapBip32Derivation: [signer, cosigner].map((key) => ({
          leafHashes: [leafHash],
          pubkey: toXOnlyPublicKey(walletKeys[key].publicKey),
          path: rootWalletKeys.getDerivationPath(rootWalletKeys[key], u.chain, u.index),
          masterFingerprint: rootWalletKeys[key].fingerprint,
        })),
      });
    }
  } else if (scriptType === 'p2trMusig2') {
    const {
      internalPubkey: tapInternalKey,
      outputPubkey: tapOutputKey,
      taptreeRoot,
    } = createKeyPathP2trMusig2(walletKeys.publicKeys);

    if (
      psbt.getProprietaryKeyVals(inputIndex, {
        identifier: PSBT_PROPRIETARY_IDENTIFIER,
        subtype: ProprietaryKeySubtype.MUSIG2_PARTICIPANT_PUB_KEYS,
      }).length === 0
    ) {
      const participantsKeyValData = encodePsbtMusig2Participants({
        tapOutputKey,
        tapInternalKey,
        participantPubKeys: [walletKeys.user.publicKey, walletKeys.bitgo.publicKey],
      });
      psbt.addProprietaryKeyValToInput(inputIndex, participantsKeyValData);
    }

    if (!input.tapInternalKey) {
      psbt.updateInput(inputIndex, {
        tapInternalKey: tapInternalKey,
      });
    }

    if (!input.tapMerkleRoot) {
      psbt.updateInput(inputIndex, {
        tapMerkleRoot: taptreeRoot,
      });
    }

    if (!input.tapBip32Derivation) {
      psbt.updateInput(inputIndex, {
        tapBip32Derivation: [signer, cosigner].map((key) => ({
          leafHashes: [],
          pubkey: toXOnlyPublicKey(walletKeys[key].publicKey),
          path: rootWalletKeys.getDerivationPath(rootWalletKeys[key], u.chain, u.index),
          masterFingerprint: rootWalletKeys[key].fingerprint,
        })),
      });
    }
  } else {
    if (!input.bip32Derivation) {
      psbt.updateInput(inputIndex, {
        bip32Derivation: [0, 1, 2].map((idx) => ({
          pubkey: walletKeys.triple[idx].publicKey,
          path: walletKeys.paths[idx],
          masterFingerprint: rootWalletKeys.triple[idx].fingerprint,
        })),
      });
    }

    const { witnessScript, redeemScript } = createOutputScript2of3(walletKeys.publicKeys, scriptType);
    if (witnessScript && !input.witnessScript) {
      psbt.updateInput(inputIndex, { witnessScript });
    }
    if (redeemScript && !input.redeemScript) {
      psbt.updateInput(inputIndex, { redeemScript });
    }
  }
}

export function addWalletUnspentToPsbt(
  psbt: UtxoPsbt,
  u: WalletUnspent<bigint>,
  rootWalletKeys: RootWalletKeys,
  signer: KeyName,
  cosigner: KeyName,
  /**
   * @deprecated
   */
  network: Network = psbt.network
): void {
  if (psbt.network !== network) {
    throw new Error('psbt network does not match network');
  }
  addUnspentToPsbt(psbt, u.id);
  updateWalletUnspentForPsbt(psbt, psbt.inputCount - 1, u, rootWalletKeys, signer, cosigner);
}
