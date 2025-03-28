import * as bitcoinjslib from 'bitcoinjs-lib';
import * as utxolib from '@bitgo/utxo-lib';
import * as vendor from '@bitgo/babylonlabs-io-btc-staking-ts';

import { getStakingParams } from './stakingParams';

export const mockBabylonProvider: vendor.BabylonProvider = {
  signTransaction(): Promise<Uint8Array> {
    throw new Error('Function not implemented.');
  },
};

export function createStakingManager(
  network: bitcoinjslib.Network | utxolib.Network,
  btcProvider: vendor.BtcProvider,
  stakingParams?: vendor.VersionedStakingParams[],
  babylonProvider = mockBabylonProvider
): vendor.BabylonBtcStakingManager {
  if (utxolib.isValidNetwork(network)) {
    switch (network) {
      case utxolib.networks.bitcoin:
        network = bitcoinjslib.networks.bitcoin;
        break;
      case utxolib.networks.testnet:
      case utxolib.networks.bitcoinTestnet4:
        throw new Error('Unsupported bitcoin testnet network - only signet is supported');
      case utxolib.networks.bitcoinPublicSignet:
        network = bitcoinjslib.networks.testnet;
        break;
      default:
        throw new Error('Unsupported network');
    }
  }
  return new vendor.BabylonBtcStakingManager(
    network,
    stakingParams ?? getStakingParams(network),
    btcProvider,
    babylonProvider
  );
}
