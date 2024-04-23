import should from 'should';
import { coins, EthereumNetwork as EthLikeNetwork } from '@bitgo/statics';
import { KeyPair, TransferBuilder } from '../../src';
import * as testData from '../resources/eth';

describe('Eth send multi sig builder', function () {
  const toAddress = '0x7325A3F7d4f9E86AE62Cf742426078C3755730d5';
  const xprv =
    'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2';
  const key = new KeyPair({ prv: xprv }).getKeys().prv as string;
  const amount = '100000000000000000'; // equivalent to 0.1 ether
  const coin = coins.get('hteth') as unknown as EthLikeNetwork;
  describe('should build', () => {
    it('native coin transfer should succeed', async () => {
      const builder = new TransferBuilder()
        .expirationTime(1590078260)
        .amount(amount)
        .to(toAddress)
        .contractSequenceId(2)
        .key(key)
        .data('0x');
      const result = builder.signAndBuild(`${coin.chainId}`);
      should.equal(result, testData.SEND_FUNDS_DATA);
    });

    it('native coin transfer with coin explicitly set should succeed', async () => {
      const builder = new TransferBuilder()
        .expirationTime(1590078260)
        .coin('eth')
        .amount(amount)
        .to(toAddress)
        .contractSequenceId(2)
        .key(key)
        .data('0x');
      const result = builder.signAndBuild(`${coin.chainId}`);
      should.equal(result, testData.SEND_FUNDS_DATA);
    });

    it('native coin transfer with sequenceId zero should succeed', async () => {
      const builder = new TransferBuilder()
        .expirationTime(1590078260)
        .amount(amount)
        .to(toAddress)
        .contractSequenceId(0)
        .key(key)
        .data('0x');
      const result = builder.signAndBuild(`${coin.chainId}`);
      should.equal(result, testData.SEND_FUNDS_SEQUENCE_ZERO_DATA);
    });

    it('native coin transfer with amount 0 should succeed', async () => {
      const builder = new TransferBuilder()
        .expirationTime(1590078260)
        .amount('0')
        .to(toAddress)
        .contractSequenceId(2)
        .key(key)
        .data('0x');
      const result = builder.signAndBuild(`${coin.chainId}`);
      should.equal(result, testData.SEND_FUNDS_AMOUNT_ZERO_DATA);
    });

    it('ERC20 token transfer should succeed', async () => {
      const builder = new TransferBuilder()
        .coin('terc')
        .expirationTime(1590078260)
        .amount(amount)
        .to(toAddress)
        .contractSequenceId(2)
        .key(key);
      const result = builder.signAndBuild(`${coin.chainId}`);
      should.equal(result, testData.SEND_TERC_DATA);
    });

    it('should build without a signature set', () => {
      const builder = new TransferBuilder()
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
