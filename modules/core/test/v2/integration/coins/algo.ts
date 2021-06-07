import * as should from 'should';
import { TestBitGo } from '../../../lib/test_bitgo';
import * as nock from 'nock';

describe('ALGO:', function() {
  let bitgo;
  let algocoin;

  before(function() {
    nock.restore();
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.authenticateWithAccessToken({ accessToken: 'v2xe4b45b5fac02ece72fd7b0f1501e43cb65da8503c1cf4c528db0fe2bfdbbdfca' });
    bitgo.initializeTestVars();
    algocoin = bitgo.coin('talgo');
  });

  describe('Algo non participation key reg transaction', function() {
    // TODO: The test currently works against 'testnet-01' environment as the accompanying platform changes are not
    // yet available in 'test' environment.
    // Once the platform updates are available in 'test', this test will be enabled, updated and a separate PR will be submitted
    xit('should successfully submit non paticipating key reg transaction', async function() {
      const algoWallet = await algocoin.wallets().getWallet({ id: TestBitGo.V2.TEST_ALGO_WALLET_ID });

      // Build and sign the transaction
      const preBuiltSignedTx: any = await algoWallet.prebuildAndSignTransaction({
        type: 'keyreg',
        nonParticipation: true,
        walletPassphrase: 'Ghghjkg!455544llll'
      });
      preBuiltSignedTx.should.have.propertyByPath('halfSigned', 'txHex');
      // preBuiltSignedTx.should.have.propertyByPath('txInfo', 'type').eql('keyreg');
      // preBuiltSignedTx.should.have.propertyByPath('txInfo', 'nonParticipation').eql(true);

      await bitgo.unlock( { otp: '0000000' });
      // submit the transaction
      const data = {
        type: 'keyreg',
        nonParticipation: true,
        halfSigned: preBuiltSignedTx.halfSigned
      };
      const txResponse = await algoWallet.submitTransaction(data);
      should.exist(txResponse);
      txResponse.should.have.propertyByPath('transfer', 'id');
      txResponse.should.have.property('txid');
      txResponse.should.have.property('tx');
      txResponse.should.have.property('status').eql('signed');
    });
  });
});
