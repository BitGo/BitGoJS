import { getBuilder } from '../getBuilder';
import should from 'should';
import * as testData from '../resources';

describe('Soneium Transfer Builder', () => {
  describe('Build from TxHex', function () {
    it('Should successfully build from txHex', async function () {
      const txBuilder = getBuilder('tsoneium');
      const txHex = testData.TXN_Hash;
      txBuilder.from(txHex);
      const parsedTx = await txBuilder.build();
      const json = parsedTx.toJson();
      should.exist(json);

      json.should.have.property('chainId').equal('0x79a');
      json.should.have.property('nonce').equal(0);
      json.should.have.property('gasPrice').equal('1000252');
      json.should.have.property('gasLimit').equal('21000');
      json.should.have.property('from').equal('0xb2da92bb8395846d69d801acfadacafa9c5c94e8');
      json.should.have.property('to').equal('0x086cac074eeb7e3d50bf1983cde2c57b48a452d1');
      json.should.have.property('value').equal('100000000000');
    });
  });
});
