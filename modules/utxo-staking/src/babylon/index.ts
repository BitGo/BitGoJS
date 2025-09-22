import { initBTCCurve } from '@bitgo-beta/babylonlabs-io-btc-staking-ts';
import * as bitcoinjslib from 'bitcoinjs-lib';
import * as utxolib from '@bitgo-beta/utxo-lib';

initBTCCurve();
bitcoinjslib.initEccLib(utxolib.ecc);

export * from './delegationMessage';
export * from './descriptor';
export * from './stakingParams';
export * from './stakingManager';
export * from './undelegation';
