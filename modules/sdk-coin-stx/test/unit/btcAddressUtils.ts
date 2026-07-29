import should from 'should';
import { decodeBtcAddress, isValidBtcAddress, SbtcAddressVersion } from '../../src/lib/btcAddressUtils';

describe('btcAddressUtils', function () {
  describe('decodeBtcAddress', function () {
    // Mainnet P2PKH
    it('should decode a mainnet P2PKH address', function () {
      const result = decodeBtcAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2');
      result.version.should.equal(SbtcAddressVersion.P2PKH);
      result.hashBytes.length.should.equal(20);
    });

    // Testnet P2PKH
    it('should decode a testnet P2PKH address', function () {
      const result = decodeBtcAddress('mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn');
      result.version.should.equal(SbtcAddressVersion.P2PKH);
      result.hashBytes.length.should.equal(20);
    });

    // Mainnet P2SH
    it('should decode a mainnet P2SH address', function () {
      const result = decodeBtcAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy');
      result.version.should.equal(SbtcAddressVersion.P2SH);
      result.hashBytes.length.should.equal(20);
    });

    // Testnet P2SH
    it('should decode a testnet P2SH address', function () {
      const result = decodeBtcAddress('2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc');
      result.version.should.equal(SbtcAddressVersion.P2SH);
      result.hashBytes.length.should.equal(20);
    });

    // Mainnet P2WPKH (bech32, witness v0, 20-byte program)
    it('should decode a mainnet P2WPKH address', function () {
      const result = decodeBtcAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
      result.version.should.equal(SbtcAddressVersion.P2WPKH);
      result.hashBytes.length.should.equal(20);
    });

    // Testnet P2WPKH
    it('should decode a testnet P2WPKH address', function () {
      const result = decodeBtcAddress('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');
      result.version.should.equal(SbtcAddressVersion.P2WPKH);
      result.hashBytes.length.should.equal(20);
    });

    // Mainnet P2WSH (bech32, witness v0, 32-byte program)
    it('should decode a mainnet P2WSH address', function () {
      const result = decodeBtcAddress('bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3');
      result.version.should.equal(SbtcAddressVersion.P2WSH);
      result.hashBytes.length.should.equal(32);
    });

    // Mainnet P2TR (bech32m, witness v1, 32-byte program)
    it('should decode a mainnet P2TR address', function () {
      const result = decodeBtcAddress('bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0');
      result.version.should.equal(SbtcAddressVersion.P2TR);
      result.hashBytes.length.should.equal(32);
    });

    // Testnet P2TR
    it('should decode a testnet P2TR address', function () {
      const result = decodeBtcAddress('tb1pqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesf3hn0c');
      result.version.should.equal(SbtcAddressVersion.P2TR);
      result.hashBytes.length.should.equal(32);
    });

    it('should throw on an invalid address', function () {
      should.throws(() => decodeBtcAddress('invalidaddress'));
    });
  });

  describe('isValidBtcAddress', function () {
    it('should return true for valid addresses', function () {
      isValidBtcAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2').should.be.true();
      isValidBtcAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy').should.be.true();
      isValidBtcAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4').should.be.true();
      isValidBtcAddress('bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0').should.be.true();
    });

    it('should return false for invalid addresses', function () {
      isValidBtcAddress('').should.be.false();
      isValidBtcAddress('notanaddress').should.be.false();
      isValidBtcAddress('SP10FDHQQ4F2F0KHMN6Z24RMAMGX5933SQJCWKAAR').should.be.false(); // STX address
    });
  });
});
