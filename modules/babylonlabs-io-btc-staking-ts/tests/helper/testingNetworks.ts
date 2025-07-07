import * as bitcoin from "bitcoinjs-lib";
import { ObservableStakingDatagen } from "./datagen/observable";
import { StakingDataGenerator } from "./datagen/base";

export interface NetworkConfig {
  networkName: string;
  network: bitcoin.Network;
  datagen: {
    observableStakingDatagen: ObservableStakingDatagen;
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
    observableStakingDatagen: new ObservableStakingDatagen(network),
    stakingDatagen: new StakingDataGenerator(network),
  },
});

const testingNetworks: NetworkConfig[] = [
  createNetworkConfig("mainnet", bitcoin.networks.bitcoin),
  createNetworkConfig("testnet", bitcoin.networks.testnet),
];

export default testingNetworks;
