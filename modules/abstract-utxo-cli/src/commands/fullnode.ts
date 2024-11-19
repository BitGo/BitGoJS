// import
import * as utxolib from '@bitgo/utxo-lib';

import { AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import { RpcClient, RpcError } from './RpcClient';

type HDKey = {
  xpub: string;
  has_private: boolean;
  xprv?: string;
};

export function getHdKeys(rpcClient: RpcClient): Promise<HDKey[]> {
  return rpcClient.exec<HDKey[]>('gethdkeys', { private: true });
}

async function createFullnodeXpub(fullnodeConfig: { url: string }, walletName): Promise<string> {
  const rpcClient = new RpcClient(fullnodeConfig.url);
  try {
    await rpcClient.exec('createwallet', walletName);
  } catch (e) {
    if (!RpcError.isRpcErrorWithCode(e, -4)) {
      throw e;
    }
  }
  const hdKeys = await getHdKeys(rpcClient);
  const xpub = hdKeys[0].xpub;
  if (!xpub) {
    throw new Error('Could not get xpub from fullnode');
  }
  return xpub;
}

export async function createFullnodeKeychain(
  coin: AbstractUtxoCoin,
  fullnodeConfig: {
    url: string;
  },
  walletName: string,
  source: 'user' | 'backup' | 'bitgo'
) {
  const pub = await createFullnodeXpub(fullnodeConfig, walletName);
  const keychain = utxolib.bip32.fromBase58(pub, coin.network);
  keychain.network = utxolib.networks.bitcoin;
  const keychainEncode = keychain.toBase58();
  console.log('adding user keychain from fullnode:', keychainEncode);
  return await coin.keychains().add({ pub: keychainEncode, source });
}
