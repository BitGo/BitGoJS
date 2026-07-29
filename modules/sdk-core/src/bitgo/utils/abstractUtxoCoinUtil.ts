import assert from 'assert';
import { coins, UtxoCoin } from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';
import ScriptType2Of3 = utxolib.bitgo.outputScripts.ScriptType2Of3;
import { WalletType } from '../wallet';

/** @deprecated - will be removed when we drop support for utxolib */
export function inferAddressType(addressDetails: { chain: number }): ScriptType2Of3 | null {
  return utxolib.bitgo.isChainCode(addressDetails.chain)
    ? utxolib.bitgo.scriptTypeForChain(addressDetails.chain)
    : null;
}

/**
 * Resolve the utxo-lib network for a statics utxo coin.
 *
 * Not every utxo coin has one: wasm-only coins (e.g. pearl) are served through
 * `@bitgo/wasm-utxo` and are deliberately absent from the utxo-lib network registry,
 * so `utxolibName` carries a wasm `CoinName` that does not resolve here. Those coins
 * must have their script types resolved through wasm-utxo instead - see
 * `AbstractUtxoCoin.supportsAddressType`, which delegates to
 * `fixedScriptWallet.supportsScriptType`.
 *
 * @deprecated - will be removed when we drop support for utxolib
 */
function getUtxolibNetwork(coinName: string, coin: UtxoCoin): utxolib.Network {
  const network = utxolib.networks[coin.network.utxolibName as utxolib.NetworkName];
  assert(
    network,
    `coin ${coinName} has no utxo-lib network (utxolibName=${coin.network.utxolibName}). ` +
      `Script types for wasm-only coins must be resolved through @bitgo/wasm-utxo.`
  );
  return network;
}

/**
 * Get the supported 2 of 3 script types for a given utxo coin
 *
 * @throws if the coin has no utxo-lib network - see `getUtxolibNetwork`
 */
export function getUtxoCoinScriptTypes2Of3(coinName: string): utxolib.bitgo.outputScripts.ScriptType2Of3[] {
  const coin = coins.get(coinName);
  assert(coin instanceof UtxoCoin, `coin ${coinName} is not a utxo coin`);
  const network = getUtxolibNetwork(coinName, coin);
  return utxolib.bitgo.outputScripts.scriptTypes2Of3.filter((v) =>
    utxolib.bitgo.outputScripts.isSupportedScriptType(network, v)
  );
}

/**
 * Check if script type is enabled for a given walletType and network
 * @param network
 * @param walletType
 * @param scriptType
 */
function isEnabledAddressType(network: utxolib.Network, walletType: WalletType, scriptType: ScriptType2Of3): boolean {
  if (!utxolib.bitgo.outputScripts.isSupportedScriptType(network, scriptType)) {
    return false;
  }
  if (scriptType === 'p2trMusig2') {
    return walletType === 'hot' || (walletType === 'cold' && utxolib.isTestnet(network));
  }
  return true;
}

/**
 * Get the supported 2 of 3 script types for a given utxo coin and wallet type
 * @param coinName
 * @param walletType
 */
export function getUtxoCoinScriptTypesForWalletType(
  coinName: string,
  walletType: WalletType
): utxolib.bitgo.outputScripts.ScriptType2Of3[] {
  const scriptTypes = getUtxoCoinScriptTypes2Of3(coinName);

  const coin = coins.get(coinName);
  assert(coin instanceof UtxoCoin, `coin ${coinName} is not a utxo coin`);
  const network = getUtxolibNetwork(coinName, coin);

  return scriptTypes.filter((scriptType) => isEnabledAddressType(network, walletType, scriptType as ScriptType2Of3));
}
