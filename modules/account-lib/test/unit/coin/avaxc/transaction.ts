import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../../../src/coin/eth';
import { getCommon } from '../../../../src/coin/avaxc/utils';

describe('AvaxC Transaction', () => {
  const coinConfig = coins.get('tavaxc');
  const common = getCommon(coinConfig.network.type);

  const getTransaction = (): Transaction => {
    return new Transaction(coinConfig, common);
  };

  it('should throw empty transaction', () => {
    const tx = getTransaction();
    should.throws(() => {
      tx.toJson();
    });
    should.throws(() => {
      tx.toBroadcastFormat();
    });
  });

  describe('should sign if transaction is', () => {
    it('invalid', function() {
      // TODO
    });

    it('valid', async () => {
      // TODO
    });

    it('multiple valid', async () => {
      // TODO
    });
  });

  describe('should return encoded tx', function() {
    it('valid sign', async function() {
      // TODO
    });
  });
});
