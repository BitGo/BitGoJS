import { getBuilder } from '../getBuilder';
import should from 'should';
import * as testData from '../resources';

describe('Somnia Transfer Builder', () => {
  describe('Build from TxHex', function () {
    it('Should successfully build from txHex', async function () {
      const txBuilder = getBuilder('tstt');
      const txHex = testData.TXN_Hash;
      txBuilder.from(txHex);
      const parsedTx = await txBuilder.build();
      const json = parsedTx.toJson();
      should.exist(json);
      json.should.have.property('chainId').equal('0xc488');
      json.should.have.property('nonce').equal(9);
      json.should.have.property('gasPrice').equal('30000000000');
      json.should.have.property('gasLimit').equal('31500');
      json.should.have.property('from').equal('0x2fbf6981df4d01d29b4790df8e4b44c6417c8d61');
      json.should.have.property('to').equal('0xa11c304ec5ef22080b692547365933f3ddce5160');
      json.should.have.property('value').equal('10000000000000');
    });
  });
});
