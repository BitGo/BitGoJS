export * from 'bitcoinjs-lib';

export * as bitgo from './bitgo';
export * as coins from './coins';

export * as address from './address';

export const networks = require('./networks');

export { Network, ZcashNetwork, BitcoinCashNetwork } from './networkTypes';
export { Network as BitcoinJSNetwork } from 'bitcoinjs-lib';
