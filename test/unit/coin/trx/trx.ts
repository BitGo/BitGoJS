import * as should from 'should';
import { TransactionBuilder } from '../../../../src';
import { TransactionType } from '../../../../src/coin/baseCoin/enum';
import { UnsignedBuildTransaction,
  FirstSigOnBuildTransaction,
  FirstPrivateKey,
  FirstExpectedKeyAddress,
  SecondSigOnBuildTransaction,
  SecondPrivateKey,
  SecondExpectedKeyAddress
} from '../../../resources/trx';

describe('Tron test network', function() {
  let txBuilder: TransactionBuilder;

  beforeEach(() => {
    txBuilder = new TransactionBuilder({ coinName: 'ttrx '});
  });

  describe('Transaction build', () => {
    it('should use from with a transfer contract for an unsigned tx', () => {
      const txJson = JSON.stringify(UnsignedBuildTransaction);
      txBuilder.from(txJson);
    });

    it('should use from with a transfer contract for a half-signed tx', () => {
      const txJson = JSON.stringify(FirstSigOnBuildTransaction);
      txBuilder.from(txJson);
    });

    it('should use from with a transfer contract for a fully signed tx', () => {
      const txJson = JSON.stringify(SecondSigOnBuildTransaction);
      txBuilder.from(txJson);
    });
  });

  describe('Transaction sign', () => {
    beforeEach(() => {
      txBuilder = new TransactionBuilder({ coinName: 'ttrx '});
    });

    it('should sign an unsigned tx', () => {
      const txJson = JSON.stringify(UnsignedBuildTransaction);
      txBuilder.from(txJson);
      txBuilder.sign({ key: FirstPrivateKey }, { address: FirstExpectedKeyAddress });
    });

    it('should sign an unsigned tx', () => {
      const txJson = JSON.stringify(FirstSigOnBuildTransaction);
      txBuilder.from(txJson);
      txBuilder.sign({ key: SecondPrivateKey }, { address: SecondExpectedKeyAddress });
    });

    it('should not duplicate an signed tx', (done) => {
      const txJson = JSON.stringify(FirstSigOnBuildTransaction);
      txBuilder.from(txJson);
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
      txBuilder.from(txJson);
      txBuilder.sign({ key: FirstPrivateKey }, { address: FirstExpectedKeyAddress });
      const tx = txBuilder.build();

      tx.id.should.equal('80b8b9eaed51c8bba3b49f7f0e7cc5f21ac99a6f3e2893c663b544bf2c695b1d');
      tx.type.should.equal(TransactionType.Send);
      tx.senders.length.should.equal(1);
      tx.senders[0].address.should.equal('TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz');
      tx.destinations.length.should.equal(1);
      tx.destinations[0].address.should.equal('TNYssiPgaf9XYz3urBUqr861Tfqxvko47B');
      tx.destinations[0].value.toString().should.equal('1718');
    });

    it('should sign a fully signed tx', () => {
      txBuilder.from(FirstSigOnBuildTransaction);
      txBuilder.sign({ key: SecondPrivateKey }, { address: SecondExpectedKeyAddress });
      const tx = txBuilder.build();

      tx.toJson().signature[0].should.equal('bd08e6cd876bb573dd00a32870b58b70ea8b7908f5131686502589941bfa4fdda76b8c81bbbcfc549be6d4988657cea122df7da46c72041def2683d6ecb04a7401');
      tx.toJson().signature[1].should.equal('f3cabe2f4aed13e2342c78c7bf4626ea36cd6509a44418c24866814d3426703686be9ef21bd993324c520565beee820201f2a50a9ac971732410d3eb69cdb2a600');

      tx.id.should.equal('80b8b9eaed51c8bba3b49f7f0e7cc5f21ac99a6f3e2893c663b544bf2c695b1d');
      tx.type.should.equal(TransactionType.Send);
      tx.senders.length.should.equal(1);
      tx.senders[0].address.should.equal('TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz');
      tx.destinations.length.should.equal(1);
      tx.destinations[0].address.should.equal('TNYssiPgaf9XYz3urBUqr861Tfqxvko47B');
      tx.destinations[0].value.toString().should.equal('1718');
      tx.validFrom.should.equal(1571811410819);
      tx.validTo.should.equal(1571811468000);
    });
  });
});
