import assert from 'assert';
import { coins, UtxoCoin } from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';
import ScriptType2Of3 = utxolib.bitgo.outputScripts.ScriptType2Of3;
import { WalletType } from '../wallet';

export function inferAddressType(addressDetails: { chain: number }): ScriptType2Of3 | null {
  return utxolib.bitgo.isChainCode(addressDetails.chain)
    ? utxolib.bitgo.scriptTypeForChain(addressDetails.chain)
    : null;
}

/**
 * Get the supported 2 of 3 script types for a given utxo coin
 */
export function getUtxoCoinScriptTypes2Of3(coinName: string): utxolib.bitgo.outputScripts.ScriptType2Of3[] {
  const coin = coins.get(coinName);
  assert(coin instanceof UtxoCoin, `coin ${coinName} is not a utxo coin`);
  const network = utxolib.networks[coin.network.utxolibName as utxolib.NetworkName];
  return utxolib.bitgo.outputScripts.scriptTypes2Of3.filter((v) =>
    utxolib.bitgo.outputScripts.isSupportedScriptType(network, v)
  );
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

  // Only return true for p2trMusig2 if the wallet type is hot
  return scriptTypes.filter((scriptType) => (scriptType === 'p2trMusig2' ? walletType === 'hot' : true));
}
