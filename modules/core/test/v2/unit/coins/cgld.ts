import { TestBitGo } from '../../../lib/test_bitgo';
import { Tcgld } from '../../../../src/v2/coins/tcgld';
import { Cgld } from '../../../../src/v2/coins/cgld';

describe('Celo Gold', function() {
  let bitgo;
  let basecoin;

  before(function() {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tcgld');
  });

  it('should instantiate the coin', function() {
    let localBasecoin = bitgo.coin('tcgld');
    localBasecoin.should.be.an.instanceof(Tcgld);

	  localBasecoin = bitgo.coin('cgld');
	  localBasecoin.should.be.an.instanceof(Cgld);
  });
});
