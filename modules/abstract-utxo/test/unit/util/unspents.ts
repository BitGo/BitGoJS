import * as utxolib from '@bitgo/utxo-lib';
import { getSeed } from '@bitgo/sdk-test';
import * as wasmUtxo from '@bitgo/wasm-utxo';

import { getReplayProtectionAddresses } from '../../../src';
import { getCoinName, isUtxoCoinName, type UtxoCoinName } from '../../../src/names';
import type { Unspent, UnspentWithPrevTx, WalletUnspent } from '../../../src/unspent';

const { scriptTypeForChain, chainCodesP2sh, getExternalChainCode, getInternalChainCode } = utxolib.bitgo;

export type UtxolibRootWalletKeys = utxolib.bitgo.RootWalletKeys;
export type WasmRootWalletKeys = wasmUtxo.fixedScriptWallet.RootWalletKeys;
export type RootWalletKeys = UtxolibRootWalletKeys | WasmRootWalletKeys;
type ChainCode = utxolib.bitgo.ChainCode;

/** Accept either a coin name string or a utxolib.Network object */
export type NetworkArg = string | utxolib.Network;

function toCoinName(network: NetworkArg): UtxoCoinName {
  if (typeof network === 'string') {
    if (!isUtxoCoinName(network)) {
      throw new Error(`not a valid coin name: ${network}`);
    }
    return network;
  }
  return getCoinName(network);
}

export type InputScriptType = utxolib.bitgo.outputScripts.ScriptType2Of3 | 'replayProtection';

/**
 * Input definition for toUnspent function
 */
export type Input = {
  scriptType: utxolib.bitgo.outputScripts.ScriptType2Of3 | 'taprootKeyPathSpend';
  value: bigint;
};

const defaultChain: ChainCode = getExternalChainCode(chainCodesP2sh);

/**
 * Check if walletKeys is wasm-utxo RootWalletKeys.
 */
function isWasmRootWalletKeys(walletKeys: RootWalletKeys): walletKeys is WasmRootWalletKeys {
  return walletKeys instanceof wasmUtxo.fixedScriptWallet.RootWalletKeys;
}

export function getOutputScript(
  walletKeys: UtxolibRootWalletKeys,
  chain = defaultChain,
  index = 0
): utxolib.bitgo.outputScripts.SpendableScript {
  return utxolib.bitgo.outputScripts.createOutputScript2of3(
    walletKeys.deriveForChainAndIndex(chain, index).publicKeys,
    scriptTypeForChain(chain)
  );
}

export function getWalletAddress(
  network: NetworkArg,
  walletKeys: RootWalletKeys,
  chain = defaultChain,
  index = 0
): string {
  const coinName = toCoinName(network);

  // Use wasm-utxo address generation for wasm-utxo RootWalletKeys
  if (isWasmRootWalletKeys(walletKeys)) {
    return wasmUtxo.fixedScriptWallet.address(walletKeys, chain, index, coinName);
  }

  // For utxolib RootWalletKeys, generate address from output script
  return wasmUtxo.address.fromOutputScriptWithCoin(getOutputScript(walletKeys, chain, index).scriptPubKey, coinName);
}

function mockOutputIdForAddress(address: string) {
  return getSeed(address).toString('hex') + ':1';
}

export function mockWalletUnspent<TNumber extends number | bigint = number>(
  network: NetworkArg,
  walletKeys: RootWalletKeys,
  { id, chain = defaultChain, index = 0, value, address }: Partial<WalletUnspent<TNumber>>
): WalletUnspent<TNumber> {
  if (value === undefined) {
    throw new Error(`unspent value must be set`);
  }
  if (chain === undefined) {
    throw new Error(`unspent chain must be set`);
  }
  const deriveAddress = getWalletAddress(network, walletKeys, chain, index);
  if (address) {
    if (address !== deriveAddress) {
      throw new Error(`derivedAddress mismatch: ${address} derived=${deriveAddress}`);
    }
  } else {
    address = deriveAddress;
  }
  if (!id) {
    id = mockOutputIdForAddress(address);
  }
  return {
    id,
    address,
    chain,
    index,
    value,
  };
}

export function mockUnspentReplayProtection<TNumber extends number | bigint = number>(
  network: NetworkArg,
  value: TNumber
): Unspent<TNumber> {
  const coinName = toCoinName(network);
  const addresses = getReplayProtectionAddresses(coinName);
  if (addresses.length) {
    const address = addresses[0];
    return {
      id: mockOutputIdForAddress(address),
      address,
      value,
    };
  }
  throw new Error(`${coinName} has no replay protection unspents`);
}

export function mockUnspent<TNumber extends number | bigint = number>(
  network: NetworkArg,
  walletKeys: RootWalletKeys,
  chain: ChainCode | InputScriptType,
  index: number,
  value: TNumber
): Unspent<TNumber> {
  if (chain === 'replayProtection') {
    return mockUnspentReplayProtection(network, (typeof value === 'bigint' ? BigInt(1000) : 1000) as TNumber);
  } else {
    return mockWalletUnspent(network, walletKeys, { chain: getInternalChainCode(chain), value, index });
  }
}

/**
 * Create unspent object from input script type, index, network and root wallet keys.
 * Supports both utxolib and wasm-utxo RootWalletKeys.
 */
