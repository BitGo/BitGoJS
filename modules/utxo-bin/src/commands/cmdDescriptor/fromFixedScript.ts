import { CommandModule } from 'yargs';
import * as utxolib from '@bitgo/utxo-lib';
import { getNamedDescriptorsForRootWalletKeys } from '@bitgo/utxo-core/descriptor';

import {
  FormatTreeOrJson,
  formatTreeOrJson,
  getNetworkOptionsDemand,
  getRootWalletKeys,
  keyOptions,
  KeyOptions,
} from '../../args';
import { formatObjAsTree } from '../../format';

type Triple<T> = [T, T, T];

type ArgsFixedScriptToDescriptor = KeyOptions & {
  network: utxolib.Network;
  format: FormatTreeOrJson;
};

function mapKeyToNetwork(key: utxolib.BIP32Interface, network: utxolib.Network): utxolib.BIP32Interface {
  key = utxolib.bip32.fromBase58(key.toBase58());
  key.network = network;
  return key;
}

function mapRootWalletKeysToNetwork(
  rootWalletKeys: utxolib.bitgo.RootWalletKeys,
  network: utxolib.Network
): utxolib.bitgo.RootWalletKeys {
  return new utxolib.bitgo.RootWalletKeys(
    rootWalletKeys.triple.map((key) => mapKeyToNetwork(key, network)) as Triple<utxolib.BIP32Interface>,
    rootWalletKeys.derivationPrefixes
  );
}

export const cmdFromFixedScript: CommandModule<unknown, ArgsFixedScriptToDescriptor> = {
  command: 'fromFixedScript',
  describe: 'Convert BitGo FixedScript RootWalletKeys to output descriptors',
  builder(b) {
    return b.option(getNetworkOptionsDemand('bitcoin')).options(keyOptions).options({ format: formatTreeOrJson });
  },
  handler(argv): void {
    let rootWalletKeys = getRootWalletKeys(argv);
    if (argv.network !== utxolib.networks.bitcoin) {
      rootWalletKeys = mapRootWalletKeysToNetwork(rootWalletKeys, argv.network);
    }
    const descriptorMap = getNamedDescriptorsForRootWalletKeys(rootWalletKeys);
    const obj = Object.fromEntries(
      [...descriptorMap].map(([name, descriptor]) => [name, descriptor?.toString() ?? null])
    );
    if (argv.format === 'tree') {
      console.log(formatObjAsTree('descriptors', obj));
    } else if (argv.format === 'json') {
      console.log(JSON.stringify(obj, null, 2));
    } else {
      throw new Error(`Invalid format: ${argv.format}. Expected 'tree' or 'json'.`);
    }
  },
};
