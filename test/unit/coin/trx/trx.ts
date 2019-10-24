import * as should from 'should';
import { TransactionBuilder } from '../../../../src/transactionBuilder';
import { TransactionType } from '../../../../src/coin/baseCoin/enum';
import { UnsignedBuildTransaction, FirstSigOnBuildTransaction, FirstPrivateKey, FirstExpectedKeyAddress, SecondSigOnBuildTransaction, SecondPrivateKey, SecondExpectedKeyAddress } from '../../../resources/trx';

describe('Tron test network', function() {
  let txBuilder: TransactionBuilder;

  beforeEach(() => {
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
      const txJson = JSON.stringify(SecondSigOnBuildTransaction);
      txBuilder.from(txJson, TransactionType.Send);
    });
  });

  describe('Transaction sign', () => {
    beforeEach(() => {
      txBuilder = new TransactionBuilder({ coinName: 'ttrx '});
    });

    it('should sign an unsigned tx', () => {
      const txJson = JSON.stringify(UnsignedBuildTransaction);
      txBuilder.from(txJson, TransactionType.Send);
      txBuilder.sign({ key: FirstPrivateKey }, { address: FirstExpectedKeyAddress });
    });

    it('should sign an unsigned tx', () => {
      const txJson = JSON.stringify(FirstSigOnBuildTransaction);
      txBuilder.from(txJson, TransactionType.Send);
      txBuilder.sign({ key: SecondPrivateKey }, { address: SecondExpectedKeyAddress });
    });

    it('should not duplicate an signed tx', (done) => {
      const txJson = JSON.stringify(FirstSigOnBuildTransaction);
      txBuilder.from(txJson, TransactionType.Send);
      try {
        txBuilder.sign({ key: FirstPrivateKey }, { address: FirstExpectedKeyAddress });
        should.fail('didnt throw an error', 'throws an error');
      } catch {
        done();
      }
    });
  });

  describe('Transaction build', () => {
    beforeEach(() => {
      txBuilder = new TransactionBuilder({ coinName: 'ttrx '});
    });

    it('should build an half signed tx', () => {
      const txJson = JSON.stringify(UnsignedBuildTransaction);
      txBuilder.from(txJson, TransactionType.Send);
      txBuilder.sign({ key: FirstPrivateKey }, { address: FirstExpectedKeyAddress });
      txBuilder.build();
    });

    it('should sign an fully signed tx', () => {
      const txJson = JSON.stringify(FirstSigOnBuildTransaction);
      txBuilder.from(txJson, TransactionType.Send);
      txBuilder.sign({ key: SecondPrivateKey }, { address: SecondExpectedKeyAddress });
      txBuilder.build();
    });
  });
});
