import * as assert from 'assert';

import { Transaction } from 'bitcoinjs-lib';
import { BIP32Interface } from 'bip32';
import { checkForInput } from 'bip174/src/lib/utils';
import { TapBip32Derivation } from 'bip174/src/lib/interfaces';

import {
  createOutputScriptP2shP2pk,
  ScriptType,
  ScriptType2Of3,
  scriptTypeP2shP2pk,
  scriptTypes2Of3,
} from '../bitgo/outputScripts';
import * as musig2 from '../bitgo/Musig2';
import {
  addReplayProtectionUnspentToPsbt,
  addWalletOutputToPsbt,
  addWalletUnspentToPsbt,
  createPsbtForNetwork,
  getExternalChainCode,
  getSignatureVerifications,
  isWalletUnspent,
  KeyName,
  parseSignatureScript2Of3,
  getInternalChainCode,
  HDTaprootMusig2Signer,
  HDTaprootSigner,
  Musig2Signer,
  RootWalletKeys,
  toOutput,
  Unspent,
  UtxoPsbt,
  UtxoTransaction,
  verifySignatureWithUnspent,
  WalletUnspent,
} from '../bitgo';
import { Network } from '../networks';
import { mockReplayProtectionUnspent, mockWalletUnspent } from './mock';

/**
 * input script type and value.
 * use p2trMusig2 for p2trMusig2 script path.
 * use taprootKeyPathSpend for p2trMusig2 key path.
 */
export type InputScriptType = ScriptType | 'taprootKeyPathSpend';
export type OutputScriptType = ScriptType2Of3;

/**
 * output script type and value
 */
export interface Input {
  scriptType: InputScriptType;
  value: bigint;
}

/**
 * set isInternalAddress=true for internal output address
 */
export interface Output {
  scriptType: OutputScriptType;
  value: bigint;
  isInternalAddress?: boolean;
}

/**
 * array of supported input script types.
 * use p2trMusig2 for p2trMusig2 script path.
 * use taprootKeyPathSpend for p2trMusig2 key path.
 */
export const inputScriptTypes = [...scriptTypes2Of3, 'taprootKeyPathSpend', scriptTypeP2shP2pk] as const;

/**
 * array of supported output script types.
 */
export const outputScriptTypes = scriptTypes2Of3;

/**
 * create unspent object from input script type, index, network and root wallet key.
 */
export function toUnspent(
  input: Input,
  index: number,
  network: Network,
  rootWalletKeys: RootWalletKeys
): Unspent<bigint> {
  if (input.scriptType === 'p2shP2pk') {
    return mockReplayProtectionUnspent(network, input.value, { key: rootWalletKeys['user'], vout: index });
  } else {
    const chain = getInternalChainCode(input.scriptType === 'taprootKeyPathSpend' ? 'p2trMusig2' : input.scriptType);
    return mockWalletUnspent(network, input.value, {
      chain,
      vout: index,
      keys: rootWalletKeys,
      index,
    });
  }
}

/**
 * returns signer and cosigner names for InputScriptType.
 * user and undefined as signer and cosigner respectively for p2shP2pk.
 * user and backup as signer and cosigner respectively for p2trMusig2.
 * user and bitgo as signer and cosigner respectively for other input script types.
 */
export function getSigners(inputType: InputScriptType): { signerName: KeyName; cosignerName?: KeyName } {
  return {
    signerName: 'user',
    cosignerName: inputType === 'p2shP2pk' ? undefined : inputType === 'p2trMusig2' ? 'backup' : 'bitgo',
  };
}

/**
 * signs with first or second signature for single input.
 * p2shP2pk is signed only with first sign.
 */
export function signPsbtInput(
  psbt: UtxoPsbt,
  input: Input,
  inputIndex: number,
  rootWalletKeys: RootWalletKeys,
  sign: 'halfsigned' | 'fullsigned'
): void {
  const { signerName, cosignerName } = getSigners(input.scriptType);
  if (sign === 'halfsigned') {
    if (input.scriptType === 'p2shP2pk') {
      psbt.signInput(inputIndex, rootWalletKeys[signerName]);
    } else {
      psbt.signInputHD(inputIndex, rootWalletKeys[signerName]);
    }
  }
  if (sign === 'fullsigned' && cosignerName) {
    psbt.signInputHD(inputIndex, rootWalletKeys[cosignerName]);
  }
}

/**
 * signs with first or second signature for all inputs.
 * p2shP2pk is signed only with first sign.
 */
export function signAllPsbtInputs(
  psbt: UtxoPsbt,
  inputs: Input[],
  rootWalletKeys: RootWalletKeys,
  sign: 'halfsigned' | 'fullsigned'
): void {
  inputs.forEach((input, index) => {
    signPsbtInput(psbt, input, index, rootWalletKeys, sign);
  });
}

