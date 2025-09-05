import should from 'should';
import {
  flushERC721TokensData,
  flushERC1155TokensData,
  decodeFlushERC721TokensData,
  decodeFlushERC1155TokensData,
} from '../../src/lib/utils';

describe('Abstract ETH Utils', () => {
  describe('ERC721 Flush Functions', () => {
    it('should encode flush ERC721 data correctly for v0-v3', () => {
      const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
      const tokenId = '12345';
      const forwarderVersion = 0;

      const encoded = flushERC721TokensData(forwarderAddress, tokenAddress, tokenId, forwarderVersion);

      should.exist(encoded);
      encoded.should.startWith('0x5a953d0a'); // flushERC721ForwarderTokens method ID
      encoded.should.be.a.String();
      encoded.length.should.be.greaterThan(10); // method ID + parameters
    });

    it('should encode flush ERC721 data correctly for v4+', () => {
      const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
      const tokenId = '12345';
      const forwarderVersion = 4;

      const encoded = flushERC721TokensData(forwarderAddress, tokenAddress, tokenId, forwarderVersion);

      should.exist(encoded);
      encoded.should.startWith('0x159e44d7'); // flushERC721Token method ID (v5)
      encoded.should.be.a.String();
    });

    it('should decode flush ERC721 data correctly for v0-v3', () => {
      const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
      const tokenId = '12345';
      const forwarderVersion = 0;

      const encoded = flushERC721TokensData(forwarderAddress, tokenAddress, tokenId, forwarderVersion);
      const decoded = decodeFlushERC721TokensData(encoded);

      should.exist(decoded);
      decoded.forwarderAddress.toLowerCase().should.equal(forwarderAddress.toLowerCase());
      decoded.tokenAddress.toLowerCase().should.equal(tokenAddress.toLowerCase());
      decoded.tokenId.should.equal(tokenId);
      decoded.forwarderVersion.should.equal(0);
    });

    it('should decode flush ERC721 data correctly for v4+', () => {
      const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
      const tokenId = '12345';
      const forwarderVersion = 4;

      const encoded = flushERC721TokensData(forwarderAddress, tokenAddress, tokenId, forwarderVersion);
      const decoded = decodeFlushERC721TokensData(encoded, forwarderAddress);

      should.exist(decoded);
      decoded.forwarderAddress.toLowerCase().should.equal(forwarderAddress.toLowerCase());
      decoded.tokenAddress.toLowerCase().should.equal(tokenAddress.toLowerCase());
      decoded.tokenId.should.equal(tokenId);
      decoded.forwarderVersion.should.equal(4);
    });

    it('should handle large token IDs for ERC721', () => {
      const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
      const tokenId = '115792089237316195423570985008687907853269984665640564039457584007913129639935'; // max uint256
      const forwarderVersion = 0;

      const encoded = flushERC721TokensData(forwarderAddress, tokenAddress, tokenId, forwarderVersion);
      const decoded = decodeFlushERC721TokensData(encoded);

      decoded.tokenId.should.equal(tokenId);
    });

    it('should throw error for invalid flush ERC721 data', () => {
      const invalidData = '0x12345678'; // Wrong method ID

      should.throws(() => {
        decodeFlushERC721TokensData(invalidData);
      }, /Invalid flush ERC721 bytecode/);
    });

    it('should throw error for missing to address in v4+ decode', () => {
      const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
      const tokenId = '12345';
      const forwarderVersion = 4;

      const encoded = flushERC721TokensData(forwarderAddress, tokenAddress, tokenId, forwarderVersion);

      should.throws(() => {
        decodeFlushERC721TokensData(encoded); // Missing 'to' parameter
      }, /Missing to address/);
    });
  });

  describe('ERC1155 Flush Functions', () => {
    it('should encode flush ERC1155 data correctly for v0-v3', () => {
      const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
      const tokenId = '99999';
      const forwarderVersion = 0;

      const encoded = flushERC1155TokensData(forwarderAddress, tokenAddress, tokenId, forwarderVersion);

      should.exist(encoded);
      encoded.should.startWith('0xe6bd0aa4'); // flushERC1155ForwarderTokens method ID
      encoded.should.be.a.String();
      encoded.length.should.be.greaterThan(10); // method ID + parameters
    });

    it('should encode flush ERC1155 data correctly for v4+', () => {
      const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
      const tokenId = '99999';
      const forwarderVersion = 4;

      const encoded = flushERC1155TokensData(forwarderAddress, tokenAddress, tokenId, forwarderVersion);

      should.exist(encoded);
      encoded.should.startWith('0x8972c17c'); // flushERC1155Tokens method ID (v5)
      encoded.should.be.a.String();
    });

    it('should decode flush ERC1155 data correctly for v0-v3', () => {
      const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
      const tokenId = '99999';
      const forwarderVersion = 0;

      const encoded = flushERC1155TokensData(forwarderAddress, tokenAddress, tokenId, forwarderVersion);
      const decoded = decodeFlushERC1155TokensData(encoded);

      should.exist(decoded);
      decoded.forwarderAddress.toLowerCase().should.equal(forwarderAddress.toLowerCase());
      decoded.tokenAddress.toLowerCase().should.equal(tokenAddress.toLowerCase());
      decoded.tokenId.should.equal(tokenId);
      decoded.forwarderVersion.should.equal(0);
    });

    it('should decode flush ERC1155 data correctly for v4+', () => {
      const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
      const tokenId = '99999';
      const forwarderVersion = 4;

      const encoded = flushERC1155TokensData(forwarderAddress, tokenAddress, tokenId, forwarderVersion);
      const decoded = decodeFlushERC1155TokensData(encoded, forwarderAddress);

      should.exist(decoded);
      decoded.forwarderAddress.toLowerCase().should.equal(forwarderAddress.toLowerCase());
      decoded.tokenAddress.toLowerCase().should.equal(tokenAddress.toLowerCase());
      decoded.tokenId.should.equal(tokenId);
      decoded.forwarderVersion.should.equal(4);
    });

    it('should handle token ID 0 for ERC1155', () => {
      const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
      const tokenId = '0';
      const forwarderVersion = 0;

      const encoded = flushERC1155TokensData(forwarderAddress, tokenAddress, tokenId, forwarderVersion);
      const decoded = decodeFlushERC1155TokensData(encoded);

      decoded.tokenId.should.equal(tokenId);
    });

    it('should handle large token IDs for ERC1155', () => {
      const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
      const tokenId = '115792089237316195423570985008687907853269984665640564039457584007913129639935'; // max uint256
      const forwarderVersion = 0;

      const encoded = flushERC1155TokensData(forwarderAddress, tokenAddress, tokenId, forwarderVersion);
      const decoded = decodeFlushERC1155TokensData(encoded);

      decoded.tokenId.should.equal(tokenId);
    });

    it('should throw error for invalid flush ERC1155 data', () => {
      const invalidData = '0x87654321'; // Wrong method ID

      should.throws(() => {
        decodeFlushERC1155TokensData(invalidData);
      }, /Invalid flush ERC1155 bytecode/);
    });

    it('should throw error for missing to address in v4+ decode', () => {
      const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
      const tokenId = '99999';
      const forwarderVersion = 4;

      const encoded = flushERC1155TokensData(forwarderAddress, tokenAddress, tokenId, forwarderVersion);

      should.throws(() => {
        decodeFlushERC1155TokensData(encoded); // Missing 'to' parameter
      }, /Missing to address/);
    });
  });

  describe('Token Address Validation', () => {
    it('should preserve address format in encoding/decoding', () => {
      const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
      const tokenAddressChecksum = '0xDf7DECb1bAa8F529F0C8982cBB4Be50357195299'; // With checksum
      const tokenId = '12345';
      const forwarderVersion = 0;

      const encoded721 = flushERC721TokensData(forwarderAddress, tokenAddressChecksum, tokenId, forwarderVersion);
      const decoded721 = decodeFlushERC721TokensData(encoded721);

      // Should preserve the address (though may lowercase it)
      decoded721.tokenAddress.toLowerCase().should.equal(tokenAddressChecksum.toLowerCase());

      const encoded1155 = flushERC1155TokensData(forwarderAddress, tokenAddressChecksum, tokenId, forwarderVersion);
      const decoded1155 = decodeFlushERC1155TokensData(encoded1155);

      decoded1155.tokenAddress.toLowerCase().should.equal(tokenAddressChecksum.toLowerCase());
    });
  });
});
