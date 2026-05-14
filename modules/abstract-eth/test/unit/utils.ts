import should from 'should';
import EthereumAbi from 'ethereumjs-abi';
import {
  flushERC721TokensData,
  flushERC1155TokensData,
  decodeFlushERC721TokensData,
  decodeFlushERC1155TokensData,
  decodeBatchTransferData,
} from '../../src/lib/utils';
import { ERC721TransferBuilder } from '../../src/lib/transferBuilders/transferBuilderERC721';
import {
  ERC721TransferFromMethodId,
  ERC721SafeTransferTypeMethodId,
  batchMethodId,
  batchMethodName,
  batchMethodTypes,
} from '../../src/lib/walletUtil';

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
      const forwarderVersion = 2;

      const encoded = flushERC721TokensData(forwarderAddress, tokenAddress, tokenId, forwarderVersion);
      const decoded = decodeFlushERC721TokensData(encoded);

      should.exist(decoded);
      decoded.forwarderAddress.toLowerCase().should.equal(forwarderAddress.toLowerCase());
      decoded.tokenAddress.toLowerCase().should.equal(tokenAddress.toLowerCase());
      decoded.tokenId.should.equal(tokenId);
      should.not.exist(decoded.forwarderVersion);
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
      should.exist(decoded.forwarderVersion);
      should.equal(decoded.forwarderVersion, 4);
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
      const forwarderVersion = 2;

      const encoded = flushERC1155TokensData(forwarderAddress, tokenAddress, tokenId, forwarderVersion);
      const decoded = decodeFlushERC1155TokensData(encoded);

      should.exist(decoded);
      decoded.forwarderAddress.toLowerCase().should.equal(forwarderAddress.toLowerCase());
      decoded.tokenAddress.toLowerCase().should.equal(tokenAddress.toLowerCase());
      decoded.tokenId.should.equal(tokenId);
      should.not.exist(decoded.forwarderVersion);
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
      should.exist(decoded.forwarderVersion);
      should.equal(decoded.forwarderVersion, 4);
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

  describe('ERC721TransferBuilder.buildTransferFrom', () => {
    const owner = '0x19645032c7f1533395d44a629462e751084d3e4d';
    const recipient = '0x19645032c7f1533395d44a629462e751084d3e4c';
    const htsNftAddress = '0x00000000000000000000000000000000007ac203';

    it('should encode transferFrom with selector 0x23b872dd', () => {
      const builder = new ERC721TransferBuilder();
      builder.tokenContractAddress(htsNftAddress).to(recipient).from(owner).tokenId('12');

      const data = builder.buildTransferFrom();

      should.exist(data);
      data.should.startWith(ERC721TransferFromMethodId); // 0x23b872dd
    });

    it('should encode safeTransferFrom with selector 0xb88d4fde via build()', () => {
      const builder = new ERC721TransferBuilder();
      builder.tokenContractAddress(htsNftAddress).to(recipient).from(owner).tokenId('12');

      const data = builder.build();

      should.exist(data);
      data.should.startWith(ERC721SafeTransferTypeMethodId); // 0xb88d4fde
    });

    it('should produce different encodings for build() vs buildTransferFrom()', () => {
      const builder = new ERC721TransferBuilder();
      builder.tokenContractAddress(htsNftAddress).to(recipient).from(owner).tokenId('12');

      const safeTransferData = builder.build();
      const transferFromData = builder.buildTransferFrom();

      safeTransferData.should.not.equal(transferFromData);
      // transferFrom encoding should be shorter (no bytes param)
      transferFromData.length.should.be.lessThan(safeTransferData.length);
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

  describe('decodeBatchTransferData', () => {
    const address1 = '0x1111111111111111111111111111111111111111';
    const address2 = '0x2222222222222222222222222222222222222222';
    const encodeBatch = (addresses: string[], amounts: string[]): string => {
      const selector = EthereumAbi.methodID(batchMethodName, batchMethodTypes);
      const args = EthereumAbi.rawEncode(batchMethodTypes, [addresses, amounts]);
      return '0x' + Buffer.concat([selector, args]).toString('hex');
    };

    it('hardcoded batchMethodId matches the runtime-computed selector', () => {
      const computed = '0x' + EthereumAbi.methodID(batchMethodName, batchMethodTypes).toString('hex');
      computed.should.equal(batchMethodId);
    });

    it('round-trips encode/decode for multiple recipients', () => {
      const data = encodeBatch([address1, address2], ['1000', '2500']);
      const decoded = decodeBatchTransferData(data);

      decoded.recipients.length.should.equal(2);
      decoded.recipients[0].address.toLowerCase().should.equal(address1);
      decoded.recipients[0].amount.should.equal('1000');
      decoded.recipients[1].address.toLowerCase().should.equal(address2);
      decoded.recipients[1].amount.should.equal('2500');
    });

    it('throws on wrong method selector', () => {
      should.throws(() => decodeBatchTransferData('0xdeadbeef00000000'), /Invalid batch transfer bytecode/);
    });

    it('throws when the encoded address[] and uint256[] arrays have different lengths', () => {
      // Encode the batch payload directly with mismatched array lengths.
      const payload = EthereumAbi.rawEncode(batchMethodTypes, [[address1, address2], ['1000']]);
      const tampered =
        '0x' + Buffer.concat([EthereumAbi.methodID(batchMethodName, batchMethodTypes), payload]).toString('hex');
      should.throws(() => decodeBatchTransferData(tampered), /Mismatched batch address\/amount array lengths/);
    });
  });
});
