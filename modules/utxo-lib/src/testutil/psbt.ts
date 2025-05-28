import * as assert from 'assert';
import { varuint } from 'bitcoinjs-lib/src/bufferutils';
import * as crypto from 'crypto';

import {
  createOutputScriptP2shP2pk,
  ScriptType,
  ScriptType2Of3,
  scriptTypeP2shP2pk,
  scriptTypes2Of3,
} from '../bitgo/outputScripts';
import {
  addReplayProtectionUnspentToPsbt,
  addWalletOutputToPsbt,
  addWalletUnspentToPsbt,
  createPsbtForNetwork,
  getExternalChainCode,
  getInternalChainCode,
  getSignatureVerifications,
  isWalletUnspent,
  KeyName,
  parseSignatureScript2Of3,
  RootWalletKeys,
  toOutput,
  Unspent,
  UtxoPsbt,
  UtxoTransaction,
  verifySignatureWithUnspent,
  withUnsafeNonSegwit,
} from '../bitgo';
import { Network } from '../networks';
import { mockReplayProtectionUnspent, mockWalletUnspent } from './mock';
import { toOutputScript } from '../address';

/**
 * input script type and value.
 * use p2trMusig2 for p2trMusig2 script path.
 * use taprootKeyPathSpend for p2trMusig2 key path.
 */
export type InputScriptType = ScriptType | 'taprootKeyPathSpend';
export type OutputScriptType = ScriptType2Of3;

/**
 * input script type and value
 */
export type Input = {
  scriptType: InputScriptType;
  value: bigint;
};

/**
 * Set isInternalAddress=true for internal output address
 */
