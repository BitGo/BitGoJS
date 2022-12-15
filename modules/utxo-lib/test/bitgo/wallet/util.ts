import { Network } from '../../../src';
import {
  formatOutputId,
  WalletUnspent,
  NonWitnessWalletUnspent,
  ChainCode,
  createPsbtForNetwork,
  Unspent,
  UnspentWithPrevTx,
  UtxoTransaction,
  fromOutputWithPrevTx,
  isSegwit,
  fromOutput,
  outputScripts,
  getExternalChainCode,
} from '../../../src/bitgo';

import {
  createOutputScript2of3,
  createOutputScriptP2shP2pk,
  scriptTypeForChain,
} from '../../../src/bitgo/outputScripts';
import { RootWalletKeys } from '../../../src/bitgo/wallet/WalletKeys';
import { fromOutputScript } from '../../../src/address';

import { getDefaultWalletKeys, getKey } from '../../testutil';
import { mockTransactionId } from '../../transaction_util';
import * as utxolib from '../../../src';
import * as noble from '@noble/secp256k1';
import { BIP32Interface } from 'bip32';
import { InputType } from '../psbt/Psbt';

export function mockOutputId(vout: number): string {
  return formatOutputId({
    txid: mockTransactionId(),
    vout,
  });
}

export function mockPrevTx(
  vout: number,
  outputScript: Buffer,
  value: bigint,
  network: Network
): UtxoTransaction<bigint> {
  const psbtFromNetwork = createPsbtForNetwork({ network });

  const privKey = noble.utils.randomPrivateKey();
  const pubkey = Buffer.from(noble.getPublicKey(privKey, true));
  const payment = utxolib.payments.p2wpkh({ pubkey });
  const destOutput = payment.output;
  if (!destOutput) throw new Error('Impossible, payment we just constructed has no output');

  for (let index = 0; index <= vout; index++) {
    if (index === vout) {
      psbtFromNetwork.addOutput({ script: outputScript, value });
    } else {
      psbtFromNetwork.addOutput({ script: destOutput, value });
    }
  }
  psbtFromNetwork.addInput({
    hash: Buffer.alloc(32, 0x01),
    index: 0,
    witnessUtxo: { script: destOutput, value: value * (BigInt(vout) + BigInt(1)) + BigInt(1000) },
  });
  psbtFromNetwork.signInput(0, {
    publicKey: pubkey,
    sign: (hash: Buffer, lowR?: boolean) =>
      Buffer.from(noble.signSync(hash, privKey, { canonical: !lowR, der: false })),
  });
  psbtFromNetwork.validateSignaturesOfAllInputs();
  psbtFromNetwork.finalizeAllInputs();
  return psbtFromNetwork.extractTransaction() as UtxoTransaction<bigint>;
}

export const replayProtectionKeyPair = getKey('replay-protection');
const replayProtectionScriptPubKey = createOutputScriptP2shP2pk(replayProtectionKeyPair.publicKey).scriptPubKey;

export function isReplayProtectionUnspent<TNumber extends bigint | number>(
  u: Unspent<TNumber>,
  network: Network
): boolean {
  return u.address === fromOutputScript(replayProtectionScriptPubKey, network);
}

export function mockReplayProtectionUnspent<TNumber extends number | bigint>(
  network: Network,
  value: TNumber,
  { key = replayProtectionKeyPair, vout = 0 }: { key?: BIP32Interface; vout?: number } = {}
): UnspentWithPrevTx<TNumber> {
  const outputScript = createOutputScriptP2shP2pk(key.publicKey).scriptPubKey;
  const prevTransaction = mockPrevTx(vout, outputScript, BigInt(value), network);
  return { ...fromOutputWithPrevTx(prevTransaction, vout), value };
}

export function mockWalletUnspent<TNumber extends number | bigint>(
  network: Network,
  value: TNumber,
  {
    chain = 0,
    index = 0,
    keys = getDefaultWalletKeys(),
    vout = 0,
    id,
  }: { chain?: ChainCode; index?: number; keys?: RootWalletKeys; vout?: number; id?: string } = {}
): WalletUnspent<TNumber> | NonWitnessWalletUnspent<TNumber> {
  const derivedKeys = keys.deriveForChainAndIndex(chain, index);
  const address = fromOutputScript(
    createOutputScript2of3(derivedKeys.publicKeys, scriptTypeForChain(chain)).scriptPubKey,
    network
  );
  if (id && typeof id === 'string') {
    return { id, address, chain, index, value };
  } else {
    const prevTransaction = mockPrevTx(
      vout,
      createOutputScript2of3(derivedKeys.publicKeys, scriptTypeForChain(chain), network).scriptPubKey,
      BigInt(value),
      network
    );
    const unspent = isSegwit(chain) ? fromOutput(prevTransaction, vout) : fromOutputWithPrevTx(prevTransaction, vout);
    return {
      ...unspent,
      chain,
      index,
      value,
    };
  }
}

export function mockUnspents<TNumber extends number | bigint>(
  rootWalletKeys: RootWalletKeys,
  inputScriptTypes: InputType[],
  testOutputAmount: TNumber,
  network: Network
): WalletUnspent<TNumber>[] {
  return inputScriptTypes.map((t, i): WalletUnspent<TNumber> => {
    if (outputScripts.isScriptType2Of3(t)) {
      return mockWalletUnspent(network, testOutputAmount, {
        keys: rootWalletKeys,
        chain: getExternalChainCode(t),
        vout: i,
      });
    }
    throw new Error(`invalid input type ${t}`);
  });
}
