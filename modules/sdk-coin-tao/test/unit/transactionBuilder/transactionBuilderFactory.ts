import { coins } from '@bitgo/statics';
import should from 'should';
import { TransactionBuilderFactory, TransferBuilder } from '../../../src/lib';
import { Interface } from '../../../src';
import { testTx } from '../../resources';
import * as materialData from '../../resources/materialData.json';

describe('Tao Transaction Builder Factory', function () {
  let factory: TransactionBuilderFactory;

  describe('Initialize builder from raw tx', function () {
    before(function () {
      factory = new TransactionBuilderFactory(coins.get('ttao'));
    });

    describe('Transfer Builder', function () {
      it(`Unsigned txn`, async () => {
        const builder = factory.from(testTx.transfer.unsignedHex);
        builder.should.be.instanceOf(TransferBuilder);
        builder.sender({ address: testTx.transfer.sender });
        builder.validity({ firstValid: testTx.transfer.blockNumber });
        const tx = await builder.build();
        should.equal(tx.toBroadcastFormat(), testTx.transfer.unsignedHex);
      });

      it(`Signed txn`, async () => {
        const builder = factory.from(testTx.transfer.signedHex);
        builder.should.be.instanceOf(TransferBuilder);
        builder.referenceBlock(testTx.transfer.blockHash);
        builder.validity({ firstValid: testTx.transfer.blockNumber });
        const tx = await builder.build();
        should.equal(tx.toBroadcastFormat(), testTx.transfer.signedHex);
      });
    });
  });
});
