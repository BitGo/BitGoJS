import * as utxolib from '@bitgo/utxo-lib';
import { getMainnet } from '@bitgo/utxo-lib';

export const bitcoinRegtest: utxolib.Network = {
  ...utxolib.networks.testnet,
  bech32: 'bcrt',
};

export function getNetworkForName(name: string): utxolib.Network {
  if (name === 'bitcoinRegtest') {
    return bitcoinRegtest;
  }
  const network = utxolib.networks[name as utxolib.NetworkName];
  if (!network) {
    throw new Error(`invalid network ${name}`);
  }
  return network;
}

export function getNetworkName(network: utxolib.Network): string {
  if (network === bitcoinRegtest) {
    return 'bitcoinRegtest';
  }
  return utxolib.getNetworkName(network) as string;
}

const networkOrder = [
  utxolib.networks.bitcoin,
  utxolib.networks.bitcoincash,
  utxolib.networks.bitcoingold,
  utxolib.networks.bitcoinsv,
  utxolib.networks.dash,
  utxolib.networks.dogecoin,
  utxolib.networks.ecash,
  utxolib.networks.litecoin,
  utxolib.networks.zcash,
];

function getNetworkOrderIndex(network: utxolib.Network): number {
  if (network === bitcoinRegtest) {
    network = utxolib.networks.bitcoin;
  }
  network = getMainnet(network);
  const index = networkOrder.indexOf(network);
  if (index === -1) {
    throw new Error(`unknown network ${network}`);
  }
  return index;
}

export function getNetworkList(): utxolib.Network[] {
  return [...utxolib.getNetworkList(), bitcoinRegtest].sort(
    (a, b) => getNetworkOrderIndex(a) - getNetworkOrderIndex(b) || getNetworkName(a).localeCompare(getNetworkName(b))
  );
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
