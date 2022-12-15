import { UtxoPsbt } from '../UtxoPsbt';
import { UtxoTransaction } from '../UtxoTransaction';
import {
  createOutputScript2of3,
  getLeafHash,
  parseTaprootScript2of3PubKeys,
  ScriptType2Of3,
  scriptTypeForChain,
  toXOnlyPublicKey,
} from '../outputScripts';
import { DerivedWalletKeys, RootWalletKeys } from './WalletKeys';
import { toPrevOutputWithPrevTx } from '../Unspent';
import { createPsbtFromTransaction } from '../transaction';
import { BIP32Interface } from 'bip32';
import { isWalletUnspent, WalletUnspent } from './Unspent';
import { checkForInput } from 'bip174/src/lib/utils';
import { PsbtInput } from 'bip174/src/lib/interfaces';
import {
  getScriptPathLevel,
  calculateScriptPathLevel,
  isValidControlBock,
  ParsedPubScript2Of3,
  ParsedPubScriptTaprootScriptPath,
  parsePubScript,
} from '../parseInput';

type Signatures = [Buffer] | [Buffer, Buffer] | undefined;

export interface ParsedPsbt2Of3 extends ParsedPubScript2Of3 {
  signatures: Signatures;
}

export interface ParsedPsbtP2TR extends ParsedPubScriptTaprootScriptPath {
  signatures: Signatures;
  controlBlock: Buffer;
  leafVersion: number;
  /** Indicates the level inside the taptree. */
  scriptPathLevel: number;
}

interface WalletSigner {
  walletKey: BIP32Interface;
  rootKey: BIP32Interface;
}

function getTaprootSigners(script: Buffer, walletKeys: DerivedWalletKeys): [WalletSigner, WalletSigner] {
  const parsedPublicKeys = parseTaprootScript2of3PubKeys(script);
  const walletSigners = parsedPublicKeys.map((publicKey) => {
    const index = walletKeys.publicKeys.findIndex((walletPublicKey) =>
      toXOnlyPublicKey(walletPublicKey).equals(publicKey)
    );
    if (index >= 0) {
      return { walletKey: walletKeys.triple[index], rootKey: walletKeys.parent.triple[index] };
    }
    throw new Error('Taproot public key is not a wallet public key');
  });
  return [walletSigners[0], walletSigners[1]];
}

function updatePsbtInput(
  psbt: UtxoPsbt<UtxoTransaction<bigint>>,
  inputIndex: number,
  unspent: WalletUnspent<bigint>,
  rootWalletKeys: RootWalletKeys
): void {
  const signatureCount = psbt.getSignatureCount(inputIndex);
  const scriptType = scriptTypeForChain(unspent.chain);
  if (signatureCount === 0 && scriptType === 'p2tr') {
    return;
  }
  const walletKeys = rootWalletKeys.deriveForChainAndIndex(unspent.chain, unspent.index);

  if (scriptType === 'p2tr') {
    const input = psbt.data.inputs[inputIndex];

    if (!Array.isArray(input.tapLeafScript) || input.tapLeafScript.length === 0) {
      throw new Error('Invalid PSBT state. Missing required fields.');
    }

    if (input.tapLeafScript.length > 1) {
      throw new Error('Bitgo only supports a single tap leaf script per input');
    }

    const [signer, cosigner] = getTaprootSigners(input.tapLeafScript[0].script, walletKeys);

    const leafHash = getLeafHash({
      publicKeys: walletKeys.publicKeys,
      signer: signer.walletKey.publicKey,
      cosigner: cosigner.walletKey.publicKey,
    });

    psbt.updateInput(inputIndex, {
      tapBip32Derivation: [signer, cosigner].map((walletSigner) => ({
        leafHashes: [leafHash],
        pubkey: toXOnlyPublicKey(walletSigner.walletKey.publicKey),
        path: rootWalletKeys.getDerivationPath(walletSigner.rootKey, unspent.chain, unspent.index),
        masterFingerprint: walletSigner.rootKey.fingerprint,
      })),
    });
  } else {
    if (signatureCount === 0) {
      const { witnessScript, redeemScript } = createOutputScript2of3(walletKeys.publicKeys, scriptType);
      if (witnessScript) {
        psbt.updateInput(inputIndex, { witnessScript });
      }
      if (redeemScript) {
        psbt.updateInput(inputIndex, { redeemScript });
      }
    }

    psbt.updateInput(inputIndex, {
      bip32Derivation: [0, 1, 2].map((idx) => ({
        pubkey: walletKeys.triple[idx].publicKey,
        path: walletKeys.paths[idx],
        masterFingerprint: rootWalletKeys.triple[idx].fingerprint,
      })),
    });
  }
}

