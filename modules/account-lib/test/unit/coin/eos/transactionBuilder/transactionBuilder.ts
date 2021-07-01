import should from 'should';
import { coins } from '@bitgo/statics';
import { TransferBuilder } from '../../../../../src/coin/eos/transferBuilder';
import * as EosResources from '../../../../resources/eos';

describe('Eos Transfer builder', () => {
  let builder: TransferBuilder;

  const sender = EosResources.accounts.account1;
  const receiver = EosResources.accounts.account2;
  beforeEach(() => {
    const config = coins.get('eos');
    builder = new TransferBuilder(config);
  });

  describe('build transaction', () => {
    it('should build a transaction', async () => {
      builder.testnet().sign({ key: sender.privateKey });
      builder.action('eosio.token', [sender.name], {
        from: sender.name,
        to: receiver.name,
        quantity: '1.0000 SYS',
        memo: 'Some memo',
      });
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.from, sender.name);
      should.deepEqual(json.actions[0].data.to, 'david');
      should.deepEqual(json.actions[0].data.quantity, '1.0000 SYS');
      should.deepEqual(json.actions[0].data.memo, 'Some memo');
      should.deepEqual(
        tx.toBroadcastFormat().serializedTransaction,
        EosResources.tranferTransaction.serializedTransaction,
      );
    });
  });
});
