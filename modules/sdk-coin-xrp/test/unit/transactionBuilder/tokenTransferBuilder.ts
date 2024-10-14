import should from 'should';
import utils from '../../../src/lib/utils';
import * as testData from '../../resources/xrp';
import { getBuilderFactory } from '../getBuilderFactory';

describe('XRP Token Transfer Builder', () => {
  const factory = getBuilderFactory('txrp:rlusd');

  describe('Succeed', () => {
    it('should build a token transfer', async function () {
      const txBuilder = factory.getTokenTransferBuilder();
      const amount = (BigInt(132131231212323) * BigInt(10) ** BigInt(81)).toString();

      txBuilder.to(testData.TEST_MULTI_SIG_ACCOUNT.address);
      txBuilder.amount(amount);
      txBuilder.sender(testData.TEST_SINGLE_SIG_ACCOUNT.address);
      txBuilder.sequence(1545099);
      txBuilder.fee('1000');
      txBuilder.flags(2147483648);

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      rawTx.should.equal(testData.TEST_TRANSFER_TX_SINGLE_SIG.unsignedTxHex);

      const rebuilder = factory.from(rawTx);
      rebuilder.setSingleSig();
      rebuilder.sign({ key: testData.TEST_SINGLE_SIG_ACCOUNT.privateKey });
      const rebuiltTx = await rebuilder.build();
      const rebuiltRawTx = rebuiltTx.toBroadcastFormat();
      rebuiltRawTx.should.equal(testData.TEST_TRANSFER_TX_SINGLE_SIG.signedTxHex);
    });

    it('should build a multi-sig transfer', async function () {
      const txBuilder = factory.getTransferBuilder();

      txBuilder.to(testData.TEST_SINGLE_SIG_ACCOUNT.address);
      txBuilder.amount('2000000');
      txBuilder.sender(utils.getAddressDetails(testData.TEST_MULTI_SIG_ACCOUNT.address).address);
      txBuilder.sequence(1546022);
      txBuilder.fee('1000');
      txBuilder.flags(2147483648);

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      rawTx.should.equal(testData.TEST_TRANSFER_TX_MULTI_SIG.unsignedTxHex);

      const rebuilder = factory.getTransferBuilder();
      rebuilder.from(rawTx);
      rebuilder.setMultiSig();
      rebuilder.sign({ key: testData.SIGNER_USER.prv });
      rebuilder.sign({ key: testData.SIGNER_BITGO.prv });
      const rebuiltTx = await rebuilder.build();
      const rebuiltRawTx = rebuiltTx.toBroadcastFormat();
      rebuiltRawTx.should.equal(testData.TEST_TRANSFER_TX_MULTI_SIG.signedTxHex);
    });
  });
});
