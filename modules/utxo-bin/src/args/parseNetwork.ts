import * as utxolib from '@bitgo/utxo-lib';

export function getNetworkForName(name: string): utxolib.Network {
  const network = utxolib.networks[name as utxolib.NetworkName];
  if (!network) {
    throw new Error(`invalid network ${name}`);
  }
  return network;
}

export function getNetwork(argv: { network: string }): utxolib.Network {
  return getNetworkForName(argv.network);
}

type DemandOption<T> = T & { demandOption: true };

type NetworkOption<TDefault> = {
  type: 'string';
  description: string;
  default: TDefault;
  coerce: (arg: string) => utxolib.Network;
};

export function getNetworkOptions(defaultValue?: string): {
  network: NetworkOption<typeof defaultValue>;
} {
  return {
    network: {
      type: 'string',
      description: 'network name',
      default: defaultValue,
      coerce: getNetworkForName,
    },
  };
}

export function getNetworkOptionsDemand(defaultValue?: string): {
  network: DemandOption<NetworkOption<typeof defaultValue>>;
} {
  return {
    network: { ...getNetworkOptions(defaultValue).network, demandOption: true },
  };
}
