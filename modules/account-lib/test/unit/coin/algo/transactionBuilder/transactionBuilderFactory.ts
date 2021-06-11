import { coins } from '@bitgo/statics';
import should from 'should';
import { TransactionBuilderFactory, TransferBuilder } from '../../../../../src/coin/algo';
import { KeyRegistrationBuilder } from '../../../../../src/coin/algo/keyRegistrationBuilder';

import * as AlgoResources from '../../../../resources/algo';

describe('transaction builder factory', () => {
  const txnBuilderFactory = new TransactionBuilderFactory(coins.get('algo'));

  const { rawTx } = AlgoResources;

  it('should parse a key registration txn and return a key registration builder', () => {
    should(txnBuilderFactory.from(rawTx.keyReg.unsigned)).instanceOf(KeyRegistrationBuilder);
    should(txnBuilderFactory.from(rawTx.keyReg.signed)).instanceOf(KeyRegistrationBuilder);
  });

  it('should parse a transfer txn and return a transfer builder', () => {
    should(txnBuilderFactory.from(rawTx.transfer.unsigned)).instanceOf(TransferBuilder);
    should(txnBuilderFactory.from(rawTx.transfer.signed)).instanceOf(TransferBuilder);
  });

  it('should parse a asset transfer txn and return a asset transfer builder', () => {
    //  should(txnBuilderFactory.from(rawTx.transfer.unsigned)).instanceOf(TransferBuilder);
    // should(txnBuilderFactory.from(rawTx.transfer.signed)).instanceOf(TransferBuilder);
  });
});
