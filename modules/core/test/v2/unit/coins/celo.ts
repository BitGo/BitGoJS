import { TestBitGo } from '../../../lib/test_bitgo';
import { Tcelo } from '../../../../src/v2/coins/tcelo';
import { Celo } from '../../../../src/v2/coins/celo';

describe('Celo Gold', function() {
	let bitgo;
	let basecoin;

	before(function() {
		bitgo = new TestBitGo({ env: 'mock' });
		bitgo.initializeTestVars();
		basecoin = bitgo.coin('tcelo');
	});

	it('should instantiate the coin', function() {
		let localBasecoin = bitgo.coin('tcelo');
		localBasecoin.should.be.an.instanceof(Tcelo);

		localBasecoin = bitgo.coin('celo');
		localBasecoin.should.be.an.instanceof(Celo);
	});
});
