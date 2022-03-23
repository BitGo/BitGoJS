import 'should';
import { getUtxoCoin } from '../util';

describe('Custom LTC tests', function () {
  const ltc = getUtxoCoin('ltc');
  const tltc = getUtxoCoin('tltc');

  describe('Canonicalize address', function () {
    it('base58 mainnet address', function () {
      const standardBase58Address = '3GBygsGPvTdfKMbq4AKZZRu1sPMWPEsBfd';
      const litecoinBase58Address = 'MNQ7zkgMsaV67rsjA3JuP59RC5wxRXpwgE';

      // convert from new format to old
      const downgradedAddress = ltc.canonicalAddress(litecoinBase58Address, 1);
      downgradedAddress.should.equal(standardBase58Address);

      // convert from new format to new (no-op)
      const unmodifiedAddress = ltc.canonicalAddress(litecoinBase58Address, 2);
      unmodifiedAddress.should.equal(litecoinBase58Address);

      // convert from old format to new
      const upgradedAddress = ltc.canonicalAddress(standardBase58Address, 2);
      upgradedAddress.should.equal(litecoinBase58Address);
    });

    it('base58 testnet address', function () {
      const standardBase58Address = '2MsFGJvxH1kCoRp3XEYvKduAjY6eYz9PJHz';
      const litecoinBase58Address = 'QLc2RwpX2rFtZzoZrexLibcAgV6Nsg74Jn';

      // convert from new format to old
      const downgradedAddress = tltc.canonicalAddress(litecoinBase58Address, 1);
      downgradedAddress.should.equal(standardBase58Address);

      // convert from new format to new (no-op)
      const unmodifiedAddress = tltc.canonicalAddress(litecoinBase58Address, 2);
      unmodifiedAddress.should.equal(litecoinBase58Address);

      // convert from old format to new
      const upgradedAddress = tltc.canonicalAddress(standardBase58Address, 2);
      upgradedAddress.should.equal(litecoinBase58Address);
    });

    it('lower case bech32 mainnet address', function () {
      // canonicalAddress will only accept lower case bech32 addresses - they are already
      // in canonical format, and the script hash version is not relevant
      const bech32Address = 'ltc1qgrl8zpndsklaa9swgd5vevyxmx5x63vcrl7dk4';
      const version1Address = ltc.canonicalAddress(bech32Address, 1);
      version1Address.should.equal(bech32Address);
      const version2Address = ltc.canonicalAddress(bech32Address, 2);
      version2Address.should.equal(bech32Address);
    });

    it('uppercase bech32 mainnet address should fail', function () {
      // canonicalAddress only accepts lower case bech32 addresses, uppercase addresses
      // are valid according to the spec but will be treated as invalid
      const bech32Address = 'LTC1QGRL8ZPNDSKLAA9SWGD5VEVYXMX5X63VCRL7DK4';
      (() => ltc.canonicalAddress(bech32Address)).should.throw('invalid address');
    });

    it('mixed-case bech32 mainnet address should fail', function () {
      const bech32Address = 'ltc1QGRL8ZPNDSKLAA9SWGD5VEVYXMX5X63VCRL7DK4';
      (() => ltc.canonicalAddress(bech32Address)).should.throw('invalid address');
    });

    it('lower case bech32 testnet address', function () {
      const bech32Address = 'tltc1qu78xur5xnq6fjy83amy0qcjfau8m367defyhms';
      const version1Address = tltc.canonicalAddress(bech32Address, 1);
      version1Address.should.equal(bech32Address);
      const version2Address = tltc.canonicalAddress(bech32Address, 2);
      version2Address.should.equal(bech32Address);
    });

    it('uppercase bech32 testnet address should fail', function () {
      const bech32Address = 'TLTC1QU78XUR5XNQ6FJY83AMY0QCJFAU8M367DEFYHMS';
      (() => ltc.canonicalAddress(bech32Address)).should.throw('invalid address');
    });

    it('mixed case bech32 testnet address should fail', function () {
      const bech32Address = 'tltc1QU78XUR5XNQ6FJY83AMY0QCJFAU8M367DEFYHMS';
      (() => ltc.canonicalAddress(bech32Address)).should.throw('invalid address');
    });
  });

  describe('should validate addresses', () => {
    it('should validate base58 addresses', () => {
      // known valid main and testnet base58 address are valid
      ltc.isValidAddress('MH6J1PzpsAfapZek7QGHv2mheUxnP8Kdek').should.be.true();
      tltc.isValidAddress('QWC1miKKHFikbwg2iyt8KZBGsTSEBKr21i').should.be.true();

      // malformed base58 addresses are invalid
      ltc.isValidAddress('MH6J1PzpsAfapZek7QGHv2mheUxnP8Kder').should.be.false();
      tltc.isValidAddress('QWC1miKKHFikbwg2iyt8KZBGsTSEBKr21l').should.be.false();
    });

    it('should validate bech32 addresses', () => {
      // all lower case is valid
      ltc.isValidAddress('ltc1qq7fzt3ek5ege3v92wh0q6wzcjr39pqswlpe36mu28f6yufark3wspfryg7').should.be.true();
      tltc.isValidAddress('tltc1qq7fzt3ek5ege3v92wh0q6wzcjr39pqswlpe36mu28f6yufark3ws2x86ht').should.be.true();

      // all upper case is invalid
      ltc.isValidAddress('LTC1QQ7FZT3EK5EGE3V92WH0Q6WZCJR39PQSWLPE36MU28F6YUFARK3WSPFRYG7').should.be.false();
      tltc.isValidAddress('TLTC1QQ7FZT3EK5EGE3V92WH0Q6WZCJR39PQSWLPE36MU28F6YUFARK3WS2X86HT').should.be.false();

      // mixed case is invalid
      ltc.isValidAddress('LTC1QQ7FZT3EK5EGE3V92WH0Q6WZCJR39PQSWLPE36MU28F6YUFARK3WSPFRYg7').should.be.false();
      tltc.isValidAddress('TLTC1QQ7FZT3EK5EGE3V92WH0Q6WZCJR39PQSWLPE36MU28F6YUFARK3WS2X86Ht').should.be.false();

      // malformed addresses are invalid
      ltc.isValidAddress('ltc1qq7fzt3ek5ege3v92wh0q6wzcjr39pqswlpe36mu28f6yufark3wspfryg9').should.be.false();
      tltc.isValidAddress('tltc1qq7fzt3ek5ege3v92wh0q6wzcjr39pqswlpe36mu28f6yufark3ws2x86hl').should.be.false();
    });
  });
});
