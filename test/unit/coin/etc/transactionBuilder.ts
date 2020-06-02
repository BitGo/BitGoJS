import should from 'should';
import { TransactionType } from '../../../../src/coin/baseCoin';
import { getBuilder, Eth, Etc } from '../../../../src';
import * as testData from '../../../resources/etc/etc';

describe('Etc Transaction builder', function() {
  const defaultKeyPair = new Eth.KeyPair({
    prv: '3D527F1CB33BB3DECB06F982AABB51B60D8B91209684E1B0938716BAEDC1A2A0',
  });

  describe('should sign', () => {
    it('an init transaction', async () => {
      const txBuilder = getBuilder('etc') as Etc.TransactionBuilder;
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({
        fee: '10000000000',
        gasLimit: '6800000',
      });
      txBuilder.chainId(63);
      const source = {
        prv: '3D527F1CB33BB3DECB06F982AABB51B60D8B91209684E1B0938716BAEDC1A2A0',
      };
      const sourceKeyPair = new Eth.KeyPair(source);
      txBuilder.source(sourceKeyPair.getAddress());
      txBuilder.counter(1);
      txBuilder.owner('0x674DC405677A2E307F69d6E22565506A7776Defa');
      txBuilder.owner('0x7CE9A19bFEbD549059DcB7390C6d302B71546a0d');
      txBuilder.owner('0xF351D9b45f202EC002d067C71C0232A40A0627ED');
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      const tx = await txBuilder.build(); //shoud build and sign

      tx.type.should.equal(TransactionType.WalletInitialization);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('6800000');
      txJson.gasPrice.should.equal('10000000000');
      should.equal(txJson.nonce, 1);
      should.equal(txJson.chainId, 63);
      should.equal(tx.toBroadcastFormat(), testData.TX_BROADCAST);
    });
  });
});
