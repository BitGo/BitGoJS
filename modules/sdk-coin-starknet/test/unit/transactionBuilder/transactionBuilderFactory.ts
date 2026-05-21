import should from 'should';
import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory } from '../../../src/lib/transactionBuilderFactory';
import { Accounts, rawTx, TEST_AMOUNTS } from '../../resources/starknet';

describe('Starknet TransactionBuilderFactory', () => {
  const coinConfig = coins.get('starknet');

  describe('getTransferBuilder', () => {
    it('should return a transfer builder', () => {
      const builder = new TransactionBuilderFactory(coinConfig).getTransferBuilder();
      should.exist(builder);
    });
  });

  describe('from', () => {
    it('should rebuild unsigned tx from raw hex', async () => {
      const builder = await new TransactionBuilderFactory(coinConfig).from(rawTx.transfer.unsigned);
      const tx = await builder.build();
      const json = tx.toJson();
      should.exist(json);
      json.sender.should.equal(Accounts.account1.address);
    });

    it('should rebuild signed tx from raw hex', async () => {
      const builder = await new TransactionBuilderFactory(coinConfig).from(rawTx.transfer.signed);
      const tx = await builder.build();
      const json = tx.toJson();
      should.exist(json);
    });
  });
});

describe('Starknet TransferBuilder', () => {
  const coinConfig = coins.get('starknet');

  const getBuilder = () => new TransactionBuilderFactory(coinConfig).getTransferBuilder();

  describe('Build unsigned transaction', () => {
    it('should build an unsigned transfer with required fields', async () => {
      const builder = getBuilder();
      builder
        .sender(Accounts.account1.address)
        .receiverId(Accounts.account2.address)
        .amount(TEST_AMOUNTS.small)
        .nonce('0')
        .chainId('0x534e5f5345504f4c4941');

      const tx = await builder.build();
      should.exist(tx);

      const json = tx.toJson();
      should.exist(json);
      json.sender.should.equal(Accounts.account1.address);
    });
  });

  describe('Validation', () => {
    it('should reject missing sender', async () => {
      const builder = getBuilder();
      builder.receiverId(Accounts.account2.address).amount(TEST_AMOUNTS.small).chainId('0x534e5f5345504f4c4941');
      await builder.build().should.be.rejectedWith('Invalid or missing sender address');
    });

    it('should reject missing recipient', async () => {
      const builder = getBuilder();
      builder.sender(Accounts.account1.address).amount(TEST_AMOUNTS.small).nonce('0').chainId('0x534e5f5345504f4c4941');
      await builder.build().should.be.rejectedWith('Receiver is required');
    });

    it('should reject invalid sender address', () => {
      const builder = getBuilder();
      should.throws(() => builder.sender('not_a_valid_address'));
    });

    it('should reject negative amount', () => {
      const builder = getBuilder();
      should.throws(() => builder.amount('-1'));
    });
  });
});
