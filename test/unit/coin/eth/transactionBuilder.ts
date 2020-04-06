import { TransactionType } from '../../../../src/coin/baseCoin/';
import { getBuilder, Eth } from '../../../../src';
import should from 'should';

describe('Eth Transaction builder', function() {
  const defaultKeyPair = new Eth.KeyPair({
    prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
  });

  describe('should build', () => {
    it('an init transaction', async () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({
        fee: '10',
        gasLimit: '1000',
      });
      txBuilder.chainId(31);
      const source = {
        prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
      };
      const sourceKeyPair = new Eth.KeyPair(source);
      txBuilder.source(sourceKeyPair.getAddress());
      txBuilder.counter(1);
      //TODO: Implement get address from pub
      // to use new Eth.KeyPair({ pub: 'e2e2c2e1b485251db5473fdce4d96424ddfc0a0876e54980cf60a52379d5dfb9a9bc2ff1d01b222a90cd00f931dce8dd84fe9dfc00202a9bf920da8d697636fd' }).getAddress()
      txBuilder.owner(sourceKeyPair.getAddress());
      txBuilder.owner('0x7325A3F7d4f9E86AE62Cf742426078C3755730d5');
      txBuilder.owner('0x603e077acd3F01e81b95fB92ce42FF60dFf3D4C7');
      const tx = await txBuilder.build(); //build without sign

      tx.type.should.equal(TransactionType.WalletInitialization);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('1000');
      txJson.gasPrice.should.equal('10');
      should.equal(txJson.nonce, 1);
      should.equal(txJson.chainId, 31);
    });
  });

  describe('should sign', () => {
    it('an init transaction', async () => {
      const txBuilder: any = getBuilder('eth');
      txBuilder.type(TransactionType.WalletInitialization);
      txBuilder.fee({
        fee: '10',
        gasLimit: '1000',
      });
      txBuilder.chainId(31);
      const source = {
        prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C',
      };
      const sourceKeyPair = new Eth.KeyPair(source);
      txBuilder.source(sourceKeyPair.getAddress());
      txBuilder.counter(1);
      //TODO: Implement get address from pub
      // to use new Eth.KeyPair({ pub: 'e2e2c2e1b485251db5473fdce4d96424ddfc0a0876e54980cf60a52379d5dfb9a9bc2ff1d01b222a90cd00f931dce8dd84fe9dfc00202a9bf920da8d697636fd' }).getAddress()
      txBuilder.owner(sourceKeyPair.getAddress());
      txBuilder.owner('0x7325A3F7d4f9E86AE62Cf742426078C3755730d5');
      txBuilder.owner('0x603e077acd3F01e81b95fB92ce42FF60dFf3D4C7');
      txBuilder.sign({ key: defaultKeyPair.getKeys().prv });
      const tx = await txBuilder.build(); //shoud build and sign

      tx.type.should.equal(TransactionType.WalletInitialization);
      const txJson = tx.toJson();
      txJson.gasLimit.should.equal('1000');
      txJson.gasPrice.should.equal('10');
      should.equal(txJson.nonce, 1);
      should.equal(txJson.chainId, 31);
      should.equal(
        tx.toBroadcastFormat(),
        '0xf84b010a8203e880800162a08d4c95218e68d91bcefe19c46d398e6bed27fb56a54bb84dce7c82bbefdd851da044531a4148a80add7dca63740227ff6fb3981eb47ff31724e2af0bf6bea96c20',
      );
    });
  });
});
