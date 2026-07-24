export { KeyPair } from './keyPair';
export { Address } from './address';
export { Transaction } from './transaction';
export { TransactionBuilder } from './transactionBuilder';

import * as Interface from './iface';
import * as Utils from './utils';
import * as MultisigUtils from './multisigUtils';
const mergedUtils = Object.assign(Utils, MultisigUtils);

export { Interface, mergedUtils as Utils };
