export * from 'bitcoinjs-lib';

export * as bufferutils from 'bitcoinjs-lib/src/bufferutils';

export * as bitgo from './bitgo';

export * as address from './address';

export * as addressFormat from './addressFormat';

export * as classify from './classify';

export * as taproot from './taproot';

export * as testutil from './testutil';

import { bip32, BIP32API, BIP32Interface, ecc, ECPair, ECPairInterface, ECPairAPI } from '@bitgo/secp256k1';

export {
  // @deprecated use import { bip32 } from '@bitgo/secp256k1' instead
  bip32,
  // @deprecated use import { BIP32API } from '@bitgo/secp256k1' instead
  BIP32API,
  // @deprecated use import { BIP32Interface } from '@bitgo/secp256k1' instead
  BIP32Interface,
  // @deprecated use import { ecc } from '@bitgo/secp256k1' instead
  ecc,
  // @deprecated use import { ECPair } from '@bitgo/secp256k1' instead
  ECPair,
  // @deprecated use import { ECPairAPI } from '@bitgo/secp256k1' instead
  ECPairAPI,
  // @deprecated use import { ECPairInterface } from '@bitgo/secp256k1' instead
  ECPairInterface,
};

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
