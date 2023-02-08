export * from 'bitcoinjs-lib';

export * as bitgo from './bitgo';

export * as address from './address';

export * as addressFormat from './addressFormat';

export * as classify from './classify';

export * from './noble_ecc';

export * from './noble_crypto';

export {
  networks,
  Network,
  NetworkName,
  getNetworkList,
  isValidNetwork,
  getNetworkName,
  getMainnet,
  getTestnet,
  isMainnet,
  isTestnet,
  supportsTaproot,
  supportsSegwit,
} from './networks';

export { TransactionBuilder } from './transaction_builder';

export { Network as BitcoinJSNetwork } from 'bitcoinjs-lib';
