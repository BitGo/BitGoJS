import { TransactionType } from '@bitgo-beta/sdk-core';
import should from 'should';
import { TransactionBuilder } from '../../../src';

export function runFlushNftTests(coinName: string, getBuilder): void {
  describe(`${coinName} transaction builder flush NFTs`, () => {
    let txBuilder: TransactionBuilder;

    beforeEach(() => {
      txBuilder = getBuilder(coinName) as TransactionBuilder;
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '100000',
      });
      txBuilder.counter(1);
    });

    describe('ERC721 Flush', () => {
      it('should build a flush ERC721 transaction with forwarder v4', async () => {
        const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
        const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
        const tokenId = '12345';

        txBuilder.type(TransactionType.FlushERC721);
        txBuilder.contract(forwarderAddress);
        txBuilder.tokenAddress(tokenAddress);
        txBuilder.forwarderAddress(forwarderAddress);
        txBuilder.forwarderVersion(4);
        txBuilder.tokenId(tokenId);

        const tx = await txBuilder.build();
        const txJson = tx.toJson();

        should.equal(tx.type, TransactionType.FlushERC721);
        should.equal(txJson.to, forwarderAddress);
        should.exist(txJson.data);
        txJson.data.should.startWith('0x159e44d7');
        should.exist(txJson.value);
        txJson.value.should.equal('0');
        should.exist(txJson.gasLimit);
        txJson.gasLimit.should.equal('100000');
        should.exist(txJson.gasPrice);
        txJson.gasPrice.should.equal('1000000000');

        // Verify the encoded parameters in the data
        const encodedTokenAddress = tokenAddress.slice(2).toLowerCase().padStart(64, '0');
        const encodedTokenId = BigInt(tokenId).toString(16).padStart(64, '0');
        txJson.data.should.containEql(encodedTokenAddress);
        txJson.data.should.containEql(encodedTokenId);
      });

      it('should build a flush ERC721 transaction with forwarder version < v4', async () => {
        const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
        const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
        const contractAddress = '0x9e2c5712ab4caf402a98c4bf58c79a0dfe718ad1';
        const tokenId = '54321';

        txBuilder.type(TransactionType.FlushERC721);
        txBuilder.contract(contractAddress);
        txBuilder.tokenAddress(tokenAddress);
        txBuilder.forwarderAddress(forwarderAddress);
        txBuilder.forwarderVersion(2);
        txBuilder.tokenId(tokenId);

        const tx = await txBuilder.build();
        const txJson = tx.toJson();

        should.equal(tx.type, TransactionType.FlushERC721);
        should.equal(txJson.to, contractAddress);
        should.exist(txJson.data);
        txJson.data.should.startWith('0x5a953d0a'); // flushERC721Tokens method ID for v2 and below
        should.equal(txJson.value, '0');

        // Verify the encoded parameters
        const encodedForwarderAddress = forwarderAddress.slice(2).toLowerCase().padStart(64, '0');
        const encodedTokenAddress = tokenAddress.slice(2).toLowerCase().padStart(64, '0');
        const encodedTokenId = BigInt(tokenId).toString(16).padStart(64, '0');
        txJson.data.should.containEql(encodedForwarderAddress);
        txJson.data.should.containEql(encodedTokenAddress);
        txJson.data.should.containEql(encodedTokenId);
      });

      it('should build a flush ERC721 with large token ID', async () => {
        const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
        const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
        const tokenId = '115792089237316195423570985008687907853269984665640564039457584007913129639935'; // max uint256

        txBuilder.type(TransactionType.FlushERC721);
        txBuilder.contract(forwarderAddress);
        txBuilder.tokenAddress(tokenAddress);
        txBuilder.forwarderAddress(forwarderAddress);
        txBuilder.forwarderVersion(4);
        txBuilder.tokenId(tokenId);

        const tx = await txBuilder.build();
        const txJson = tx.toJson();

        should.equal(tx.type, TransactionType.FlushERC721);
        should.equal(txJson.to, forwarderAddress);
        should.exist(txJson.data);
        txJson.data.should.startWith('0x159e44d7');

        // Verify large token ID is properly encoded
        const maxUint256Hex = 'f'.repeat(64);
        txJson.data.should.containEql(maxUint256Hex);
      });

      it('should build flush ERC721 with token ID as string zero', async () => {
        const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
        const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
        const tokenId = '0';

        txBuilder.type(TransactionType.FlushERC721);
        txBuilder.contract(forwarderAddress);
        txBuilder.tokenAddress(tokenAddress);
        txBuilder.forwarderAddress(forwarderAddress);
        txBuilder.forwarderVersion(4);
        txBuilder.tokenId(tokenId);

        const tx = await txBuilder.build();
        const txJson = tx.toJson();

        should.equal(tx.type, TransactionType.FlushERC721);
        should.equal(txJson.to, forwarderAddress);
        should.exist(txJson.data);

        // Verify token ID 0 is properly encoded
        const encodedZeroTokenId = '0'.padStart(64, '0');
        txJson.data.should.containEql(encodedZeroTokenId);
      });

      it('should fail to build flush ERC721 without token address', async () => {
        const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
        const tokenId = '12345';

        txBuilder.type(TransactionType.FlushERC721);
        txBuilder.contract(forwarderAddress);
        txBuilder.tokenId(tokenId);
        txBuilder.forwarderVersion(4);

        await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing token address');
      });

      it('should fail to build flush ERC721 without token ID', async () => {
        const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
        const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';

        txBuilder.type(TransactionType.FlushERC721);
        txBuilder.contract(forwarderAddress);
        txBuilder.tokenAddress(tokenAddress);
        txBuilder.forwarderVersion(4);

        await txBuilder.build().should.be.rejectedWith('Token ID is required for ERC721 flush');
      });

      it('should fail to build flush ERC721 without contract address', async () => {
        const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
        const tokenId = '12345';

        txBuilder.type(TransactionType.FlushERC721);
        txBuilder.tokenAddress(tokenAddress);
        txBuilder.tokenId(tokenId);
        txBuilder.forwarderVersion(4);

        await txBuilder.build().should.be.rejected();
      });

      it('should decode flush ERC721 transaction from raw tx with v4', async () => {
        const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
        const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
        const tokenId = '12345';

        // Build a transaction first
        txBuilder.type(TransactionType.FlushERC721);
        txBuilder.contract(forwarderAddress);
        txBuilder.forwarderAddress(forwarderAddress);
        txBuilder.tokenAddress(tokenAddress);
        txBuilder.tokenId(tokenId);
        txBuilder.forwarderVersion(4);

        const builtTx = await txBuilder.build();
        const txHex = builtTx.toBroadcastFormat();

        // Create a new builder and parse the transaction
        const rebuilder = getBuilder(coinName) as TransactionBuilder;
        rebuilder.from(txHex);
        const rebuiltTx = await rebuilder.build();

        should.equal(rebuiltTx.type, TransactionType.FlushERC721);
        const txJson = rebuiltTx.toJson();
        should.equal(txJson.to, forwarderAddress);
        should.exist(txJson.data);
        txJson.data.should.startWith('0x159e44d7');
      });

      it('should decode flush ERC721 transaction from raw tx with version < v4', async () => {
        const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
        const contractAddress = '0x9e2c5712ab4caf402a98c4bf58c79a0dfe718ad1';
        const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
        const tokenId = '99999';

        // Build a transaction first
        txBuilder.type(TransactionType.FlushERC721);
        txBuilder.contract(contractAddress);
        txBuilder.tokenAddress(tokenAddress);
        txBuilder.forwarderAddress(forwarderAddress);
        txBuilder.tokenId(tokenId);
        txBuilder.forwarderVersion(2);

        const builtTx = await txBuilder.build();
        const txHex = builtTx.toBroadcastFormat();

        // Create a new builder and parse the transaction
        const rebuilder = getBuilder(coinName) as TransactionBuilder;
        rebuilder.from(txHex);
        const rebuiltTx = await rebuilder.build();

        should.equal(rebuiltTx.type, TransactionType.FlushERC721);
        const txJson = rebuiltTx.toJson();
        should.equal(txJson.to, contractAddress);
        should.exist(txJson.data);
        txJson.data.should.startWith('0x5a953d0a');
      });
    });

    describe('ERC1155 Flush', () => {
      it('should build a flush ERC1155 transaction with forwarder v4', async () => {
        const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
        const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
        const tokenId = '99999';

        txBuilder.type(TransactionType.FlushERC1155);
        txBuilder.contract(forwarderAddress);
        txBuilder.tokenAddress(tokenAddress);
        txBuilder.forwarderAddress(forwarderAddress);
        txBuilder.tokenId(tokenId);
        txBuilder.forwarderVersion(4);

        const tx = await txBuilder.build();
        const txJson = tx.toJson();

        should.equal(tx.type, TransactionType.FlushERC1155);
        should.equal(txJson.to, forwarderAddress);
        should.exist(txJson.data);
        txJson.data.should.startWith('0x8972c17c'); // flushERC1155Tokens v4 method ID
        should.exist(txJson.value);
        txJson.value.should.equal('0');
        should.exist(txJson.gasLimit);
        txJson.gasLimit.should.equal('100000');
        should.exist(txJson.gasPrice);
        txJson.gasPrice.should.equal('1000000000');

        // Verify the encoded parameters in the data
        const encodedTokenAddress = tokenAddress.slice(2).toLowerCase().padStart(64, '0');
        const encodedTokenId = BigInt(tokenId).toString(16).padStart(64, '0');
        txJson.data.should.containEql(encodedTokenAddress);
        txJson.data.should.containEql(encodedTokenId);
      });

      it('should build a flush ERC1155 transaction with forwarder version < v4', async () => {
        const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
        const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
        const contractAddress = '0x9e2c5712ab4caf402a98c4bf58c79a0dfe718ad1';
        const tokenId = '555';

        txBuilder.type(TransactionType.FlushERC1155);
        txBuilder.contract(contractAddress);
        txBuilder.tokenAddress(tokenAddress);
        txBuilder.forwarderAddress(forwarderAddress);
        txBuilder.forwarderVersion(2);
        txBuilder.tokenId(tokenId);

        const tx = await txBuilder.build();
        const txJson = tx.toJson();

        should.equal(tx.type, TransactionType.FlushERC1155);
        should.equal(txJson.to, contractAddress);
        should.exist(txJson.data);
        txJson.data.should.startWith('0xe6bd0aa4'); // flushForwarderERC1155Tokens method ID for v3 and below
        should.equal(txJson.value, '0');

        // Verify the encoded parameters
        const encodedForwarderAddress = forwarderAddress.slice(2).toLowerCase().padStart(64, '0');
        const encodedTokenAddress = tokenAddress.slice(2).toLowerCase().padStart(64, '0');
        const encodedTokenId = BigInt(tokenId).toString(16).padStart(64, '0');
        txJson.data.should.containEql(encodedForwarderAddress);
        txJson.data.should.containEql(encodedTokenAddress);
        txJson.data.should.containEql(encodedTokenId);
      });

      it('should fail to build flush ERC1155 without token address', async () => {
        const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
        const tokenId = '99999';

        txBuilder.type(TransactionType.FlushERC1155);
        txBuilder.contract(forwarderAddress);
        txBuilder.tokenId(tokenId);
        txBuilder.forwarderVersion(4);

        await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing token address');
      });

      it('should fail to build flush ERC1155 without token ID', async () => {
        const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
        const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';

        txBuilder.type(TransactionType.FlushERC1155);
        txBuilder.contract(forwarderAddress);
        txBuilder.tokenAddress(tokenAddress);
        txBuilder.forwarderVersion(4);

        await txBuilder.build().should.be.rejectedWith('Token ID is required for ERC1155 flush');
      });

      it('should fail to build flush ERC1155 without contract address', async () => {
        const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
        const tokenId = '12345';

        txBuilder.type(TransactionType.FlushERC1155);
        txBuilder.tokenAddress(tokenAddress);
        txBuilder.tokenId(tokenId);
        txBuilder.forwarderVersion(4);

        await txBuilder.build().should.be.rejected();
      });

      it('should build flush ERC1155 with token ID as string zero', async () => {
        const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
        const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
        const tokenId = '0';

        txBuilder.type(TransactionType.FlushERC1155);
        txBuilder.contract(forwarderAddress);
        txBuilder.tokenAddress(tokenAddress);
        txBuilder.forwarderAddress(forwarderAddress);
        txBuilder.tokenId(tokenId);
        txBuilder.forwarderVersion(4);

        const tx = await txBuilder.build();
        const txJson = tx.toJson();

        should.equal(tx.type, TransactionType.FlushERC1155);
        should.equal(txJson.to, forwarderAddress);
        should.exist(txJson.data);

        // Verify token ID 0 is properly encoded
        const encodedZeroTokenId = '0'.padStart(64, '0');
        txJson.data.should.containEql(encodedZeroTokenId);
      });

      it('should handle large token IDs for ERC1155 with v4', async () => {
        const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
        const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
        const tokenId = '115792089237316195423570985008687907853269984665640564039457584007913129639935'; // max uint256

        txBuilder.type(TransactionType.FlushERC1155);
        txBuilder.contract(forwarderAddress);
        txBuilder.forwarderAddress(forwarderAddress);
        txBuilder.tokenAddress(tokenAddress);
        txBuilder.tokenId(tokenId);
        txBuilder.forwarderVersion(4);

        const tx = await txBuilder.build();
        const txJson = tx.toJson();

        should.equal(tx.type, TransactionType.FlushERC1155);
        should.equal(txJson.to, forwarderAddress);
        should.exist(txJson.data);
        txJson.data.should.startWith('0x8972c17c');

        // Verify large token ID is properly encoded
        const maxUint256Hex = 'f'.repeat(64);
        txJson.data.should.containEql(maxUint256Hex);
      });

      it('should handle large token IDs for ERC1155 with version < v4', async () => {
        const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
        const contractAddress = '0x9e2c5712ab4caf402a98c4bf58c79a0dfe718ad1';
        const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
        const tokenId = '115792089237316195423570985008687907853269984665640564039457584007913129639935'; // max uint256

        txBuilder.type(TransactionType.FlushERC1155);
        txBuilder.contract(contractAddress);
        txBuilder.tokenAddress(tokenAddress);
        txBuilder.forwarderAddress(forwarderAddress);
        txBuilder.tokenId(tokenId);
        txBuilder.forwarderVersion(2);

        const tx = await txBuilder.build();
        const txJson = tx.toJson();

        should.equal(tx.type, TransactionType.FlushERC1155);
        should.equal(txJson.to, contractAddress);
        should.exist(txJson.data);
        txJson.data.should.startWith('0xe6bd0aa4');

        // Verify large token ID is properly encoded
        const maxUint256Hex = 'f'.repeat(64);
        txJson.data.should.containEql(maxUint256Hex);
      });

      it('should decode flush ERC1155 transaction from raw tx with v4', async () => {
        const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
        const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
        const tokenId = '99999';

        // Build a transaction first
        txBuilder.type(TransactionType.FlushERC1155);
        txBuilder.contract(forwarderAddress);
        txBuilder.forwarderAddress(forwarderAddress);
        txBuilder.tokenAddress(tokenAddress);
        txBuilder.tokenId(tokenId);
        txBuilder.forwarderVersion(4);

        const builtTx = await txBuilder.build();
        const txHex = builtTx.toBroadcastFormat();

        // Create a new builder and parse the transaction
        const rebuilder = getBuilder(coinName) as TransactionBuilder;
        rebuilder.from(txHex);
        const rebuiltTx = await rebuilder.build();

        should.equal(rebuiltTx.type, TransactionType.FlushERC1155);
        const txJson = rebuiltTx.toJson();
        should.equal(txJson.to, forwarderAddress);
        should.exist(txJson.data);
        txJson.data.should.startWith('0x8972c17c');
      });

      it('should decode flush ERC1155 transaction from raw tx with version < v4', async () => {
        const forwarderAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
        const contractAddress = '0x9e2c5712ab4caf402a98c4bf58c79a0dfe718ad1';
        const tokenAddress = '0xdf7decb1baa8f529f0c8982cbb4be50357195299';
        const tokenId = '7777';

        // Build a transaction first
        txBuilder.type(TransactionType.FlushERC1155);
        txBuilder.contract(contractAddress);
        txBuilder.tokenAddress(tokenAddress);
        txBuilder.forwarderAddress(forwarderAddress);
        txBuilder.tokenId(tokenId);
        txBuilder.forwarderVersion(1);

        const builtTx = await txBuilder.build();
        const txHex = builtTx.toBroadcastFormat();

        // Create a new builder and parse the transaction
        const rebuilder = getBuilder(coinName) as TransactionBuilder;
        rebuilder.from(txHex);
        const rebuiltTx = await rebuilder.build();

        should.equal(rebuiltTx.type, TransactionType.FlushERC1155);
        const txJson = rebuiltTx.toJson();
        should.equal(txJson.to, contractAddress);
        should.exist(txJson.data);
        txJson.data.should.startWith('0xe6bd0aa4');
      });
    });
  });
}
