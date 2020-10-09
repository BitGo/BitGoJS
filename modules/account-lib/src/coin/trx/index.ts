export { KeyPair } from './keyPair';
export { Address } from './address';
export { Transaction } from './transaction';
export { TransactionBuilder } from './transactionBuilder';

import TronWeb from 'tronweb';
import * as Enum from './enum';
import * as Interface from './iface';
import * as Utils from './utils';

export { Enum, Interface, Utils };

/**
 * @param tronWeb
 * @param createData
 */
export async function createRawTransaction(tronWeb: TronWeb, createData: Interface.TxCreateData) {
  return tronWeb.fullNode.request(createData.apiUrl, createData.data, 'post');
}
