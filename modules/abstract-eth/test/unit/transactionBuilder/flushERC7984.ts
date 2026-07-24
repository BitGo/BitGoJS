/**
 * TransactionBuilder tests for FlushERC7984ForwarderToken transaction type.
 *
 * Verifies:
 *   - Building a FlushERC7984ForwarderToken tx from scratch (legacy and EIP-1559 fees)
 *   - Signing and serialization round-trip for both signed and unsigned transactions
 *   - classifyTransaction correctly identifies the type
 *   - Error cases for missing fields
 *   - contractAddress !== forwarderAddress guard
 */
import { TransactionType } from '@bitgo/sdk-core';
import should from 'should';
import { ETHTransactionType, TransactionBuilder } from '../../../src';
import {
  buildFlushERC7984ForwarderTokenCalldata,
  callFromParentMethodId,
  decodeFlushERC7984ForwarderTokenCalldata,
} from '../../../src/lib/zamaUtils';
import { classifyTransaction } from '../../../src/lib/utils';

const FORWARDER_ADDRESS = '0xDeADbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF';
const TOKEN_CONTRACT_ADDRESS = '0x94167129172A35ab093B44b8b96213DDbc3cD387';
const PARENT_ADDRESS = '0x1111111111111111111111111111111111111111';
const ENCRYPTED_HANDLE = '0x' + 'ab'.repeat(32); // 32-byte mock handle
const OTHER_ADDRESS = '0x2222222222222222222222222222222222222222';
// Deterministic test-only private key — never used on mainnet
const TEST_PRV_KEY = 'FAC4D04AA0025ECF200D74BC9B5E4616E4B8338B69B61362AAAD49F76E68EF28';

