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
  network,
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
