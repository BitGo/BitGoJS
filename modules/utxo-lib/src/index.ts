export * from 'bitcoinjs-lib';

export * as bitgo from './bitgo';

export * as address from './address';

export * as addressFormat from './addressFormat';

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

export { Network as BitcoinJSNetwork } from 'bitcoinjs-lib';
