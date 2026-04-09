import assert from 'assert';
import should from 'should';

import { TransferBuilder } from '../../src/lib/transferBuilder';

describe('Tezos Transfer builder', function () {
  describe('should build', () => {
    it('a valid transfer with minimum fields', async () => {
      const builder = new TransferBuilder();
      const transfer = builder.amount('10').from('a').to('b').fee('20').build();
      transfer.amount.should.equal('10');
      should.not.exist(transfer.coin);
      transfer.from.should.equal('a');
      transfer.to.should.equal('b');
      transfer.fee.fee.should.equal('20');
      should.not.exist(transfer.fee.gasLimit);
      should.not.exist(transfer.fee.storageLimit);
      should.not.exist(transfer.counter);
      should.not.exist(transfer.dataToSign);
    });

    it('a valid transfer with all fields', async () => {
      const builder = new TransferBuilder();
      const transfer = builder
        .amount('10')
        .coin('testCoin')
        .from('a')
        .to('b')
        .fee('20')
        .gasLimit('30')
        .storageLimit('40')
        .counter('0')
        .dataToSign('someEncodedData')
        .build();
      transfer.amount.should.equal('10');
      should.exist(transfer.coin);
      transfer.coin!.should.equal('testCoin');
      transfer.from.should.equal('a');
      transfer.to.should.equal('b');
      transfer.fee.fee.should.equal('20');
      should.exist(transfer.fee.gasLimit);
      transfer.fee.gasLimit!.should.equal('30');
      should.exist(transfer.fee.storageLimit);
      transfer.fee.storageLimit!.should.equal('40');
      should.exist(transfer.counter);
      transfer.counter!.should.equal('0');
      should.exist(transfer.dataToSign);
      transfer.dataToSign!.should.equal('someEncodedData');
    });
  });

  describe('should fail to', () => {
    it('build an empty transfer', async () => {
      const builder = new TransferBuilder();
      assert.throws(() => builder.build(), new RegExp('Missing transfer mandatory fields'));
    });

    it('build a transfer without amount', async () => {
      const builder = new TransferBuilder()
        .from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL')
        .to('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A')
        .fee('20');
      assert.throws(() => builder.build(), new RegExp('Missing transfer mandatory fields'));
    });

    it('build a transfer without from address', async () => {
      const builder = new TransferBuilder().amount('10').to('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A').fee('20');
      assert.throws(() => builder.build(), new RegExp('Missing transfer mandatory fields'));
    });

    it('build a transfer without destination address', async () => {
      const builder = new TransferBuilder().amount('10').from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL').fee('20');
      assert.throws(() => builder.build(), new RegExp('Missing transfer mandatory fields'));
    });

    it('build a transfer without fee', async () => {
      const builder = new TransferBuilder()
        .amount('10')
        .from('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL')
        .to('tz1VRjRpVKnv16AVprFH1tkDn4TDfVqA893A');
      assert.throws(() => builder.build(), new RegExp('Missing transfer mandatory fields'));
    });
  });
});
