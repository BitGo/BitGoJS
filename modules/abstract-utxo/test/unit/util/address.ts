import * as utxolib from '@bitgo/utxo-lib';
import { fixedScriptWallet, type CoinName } from '@bitgo/wasm-utxo';

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
  coinName: CoinName,
  walletKeys: RootWalletKeys,
  chain = defaultChain,
  index = 0
): string {
  return fixedScriptWallet.address(walletKeys, chain, index, coinName);
}
