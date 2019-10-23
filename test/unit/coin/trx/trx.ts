import * as should from 'should';
import { TransactionBuilder } from '../../../../src/transactionBuilder';
import { TransactionType } from '../../../../src/coin/baseCoin/enum';
import { UnsignedBuildTransaction, FirstSigOnBuildTransaction } from '../../../resources/trx';

describe('Tron test network', function() {
  let txBuilder: TransactionBuilder;

  before(() => {
    txBuilder = new TransactionBuilder({ coinName: 'ttrx '});
  });

  it('should instantiate the txBuilder properly', () => {
    should.exist(txBuilder);
  });

  describe('Transaction build', () => {
    it('should use from with a transfer contract for an unsigned tx', () => {
      const txJson = JSON.stringify(UnsignedBuildTransaction);
      txBuilder.from(txJson, TransactionType.Send);
    });

    it('should use from with a transfer contract for a half-signed tx', () => {
      const txJson = JSON.stringify(FirstSigOnBuildTransaction);
      txBuilder.from(txJson, TransactionType.Send);
    });

    it('should use from with a transfer contract for a fully signed tx', () => {
      const txJson = JSON.stringify(FirstSigOnBuildTransaction);
      txBuilder.from(txJson, TransactionType.Send);
    });
  });

  describe('Transaction sign', () => {
    it('should use from with a transfer contract for an unsigned tx', () => {
      const txJson = JSON.stringify(UnsignedBuildTransaction);
      txBuilder.from(txJson, TransactionType.Send);
    });
  });

  

});
