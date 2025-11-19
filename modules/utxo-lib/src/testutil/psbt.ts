import * as bitcoinjslib from 'bitcoinjs-lib';
import { ok as assert } from 'assert';

import {
  createOutputScriptP2shP2pk,
  isSupportedScriptType,
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
  addXpubsToPsbt,
  clonePsbtWithoutNonWitnessUtxo,
} from '../bitgo';
import { getNetworkList, getNetworkName, isMainnet, Network, networks } from '../networks';
import { mockReplayProtectionUnspent, mockWalletUnspent } from './mock';
import { toOutputScript } from '../address';
import { getDefaultWalletKeys, getWalletKeysForSeed } from './keys';

/**
 * This is a bit of a misnomer, as it actually specifies the spend type of the input.
 * This makes a difference for p2trMusig2 inputs, as they can be spent either by key path or script path.
 * The value p2trMusig2 is used for p2trMusig2 script path.
 * The value taprootKeyPathSpend is used for p2trMusig2 key path.
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

export const signStages = ['unsigned', 'halfsigned', 'fullsigned'] as const;
export type SignStage = (typeof signStages)[number];

/**
 * Set isInternalAddress=true for internal output address
 */
// Make script: string as instead of scriptType or address
export type Output = {
  value: bigint;
  // Determines chain code for the output
  isInternalAddress?: boolean;
  // Determines the wallet keys to use for the output. By default use root wallet keys used for the inputs.
  // When set to null, omits the derivation info and effectively makes the output non-wallet output.
  walletKeys?: RootWalletKeys | null;
} & ({ scriptType: OutputScriptType } | { address: string } | { script: string } | { opReturn: string });

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
  sign: 'halfsigned' | 'fullsigned',
  params?: {
    signers?: { signerName: KeyName; cosignerName?: KeyName };
    deterministic?: boolean;
    // For backwards compatibility keep this here.
    skipNonWitnessUtxo?: boolean;
  }
): void {
  const { signers, deterministic } = params ?? {};
  const { signerName, cosignerName } = signers ? signers : getSigners(input.scriptType);
  if (sign === 'halfsigned') {
    if (input.scriptType === 'p2shP2pk') {
      psbt.signInput(inputIndex, rootWalletKeys[signerName]);
    } else {
      psbt.signInputHD(inputIndex, rootWalletKeys[signerName]);
    }
  }
  if (sign === 'fullsigned' && cosignerName && input.scriptType !== 'p2shP2pk') {
    psbt.signInputHD(inputIndex, rootWalletKeys[cosignerName], { deterministic });
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
    // For backwards compatibility keep this here.
    skipNonWitnessUtxo?: boolean;
  }
): void {
  const { signers, deterministic } = params ?? {};
  inputs.forEach((input, inputIndex) => {
    signPsbtInput(psbt, input, inputIndex, rootWalletKeys, sign, { signers, deterministic });
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
  signStage: SignStage,
  params?: {
    signers?: { signerName: KeyName; cosignerName?: KeyName };
    deterministic?: boolean;
    skipNonWitnessUtxo?: boolean;
    addGlobalXPubs?: boolean;
  }
): UtxoPsbt {
  const { signers, deterministic, skipNonWitnessUtxo } = params ?? {};
  const totalInputAmount = inputs.reduce((sum, input) => sum + input.value, BigInt(0));
  const outputInputAmount = outputs.reduce((sum, output) => sum + output.value, BigInt(0));
  assert(totalInputAmount >= outputInputAmount, 'total output can not exceed total input');

  const psbt = createPsbtForNetwork({ network });

  if (params?.addGlobalXPubs) {
    addXpubsToPsbt(psbt, rootWalletKeys);
  }

  const unspents = inputs.map((input, i) => toUnspent(input, i, network, rootWalletKeys));

  unspents.forEach((u, i) => {
    const { signerName, cosignerName } = signers ? signers : getSigners(inputs[i].scriptType);
    if (isWalletUnspent(u) && cosignerName) {
      addWalletUnspentToPsbt(psbt, u, rootWalletKeys, signerName, cosignerName, { skipNonWitnessUtxo });
    } else {
      const { redeemScript } = createOutputScriptP2shP2pk(rootWalletKeys.user.publicKey);
      assert(redeemScript);
      addReplayProtectionUnspentToPsbt(psbt, u, redeemScript, { skipNonWitnessUtxo });
    }
  });

  outputs.forEach((output, i) => {
    if ('scriptType' in output) {
      addWalletOutputToPsbt(
        psbt,
        output.walletKeys ?? rootWalletKeys,
        output.isInternalAddress ? getInternalChainCode(output.scriptType) : getExternalChainCode(output.scriptType),
        i,
        output.value,
        { addDerivationInfo: output.walletKeys !== null }
      );
      return;
    } else if ('address' in output) {
      const { address, value } = output;
      psbt.addOutput({ script: toOutputScript(address, network), value });
      return;
    } else if ('opReturn' in output) {
      const { opReturn, value } = output;
      const script = bitcoinjslib.payments.embed({ data: [Buffer.from(opReturn, 'ascii')] }).output;
      assert(script, 'script is required');
      psbt.addOutput({ script, value });
      return;
    } else if ('script' in output) {
      const { script, value } = output;
      psbt.addOutput({ script: Buffer.from(script, 'hex'), value });
      return;
    }

    throw new Error('invalid output');
  });

  if (signStage === 'unsigned') {
    return psbt;
  }

  /* use fixed sessionId for deterministic nonce creation */
  const sessionId = Buffer.alloc(32);
  psbt.setAllInputsMusig2NonceHD(rootWalletKeys['user'], { sessionId });
  psbt.setAllInputsMusig2NonceHD(rootWalletKeys['bitgo'], { deterministic });

  signAllPsbtInputs(psbt, inputs, rootWalletKeys, 'halfsigned', { signers, skipNonWitnessUtxo });

  if (signStage === 'fullsigned') {
    signAllPsbtInputs(psbt, inputs, rootWalletKeys, signStage, { signers, deterministic, skipNonWitnessUtxo });
  }

  return psbt;
}

export const txFormats = ['psbt', 'psbt-lite'] as const;
export type TxFormat = (typeof txFormats)[number];

/**
 * Creates a valid PSBT with as many features as possible.
 *
 * - Inputs:
 *   - All wallet script types that are supported by the network.
 *   - A p2shP2pk input (for replay protection)
 * - Outputs:
 *   - All wallet script types that are supported by the network.
 *   - A p2sh output with derivation info of a different wallet (not in the global psbt xpubs)
 *   - A p2sh output with no derivation info (external output)
 *   - An OP_RETURN output
 */
export class AcidTest {
  public readonly network: Network;
  public readonly signStage: SignStage;
  public readonly txFormat: TxFormat;
  public readonly rootWalletKeys: RootWalletKeys;
  public readonly otherWalletKeys: RootWalletKeys;
  public readonly inputs: Input[];
  public readonly outputs: Output[];

  constructor(
    network: Network,
    signStage: SignStage,
    txFormat: TxFormat,
    rootWalletKeys: RootWalletKeys,
    otherWalletKeys: RootWalletKeys,
    inputs: Input[],
    outputs: Output[]
  ) {
    this.network = network;
    this.signStage = signStage;
    this.txFormat = txFormat;
    this.rootWalletKeys = rootWalletKeys;
    this.otherWalletKeys = otherWalletKeys;
    this.inputs = inputs;
    this.outputs = outputs;
  }

  static withDefaults(network: Network, signStage: SignStage, txFormat: TxFormat): AcidTest {
    const rootWalletKeys = getDefaultWalletKeys();

    const otherWalletKeys = getWalletKeysForSeed('too many secrets');
    const inputs: Input[] = inputScriptTypes
      .filter((scriptType) =>
        scriptType === 'taprootKeyPathSpend'
          ? isSupportedScriptType(network, 'p2trMusig2')
          : isSupportedScriptType(network, scriptType)
      )
      .map((scriptType) => ({ scriptType, value: BigInt(2000) }));

    const outputs: Output[] = outputScriptTypes
      .filter((scriptType) => isSupportedScriptType(network, scriptType))
      .map((scriptType) => ({ scriptType, value: BigInt(900) }));

    // Test other wallet output (with derivation info)
    outputs.push({ scriptType: 'p2sh', value: BigInt(900), walletKeys: otherWalletKeys });
    // Tes non-wallet output
    outputs.push({ scriptType: 'p2sh', value: BigInt(900), walletKeys: null });
    // Test OP_RETURN output
    outputs.push({ opReturn: 'setec astronomy', value: BigInt(0) });

    return new AcidTest(network, signStage, txFormat, rootWalletKeys, otherWalletKeys, inputs, outputs);
  }

  get name(): string {
    const networkName = getNetworkName(this.network);
    return `${networkName} ${this.signStage} ${this.txFormat}`;
  }

  getReplayProtectionOutputScript(): Buffer {
    const { scriptPubKey } = createOutputScriptP2shP2pk(this.rootWalletKeys.user.publicKey);
    assert(scriptPubKey);
    return scriptPubKey;
  }

  createPsbt(): UtxoPsbt {
    const psbt = constructPsbt(this.inputs, this.outputs, this.network, this.rootWalletKeys, this.signStage, {
      deterministic: true,
      addGlobalXPubs: true,
    });
    if (this.txFormat === 'psbt-lite') {
      return clonePsbtWithoutNonWitnessUtxo(psbt);
    }
    return psbt;
  }

  static suite(): AcidTest[] {
    return getNetworkList()
      .filter((network) => isMainnet(network) && network !== networks.bitcoinsv)
      .flatMap((network) =>
        signStages.flatMap((signStage) =>
          txFormats.flatMap((txFormat) => AcidTest.withDefaults(network, signStage, txFormat))
        )
      );
  }
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