// Make script: string as instead of scriptType or address
export type Output = {
  value: bigint;
  isInternalAddress?: boolean;
} & ({ scriptType: OutputScriptType } | { address: string } | { script: string });

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
    return mockReplayProtectionUnspent(network, input.value, {
      key: rootWalletKeys['user'],
      vout: index,
    });
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
export function getSigners(inputType: InputScriptType): {
  signerName: KeyName;
  cosignerName?: KeyName;
} {
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
  sign: 'halfsigned' | 'fullsigned',
  params?: {
    signers?: { signerName: KeyName; cosignerName?: KeyName };
    deterministic?: boolean;
    skipNonWitnessUtxo?: boolean;
  }
): void {
  function signPsbt(psbt: UtxoPsbt, signFunc: () => void, skipNonWitnessUtxo?: boolean) {
    if (skipNonWitnessUtxo) {
      withUnsafeNonSegwit(psbt, signFunc);
    } else {
      signFunc();
    }
  }

  const { signers, deterministic, skipNonWitnessUtxo } = params ?? {};
  const { signerName, cosignerName } = signers ? signers : getSigners(input.scriptType);
  if (sign === 'halfsigned') {
    if (input.scriptType === 'p2shP2pk') {
      signPsbt(psbt, () => psbt.signInput(inputIndex, rootWalletKeys[signerName]), skipNonWitnessUtxo);
    } else {
      signPsbt(psbt, () => psbt.signInputHD(inputIndex, rootWalletKeys[signerName]), skipNonWitnessUtxo);
    }
  }
  if (sign === 'fullsigned' && cosignerName && input.scriptType !== 'p2shP2pk') {
    signPsbt(
      psbt,
      () =>
        psbt.signInputHD(inputIndex, rootWalletKeys[cosignerName], {
          deterministic,
        }),
      skipNonWitnessUtxo
    );
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
  sign: 'halfsigned' | 'fullsigned',
  params?: {
    signers?: { signerName: KeyName; cosignerName?: KeyName };
    deterministic?: boolean;
    skipNonWitnessUtxo?: boolean;
  }
): void {
  const { signers, deterministic, skipNonWitnessUtxo } = params ?? {};
  inputs.forEach((input, inputIndex) => {
    signPsbtInput(psbt, input, inputIndex, rootWalletKeys, sign, {
      signers,
      deterministic,
      skipNonWitnessUtxo,
    });
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
  sign: 'unsigned' | 'halfsigned' | 'fullsigned',
  params?: {
    signers?: { signerName: KeyName; cosignerName?: KeyName };
    deterministic?: boolean;
    skipNonWitnessUtxo?: boolean;
  }
): UtxoPsbt {
  const { signers, deterministic, skipNonWitnessUtxo } = params ?? {};
  const totalInputAmount = inputs.reduce((sum, input) => sum + input.value, BigInt(0));
  const outputInputAmount = outputs.reduce((sum, output) => sum + output.value, BigInt(0));
  assert(totalInputAmount >= outputInputAmount, 'total output can not exceed total input');

  const psbt = createPsbtForNetwork({ network });
  const unspents = inputs.map((input, i) => toUnspent(input, i, network, rootWalletKeys));

  unspents.forEach((u, i) => {
    const { signerName, cosignerName } = signers ? signers : getSigners(inputs[i].scriptType);
    if (isWalletUnspent(u) && cosignerName) {
      addWalletUnspentToPsbt(psbt, u, rootWalletKeys, signerName, cosignerName, { skipNonWitnessUtxo });
    } else {
      const { redeemScript } = createOutputScriptP2shP2pk(rootWalletKeys[signerName].publicKey);
      assert(redeemScript);
      addReplayProtectionUnspentToPsbt(psbt, u, redeemScript, {
        skipNonWitnessUtxo,
      });
    }
  });

  outputs.forEach((output, i) => {
    if ('scriptType' in output) {
      addWalletOutputToPsbt(
        psbt,
        rootWalletKeys,
        output.isInternalAddress ? getInternalChainCode(output.scriptType) : getExternalChainCode(output.scriptType),
        i,
        output.value
      );
    } else if ('address' in output) {
      const { address, value } = output;
      psbt.addOutput({ script: toOutputScript(address, network), value });
    } else if ('script' in output) {
      const { script, value } = output;
      psbt.addOutput({ script: Buffer.from(script, 'hex'), value });
    }
  });

  if (sign === 'unsigned') {
    return psbt;
  }

  psbt.setAllInputsMusig2NonceHD(rootWalletKeys['user']);
  psbt.setAllInputsMusig2NonceHD(rootWalletKeys['bitgo'], { deterministic });

  signAllPsbtInputs(psbt, inputs, rootWalletKeys, 'halfsigned', {
    signers,
    skipNonWitnessUtxo,
  });

  if (sign === 'fullsigned') {
    signAllPsbtInputs(psbt, inputs, rootWalletKeys, sign, {
      signers,
      deterministic,
      skipNonWitnessUtxo,
    });
  }

  return psbt;
}

/**
 * Verifies signatures of fully signed tx (with taproot key path support).
 * NOTE: taproot key path tx can only be built and signed with PSBT.
 */
export function verifyFullySignedSignatures(
  tx: UtxoTransaction<bigint>,
  unspents: Unspent<bigint>[],
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

/** We have a mirrored function similar to our hsm that generates our Bitcoin signed
 * message so that we can use for testing. This creates a random entropy as well using
 * the nilUUID structure to construct our uuid buffer and given our address we can
 * directly encode it into our message.
 *
 * @param attestationPrvKey
 * @param uuid
 * @param address
 * @returns
 */
export function generatePayGoAttestationProof(uuid: string, address: Buffer): Buffer {
  // <0x18Bitcoin Signed Message:\n
  const prefixByte = Buffer.from([0x18]);
  const prefixMessage = Buffer.from('Bitcoin Signed Message:\n');
  const prefixBuffer = Buffer.concat([prefixByte, prefixMessage]);

  // <ENTROPY>
  const entropyLength = 64;
  const entropy = crypto.randomBytes(entropyLength);

  // <UUID>
  const uuidBuffer = Buffer.from(uuid);
  const uuidBufferLength = uuidBuffer.length;

  // <ADDRESS>
  const addressBufferLength = address.length;

  // <VARINT_LENGTH>
  const msgLength = entropyLength + addressBufferLength + uuidBufferLength;
  const msgLengthBuffer = varuint.encode(msgLength);

  // <0x18Bitcoin Signed Message:\n<LENGTH><ENTROPY><ADDRESS><UUID>
  const proofMessage = Buffer.concat([prefixBuffer, msgLengthBuffer, entropy, address, uuidBuffer]);

  // we sign this with the priv key
  // don't know what sign function to call. Since this is just a mirrored function don't know if we need
  // to include this part.
  // const signedMsg = sign(attestationPrvKey, proofMessage);
  return proofMessage;
}
