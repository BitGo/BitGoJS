import * as _ from 'lodash';
import { TestBitGo } from '../../../lib/test_bitgo';
import * as bitgoUtxoLib from 'bitgo-utxo-lib';

describe('ETH-like coins', () => {
	_.forEach(['tetc', 'tcgld', 'trbtc'], (coinName) => {
		describe(`${coinName}`, () => {
			let bitgo;
			let basecoin;

			before(function() {
				bitgo = new TestBitGo({ env: 'mock' });
				bitgo.initializeTestVars();
				basecoin = bitgo.coin(coinName);
			});

			describe('Is valid address', () => {
				it('Should find valid addresses to be valid', () => {
					basecoin.isValidAddress('0x2af9152fc4afd89a8124731bdfb8710c8751f3ed').should.equal(true);
					basecoin.isValidAddress('0x2af9152FC4afd89A8124731BdFb8710c8751f3eD').should.equal(true);
				});

				it('Should find invalid addresses to be invalid', () => {
					basecoin.isValidAddress('0x2af9152fc4afd89a8124731bdfb8710c8751f3edd').should.equal(false);
					basecoin.isValidAddress('0x2af9152fc4afd89a8124731bdfb8710c8751f3e').should.equal(false);
					basecoin.isValidAddress('2af9152fc4afd89a8124731bdfb8710c8751f3ed').should.equal(false);
					basecoin.isValidAddress('notanaddress').should.equal(false);
					basecoin.isValidAddress('not an address').should.equal(false);
					basecoin.isValidAddress('3KgL6DTUb6gEoqSwMMJzyf96ekH8oZtWtZ').should.equal(false);
				});
			});

			describe('Is valid pub', () => {
				it('Should find valid pubs to be valid', () => {
					basecoin.isValidPub('xpub661MyMwAqRbcF9Nc7TbBo1rZAagiWEVPWKbDKThNG8zqjk76HAKLkaSbTn6dK2dQPfuD7xjicxCZVWvj67fP5nQ9W7QURmoMVAX8m6jZsGp').should.equal(true);
					basecoin.isValidPub('04614C070C6D1C18A6A2D6EE2BBBE1FF291A0ABA8ED6B55023C03BE42583AC23A743BCB5EF9DB59E14FD7025A9A5D93C6BA89EEFEB40215BF24933D4F2935D14CB').should.equal(true);
					basecoin.isValidPub('034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa').should.equal(true);
				});

				it('Should find invalid pubs to be invalid', () => {
					basecoin.isValidPub('0x2af9152fc4afd89a8124731bdfb8710c8751f3e').should.equal(false);
					basecoin.isValidPub('0x2af9152fc4afd89a8124731bdfb8710c8751f3ed').should.equal(false);
					basecoin.isValidPub('2af9152fc4afd89a8124731bdfb8710c8751f3ed').should.equal(false);
					basecoin.isValidPub('notapub').should.equal(false);
					basecoin.isValidPub('not a pub').should.equal(false);
					basecoin.isValidPub('3KgL6DTUb6gEoqSwMMJzyf96ekH8oZtWtZ').should.equal(false);
				});
			});

			describe('Generate keypair', () => {
				it('Should generate valid keypair without seed', () => {
					const { pub, prv } = basecoin.generateKeyPair();
					basecoin.isValidPub(pub).should.equal(true);
					const bitgoKey = bitgoUtxoLib.HDNode.fromBase58(prv);
					basecoin.isValidPub(bitgoKey.neutered().toBase58()).should.equal(true);
				});

				it('Should generate valid keypair with seed', () => {
					const seed = Buffer.from('c3b09c24731be2851b641d9d5b3f60fa129695c24071768d15654bea207b7bb6', 'hex');
					const { pub, prv } = basecoin.generateKeyPair(seed);
					basecoin.isValidPub(pub).should.equal(true);
					const bitgoKey = bitgoUtxoLib.HDNode.fromBase58(prv);
					basecoin.isValidPub(bitgoKey.neutered().toBase58()).should.equal(true);
				});
			});
		});
	});
});
