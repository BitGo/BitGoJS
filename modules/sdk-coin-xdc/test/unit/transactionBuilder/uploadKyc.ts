import { getBuilder } from '../getBuilder';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import {
  UploadKycBuilder,
  UploadKycCall,
  XDC_VALIDATOR_CONTRACT_ADDRESS_TESTNET,
  UPLOAD_KYC_METHOD_ID,
} from '../../../src/lib';

describe('XDC Upload KYC Builder', () => {
  const coinConfig = coins.get('txdc');

  describe('UploadKycBuilder', () => {
    it('should build uploadKYC call with valid IPFS hash', () => {
      const builder = new UploadKycBuilder(coinConfig);
      const ipfsHash = 'QmRealIPFSHashExample123456789012345678901234';

      const call = builder.ipfsHash(ipfsHash).build();

      should.exist(call);
      call.should.be.instanceOf(UploadKycCall);
      call.ipfsHash.should.equal(ipfsHash);
      call.contractAddress.should.equal(XDC_VALIDATOR_CONTRACT_ADDRESS_TESTNET);
    });

    it('should build uploadKYC call with custom contract address', () => {
      const builder = new UploadKycBuilder(coinConfig);
      const ipfsHash = 'QmCustomIPFSHash123456789012345678901234567';
      const customAddress = '0x1234567890123456789012345678901234567890';

      const call = builder.ipfsHash(ipfsHash).contractAddress(customAddress).build();

      should.exist(call);
      call.contractAddress.should.equal(customAddress);
    });

    it('should accept IPFS v1 hash format (starting with "b")', () => {
      const builder = new UploadKycBuilder(coinConfig);
      const ipfsHash = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';

      const call = builder.ipfsHash(ipfsHash).build();

      should.exist(call);
      call.ipfsHash.should.equal(ipfsHash);
    });

    it('should throw error when IPFS hash is empty', () => {
      const builder = new UploadKycBuilder(coinConfig);

      (() => builder.ipfsHash('')).should.throw('IPFS hash cannot be empty');
    });

    it('should throw error when IPFS hash format is invalid', () => {
      const builder = new UploadKycBuilder(coinConfig);

      (() => builder.ipfsHash('InvalidHash123')).should.throw(
        'Invalid IPFS hash format. Expected hash starting with "Qm" (v0) or "b" (v1)'
      );
    });

    it('should throw error when contract address is empty', () => {
      const builder = new UploadKycBuilder(coinConfig);

      (() => builder.contractAddress('')).should.throw('Contract address cannot be empty');
    });

    it('should throw error when contract address format is invalid', () => {
      const builder = new UploadKycBuilder(coinConfig);

      (() => builder.contractAddress('InvalidAddress')).should.throw('Invalid contract address format');
    });

    it('should throw error when building without IPFS hash', () => {
      const builder = new UploadKycBuilder(coinConfig);

      (() => builder.build()).should.throw('Missing IPFS hash for uploadKYC transaction');
    });

    it('should normalize contract address with 0x prefix', () => {
      const builder = new UploadKycBuilder(coinConfig);
      const ipfsHash = 'QmTestHash123456789012345678901234567890123';
      const addressWithoutPrefix = '1234567890123456789012345678901234567890';

      const call = builder.ipfsHash(ipfsHash).contractAddress(addressWithoutPrefix).build();

      call.contractAddress.should.equal('0x' + addressWithoutPrefix);
    });
  });

  describe('UploadKycCall', () => {
    it('should serialize uploadKYC call correctly', () => {
      const ipfsHash = 'QmTestIPFSHash1234567890123456789012345678';
      const contractAddress = XDC_VALIDATOR_CONTRACT_ADDRESS_TESTNET;

      const call = new UploadKycCall(contractAddress, ipfsHash);
      const serialized = call.serialize();

      should.exist(serialized);
      serialized.should.be.type('string');
      // Should start with the method ID
      serialized.should.startWith(UPLOAD_KYC_METHOD_ID);
    });

    it('should have correct properties', () => {
      const ipfsHash = 'QmTestIPFSHash1234567890123456789012345678';
      const contractAddress = '0x0000000000000000000000000000000000000088';

      const call = new UploadKycCall(contractAddress, ipfsHash);

      call.contractAddress.should.equal(contractAddress);
      call.ipfsHash.should.equal(ipfsHash);
    });
  });

  describe('TransactionBuilder integration', () => {
    it('should build uploadKYC transaction with TransactionBuilder', async () => {
      const txBuilder = getBuilder('txdc');
      const ipfsHash = 'QmTestIPFSHash1234567890123456789012345678';

      txBuilder.type(TransactionType.ContractCall);
      txBuilder.fee({
        fee: '10000000000',
        gasLimit: '100000',
      });
      txBuilder.counter(1);
      txBuilder.uploadKyc().ipfsHash(ipfsHash);

      const tx = await txBuilder.build();

      should.exist(tx);
      const txJson = tx.toJson();
      should.exist(txJson.to);
      txJson.to!.should.equal(XDC_VALIDATOR_CONTRACT_ADDRESS_TESTNET);
      txJson.value.should.equal('0');
      should.exist(txJson.data);
      // Data should start with uploadKYC method ID
      txJson.data.should.startWith(UPLOAD_KYC_METHOD_ID);
    });

    it('should throw error when uploadKyc() is called on non-ContractCall transaction', () => {
      const txBuilder = getBuilder('txdc');

      txBuilder.type(TransactionType.Send);

      (() => txBuilder.uploadKyc()).should.throw('uploadKYC can only be set for contract call transactions');
    });

    it('should build transaction with custom validator contract address', async () => {
      const txBuilder = getBuilder('txdc');
      const ipfsHash = 'QmCustomIPFSHash123456789012345678901234567';
      const customAddress = '0x1234567890123456789012345678901234567890';

      txBuilder.type(TransactionType.ContractCall);
      txBuilder.fee({
        fee: '10000000000',
        gasLimit: '100000',
      });
      txBuilder.counter(1);
      txBuilder.uploadKyc().ipfsHash(ipfsHash).contractAddress(customAddress);

      const tx = await txBuilder.build();

      should.exist(tx);
      const txJson = tx.toJson();
      should.exist(txJson.to);
      txJson.to!.should.equal(customAddress);
    });

    it('should build and serialize uploadKYC transaction', async () => {
      const txBuilder = getBuilder('txdc');
      const ipfsHash = 'QmRealIPFSHashForSerialization1234567890123';

      txBuilder.type(TransactionType.ContractCall);
      txBuilder.fee({
        fee: '10000000000',
        gasLimit: '100000',
      });
      txBuilder.counter(5);
      txBuilder.uploadKyc().ipfsHash(ipfsHash);

      const tx = await txBuilder.build();
      const serialized = tx.toBroadcastFormat();

      should.exist(serialized);
      serialized.should.be.type('string');
      // Should be a valid hex string
      serialized.should.match(/^(0x)?[0-9a-f]+$/i);
    });

    it('should parse uploadKYC transaction from hex', async () => {
      const txBuilder = getBuilder('txdc');
      const ipfsHash = 'QmParseTestHash12345678901234567890123456';

      // First build a transaction
      txBuilder.type(TransactionType.ContractCall);
      txBuilder.fee({
        fee: '10000000000',
        gasLimit: '100000',
      });
      txBuilder.counter(10);
      txBuilder.uploadKyc().ipfsHash(ipfsHash);

      const tx = await txBuilder.build();
      const serialized = tx.toBroadcastFormat();

      // Now parse it back
      const txBuilder2 = getBuilder('txdc');
      txBuilder2.from(serialized);
      const parsedTx = await txBuilder2.build();

      should.exist(parsedTx);
      const parsedJson = parsedTx.toJson();
      should.exist(parsedJson.to);
      parsedJson.to!.should.equal(XDC_VALIDATOR_CONTRACT_ADDRESS_TESTNET);
      parsedJson.nonce.should.equal(10);
    });
  });

  describe('Real-world scenarios', () => {
    it('should create transaction matching sandbox code pattern', async () => {
      const txBuilder = getBuilder('txdc');
      // Mock IPFS hash similar to what would be generated
      const mockIPFSHash = 'Qm' + 'a'.repeat(44);

      txBuilder.type(TransactionType.ContractCall);
      txBuilder.fee({
        fee: '20000000000',
        gasLimit: '200000',
      });
      txBuilder.counter(0);
      txBuilder.uploadKyc().ipfsHash(mockIPFSHash);

      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      // Verify transaction structure matches expected format
      should.exist(txJson.to);
      txJson.to!.should.equal(XDC_VALIDATOR_CONTRACT_ADDRESS_TESTNET);
      txJson.value.should.equal('0');
      should.exist(txJson.data);
      txJson.data.should.startWith(UPLOAD_KYC_METHOD_ID);
      should.exist(txJson.gasLimit);
      should.exist(txJson.nonce);
    });

    it('should handle multiple IPFS hash formats', async () => {
      const testHashes = [
        'QmRealIPFSHashExample123456789012345678901234', // v0
        'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi', // v1
        'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG', // real example
      ];

      for (const hash of testHashes) {
        const txBuilder = getBuilder('txdc');

        txBuilder.type(TransactionType.ContractCall);
        txBuilder.fee({
          fee: '10000000000',
          gasLimit: '100000',
        });
        txBuilder.counter(1);
        txBuilder.uploadKyc().ipfsHash(hash);

        const tx = await txBuilder.build();
        should.exist(tx);

        const txJson = tx.toJson();
        txJson.data.should.startWith(UPLOAD_KYC_METHOD_ID);
      }
    });
  });
});
