import * as bitcoinjslib from 'bitcoinjs-lib';
import * as utxolib from '@bitgo/utxo-lib';

export type BabylonNetwork = 'mainnet' | 'testnet';

export type BabylonNetworkLike = bitcoinjslib.Network | utxolib.Network | BabylonNetwork;

export function toBabylonNetwork(n: BabylonNetworkLike): BabylonNetwork {
  switch (n) {
    case bitcoinjslib.networks.bitcoin:
    case utxolib.networks.bitcoin:
      return 'mainnet';
    case bitcoinjslib.networks.testnet:
    case utxolib.networks.testnet:
    case utxolib.networks.bitcoinPublicSignet:
      return 'testnet';
    case 'mainnet':
    case 'testnet':
      return n;
    default:
      throw new Error('Unsupported network');
  }
}

export function toBitcoinJsNetwork(n: BabylonNetworkLike): bitcoinjslib.Network {
  switch (toBabylonNetwork(n)) {
    case 'mainnet':
      return bitcoinjslib.networks.bitcoin;
    case 'testnet':
      return bitcoinjslib.networks.testnet;
    default:
      throw new Error('Unsupported network');
  }
}
