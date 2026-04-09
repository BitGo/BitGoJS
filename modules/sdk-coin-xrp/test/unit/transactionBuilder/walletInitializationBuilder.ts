import should from 'should';
import utils from '../../../src/lib/utils';
import * as testData from '../../resources/xrp';
import { getBuilderFactory } from '../getBuilderFactory';

describe('XRP Wallet Initialization Builder', () => {
  const factory = getBuilderFactory('txrp');

  describe('Succeed', () => {
    it('should build a SignerListSet txn', async function () {
      const txBuilder = factory.getWalletInitializationBuilder();

      txBuilder.sender(utils.getAddressDetails(testData.TEST_MULTI_SIG_ACCOUNT.address).address);
      txBuilder.signer({ address: testData.SIGNER_USER.address, weight: 1 });
      txBuilder.signer({ address: testData.SIGNER_BACKUP.address, weight: 1 });
      txBuilder.signer({ address: testData.SIGNER_BITGO.address, weight: 1 });
      txBuilder.signerQuorum(2);
      txBuilder.sequence(1546019);
      txBuilder.fee('1000');
      txBuilder.flags(2147483648);

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      rawTx.should.equal(testData.TEST_WALLET_INIT_TX.unsignedTxHex);

      const rebuilder = factory.getWalletInitializationBuilder();
      rebuilder.from(rawTx);
      rebuilder.setSingleSig();
      rebuilder.sign({ key: testData.TEST_MULTI_SIG_ACCOUNT.privateKey });
      const rebuiltTx = await rebuilder.build();
      const rebuiltRawTx = rebuiltTx.toBroadcastFormat();
      rebuiltRawTx.should.equal(testData.TEST_WALLET_INIT_TX.signedTxHex);
    });
  });
});
