import { initBTCCurve } from '@bitgo/babylonlabs-io-btc-staking-ts';
import * as bitcoinjslib from 'bitcoinjs-lib';
import * as utxolib from '@bitgo/utxo-lib';

initBTCCurve();
bitcoinjslib.initEccLib(utxolib.ecc);

export * from './delegationMessage';
export * from './descriptor';
export * from './stakingParams';
export * from './stakingManager';
