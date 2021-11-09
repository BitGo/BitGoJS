import 'should';

import { TestBitGo } from '../../../lib/test_bitgo';
import { TX_WITH_REPLAY_PROTECTION } from '../../fixtures/coins/bch';

describe('BCH:', function () {
  const bitgo = new TestBitGo();

  describe('Explain Transaction:', () => {
    it('should successfully explain a transaction that includes a single sig p2sh replay protection input', async function () {
      const tbch = bitgo.coin('tbch');

      const explanation = await tbch.explainTransaction({
        txHex: TX_WITH_REPLAY_PROTECTION,
      });

      explanation.should.have.property('signatures', 0);
    });
  });
});
