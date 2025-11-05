import assert from 'assert';
import { IBaseCoin } from '../../../baseCoin';
import baseTSSUtils from '../baseTSSUtils';
import { KeyShare } from './types';
import { TxRequest, UnsignedTransactionTss } from '../baseTypes';
import { BitGoBase } from '../../../bitgoBase';
import { IWallet } from '../../../wallet';
import { getTxRequest } from '../../../tss';
import { IRequestTracer } from '../../../../api';

/**
 * @inheritdoc
 * Base class for EDDSA TSS utilities.
 * Provides common functionality shared between EDDSA v1 and v2 implementations.
 */
export class BaseEddsaUtils extends baseTSSUtils<KeyShare> {
  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin, wallet?: IWallet) {
    super(bitgo, baseCoin, wallet);
    this.setBitgoGpgPubKey(bitgo);
  }

  /**
   * Resolves a transaction request from either a string ID or TxRequest object.
   *
   * @param txRequest - Transaction request ID or object
   * @param reqId - Optional request tracer ID
   * @returns Resolved TxRequest object and its ID
   */
  protected async resolveTxRequest(
    txRequest: string | TxRequest,
    reqId?: IRequestTracer
  ): Promise<{ txRequestResolved: TxRequest; txRequestId: string }> {
    if (typeof txRequest === 'string') {
      const txRequestResolved = await getTxRequest(this.bitgo, this.wallet.id(), txRequest, reqId);
      return { txRequestResolved, txRequestId: txRequestResolved.txRequestId };
    } else {
      return { txRequestResolved: txRequest, txRequestId: txRequest.txRequestId };
    }
  }

  /**
   * Extracts the unsigned transaction from a transaction request.
   *
   * @param txRequest - The transaction request containing unsigned transactions
   * @returns The unsigned transaction to be signed
   * @throws Error if no transactions are found in the request
   */
  protected getUnsignedTxFromRequest(txRequest: TxRequest): UnsignedTransactionTss {
    assert(txRequest.transactions || txRequest.unsignedTxs, 'Unable to find transactions in txRequest');
    return txRequest.apiVersion === 'full' ? txRequest.transactions![0].unsignedTx : txRequest.unsignedTxs[0];
  }
}
