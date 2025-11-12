import { ok as assert } from 'assert';
import { BIP32Interface } from '@bitgo/secp256k1';
import { payments } from '..';
import { getMainnet, Network, networks, isTestnet } from '../networks';

import {
  ChainCode,
  withUnsafeNonSegwit,
  createPsbtForNetwork,
  fromOutput,
  fromOutputWithPrevTx,
  getExternalChainCode,
  isSegwit,
  NonWitnessWalletUnspent,
  outputScripts,
  RootWalletKeys,
  scriptTypeForChain,
  Unspent,
  UnspentWithPrevTx,
  UtxoTransaction,
  WalletUnspent,
} from '../bitgo';
import { fromOutputScript } from '../address';
import { createOutputScript2of3, createOutputScriptP2shP2pk } from '../bitgo/outputScripts';
import * as wasmUtxo from '@bitgo/wasm-utxo';

import { getDefaultWalletKeys, getKey } from './keys';

export type InputType = outputScripts.ScriptType2Of3;

export function mockPrevTx(
  vout: number,
  outputScript: Buffer,
  value: bigint,
  network: Network
): UtxoTransaction<bigint> {
  const psbtFromNetwork = createPsbtForNetwork({ network });

  const keypair = getKey('mock-prev-tx');
  const pubkey = keypair.publicKey;
  assert(keypair.privateKey);
  const payment = payments.p2pkh({ pubkey });
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
  // Don't require the prevTx for signing and finalizing for non-segwit input
  withUnsafeNonSegwit(psbtFromNetwork, () => {
    psbtFromNetwork.signInput(0, keypair);
    psbtFromNetwork.validateSignaturesOfAllInputs();
    psbtFromNetwork.finalizeAllInputs();
  });
  return psbtFromNetwork.extractTransaction();
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
  const address = isTestnet(network)
    ? wasmUtxo.fixedScriptWallet.address(keys, chain, index, network)
    : fromOutputScript(
        createOutputScript2of3(keys.deriveForChainAndIndex(chain, index).publicKeys, scriptTypeForChain(chain))
          .scriptPubKey,
        network
      );
  if (id && typeof id === 'string') {
    return { id, address, chain, index, value };
  } else {
    const derivedKeys = keys.deriveForChainAndIndex(chain, index);
    const prevTransaction = mockPrevTx(
      vout,
      createOutputScript2of3(derivedKeys.publicKeys, scriptTypeForChain(chain), network).scriptPubKey,
      BigInt(value),
      network
    );
    const unspent =
      isSegwit(chain) || getMainnet(network) === networks.zcash
        ? fromOutput(prevTransaction, vout)
        : fromOutputWithPrevTx(prevTransaction, vout);
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
  inputScriptTypes: (InputType | outputScripts.ScriptTypeP2shP2pk)[],
  testOutputAmount: TNumber,
  network: Network
): (Unspent<TNumber> | WalletUnspent<TNumber>)[] {
  return inputScriptTypes.map((t, i): Unspent<TNumber> => {
    if (outputScripts.isScriptType2Of3(t)) {
      return mockWalletUnspent(network, testOutputAmount, {
        keys: rootWalletKeys,
        chain: getExternalChainCode(t),
        vout: i,
      });
    } else if (t === outputScripts.scriptTypeP2shP2pk) {
      return mockReplayProtectionUnspent(network, testOutputAmount, {
        key: replayProtectionKeyPair,
        vout: i,
      });
    }
    throw new Error(`invalid input type ${t}`);
  });
}
