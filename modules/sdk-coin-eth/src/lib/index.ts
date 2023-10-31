// for Backwords Compatibility
export * from '@bitgo/abstract-eth';

// exporting the EthTransactionBuilder as it is needed in Ethw class
export { TransactionBuilder as EthTransactionBuilder } from './transactionBuilder';

// for Backwards Compatibility
import { Interface, Utils } from '@bitgo/abstract-eth';
export { Interface, Utils };
