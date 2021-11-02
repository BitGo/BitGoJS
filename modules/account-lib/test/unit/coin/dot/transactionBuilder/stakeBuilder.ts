import { coins } from '@bitgo/statics';
import should from 'should';
import sinon, { assert } from 'sinon';
import { StakeBuilder } from '../../../../../src/coin/dot';
import * as DotResources from '../../../../resources/dot';

describe('Dot Stake Builder', () => {
  let builder: StakeBuilder;

  const sender = DotResources.accounts.account1;
  const receiver = DotResources.accounts.account2;

  beforeEach(() => {
    const config = coins.get('algo');
    builder = new StakeBuilder(config);
  });
  describe('setter validation', () => {
    it('should validate stake amount', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.amount('-1'),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.amount('1000'));
      assert.calledTwice(spy);
    });

    it('should validate controller address', () => {
      const spy = sinon.spy(builder, 'validateAddress');
      should.throws(
        () => builder.controller('asd'),
        (e: Error) => e.message === `The address 'asd' is not a well-formed dot address`,
      );
      should.doesNotThrow(() => builder.controller(sender.address));
      assert.calledTwice(spy);
    });

    it('should validate payee', () => {
      const spy = sinon.spy(builder, 'validateAddress');
      should.throws(
        () => builder.payee({ Account: 'asd' }),
        (e: Error) => e.message === `The address 'asd' is not a well-formed dot address`,
      );
      should.doesNotThrow(() => builder.payee({ Account: sender.address }));
      should.doesNotThrow(() => builder.payee('Staked'));
      should.doesNotThrow(() => builder.payee('Controller'));
      should.doesNotThrow(() => builder.payee('Stash'));
      assert.calledTwice(spy);
    });
  });

  describe('build stake transaction', () => {
    it('should build a stake transaction', async () => {
      builder
        .testnet()
        .amount('90034235235322')
        .controller(receiver.address)
        .payee('Staked')
        .sender(sender.address)
        .validity({ firstValid: 3933 })
        .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .tip(0)
        .transactionVersion(7)
        .durationConfig({ maxDuration: 64 });
      builder.sign({ key: sender.secretKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '90034235235322');
      should.deepEqual(txJson.controller, receiver.address);
      should.deepEqual(txJson.payee, 'Staked');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.blockHash, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, '0x2b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349');
      should.deepEqual(txJson.specVersion, 9100);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, 7);
      should.deepEqual(txJson.chainName, 'Polkadot');
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build an unsigned stake transaction', async () => {
      builder
        .testnet()
        .amount('90034235235322')
        .controller(receiver.address)
        .payee('Staked')
        .sender(sender.address)
        .validity({ firstValid: 3933 })
        .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .tip(0)
        .transactionVersion(7)
        .durationConfig({ maxDuration: 64 });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '90034235235322');
      should.deepEqual(txJson.controller, receiver.address);
      should.deepEqual(txJson.payee, 'Staked');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.blockHash, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, '0x2b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349');
      should.deepEqual(txJson.specVersion, 9100);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, 7);
      should.deepEqual(txJson.chainName, 'Polkadot');
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw signed tx', async () => {
      builder.testnet().from(DotResources.rawTx.stake.signed);
      builder
        .validity({ firstValid: 3933 })
        .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .transactionVersion(7);
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '50000000000000');
      should.deepEqual(txJson.controller, receiver.address);
      should.deepEqual(txJson.payee, 'Staked');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.blockHash, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, '0x2b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349');
      should.deepEqual(txJson.specVersion, 9100);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, 7);
      should.deepEqual(txJson.chainName, 'Polkadot');
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw unsigned tx', async () => {
      builder.testnet().from(DotResources.rawTx.stake.unsigned);
      builder
        .validity({ firstValid: 3933 })
        .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender(sender.address)
        .sign({ key: sender.secretKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '50000000000000');
      should.deepEqual(txJson.controller, receiver.address);
      should.deepEqual(txJson.payee, 'Staked');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.blockHash, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, '0x2b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349');
      should.deepEqual(txJson.specVersion, 9100);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.eraPeriod, 64);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, 7);
      should.deepEqual(txJson.chainName, 'Polkadot');
    });

    it('should build from raw signed tx with receiver account', async () => {
      builder.testnet().from(DotResources.rawTx.stake.signedAlt);
      builder
        .validity({ firstValid: 3933 })
        .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .transactionVersion(7);
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '50000000000000');
      should.deepEqual(txJson.controller, receiver.address);
      should.deepEqual(txJson.payee, receiver.address);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.blockHash, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, '0x2b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349');
      should.deepEqual(txJson.specVersion, 9100);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, 7);
      should.deepEqual(txJson.chainName, 'Polkadot');
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw unsigned tx with payee account', async () => {
      builder.testnet().from(DotResources.rawTx.stake.unsignedAlt);
      builder
        .validity({ firstValid: 3933 })
        .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender(sender.address)
        .sign({ key: sender.secretKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '50000000000000');
      should.deepEqual(txJson.controller, receiver.address);
      should.deepEqual(txJson.payee, receiver.address);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.blockHash, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, '0x2b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349');
      should.deepEqual(txJson.specVersion, 9100);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.eraPeriod, 64);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, 7);
      should.deepEqual(txJson.chainName, 'Polkadot');
    });
  });
});
