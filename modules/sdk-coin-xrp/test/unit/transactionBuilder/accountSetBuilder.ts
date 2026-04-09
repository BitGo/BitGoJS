import should from 'should';
import utils from '../../../src/lib/utils';
import * as testData from '../../resources/xrp';
import { getBuilderFactory } from '../getBuilderFactory';

describe('XRP Account Update Builder', () => {
  const factory = getBuilderFactory('txrp');

  describe('Succeed', () => {
    it('should build an AccountSet transaction', async function () {
      const txBuilder = factory.getAccountUpdateBuilder();

      txBuilder.sender(utils.getAddressDetails(testData.TEST_MULTI_SIG_ACCOUNT.address).address);
      txBuilder.sequence(1546021);
      txBuilder.fee('1000');
      txBuilder.flags(2147483648);
      txBuilder.setFlag(4);

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      rawTx.should.equal(testData.TEST_ACCOUNT_UPDATE_TX.unsignedTxHex);

      const rebuilder = factory.getAccountUpdateBuilder();
      rebuilder.from(rawTx);
      rebuilder.setSingleSig();
      rebuilder.sign({ key: testData.TEST_MULTI_SIG_ACCOUNT.privateKey });
      const rebuiltTx = await rebuilder.build();
      const rebuiltRawTx = rebuiltTx.toBroadcastFormat();
      rebuiltRawTx.should.equal(testData.TEST_ACCOUNT_UPDATE_TX.signedTxHex);
    });
  });
});
