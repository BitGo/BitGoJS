import * as bitcoin from "bitcoinjs-lib";
import { StakingDataGenerator } from "./datagen/base";

export interface NetworkConfig {
  networkName: string;
  network: bitcoin.Network;
  datagen: {
    stakingDatagen: StakingDataGenerator;
  }
}

const createNetworkConfig = (
  networkName: string,
  network: bitcoin.Network,
): NetworkConfig => ({
  networkName,
   // A deep copy of the network object to avoid referring to the same object 
  // in memory
  network: {...network},
  datagen: {
    stakingDatagen: new StakingDataGenerator(network),
  },
});

const testingNetworks: NetworkConfig[] = [
  createNetworkConfig("mainnet", bitcoin.networks.bitcoin),
  createNetworkConfig("testnet", bitcoin.networks.testnet),
];

export default testingNetworks;
