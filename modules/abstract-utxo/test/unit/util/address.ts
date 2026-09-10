import * as utxolib from '@bitgo/utxo-lib';
import { fixedScriptWallet, type CoinName } from '@bitgo/wasm-utxo';

import { toWasmUtxoCoinName, type UtxoCoinName } from '../../../src/names';
const { ChainCode } = fixedScriptWallet;

type UtxolibRootWalletKeys = utxolib.bitgo.RootWalletKeys;
type WasmRootWalletKeys = fixedScriptWallet.RootWalletKeys;
type RootWalletKeys = UtxolibRootWalletKeys | WasmRootWalletKeys;

const defaultChain = ChainCode.value('p2sh', 'external');

/**
 * Generate a wallet address from RootWalletKeys.
 * Supports both utxolib and wasm-utxo RootWalletKeys.
 * Utxolib keys are converted to wasm-utxo keys for address generation.
 */
export function getWalletAddress(
  coinName: CoinName | UtxoCoinName,
  walletKeys: RootWalletKeys,
  chain = defaultChain,
  index = 0
): string {
  return fixedScriptWallet.address(walletKeys, chain, index, toWasmUtxoCoinName(coinName));
}
