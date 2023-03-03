export * from 'bitcoinjs-lib';

export * as bitgo from './bitgo';

export * as address from './address';

export * as addressFormat from './addressFormat';

export * as classify from './classify';

export * as taproot from './taproot';

export * as testutil from './testutil';

export * from './noble_ecc';

export * as p2trPayments from './payments';

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
