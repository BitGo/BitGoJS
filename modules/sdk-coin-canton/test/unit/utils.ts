import assert from 'assert';
import should from 'should';
import utils from '../../src/lib/utils';
import { PreparedTransactionRawData } from '../resources';

describe('Canton Util', function () {
  describe('Raw transaction parser', function () {
    it('should parse the prepared transaction', () => {
      const parsedData = utils.parseRawCantonTransactionData(PreparedTransactionRawData);
      should.exist(parsedData);
      assert.equal(parsedData.sender, 'abc-1::12200c1ee226fbdf9fba3461c2c0c73331b69d3c6fd8cfce28cdf864141141cc656d');
      assert.equal(parsedData.receiver, 'abc-2::12207e96ada18a845adf4dc01410265633d5266dca9bb280c98e35c3692db87d3e35');
      assert.equal(parsedData.amount, '20.0000000000');
    });
  });
});
