import { Network, address } from '../..';
import { outputScripts } from '..';
import { RootWalletKeys } from './WalletKeys';
import { scriptTypeForChain, SpendableScript } from '../outputScripts';

export function getWalletOutputScripts(keys: RootWalletKeys, chain: number, index: number): SpendableScript {
  return outputScripts.createOutputScript2of3(
    keys.deriveForChainAndIndex(chain, index).publicKeys,
    scriptTypeForChain(chain)
  );
}

export function getWalletAddress(keys: RootWalletKeys, chain: number, index: number, network: Network): string {
  return address.fromOutputScript(getWalletOutputScripts(keys, chain, index).scriptPubKey, network);
}
