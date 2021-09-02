import should from 'should';
import * as testData from '../../../resources/xrp/xrp';
import { Xrp } from '../../../../src';

describe('Xrp util library', function() {
  describe('sign and verify', function() {
    const keyPair1 = new Xrp.KeyPair({ prv: testData.accounts.acc1.prv });
    const keyPair2 = new Xrp.KeyPair({ prv: testData.accounts.acc2.prv });

    it('verify a signature', function() {
      Xrp.Utils.default
        .verifySignature(
          testData.transactions.multiSigTransaction.rawSigned,
          testData.transactions.multiSigTransaction.signature,
          keyPair1.getKeys().pub,
        )
        .should.be.true();

      it('should not verify signatures', function() {
        should.throws(
          () =>
            Xrp.Utils.default.verifySignature(
              '',
              testData.transactions.multiSigTransaction.signature,
              keyPair1.getKeys().pub,
            ),
          'Cannot verify empty messages',
        );

        // wrong public key
        Xrp.Utils.default
          .verifySignature(
            testData.transactions.multiSigTransaction.rawSigned,
            testData.transactions.multiSigTransaction.signature,
            keyPair2.getKeys().pub,
          )
          .should.be.false();

        // wrong signature
        Xrp.Utils.default
          .verifySignature(testData.transactions.multiSigTransaction.rawSigned, 'A65TS9087', keyPair2.getKeys().pub)
          .should.be.false();
      });
    });
  });
});
