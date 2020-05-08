import should from 'should';
import { TransactionType } from '../../../../src/coin/baseCoin/';
import { getBuilder, Eth } from '../../../../src';
import * as testData from '../../../resources/rbtc/rbtc';

describe('Rbtc Transaction builder', function() {
  const defaultKeyPair = new Eth.KeyPair({
    prv: '63951AF5D5CF06ADE2E8EC0283055548CABCEEB9E9405D00077EC7403BA7A122',
  });

  describe('should sign', () => {
    it('an init transaction', async () => {
      const txBuilder: any = getBuilder('rbtc');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({
        fee: '10000000000',
        gasLimit: '6800000',
      });
      txBuilder.chainId(31);
      const source = {
        prv: '63951AF5D5CF06ADE2E8EC0283055548CABCEEB9E9405D00077EC7403BA7A122',
      };
      const sourceKeyPair = new Eth.KeyPair(source);
      txBuilder.source(sourceKeyPair.getAddress());
      txBuilder.counter(1);
      txBuilder.owner('0xa43f0BDd451E39C7AF20426f43589DEFAd4335E6');
      txBuilder.owner('0x2fa96fca36dd9d646AC8a4e0C19b4D3a0Dc7e456');
      txBuilder.owner('0xc37825D368eC3F50a1505542d8fFB25f7b6288f2');
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      const tx = await txBuilder.build(); //shoud build and sign

      tx.type.should.equal(TransactionType.WalletInitialization);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('6800000');
      txJson.gasPrice.should.equal('10000000000');
      should.equal(txJson.nonce, 1);
      should.equal(txJson.chainId, 31);
      should.equal(tx.toBroadcastFormat(), testData.TX_BROADCAST);
    });
  });
});
