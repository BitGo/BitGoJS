require('should');

const TestV2BitGo = require('../../lib/test_bitgo');

describe('LTC:', function() {
  let bitgo;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
  });

  describe('Should canonicalize address', function() {
    it('for prod address', function() {
      const prodLtc = bitgo.coin('ltc');
      const oldAddress = '3GBygsGPvTdfKMbq4AKZZRu1sPMWPEsBfd';
      const newAddress = prodLtc.canonicalAddress(oldAddress, 2);
      newAddress.should.equal('MNQ7zkgMsaV67rsjA3JuP59RC5wxRXpwgE');
      const sameAddress = prodLtc.canonicalAddress(oldAddress, 1);
      oldAddress.should.equal(sameAddress);
      const newOldAddress = prodLtc.canonicalAddress(newAddress, 1);
      oldAddress.should.equal(newOldAddress);
    });
    it('for test address', function() {
      const testLtc = bitgo.coin('tltc');
      const newAddress = 'QLc2RwpX2rFtZzoZrexLibcAgV6Nsg74Jn';
      const oldAddress = testLtc.canonicalAddress(newAddress, 1);
      oldAddress.should.equal('2MsFGJvxH1kCoRp3XEYvKduAjY6eYz9PJHz');
      const sameAddress = testLtc.canonicalAddress(newAddress, 2);
      newAddress.should.equal(sameAddress);
      const newNewAddress = testLtc.canonicalAddress(oldAddress, 2);
      newAddress.should.equal(newNewAddress);
    });
  });
});
