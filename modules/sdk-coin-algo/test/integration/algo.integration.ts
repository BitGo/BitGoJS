import * as should from 'should';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

describe('ALGO:', function () {
  let bitgo;
  let algocoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    algocoin = bitgo.coin('talgo');
  });

  describe('Algo non partipation key reg transaction', function () {
    // TODO: The test currently works against 'testnet-01' environment as the accompanying platform changes are not
    // yet available in 'test' environment.
    // Once the platform updates are available in 'test', this test will be enabled, updated and a separate PR will be submitted
    xit('should successfully submit non paticipating key reg transaction', async function () {
      const algoWallet = await algocoin.wallets().getWallet({ id: TestBitGo.V2.TEST_ALGO_WALLET_ID });

      // Build and sign the transaction
      const preBuiltSignedTx: any = await algoWallet.prebuildAndSignTransaction({
        type: 'keyreg',
        nonParticipation: true,
        walletPassphrase: TestBitGo.TEST_PASSWORD,
      });
      preBuiltSignedTx.should.have.property('txHex');
      preBuiltSignedTx.should.have.propertyByPath('txInfo', 'type').eql('keyreg');
      preBuiltSignedTx.should.have.propertyByPath('txInfo', 'nonParticipation').eql(true);

      // submit the transaction
      const txResponse = await algoWallet.submitTransaction({ halfSigned: preBuiltSignedTx.halfSigned });
      should.exist(txResponse);
      txResponse.should.have.property('transfer', 'id');
      txResponse.should.have.property('txid');
      txResponse.should.have.property('tx');
      txResponse.should.have.property('status').eql('signed');
    });
  });
});
