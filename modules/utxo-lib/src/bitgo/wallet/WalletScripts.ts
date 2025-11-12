import { Network, address, isTestnet } from '../..';
import { ChainCode, outputScripts } from '..';
import { RootWalletKeys } from './WalletKeys';
import { scriptTypeForChain, SpendableScript } from '../outputScripts';
import * as wasmUtxo from '@bitgo/wasm-utxo';

export function getWalletOutputScripts(keys: RootWalletKeys, chain: ChainCode, index: number): SpendableScript {
  return outputScripts.createOutputScript2of3(
    keys.deriveForChainAndIndex(chain, index).publicKeys,
    scriptTypeForChain(chain)
  );
}

export function getWalletAddress(keys: RootWalletKeys, chain: ChainCode, index: number, network: Network): string {
  if (isTestnet(network)) {
    return wasmUtxo.fixedScriptWallet.address(keys, chain, index, network);
  }
  return address.fromOutputScript(getWalletOutputScripts(keys, chain, index).scriptPubKey, network);
}
