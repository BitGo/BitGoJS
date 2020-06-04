import should from 'should';
import { TransferBuilder } from '../../../../src/coin/eth';
import { Eth } from '../../../../src';
import * as testData from '../../../resources/eth/eth';

describe('Eth send multi sig builder', function() {
  const toAddress = '0x7325A3F7d4f9E86AE62Cf742426078C3755730d5';
  const xprv =
    'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2';
  const key = new Eth.KeyPair({ prv: xprv }).getKeys().prv as string;
  const amount = '100000000000000000'; // equivalent to 0.1 ether

  describe('should build', () => {
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

    it('should build without a signature set', () => {
      const builder = new TransferBuilder()
        .expirationTime(1590078260)
        .amount(amount)
        .to(toAddress)
        .contractSequenceId(2)
        .data('0x');
      const result = builder.signAndBuild();
      should.equal(result, testData.SEND_FUNDS_NO_KEY_DATA);
    });

    it('should build from a non signed serialized data', () => {
      const builder = new TransferBuilder(testData.SEND_FUNDS_NO_KEY_DATA);
      builder.key(key);
      const result = builder.signAndBuild();
      should.equal(result, testData.SEND_FUNDS_DATA);
    });
  });

  describe('should fail', () => {
    it('should fail if a coin does not exists in @bitgo/statics', () => {
      should(() => {
        new TransferBuilder().coin('inexistentcoin');
      }).throw();
    });

    it('should fail if a coin is a token but not an ERC20 token', () => {
      should.throws(() => {
        new TransferBuilder().coin('xlm:ETH-GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5');
      }, 'There was an error using that coin as a transfer currency');
    });

    it('should fail with an invalid key', () => {
      const builder = new TransferBuilder()
        .expirationTime(1590078260)
        .amount(amount)
        .to(toAddress)
        .contractSequenceId(2)
        .key('invalidkey');
      should(() => {
        builder.signAndBuild();
      }).throw('private key length is invalid');
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

    it('should fail if a coin is not an ERC20 instance', () => {
      should.throws(() => {
        new TransferBuilder().coin('eth');
      }, 'There was an error using that coin as a transfer currency');
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
