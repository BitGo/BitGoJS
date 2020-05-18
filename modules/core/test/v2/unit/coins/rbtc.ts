import { TestBitGo } from '../../../lib/test_bitgo';
import { Rbtc, Trbtc } from '../../../../src/v2/coins';

describe('RSK Smart Bitcoin', function() {
	let bitgo;
	let basecoin;

	before(function() {
		bitgo = new TestBitGo({ env: 'mock' });
		bitgo.initializeTestVars();
		basecoin = bitgo.coin('trbtc');
	});

	it('should instantiate the coin', function() {
		let localBasecoin = bitgo.coin('trbtc');
		localBasecoin.should.be.an.instanceof(Trbtc);

		localBasecoin = bitgo.coin('rbtc');
		localBasecoin.should.be.an.instanceof(Rbtc);
	});
});
