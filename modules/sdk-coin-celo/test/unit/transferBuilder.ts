import should from 'should';
import { KeyPair, TransferBuilder } from '../../src';
import * as testData from '../resources/celo';
import { coins, EthereumNetwork as EthLikeNetwork } from '@bitgo/statics';

describe('Celo send multi sig builder', function () {
  const toAddress = '0x7325A3F7d4f9E86AE62Cf742426078C3755730d5';
  const xprv =
    'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2';
  const key = new KeyPair({ prv: xprv }).getKeys().prv as string;
  const amount = '100000000000000000'; // equivalent to 0.1 ether
  const coin = coins.get('tcelo') as unknown as EthLikeNetwork;
  describe('should build', () => {
    it('celo token transfer should succeed', async () => {
      const builder = new TransferBuilder()
        .coin('tcusd')
        .expirationTime(1590078260)
        .amount(amount)
        .to(toAddress)
        .contractSequenceId(2)
        .key(key);
      const result = builder.signAndBuild(`${coin.chainId}`);
      should.equal(result, testData.SEND_TOKEN_DATA);
    });

    it('celo erc20 transfer with zero sequence id should succeed', async () => {
      const builder = new TransferBuilder()
        .coin('tcusd')
        .expirationTime(1590078260)
        .amount(amount)
        .to(toAddress)
        .contractSequenceId(0)
        .key(key);
      const result = builder.signAndBuild(`${coin.chainId}`);
      should.equal(result, testData.SEND_TOKEN_SEQUENCE_ZERO_DATA);
    });

    it('celo erc20 transfer with amount 0 should succeed', async () => {
      const builder = new TransferBuilder()
        .coin('tcusd')
        .expirationTime(1590078260)
        .amount('0')
        .to(toAddress)
        .contractSequenceId(2)
        .key(key);
      const result = builder.signAndBuild(`${coin.chainId}`);
      should.equal(result, testData.SEND_TOKEN_AMOUNT_ZERO_DATA);
    });

    it('should build without a signature set', () => {
      const builder = new TransferBuilder()
        .coin('tcelo')
        .expirationTime(1590078260)
        .amount(amount)
        .to(toAddress)
        .contractSequenceId(2)
        .data('0x');
      const result = builder.signAndBuild(`${coin.chainId}`);
      should.equal(result, testData.SEND_FUNDS_NO_KEY_DATA);
    });

    it('should build from a non signed serialized data', () => {
      const builder = new TransferBuilder(testData.SEND_FUNDS_NO_KEY_DATA);
      builder.key(key);
      const result = builder.signAndBuild(`${coin.chainId}`);
      should.equal(result, testData.SEND_FUNDS_DATA);
    });
  });
});