export function toUnspent(
  input: Input,
  index: number,
  network: NetworkArg,
  rootWalletKeys: RootWalletKeys
): WalletUnspent<bigint> {
  const scriptType = input.scriptType === 'taprootKeyPathSpend' ? 'p2trMusig2' : input.scriptType;
  const chain = getInternalChainCode(scriptType);
  return mockWalletUnspent(network, rootWalletKeys, {
    chain,
    index,
    value: input.value,
  });
}

/**
 * Wallet unspent with prevTx - combines WalletUnspent and UnspentWithPrevTx
 */
export interface WalletUnspentWithPrevTx<TNumber extends number | bigint = number>
  extends WalletUnspent<TNumber>,
    UnspentWithPrevTx<TNumber> {}

/**
 * Create a mock wallet unspent using wasm-utxo only (no utxolib dependency).
 * Uses createMockPrevTx to generate a realistic txid for the unspent.
 *
 * This is useful for tests that need a valid unspent but don't require the prevTx buffer.
 *
 * @param address - The wallet address for the unspent
 * @param chain - The derivation chain
 * @param index - The derivation index
 * @param value - The value in satoshis (bigint)
 * @param network - The network to get the output script
 * @returns WalletUnspent with a valid txid from a wasm-utxo generated transaction
 */
export function createWasmWalletUnspent<TNumber extends number | bigint = bigint>(
  address: string,
  chain: ChainCode,
  index: number,
  value: TNumber,
  network: NetworkArg
): WalletUnspent<TNumber> {
  // Get output script from address using correct wasm-utxo function
  const outputScript = wasmUtxo.address.toOutputScriptWithCoin(address, toCoinName(network));

  // Create a mock transaction with output at vout=0
  const { txid } = createMockPrevTx(0, outputScript, BigInt(value));

  return {
    id: `${txid}:0`,
    address,
    chain,
    index,
    value,
  };
}

/**
 * Create a mock previous transaction using wasm-utxo's low-level Psbt class.
 *
 * Creates a valid transaction structure with:
 * - A p2wpkh input (segwit, easy to construct)
 * - Outputs including the target output at the specified vout
 * - Reasonable fee rate (input value slightly higher than output sum)
 *
 * @param vout - The output index where the target output should be placed
 * @param outputScript - The scriptPubKey for the target output
 * @param value - The value in satoshis for the target output
 * @returns Object with prevTx buffer and the transaction's txid
 */
export function createMockPrevTx(
  vout: number,
  outputScript: Uint8Array,
  value: bigint
): { prevTx: Buffer; txid: string } {
  // Create a p2wpkh script for the dummy input
  // p2wpkh: OP_0 <20-byte-hash> - we use a deterministic hash
  const dummyHash = getSeed('mock-prev-tx-input').subarray(0, 20);
  const p2wpkhScript = new Uint8Array([0x00, 0x14, ...dummyHash]);

  // Calculate total output value
  const dummyOutputValue = BigInt(1000); // 1000 satoshis per dummy output
  const totalOutputValue = dummyOutputValue * BigInt(vout) + value;

  // Input value = output value + small fee (1000 sat - reasonable fee)
  const inputValue = totalOutputValue + BigInt(1000);

  // Create PSBT using WrapPsbt (exported as Psbt)
  const psbt = new wasmUtxo.Psbt(2, 0);

  // Add dummy segwit input - p2wpkh
  psbt.addInput(
    '01'.repeat(32), // non-zero txid to avoid coinbase detection
    0,
    inputValue,
    p2wpkhScript
  );

  // Add dummy outputs before the target vout
  for (let i = 0; i < vout; i++) {
    psbt.addOutput(p2wpkhScript, dummyOutputValue);
  }

  // Add the target output at the specified vout
  psbt.addOutput(outputScript, value);

  // Get the unsigned transaction bytes
  // Note: This is a valid transaction structure without signatures
  // For prevTx purposes, we just need the output scripts and values
  const txBytes = psbt.getUnsignedTx();

  // Parse with wasm-utxo Transaction to get the txid
  const tx = wasmUtxo.Transaction.fromBytes(txBytes);
  const txid = tx.getId();

  return {
    prevTx: Buffer.from(txBytes),
    txid,
  };
}

/**
 * Create unspent with prevTx using wasm-utxo only (no utxolib dependency).
 * The prevTx is built using wasm-utxo's low-level Psbt class.
 *
 * Key: The unspent id uses the actual txid from the generated prevTx,
 * ensuring the MockRecoveryProvider returns the correct prevTx.
 */
export function toUnspentWithPrevTx(
  input: Input,
  index: number,
  network: NetworkArg,
  rootWalletKeys: WasmRootWalletKeys
): WalletUnspentWithPrevTx<bigint> {
  const scriptType = input.scriptType === 'taprootKeyPathSpend' ? 'p2trMusig2' : input.scriptType;
  const chain = getInternalChainCode(scriptType);
  const coinName = toCoinName(network);

  // Get the output script for the wallet address
  const outputScript = wasmUtxo.fixedScriptWallet.outputScript(rootWalletKeys, chain, index, coinName);

  // Create mock prevTx with output at vout=0
  const { prevTx, txid } = createMockPrevTx(0, outputScript, input.value);

  // Get the wallet address
  const address = getWalletAddress(network, rootWalletKeys, chain, index);

  // Use the actual txid from the prevTx in the unspent id
  return {
    id: `${txid}:0`,
    address,
    chain,
    index,
    value: input.value,
    prevTx,
  };
}