/**
 * construct psbt for given inputs, outputs, network and root wallet keys.
 */
export function constructPsbt(
  inputs: Input[],
  outputs: Output[],
  network: Network,
  rootWalletKeys: RootWalletKeys,
  sign: 'unsigned' | 'halfsigned' | 'fullsigned'
): UtxoPsbt {
  const totalInputAmount = inputs.reduce((sum, input) => sum + input.value, BigInt(0));
  const outputInputAmount = outputs.reduce((sum, output) => sum + output.value, BigInt(0));
  assert(totalInputAmount >= outputInputAmount, 'total output can not exceed total input');

  const psbt = createPsbtForNetwork({ network });
  const unspents = inputs.map((input, i) => toUnspent(input, i, network, rootWalletKeys));

  unspents.forEach((u, i) => {
    const { signerName, cosignerName } = getSigners(inputs[i].scriptType);
    if (isWalletUnspent(u) && cosignerName) {
      addWalletUnspentToPsbt(psbt, u, rootWalletKeys, signerName, cosignerName);
    } else {
      const { redeemScript } = createOutputScriptP2shP2pk(rootWalletKeys[signerName].publicKey);
      assert(redeemScript);
      addReplayProtectionUnspentToPsbt(psbt, u, redeemScript);
    }
  });

  outputs.forEach((output, i) => {
    addWalletOutputToPsbt(
      psbt,
      rootWalletKeys,
      output.isInternalAddress ? getInternalChainCode(output.scriptType) : getExternalChainCode(output.scriptType),
      i,
      output.value
    );
  });

  if (sign === 'unsigned') {
    return psbt;
  }

  psbt.setAllInputsMusig2NonceHD(rootWalletKeys['user']);
  psbt.setAllInputsMusig2NonceHD(rootWalletKeys['bitgo']);

  signAllPsbtInputs(psbt, inputs, rootWalletKeys, 'halfsigned');

  if (sign === 'fullsigned') {
    signAllPsbtInputs(psbt, inputs, rootWalletKeys, sign);
  }

  return psbt;
}

/**
 * Verifies signatures of fully signed tx (with taproot key path support).
 * NOTE: taproot key path tx can only be built and signed with PSBT.
 */
export function verifyFullySignedSignatures(
  tx: UtxoTransaction<bigint>,
  unspents: WalletUnspent<bigint>[],
  walletKeys: RootWalletKeys,
  signer: KeyName,
  cosigner: KeyName
): boolean {
  const prevOutputs = unspents.map((u) => toOutput(u, tx.network));
  return unspents.every((u, index) => {
    if (parseSignatureScript2Of3(tx.ins[index]).scriptType === 'taprootKeyPathSpend') {
      const result = getSignatureVerifications(tx, index, u.value, undefined, prevOutputs);
      return result.length === 1 && result[0].signature;
    } else {
      const result = verifySignatureWithUnspent(tx, index, unspents, walletKeys);
      if ((signer === 'user' && cosigner === 'bitgo') || (signer === 'bitgo' && cosigner === 'user')) {
        return result[0] && !result[1] && result[2];
      } else if ((signer === 'user' && cosigner === 'backup') || (signer === 'backup' && cosigner === 'user')) {
        return result[0] && result[1] && !result[2];
      } else {
        return !result[0] && result[1] && result[2];
      }
    }
  });
}

export function getTaprootSigners(
  psbt: UtxoPsbt,
  inputIndex: number,
  keypair: BIP32Interface
): HDTaprootSigner[] | HDTaprootMusig2Signer[] {
  const input = checkForInput(psbt.data.inputs, inputIndex);
  if (!input.tapBip32Derivation || input.tapBip32Derivation.length === 0) {
    throw new Error('Need tapBip32Derivation to sign Taproot with HD');
  }
  const myDerivations = input.tapBip32Derivation
    .map((bipDv) => {
      if (bipDv.masterFingerprint.equals(keypair.fingerprint)) {
        return bipDv;
      }
    })
    .filter((v) => !!v) as TapBip32Derivation[];
  if (myDerivations.length === 0) {
    throw new Error('Need one tapBip32Derivation masterFingerprint to match the HDSigner fingerprint');
  }

  function getDerivedNode(bipDv: TapBip32Derivation): HDTaprootMusig2Signer | HDTaprootSigner {
    const node = keypair.derivePath(bipDv.path);
    if (!bipDv.pubkey.equals(node.publicKey.slice(1))) {
      throw new Error('pubkey did not match tapBip32Derivation');
    }
    return node;
  }

  if (input.tapLeafScript?.length) {
    return myDerivations.map((bipDv) => {
      const signer = getDerivedNode(bipDv);
      if (!('signSchnorr' in signer)) {
        throw new Error('signSchnorr function is required to sign p2tr');
      }
      return signer;
    });
  } else if (input.tapInternalKey?.length) {
    return myDerivations.map((bipDv) => {
      const signer = getDerivedNode(bipDv);
      if (!('privateKey' in signer) || !signer.privateKey) {
        throw new Error('privateKey is required to sign p2tr musig2');
      }
      return signer;
    });
  }
  throw new Error(`taproot input #${inputIndex} failed to get signers`);
}

