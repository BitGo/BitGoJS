import * as should from 'should';
import { TransactionBuilder } from '../../../../src';
import { TransactionType } from '../../../../src/coin/baseCoin/';
import {
  UnsignedBuildTransaction,
  FirstSigOnBuildTransaction,
  FirstPrivateKey,
  SecondSigOnBuildTransaction,
  SecondPrivateKey,
  SignedAccountPermissionUpdateContractTx,
  UnsignedAccountPermissionUpdateContractTx, UnsignedAccountPermissionUpdateContractPriv,
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
      txBuilder.sign({ key: FirstPrivateKey });
    });

    it('should sign an unsigned tx', () => {
      const txJson = JSON.stringify(FirstSigOnBuildTransaction);
      txBuilder.from(txJson);
      txBuilder.sign({ key: SecondPrivateKey });
    });

    it('should not duplicate an signed tx', (done) => {
      const txJson = JSON.stringify(FirstSigOnBuildTransaction);
      txBuilder.from(txJson);
      try {
        txBuilder.sign({ key: FirstPrivateKey });
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

    it('should build an update account tx', () => {
      const txJson = JSON.stringify(UnsignedAccountPermissionUpdateContractTx);
      txBuilder.from(txJson);
      txBuilder.sign({ key: UnsignedAccountPermissionUpdateContractPriv });
      const tx = txBuilder.build();
      const signedTxJson = tx.toJson();

      signedTxJson.txID.should.equal(UnsignedAccountPermissionUpdateContractTx.txID);
      signedTxJson.raw_data_hex.should.equal(UnsignedAccountPermissionUpdateContractTx.raw_data_hex);
      (JSON.stringify(signedTxJson.raw_data) === JSON.stringify(UnsignedAccountPermissionUpdateContractTx.raw_data)).should.be.ok;
      signedTxJson.signature.length.should.equal(1);
      signedTxJson.signature[0].should.equal('2bc5030727d42ed642c2806a3c1a5a0393408b159541f2163df4ba692c5c1240e2dde5a2aae4ecad465414e60b5aeca8522d0a2b6606f88a326658809161334f00');
    });

    it('should build an half signed tx', () => {
      const txJson = JSON.stringify(UnsignedBuildTransaction);
      txBuilder.from(txJson);
      txBuilder.sign({ key: FirstPrivateKey });
      const tx = txBuilder.build();

      tx.id.should.equal('80b8b9eaed51c8bba3b49f7f0e7cc5f21ac99a6f3e2893c663b544bf2c695b1d');
      tx.type.should.equal(TransactionType.Send);
      tx.senders.length.should.equal(1);
      tx.senders[0].address.should.equal('TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz');
      tx.destinations.length.should.equal(1);
      tx.destinations[0].address.should.equal('TNYssiPgaf9XYz3urBUqr861Tfqxvko47B');
      tx.destinations[0].value.toString().should.equal('1718');
    });

    it('should build the right JSON after is half signed tx', () => {
      const txJson = JSON.stringify(UnsignedBuildTransaction);
      txBuilder.from(txJson);
      txBuilder.sign({ key: FirstPrivateKey });
      const tx = txBuilder.build();
      const signedTxJson = tx.toJson();

      signedTxJson.txID.should.equal(UnsignedBuildTransaction.txID);
      signedTxJson.raw_data_hex.should.equal(UnsignedBuildTransaction.raw_data_hex);
      (JSON.stringify(signedTxJson.raw_data) === JSON.stringify(UnsignedBuildTransaction.raw_data)).should.be.ok;
      signedTxJson.signature.length.should.equal(1);
      signedTxJson.signature[0].should.equal('bd08e6cd876bb573dd00a32870b58b70ea8b7908f5131686502589941bfa4fdda76b8c81bbbcfc549be6d4988657cea122df7da46c72041def2683d6ecb04a7401');
    });

    it('should sign a fully signed tx', () => {
      txBuilder.from(FirstSigOnBuildTransaction);
      txBuilder.sign({ key: SecondPrivateKey});
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

  describe('Transaction extend', () => {
    beforeEach(() => {
      txBuilder = new TransactionBuilder({ coinName: 'ttrx '});
    });

    it('should not extend a half signed tx', () => {
      const txJson = JSON.stringify(UnsignedBuildTransaction);
      txBuilder.from(txJson);
      txBuilder.sign({ key: FirstPrivateKey });

      should.throws(() => txBuilder.extendValidTo(10000));
    });

    it('should extend an unsigned tx', () => {
      const extendMs = 10000;
      txBuilder.from(JSON.parse(JSON.stringify(UnsignedBuildTransaction)));
      txBuilder.extendValidTo(extendMs);
      const tx = txBuilder.build();

      tx.id.should.not.equal(UnsignedBuildTransaction.txID);
      tx.id.should.equal('764aa8a72c2c720a6556def77d6092f729b6e14209d8130f1692d5aff13f2503');
      const oldExpiration = UnsignedBuildTransaction.raw_data.expiration;
      tx.validTo.should.equal(oldExpiration + extendMs);
      tx.type.should.equal(TransactionType.Send);
      tx.senders.length.should.equal(1);
      tx.senders[0].address.should.equal('TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz');
      tx.destinations.length.should.equal(1);
      tx.destinations[0].address.should.equal('TNYssiPgaf9XYz3urBUqr861Tfqxvko47B');
      tx.destinations[0].value.toString().should.equal('1718');
      tx.validFrom.should.equal(1571811410819);
    });
  });
});
