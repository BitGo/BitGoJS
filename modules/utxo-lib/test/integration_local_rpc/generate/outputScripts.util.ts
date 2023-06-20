import { BIP32Interface } from 'bip32';
import { Transaction, TxOutput } from 'bitcoinjs-lib';
import * as utxolib from '../../../src';
import {
  createOutputScript2of3,
  isScriptType2Of3,
  isSupportedScriptType,
  ScriptType2Of3,
  scriptTypes2Of3,
} from '../../../src/bitgo/outputScripts';
import { getDefaultCosigner, KeyTriple } from '../../../src/testutil';

import {
  isTriple,
  createTransactionBuilderForNetwork,
  createTransactionFromBuffer,
  signInput2Of3,
  TxOutPoint,
  UtxoTransaction,
  createPsbtForNetwork,
  ChainCode,
  RootWalletKeys,
  addWalletUnspentToPsbt,
  fromOutputWithPrevTx,
  WalletUnspent,
  KeyName,
  addWalletOutputToPsbt,
  Tuple,
} from '../../../src/bitgo';
import { scriptTypeForChain } from '../../../src/bitgo';

export const scriptTypesSingleSig = ['p2pkh', 'p2wkh'] as const;
export type ScriptTypeSingleSig = (typeof scriptTypesSingleSig)[number];

export const scriptTypes = [...scriptTypesSingleSig, ...scriptTypes2Of3];
export type ScriptType = ScriptType2Of3 | ScriptTypeSingleSig;

type Network = utxolib.Network;

export function isSupportedDepositType(network: Network, scriptType: ScriptType): boolean {
  if (scriptType === 'p2pkh') {
    return true;
  }

  if (scriptType === 'p2wkh') {
    return utxolib.supportsSegwit(network);
  }

  return isSupportedScriptType(network, scriptType);
}

export function isSupportedSpendType(network: Network, scriptType: ScriptType): boolean {
  return isScriptType2Of3(scriptType) && isSupportedScriptType(network, scriptType);
}

/**
 *
 * @param keys - Pubkeys to use for generating the address.
 *               If scriptType is single-sig, the first key will be used.
 * @param scriptType
 * @param network
 * @return {Buffer} scriptPubKey
 */
export function createScriptPubKey(keys: KeyTriple, scriptType: ScriptType, network: Network): Buffer {
  const pubkeys = keys.map((k) => k.publicKey);

  switch (scriptType) {
    case 'p2sh':
    case 'p2shP2wsh':
    case 'p2wsh':
    case 'p2tr':
    case 'p2trMusig2':
      return createOutputScript2of3(pubkeys, scriptType).scriptPubKey;
    case 'p2pkh':
      return utxolib.payments.p2pkh({ pubkey: keys[0].publicKey }).output as Buffer;
    case 'p2wkh':
      return utxolib.payments.p2wpkh({ pubkey: keys[0].publicKey }).output as Buffer;
    default:
      throw new Error(`unsupported output type ${scriptType}`);
  }
}

export function createSpendTransactionFromPrevOutputs<TNumber extends number | bigint>(
  keys: KeyTriple,
  scriptType: ScriptType2Of3,
  prevOutputs: (TxOutPoint & TxOutput<TNumber>)[],
  recipientScript: Buffer,
  network: Network,
  {
    signKeys = [keys[0], keys[2]],
    version,
    amountType,
  }: { signKeys?: BIP32Interface[]; version?: number; amountType?: 'number' | 'bigint' } = {}
): UtxoTransaction<TNumber> {
  if (signKeys.length !== 1 && signKeys.length !== 2) {
    throw new Error(`signKeys length must be 1 or 2`);
  }

  const txBuilder = createTransactionBuilderForNetwork<TNumber>(network, { version });

  prevOutputs.forEach(({ txid, vout, script, value }, i) => {
    txBuilder.addInput(txid, vout, undefined, script, value);
  });

  const inputSum = prevOutputs.reduce((sum, { value }) => sum + BigInt(value), BigInt(0));
  const fee = network === utxolib.networks.dogecoinTest ? BigInt(1_000_000) : BigInt(1_000);
  const outputValue = inputSum - fee;

  txBuilder.addOutput(recipientScript, (amountType === 'number' ? Number(outputValue) : outputValue) as TNumber);

  const publicKeys = keys.map((k) => k.publicKey);
  if (!isTriple(publicKeys)) {
    throw new Error();
  }

  prevOutputs.forEach(({ value }, vin) => {
    signKeys.forEach((key) => {
      signInput2Of3(txBuilder, vin, scriptType, publicKeys, key, getDefaultCosigner(publicKeys, key.publicKey), value);
    });
  });

  if (signKeys.length === 1) {
    return txBuilder.buildIncomplete() as UtxoTransaction<TNumber>;
  }
  return txBuilder.build() as UtxoTransaction<TNumber>;
}

