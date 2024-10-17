import should from 'should';
import utils from '../../../src/lib/utils';
import * as testData from '../../resources/xrp';
import { getBuilderFactory } from '../getBuilderFactory';

describe('XRP Trustline Builder', () => {
  const factory = getBuilderFactory('txrp:rlusd');

  it('should build a TrustSet transaction', async function () {
    const txBuilder = factory.getTrustSetBuilder();
    const amount = (BigInt(1000000000000) * BigInt(10) ** BigInt(96)).toString();

    txBuilder.sender(utils.getAddressDetails(testData.TEST_MULTI_SIG_ACCOUNT.address).address);
    txBuilder.amount(amount);
    txBuilder.sequence(1546024);
    txBuilder.fee('1000');
    txBuilder.flags(2147483648);

    const tx = await txBuilder.build();
    const rawTx = tx.toBroadcastFormat();
    should.equal(utils.isValidRawTransaction(rawTx), true);
    rawTx.should.equal(testData.TEST_TRUSTLINE_TX.unsignedTxHex);

    const rebuilder = factory.from(rawTx);
    rebuilder.setMultiSig();
    rebuilder.sign({ key: testData.SIGNER_USER.prv });
    rebuilder.sign({ key: testData.SIGNER_BITGO.prv });
    const rebuiltTx = await rebuilder.build();
    const rebuiltRawTx = rebuiltTx.toBroadcastFormat();
    rebuiltRawTx.should.equal(testData.TEST_TRUSTLINE_TX.signedTxHex);
  });
});
