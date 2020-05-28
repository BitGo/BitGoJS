import should from 'should';
import { TransferBuilder } from '../../../../src/coin/eth';
import { Eth } from '../../../../src';
import * as testData from '../../../resources/eth/eth';

describe('Eth send multi sig builder', function() {
  describe('should build', () => {
    const toAddress = '0x7325A3F7d4f9E86AE62Cf742426078C3755730d5';
    const xprv =
      'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2';
    const key = new Eth.KeyPair({ prv: xprv }).getKeys().prv as string;
    const amount = '100000000000000000'; // equivalent to 0.1 ether

    it('native coin transfer should succeed', async () => {
      const builder = new TransferBuilder()
        .expirationTime(1590078260)
        .amount(amount)
        .to(toAddress)
        .contractSequenceId(2)
        .key(key)
        .data('0x');
      const result = builder.signAndBuild();
      should.equal(result, testData.SEND_FUNDS_DATA);
    });

    it('erc20 transfer should succeed', async () => {
      const builder = new TransferBuilder()
        .coin('tcusd')
        .expirationTime(1590078260)
        .amount(amount)
        .to(toAddress)
        .contractSequenceId(2)
        .key(key);
      const result = builder.signAndBuild();
      should.equal(result, testData.SEND_TOKEN_DATA);
    });

    it('should fail if a coin is not an ERC20 instance', () => {
      should.throws(() => {
        new TransferBuilder().coin('eth');
      }, 'There was an error using that coin as a transfer currency');
    });

    it('should fail if a key param is missing', () => {
      const builder = new TransferBuilder()
        .amount(amount)
        .to(toAddress)
        .contractSequenceId(2);
      should.throws(() => builder.signAndBuild());
    });

    it('should fail if a sequenceId param is missing', () => {
      const builder = new TransferBuilder()
        .amount(amount)
        .to(toAddress)
        .key(key);
      should.throws(() => builder.signAndBuild());
    });

    it('should fail if a destination param is missing', () => {
      const builder = new TransferBuilder()
        .amount(amount)
        .contractSequenceId(2)
        .key(key);
      should.throws(() => builder.signAndBuild());
    });

    it('should fail if a amount param is missing', () => {
      const builder = new TransferBuilder()
        .to(toAddress)
        .contractSequenceId(2)
        .key(key);
      should.throws(() => builder.signAndBuild());
    });
  });
});