export function createSpendTransaction<TNumber extends number | bigint = number>(
  keys: KeyTriple,
  scriptType: ScriptType2Of3,
  inputTxs: Buffer[],
  recipientScript: Buffer,
  network: Network,
  version?: number,
  amountType?: 'number' | 'bigint'
): Transaction<TNumber> {
  const matches: (TxOutPoint & TxOutput<TNumber>)[] = inputTxs
    .map((inputTxBuffer): (TxOutPoint & TxOutput<TNumber>)[] => {
      const inputTx = createTransactionFromBuffer<TNumber>(inputTxBuffer, network, { amountType });

      const { scriptPubKey } = createOutputScript2of3(
        keys.map((k) => k.publicKey),
        scriptType as ScriptType2Of3
      );

      return inputTx.outs
        .map((o, vout): (TxOutPoint & TxOutput<TNumber>) | undefined => {
          if (!scriptPubKey.equals(o.script)) {
            return;
          }
          return {
            txid: inputTx.getId(),
            vout,
            value: o.value,
            script: o.script,
          };
        })
        .filter((v): v is TxOutPoint & TxOutput<TNumber> => v !== undefined);
    })
    .reduce((all, matches) => [...all, ...matches]);

  if (!matches.length) {
    throw new Error(`could not find matching outputs in funding transaction`);
  }

  return createSpendTransactionFromPrevOutputs<TNumber>(keys, scriptType, matches, recipientScript, network, {
    version,
    amountType,
  });
}

export function createPsbtSpendTransactionFromPrevTx(
  rootWalletKeys: RootWalletKeys,
  unspents: WalletUnspent<bigint>[],
  network: Network,
  signers: Tuple<KeyName> = ['user', 'bitgo'],
  version?: number
): UtxoTransaction<bigint> {
  const psbt = createPsbtForNetwork({ network }, { version });

  unspents.forEach((u, index) => {
    addWalletUnspentToPsbt(psbt, u, rootWalletKeys, signers[0], signers[1]);
  });

  const inputSum = unspents.reduce((sum, { value }) => sum + BigInt(value), BigInt(0));
  const fee = network === utxolib.networks.dogecoinTest ? BigInt(1_000_000) : BigInt(1_000);
  const outputValue = inputSum - fee;

  addWalletOutputToPsbt(psbt, rootWalletKeys, unspents[0].chain, unspents[0].index, outputValue);

  signers.forEach((keyName) => {
    psbt.setAllInputsMusig2NonceHD(rootWalletKeys[keyName]);
  });

  signers.forEach((keyName) => {
    psbt.signAllInputsHD(rootWalletKeys[keyName]);
  });

  if (!psbt.validateSignaturesOfAllInputs()) {
    throw new Error('psbt sig validation fails');
  }

  psbt.finalizeAllInputs();
  return psbt.extractTransaction();
}

export function createPsbtSpendTransaction<TNumber extends number | bigint = number>({
  rootWalletKeys,
  signers,
  chain,
  index,
  inputTxs,
  network,
  version,
  amountType,
}: {
  rootWalletKeys: RootWalletKeys;
  signers: Tuple<KeyName>;
  chain: ChainCode;
  index: number;
  inputTxs: Buffer[];
  network: Network;
  version?: number;
  amountType?: 'number' | 'bigint';
}): Transaction<TNumber> {
  const walletKeys = rootWalletKeys.deriveForChainAndIndex(chain, index);
  const { scriptPubKey } = createOutputScript2of3(walletKeys.publicKeys, scriptTypeForChain(chain));

  const matches = inputTxs
    .map((inputTxBuffer): WalletUnspent<bigint>[] => {
      const inputTx = createTransactionFromBuffer<bigint>(inputTxBuffer, network, { amountType: 'bigint' });

      return inputTx.outs
        .map((o, vout): WalletUnspent<bigint> | undefined => {
          if (!scriptPubKey.equals(o.script)) {
            return;
          }
          return { chain, index, ...fromOutputWithPrevTx<bigint>(inputTx, vout) };
        })
        .filter((v): v is WalletUnspent<bigint> => v !== undefined);
    })
    .reduce((all, matches) => [...all, ...matches]);

  if (!matches.length) {
    throw new Error(`could not find matching outputs in funding transaction`);
  }

  const tx = createPsbtSpendTransactionFromPrevTx(rootWalletKeys, matches, network, signers, version);
  return tx.clone(amountType) as Transaction<TNumber>;
}

/**
 * @returns BIP32 hardcoded index for p2trMusig2 spend type. 0 for key path and 100 for script path.
 * For same fixture key triple and script type (p2trMusig2),
 * we need 2 different deposit and spend tx fixtures.
 */
export function getP2trMusig2Index(spendType: 'keyPath' | 'scriptPath'): number {
  return spendType === 'keyPath' ? 0 : 100;
}