export function runFlushERC7984Tests(coinName: string, getBuilder: (coin: string) => TransactionBuilder): void {
  describe(`${coinName} transaction builder — FlushERC7984ForwarderToken`, () => {
    let txBuilder: TransactionBuilder;

    beforeEach(() => {
      txBuilder = getBuilder(coinName);
      txBuilder.fee({ fee: '1000000000', gasLimit: '200000' });
      txBuilder.counter(1);
    });

    // -------------------------------------------------------------------------
    // classifyTransaction — verify selector → type mapping
    // -------------------------------------------------------------------------
    describe('classifyTransaction', () => {
      it('should classify callFromParent+confidentialTransfer as FlushERC7984ForwarderToken', () => {
        const calldata = buildFlushERC7984ForwarderTokenCalldata(
          TOKEN_CONTRACT_ADDRESS,
          PARENT_ADDRESS,
          ENCRYPTED_HANDLE
        );
        const result = classifyTransaction(calldata);
        should.equal(result, TransactionType.FlushERC7984ForwarderToken);
      });

      it('should NOT classify plain callFromParent (delegation) as FlushERC7984ForwarderToken', () => {
        // A callFromParent wrapping a multicall delegation starts with 0xac9650d8 inside, not 0x5bebed7e
        // Use callFromParent prefix + arbitrary non-confidentialTransfer inner data
        const fakeInner = '0xac9650d8' + '00'.repeat(64); // multicall selector
        const { wrapInCallFromParent } = require('../../../src/lib/zamaUtils');
        const calldata = wrapInCallFromParent(TOKEN_CONTRACT_ADDRESS, fakeInner);
        const result = classifyTransaction(calldata);
        // Should fall through to ContractCall, not FlushERC7984ForwarderToken
        should.equal(result, TransactionType.ContractCall);
      });

      it('should NOT classify confidentialTransferWithProof inside sendMultiSig as FlushERC7984ForwarderToken', () => {
        // SendERC7984 uses sendMultiSig wrapping confidentialTransferWithProof
        // Should remain SendERC7984, not FlushERC7984ForwarderToken
        const result = classifyTransaction('0x39125215' + '00'.repeat(28));
        should.equal(result, TransactionType.Send);
      });
    });

    // -------------------------------------------------------------------------
    // Build from scratch
    // -------------------------------------------------------------------------
    describe('build from scratch', () => {
      it('should build a FlushERC7984ForwarderToken transaction', async () => {
        txBuilder.type(TransactionType.FlushERC7984ForwarderToken);
        txBuilder.contract(FORWARDER_ADDRESS);
        txBuilder.forwarderAddress(FORWARDER_ADDRESS);
        txBuilder.tokenContractAddress(TOKEN_CONTRACT_ADDRESS);
        txBuilder.encryptedHandle(ENCRYPTED_HANDLE);
        txBuilder.parentAddress(PARENT_ADDRESS);

        const tx = await txBuilder.build();
        const json = tx.toJson();

        should.equal(tx.type, TransactionType.FlushERC7984ForwarderToken);
        json.to.toLowerCase().should.equal(FORWARDER_ADDRESS.toLowerCase());
        json.data.should.startWith(callFromParentMethodId);
        json.value.should.equal('0');
      });

      it('tx.data should contain the inner confidentialTransfer selector', async () => {
        txBuilder.type(TransactionType.FlushERC7984ForwarderToken);
        txBuilder.contract(FORWARDER_ADDRESS);
        txBuilder.forwarderAddress(FORWARDER_ADDRESS);
        txBuilder.tokenContractAddress(TOKEN_CONTRACT_ADDRESS);
        txBuilder.encryptedHandle(ENCRYPTED_HANDLE);
        txBuilder.parentAddress(PARENT_ADDRESS);

        const tx = await txBuilder.build();
        const json = tx.toJson();

        const { tokenContractAddress, parentAddress, encryptedHandle } = decodeFlushERC7984ForwarderTokenCalldata(
          json.data
        );
        tokenContractAddress.toLowerCase().should.equal(TOKEN_CONTRACT_ADDRESS.toLowerCase());
        parentAddress.toLowerCase().should.equal(PARENT_ADDRESS.toLowerCase());
        encryptedHandle.should.equal(ENCRYPTED_HANDLE);
      });

      it('tx.to should equal the forwarder address', async () => {
        txBuilder.type(TransactionType.FlushERC7984ForwarderToken);
        txBuilder.contract(FORWARDER_ADDRESS);
        txBuilder.forwarderAddress(FORWARDER_ADDRESS);
        txBuilder.tokenContractAddress(TOKEN_CONTRACT_ADDRESS);
        txBuilder.encryptedHandle(ENCRYPTED_HANDLE);
        txBuilder.parentAddress(PARENT_ADDRESS);

        const tx = await txBuilder.build();
        tx.toJson().to.toLowerCase().should.equal(FORWARDER_ADDRESS.toLowerCase());
      });

      it('should build with EIP-1559 fee model', async () => {
        const builder = getBuilder(coinName);
        builder.fee({
          fee: '30000000000',
          eip1559: {
            maxFeePerGas: '30000000000',
            maxPriorityFeePerGas: '1000000000',
          },
          gasLimit: '200000',
        });
        builder.counter(1);
        builder.type(TransactionType.FlushERC7984ForwarderToken);
        builder.contract(FORWARDER_ADDRESS);
        builder.forwarderAddress(FORWARDER_ADDRESS);
        builder.tokenContractAddress(TOKEN_CONTRACT_ADDRESS);
        builder.encryptedHandle(ENCRYPTED_HANDLE);
        builder.parentAddress(PARENT_ADDRESS);

        const tx = await builder.build();
        const json = tx.toJson();

        should.equal(tx.type, TransactionType.FlushERC7984ForwarderToken);
        json._type.should.equal(ETHTransactionType.EIP1559);
        json.maxFeePerGas!.should.equal('30000000000');
        json.maxPriorityFeePerGas!.should.equal('1000000000');
        should.not.exist((json as any).gasPrice);
        json.data.should.startWith(callFromParentMethodId);
      });
    });

    // -------------------------------------------------------------------------
    // Signing
    // -------------------------------------------------------------------------
    describe('signing', () => {
      it('should produce a signed transaction with v, r, s and from fields', async () => {
        txBuilder.type(TransactionType.FlushERC7984ForwarderToken);
        txBuilder.contract(FORWARDER_ADDRESS);
        txBuilder.forwarderAddress(FORWARDER_ADDRESS);
        txBuilder.tokenContractAddress(TOKEN_CONTRACT_ADDRESS);
        txBuilder.encryptedHandle(ENCRYPTED_HANDLE);
        txBuilder.parentAddress(PARENT_ADDRESS);
        txBuilder.sign({ key: TEST_PRV_KEY });

        const tx = await txBuilder.build();
        const json = tx.toJson();

        should.exist(json.v);
        should.exist(json.r);
        should.exist(json.s);
        should.exist(json.from);
        should.equal(tx.type, TransactionType.FlushERC7984ForwarderToken);
      });

      it('should round-trip a signed transaction from serialized hex', async () => {
        txBuilder.type(TransactionType.FlushERC7984ForwarderToken);
        txBuilder.contract(FORWARDER_ADDRESS);
        txBuilder.forwarderAddress(FORWARDER_ADDRESS);
        txBuilder.tokenContractAddress(TOKEN_CONTRACT_ADDRESS);
        txBuilder.encryptedHandle(ENCRYPTED_HANDLE);
        txBuilder.parentAddress(PARENT_ADDRESS);
        txBuilder.sign({ key: TEST_PRV_KEY });

        const originalTx = await txBuilder.build();
        const rawHex = originalTx.toBroadcastFormat();

        const rebuiltBuilder = getBuilder(coinName);
        rebuiltBuilder.from(rawHex);
        const rebuiltTx = await rebuiltBuilder.build();

        rebuiltTx.toBroadcastFormat().should.equal(rawHex);
        should.equal(rebuiltTx.type, TransactionType.FlushERC7984ForwarderToken);
        should.exist(rebuiltTx.toJson().v);
      });

      it('should produce a signed EIP-1559 transaction with v, r, s fields', async () => {
        const builder = getBuilder(coinName);
        builder.fee({
          fee: '30000000000',
          eip1559: {
            maxFeePerGas: '30000000000',
            maxPriorityFeePerGas: '1000000000',
          },
          gasLimit: '200000',
        });
        builder.counter(1);
        builder.type(TransactionType.FlushERC7984ForwarderToken);
        builder.contract(FORWARDER_ADDRESS);
        builder.forwarderAddress(FORWARDER_ADDRESS);
        builder.tokenContractAddress(TOKEN_CONTRACT_ADDRESS);
        builder.encryptedHandle(ENCRYPTED_HANDLE);
        builder.parentAddress(PARENT_ADDRESS);
        builder.sign({ key: TEST_PRV_KEY });

        const tx = await builder.build();
        const json = tx.toJson();

        json._type.should.equal(ETHTransactionType.EIP1559);
        should.exist(json.v);
        should.exist(json.r);
        should.exist(json.s);
        should.exist(json.from);
      });
    });

    // -------------------------------------------------------------------------
    // Serialization round-trip
    // -------------------------------------------------------------------------
    describe('serialization round-trip', () => {
      it('should serialize and deserialize to the same transaction', async () => {
        txBuilder.type(TransactionType.FlushERC7984ForwarderToken);
        txBuilder.contract(FORWARDER_ADDRESS);
        txBuilder.forwarderAddress(FORWARDER_ADDRESS);
        txBuilder.tokenContractAddress(TOKEN_CONTRACT_ADDRESS);
        txBuilder.encryptedHandle(ENCRYPTED_HANDLE);
        txBuilder.parentAddress(PARENT_ADDRESS);

        const originalTx = await txBuilder.build();
        const rawHex = originalTx.toBroadcastFormat();

        const rebuiltBuilder = getBuilder(coinName);
        rebuiltBuilder.from(rawHex);
        const rebuiltTx = await rebuiltBuilder.build();

        rebuiltTx.toBroadcastFormat().should.equal(rawHex);
      });

      it('deserialized tx should classify as FlushERC7984ForwarderToken', async () => {
        txBuilder.type(TransactionType.FlushERC7984ForwarderToken);
        txBuilder.contract(FORWARDER_ADDRESS);
        txBuilder.forwarderAddress(FORWARDER_ADDRESS);
        txBuilder.tokenContractAddress(TOKEN_CONTRACT_ADDRESS);
        txBuilder.encryptedHandle(ENCRYPTED_HANDLE);
        txBuilder.parentAddress(PARENT_ADDRESS);

        const originalTx = await txBuilder.build();
        const rawHex = originalTx.toBroadcastFormat();

        const rebuiltBuilder = getBuilder(coinName);
        rebuiltBuilder.from(rawHex);
        const rebuiltTx = await rebuiltBuilder.build();

        should.equal(rebuiltTx.type, TransactionType.FlushERC7984ForwarderToken);
      });
    });

    // -------------------------------------------------------------------------
    // Error cases — missing required fields
    // -------------------------------------------------------------------------
    describe('missing field errors', () => {
      it('should throw when forwarderAddress is not set', async () => {
        txBuilder.type(TransactionType.FlushERC7984ForwarderToken);
        txBuilder.contract(FORWARDER_ADDRESS);
        // no forwarderAddress
        txBuilder.tokenContractAddress(TOKEN_CONTRACT_ADDRESS);
        txBuilder.encryptedHandle(ENCRYPTED_HANDLE);
        txBuilder.parentAddress(PARENT_ADDRESS);

        await txBuilder.build().should.be.rejectedWith(/missing forwarder address/i);
      });

      it('should throw when tokenContractAddress is not set', async () => {
        txBuilder.type(TransactionType.FlushERC7984ForwarderToken);
        txBuilder.contract(FORWARDER_ADDRESS);
        txBuilder.forwarderAddress(FORWARDER_ADDRESS);
        // no tokenContractAddress
        txBuilder.encryptedHandle(ENCRYPTED_HANDLE);
        txBuilder.parentAddress(PARENT_ADDRESS);

        await txBuilder.build().should.be.rejectedWith(/missing tokenContractAddress/i);
      });

      it('should throw when encryptedHandle is not set', async () => {
        txBuilder.type(TransactionType.FlushERC7984ForwarderToken);
        txBuilder.contract(FORWARDER_ADDRESS);
        txBuilder.forwarderAddress(FORWARDER_ADDRESS);
        txBuilder.tokenContractAddress(TOKEN_CONTRACT_ADDRESS);
        // no encryptedHandle
        txBuilder.parentAddress(PARENT_ADDRESS);

        await txBuilder.build().should.be.rejectedWith(/missing encryptedHandle/i);
      });

      it('should throw when parentAddress is not set', async () => {
        txBuilder.type(TransactionType.FlushERC7984ForwarderToken);
        txBuilder.contract(FORWARDER_ADDRESS);
        txBuilder.forwarderAddress(FORWARDER_ADDRESS);
        txBuilder.tokenContractAddress(TOKEN_CONTRACT_ADDRESS);
        txBuilder.encryptedHandle(ENCRYPTED_HANDLE);
        // no parentAddress

        await txBuilder.build().should.be.rejectedWith(/missing parentAddress/i);
      });

      it('should throw when contractAddress !== forwarderAddress', async () => {
        txBuilder.type(TransactionType.FlushERC7984ForwarderToken);
        txBuilder.contract(OTHER_ADDRESS); // different from forwarder
        txBuilder.forwarderAddress(FORWARDER_ADDRESS);
        txBuilder.tokenContractAddress(TOKEN_CONTRACT_ADDRESS);
        txBuilder.encryptedHandle(ENCRYPTED_HANDLE);
        txBuilder.parentAddress(PARENT_ADDRESS);

        await txBuilder.build().should.be.rejectedWith(/contractAddress must equal forwarderAddress/);
      });
    });

    // -------------------------------------------------------------------------
    // Setter validation
    // -------------------------------------------------------------------------
    describe('setter validation', () => {
      it('tokenContractAddress should reject invalid address', () => {
        should.throws(() => txBuilder.tokenContractAddress('not-an-address'), /Invalid address/);
      });

      it('parentAddress should reject invalid address', () => {
        should.throws(() => txBuilder.parentAddress('not-an-address'), /Invalid address/);
      });
    });
  });
}
