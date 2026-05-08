import assert from 'assert';
import should from 'should';
import { coins, EthereumNetwork as EthLikeNetwork } from '@bitgo/statics';
import { KeyPair, TransferBuilder } from '../../src';

describe('Eth send multi sig builder', function () {
  const toAddress = '0x7325A3F7d4f9E86AE62Cf742426078C3755730d5';
  const xprv =
    'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2';
  const key = new KeyPair({ prv: xprv }).getKeys().prv as string;
  const amount = '100000000000000000'; // equivalent to 0.1 ether
  const ethLikeCoins = ['hteth', 'tarbeth', 'topeth', 'zketh'];

  describe('should fail', () => {
    it('should fail if a coin does not exists in @bitgo/statics', () => {
      should(() => {
        new TransferBuilder().coin('inexistentcoin');
      }).throw();
    });

    ethLikeCoins.forEach((coin) => {
      it('should fail with an invalid key', () => {
        const staticsCoin = coins.get(coin) as unknown as EthLikeNetwork;
        const builder = new TransferBuilder()
          .coin(coin)
          .expirationTime(1590078260)
          .amount(amount)
          .to(toAddress)
          .contractSequenceId(2)
          .key('invalidkey');
        should(() => {
          builder.signAndBuild(`${staticsCoin.chainId}`);
        }).throw('private key length is invalid');
      });
    });

    it('should fail with an invalid sequence id', () => {
      should(() => {
        new TransferBuilder().contractSequenceId(-1);
      }).throw('Invalid contract sequence id');
    });

    it('should fail with an invalid destination address', () => {
      should(() => {
        new TransferBuilder().to('invalidaddress');
      }).throw('Invalid address');
    });

    it('should fail with an invalid amount: text value', () => {
      should(() => {
        new TransferBuilder().amount('invalidamount');
      }).throw('Invalid amount');
    });

    it('should fail with an invalid amount: negative value', () => {
      should(() => {
        new TransferBuilder().amount('-10');
      }).throw('Invalid amount');
    });

    it('should fail with an invalid expiration time', () => {
      should(() => {
        new TransferBuilder().expirationTime(-1);
      }).throw('Invalid expiration time');
    });

    it('should fail if a sequenceId param is missing', () => {
      const builder = new TransferBuilder().amount(amount).to(toAddress).key(key);
      assert.throws(() => builder.signAndBuild(''));
    });

    it('should fail if a destination param is missing', () => {
      const builder = new TransferBuilder().amount(amount).contractSequenceId(2).key(key);
      assert.throws(() => builder.signAndBuild(''));
    });

    it('should fail if a amount param is missing', () => {
      const builder = new TransferBuilder().to(toAddress).contractSequenceId(2).key(key);
      assert.throws(() => builder.signAndBuild(''));
    });
  });
});