/**
 * @return PSBT filled with metatdata as per input params tx, unspents and rootWalletKeys.
 * Unsigned PSBT for taproot input with witnessUtxo
 * Unsigned PSBT for other input with witnessUtxo/nonWitnessUtxo, redeemScript/witnessScript, bip32Derivation
 * Signed PSBT for taproot input with witnessUtxo, tapLeafScript, tapBip32Derivation, tapScriptSig
 * Signed PSBT for other input with witnessUtxo/nonWitnessUtxo, redeemScript/witnessScript, bip32Derivation, partialSig
 */
export function toWalletPsbt(
  tx: UtxoTransaction<bigint>,
  unspents: WalletUnspent<bigint>[],
  rootWalletKeys: RootWalletKeys
): UtxoPsbt<UtxoTransaction<bigint>> {
  const prevOutputs = unspents.map((u) => toPrevOutputWithPrevTx(u, tx.network));
  const psbt = createPsbtFromTransaction(tx, prevOutputs);
  unspents.forEach((u, i) => {
    if (isWalletUnspent(u) && u.index !== undefined) {
      updatePsbtInput(psbt, i, u, rootWalletKeys);
    }
  });
  return psbt;
}

/**
 * @param psbt
 * @param inputIndex
 * @param signer
 * @param unspent
 * @return signed PSBT with signer's key for unspent
 */
export function signWalletPsbt(
  psbt: UtxoPsbt<UtxoTransaction<bigint>>,
  inputIndex: number,
  signer: BIP32Interface,
  unspent: WalletUnspent<bigint>
): void {
  if (scriptTypeForChain(unspent.chain) === 'p2tr') {
    psbt.signTaprootInputHD(inputIndex, signer);
  } else {
    psbt.signInputHD(inputIndex, signer);
  }
}

function classifyScriptType(input: PsbtInput): ScriptType2Of3 | undefined {
  let scriptType: ScriptType2Of3 | undefined;
  if (Buffer.isBuffer(input.redeemScript) && Buffer.isBuffer(input.witnessScript)) {
    scriptType = 'p2shP2wsh';
  } else if (Buffer.isBuffer(input.redeemScript)) {
    scriptType = 'p2sh';
  } else if (Buffer.isBuffer(input.witnessScript)) {
    scriptType = 'p2wsh';
  }
  if (Array.isArray(input.tapLeafScript) && input.tapLeafScript.length > 0) {
    if (scriptType) {
      throw new Error(`Found both ${scriptType} and p2tr PSBT metadata.`);
    }
    if (input.tapLeafScript.length > 1) {
      throw new Error('Bitgo only supports a single tap leaf script per input.');
    }
    scriptType = 'p2tr';
  }
  return scriptType;
}