export function addDeterministicNoncesToPsbt(psbt: UtxoPsbt, keypair: BIP32Interface): UtxoPsbt {
  psbt.data.inputs.forEach((input, inputIndex) => {
    if (!input.tapMerkleRoot || !input.tapInternalKey) {
      return;
    }
    const derivedKey = input.tapBip32Derivation ? UtxoPsbt.deriveKeyPair(keypair, input.tapBip32Derivation) : keypair;
    assert.ok(derivedKey);
    assert.ok(derivedKey.privateKey);

    const participants = musig2.parsePsbtMusig2Participants(psbt, inputIndex);
    assert.ok(participants);
    musig2.assertPsbtMusig2Participants(participants, input.tapInternalKey, input.tapMerkleRoot);
    const { tapOutputKey, participantPubKeys } = participants;
    const participantPubKey = participantPubKeys.find((pubKey) => pubKey.equals(derivedKey.publicKey));

    // If the bitgo pubkey is not within the participants, then this musig2 input doesnt use this key. Skip
    if (!participantPubKey) {
      return;
    }
    assert.ok(participantPubKeys[1].equals(derivedKey.publicKey));

    const { hash } = psbt.getTaprootHashForSig(inputIndex);

    const musigNonces = musig2.parsePsbtMusig2Nonces(psbt, inputIndex);
    assert.ok(musigNonces);
    const userNonce = musigNonces.find((kv) => kv.participantPubKey.equals(participantPubKeys[0]));
    assert.ok(userNonce);

    const pubNonce = musig2.createMusig2DeterministicNonce({
      privateKey: derivedKey.privateKey,
      otherNonce: userNonce.pubNonce,
      publicKeys: participantPubKeys,
      internalPubKey: input.tapInternalKey,
      tapTreeRoot: input.tapMerkleRoot,
      hash,
    });
    const nonce = { tapOutputKey, participantPubKey, pubNonce };
    psbt.addOrUpdateProprietaryKeyValToInput(inputIndex, musig2.encodePsbtMusig2PubNonce(nonce));
  });
  return psbt;
}

/**
 * General flow is copied from UtxoPsbt.signAllInputsHD going into UtxoPsbt.signTaprootMusig2Input.
 *
 * This only adds signatures to musig2 inputs
 * @param psbt
 * @param keypair
 */
export function addDeterministicMusig2SignaturesToPsbt(
  psbt: UtxoPsbt,
  inputIndex: number,
  signer: Musig2Signer,
  sighashTypes: number[] = [Transaction.SIGHASH_DEFAULT, Transaction.SIGHASH_ALL]
): void {
  const input = checkForInput(psbt.data.inputs, inputIndex);

  if (!input.tapBip32Derivation?.length) {
    return;
  }

  if (!input.tapInternalKey || !input.tapMerkleRoot) {
    return;
  }
  assert.ok(input.tapInternalKey);
  assert.ok(input.tapMerkleRoot);

  const participants = musig2.parsePsbtMusig2Participants(psbt, inputIndex);
  assert.ok(participants);
  const { tapOutputKey, participantPubKeys } = participants;
  const signerPubKey = participantPubKeys.find((pubKey) => pubKey.equals(signer.publicKey));
  assert.ok(signerPubKey);
  if (!participantPubKeys[1].equals(signer.publicKey)) {
    return;
  }

  const nonces = musig2.parsePsbtMusig2Nonces(psbt, inputIndex);
  assert.ok(nonces);
  const userNonce = nonces.find((n) => !n.participantPubKey.equals(signerPubKey));
  assert.ok(userNonce);

  const { hash, sighashType } = psbt.getTaprootHashForSig(inputIndex, sighashTypes);

  let partialSig = musig2.musig2DeterministicSign({
    privateKey: signer.privateKey,
    otherNonce: userNonce.pubNonce,
    publicKeys: participantPubKeys,
    internalPubKey: input.tapInternalKey,
    tapTreeRoot: input.tapMerkleRoot,
    hash,
  }).sig;

  if (sighashType !== Transaction.SIGHASH_DEFAULT) {
    partialSig = Buffer.concat([partialSig, Buffer.of(sighashType)]);
  }

  const sig = musig2.encodePsbtMusig2PartialSig({
    participantPubKey: signerPubKey,
    tapOutputKey,
    partialSig: partialSig,
  });
  psbt.addProprietaryKeyValToInput(inputIndex, sig);
}