function parseSignatures(input: PsbtInput, scriptType: ScriptType2Of3): Signatures {
  const validate = (sig: Buffer): Buffer => {
    if (Buffer.isBuffer(sig)) {
      return sig;
    }
    throw new Error('Invalid signature type');
  };

  if (scriptType === 'p2tr') {
    if (input.partialSig && input.partialSig.length > 0) {
      throw new Error('Invalid PSBT signature state');
    }
    if (!input.tapScriptSig || input.tapScriptSig.length === 0) {
      return undefined;
    }
    if (input.tapScriptSig.length > 2) {
      throw new Error('unexpected signature count');
    }
    return input.tapScriptSig.length === 1
      ? [validate(input.tapScriptSig[0].signature)]
      : [validate(input.tapScriptSig[0].signature), validate(input.tapScriptSig[1].signature)];
  }
  if (input.tapScriptSig && input.tapScriptSig.length > 0) {
    throw new Error('Invalid PSBT signature state');
  }
  if (!input.partialSig || input.partialSig.length === 0) {
    return undefined;
  }
  if (input.partialSig.length > 2) {
    throw new Error('unexpected signature count');
  }
  return input.partialSig.length === 1
    ? [validate(input.partialSig[0].signature)]
    : [validate(input.partialSig[0].signature), validate(input.partialSig[1].signature)];
}

function parseScript(
  input: PsbtInput,
  scriptType: ScriptType2Of3
): ParsedPubScript2Of3 | ParsedPubScriptTaprootScriptPath {
  let pubScript: Buffer | undefined;
  if (scriptType === 'p2sh') {
    pubScript = input.redeemScript;
  } else if (scriptType === 'p2wsh' || scriptType === 'p2shP2wsh') {
    pubScript = input.witnessScript;
  } else {
    pubScript = input.tapLeafScript ? input.tapLeafScript[0].script : undefined;
  }
  if (!pubScript) {
    throw new Error(`Invalid PSBT state for ${scriptType}. Missing required fields.`);
  }
  return parsePubScript(pubScript, scriptType);
}

function parseInputMetadata(input: PsbtInput, scriptType: ScriptType2Of3): ParsedPsbt2Of3 | ParsedPsbtP2TR {
  const parsedPubScript = parseScript(input, scriptType);
  const signatures = parseSignatures(input, scriptType);

  if (parsedPubScript.scriptType === 'p2tr') {
    if (!input.tapLeafScript) {
      throw new Error('Invalid PSBT state for p2tr. Missing required fields.');
    }
    const controlBlock = input.tapLeafScript[0].controlBlock;
    if (!isValidControlBock(controlBlock)) {
      throw new Error('Invalid PSBT p2tr script path controlBlock.');
    }
    const scriptPathLevel = calculateScriptPathLevel(controlBlock);
    const leafVersion = getScriptPathLevel(controlBlock);
    return {
      ...parsedPubScript,
      signatures,
      controlBlock,
      scriptPathLevel,
      leafVersion,
    };
  } else {
    if (parsedPubScript.scriptType === 'p2shP2wsh') {
      parsedPubScript.redeemScript = input.redeemScript;
    }
    return {
      ...parsedPubScript,
      signatures,
    };
  }
}

/**
 * @return psbt metadata are parsed as per below conditions.
 * redeemScript/witnessScript/tapLeafScript matches BitGo.
 * signature and public key count matches BitGo.
 * P2SH => scriptType, redeemScript, public keys, signatures.
 * PW2SH => scriptType, witnessScript, public keys, signatures.
 * P2SH-PW2SH => scriptType, redeemScript, witnessScript, public keys, signatures.
 * P2TR => scriptType, pubScript (witnessScript), controlBlock, scriptPathLevel, leafVersion, public keys, signatures.
 * Any unsigned PSBT and without required metadata is returned with undefined.
 */
export function parsePsbtInput(
  psbt: UtxoPsbt<UtxoTransaction<bigint>>,
  inputIndex: number
): ParsedPsbt2Of3 | ParsedPsbtP2TR | undefined {
  const input = checkForInput(psbt.data.inputs, inputIndex);
  if (psbt.isInputFinalized(inputIndex)) {
    throw new Error('Finalized PSBT parsing is not supported');
  }
  const scriptType = classifyScriptType(input);
  if (!scriptType) {
    if (psbt.getSignatureCount(inputIndex) > 0) {
      throw new Error('Invalid PSBT state. Signatures found without scripts.');
    }
    return undefined;
  }
  return parseInputMetadata(input, scriptType);
}
