import { TransactionType } from '@bitgo/sdk-core';
import { coins, EthereumNetwork as EthLikeNetwork } from '@bitgo/statics';
import { TransferBuilderERC7984, classifyTransaction, decodeConfidentialTransferData } from '@bitgo/abstract-eth';
import { TransactionBuilder } from '../../../src';
import * as testData from '../../resources/eth';
import should from 'should';
import { getBuilder } from '../getBuilder';

describe('Eth transaction builder sendERC7984Token', () => {
  // dummy wallet contract address (sendMultiSig wrapper)
  const walletContractAddress = '0x8f977e912ef500548a0c3be6ddde9899f1199b81';
  // dummy ERC-7984 token contract address
  const tokenContractAddress = '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85';
  const senderAddress = '0x19645032c7f1533395d44a629462e751084d3e4d';
  const recipientAddress = '0x19645032c7f1533395d44a629462e751084d3e4c';

  // Synthetic 32-byte encrypted handle (all valid hex)
  const encryptedHandle = '0x' + 'ab'.repeat(32); // 66 chars
  // Synthetic input proof (~50 bytes)
  const inputProof = '0x' + 'cd'.repeat(50); // 102 chars

  const expireTime = 1590066728;
  const sequenceId = 42;

  const coin = coins.get('hteth') as unknown as EthLikeNetwork;

  let key: string;

  beforeEach(() => {
    key = testData.KEYPAIR_PRV.getKeys().prv as string;
  });

  // ───────────────────────────────────────────────────────────
  // 1. TransferBuilderERC7984 — unit tests
  // ───────────────────────────────────────────────────────────

  describe('TransferBuilderERC7984 unit tests', () => {
    it('build() produces correct ABI encoding with expected method ID prefix', () => {
      const builder = new TransferBuilderERC7984();
      builder
        .from(senderAddress)
        .to(recipientAddress)
        .tokenContractAddress(tokenContractAddress)
        .encryptedHandle(encryptedHandle)
        .inputProof(inputProof)
        .contractSequenceId(sequenceId)
        .expirationTime(expireTime);

      const innerCalldata = builder.build();
      // confidentialTransfer(address,bytes32,bytes) method id
      should(innerCalldata.slice(0, 10).toLowerCase()).equal('0x2fb74e62');
    });

    it('encryptedHandle setter rejects wrong length', () => {
      const builder = new TransferBuilderERC7984();
      should(() => builder.encryptedHandle('0x1234')).throw(/encryptedHandle/);
    });

    it('encryptedHandle setter rejects missing 0x prefix', () => {
      const builder = new TransferBuilderERC7984();
      should(() => builder.encryptedHandle('ab'.repeat(32))).throw(/encryptedHandle/);
    });

    it('inputProof setter rejects empty proof', () => {
      const builder = new TransferBuilderERC7984();
      should(() => builder.inputProof('0x')).throw(/inputProof/);
    });

    it('inputProof setter rejects non-hex', () => {
      const builder = new TransferBuilderERC7984();
      should(() => builder.inputProof('0xzzzz')).throw(/inputProof/);
    });

    it('to setter rejects invalid address', () => {
      const builder = new TransferBuilderERC7984();
      should(() => builder.to('not-an-address')).throw(/Invalid address/);
    });

    it('tokenContractAddress setter rejects invalid address', () => {
      const builder = new TransferBuilderERC7984();
      should(() => builder.tokenContractAddress('not-an-address')).throw(/Invalid address/);
    });

    it('build() throws without required fields', () => {
      const builder = new TransferBuilderERC7984();
      should(() => builder.build()).throw(/Missing mandatory field/);
    });

    it('build() throws without encryptedHandle', () => {
      const builder = new TransferBuilderERC7984();
      builder.to(recipientAddress).tokenContractAddress(tokenContractAddress).inputProof(inputProof);
      should(() => builder.build()).throw(/encryptedHandle/);
    });

    it('build() throws without inputProof', () => {
      const builder = new TransferBuilderERC7984();
      builder.to(recipientAddress).tokenContractAddress(tokenContractAddress).encryptedHandle(encryptedHandle);
      should(() => builder.build()).throw(/inputProof/);
    });

    it('signAndBuild() throws without contractSequenceId', () => {
      // build() only produces inner calldata and does not require sequenceId.
      // signAndBuild() wraps in sendMultiSig which needs sequenceId — verify it fails early.
      const builder = new TransferBuilderERC7984();
      builder
        .to(recipientAddress)
        .tokenContractAddress(tokenContractAddress)
        .encryptedHandle(encryptedHandle)
        .inputProof(inputProof)
        .expirationTime(expireTime)
        .key(key);
      should(() => builder.signAndBuild(`${coin.chainId}`)).throw(/contract sequence id/);
    });
  });

  // ───────────────────────────────────────────────────────────
  // 2. MPC / TSS flow (signing key provided)
  // ───────────────────────────────────────────────────────────

  describe('MPC/TSS flow with signing key', () => {
    it('signAndBuild() returns a well-formed hex string', () => {
      const builder = new TransferBuilderERC7984();
      builder
        .from(senderAddress)
        .to(recipientAddress)
        .tokenContractAddress(tokenContractAddress)
        .encryptedHandle(encryptedHandle)
        .inputProof(inputProof)
        .contractSequenceId(sequenceId)
        .expirationTime(expireTime)
        .key(key);

      const calldata = builder.signAndBuild(`${coin.chainId}`);
      should(calldata).be.a.String();
      should(calldata.startsWith('0x')).be.true();
      // outer method id: sendMultiSig = 0x39125215
      should(calldata.slice(0, 10).toLowerCase()).equal('0x39125215');
    });

    it('decoded inner calldata starts with confidentialTransfer method id and has correct fields', () => {
      const builder = new TransferBuilderERC7984();
      builder
        .from(senderAddress)
        .to(recipientAddress)
        .tokenContractAddress(tokenContractAddress)
        .encryptedHandle(encryptedHandle)
        .inputProof(inputProof)
        .contractSequenceId(sequenceId)
        .expirationTime(expireTime)
        .key(key);

      const calldata = builder.signAndBuild(`${coin.chainId}`);
      const decoded = decodeConfidentialTransferData(calldata);
      should(decoded.toAddress.toLowerCase()).equal(recipientAddress.toLowerCase());
      should(decoded.tokenContractAddress.toLowerCase()).equal(tokenContractAddress.toLowerCase());
      should(decoded.encryptedHandle.toLowerCase()).equal(encryptedHandle.toLowerCase());
      should(decoded.inputProof.toLowerCase()).equal(inputProof.toLowerCase());
      should(decoded.expireTime).equal(expireTime.toString());
      should(decoded.sequenceId).equal(sequenceId.toString());
    });
  });

  // ───────────────────────────────────────────────────────────
  // 3. No-key flow (multisig second-signer path)
  // ───────────────────────────────────────────────────────────

  describe('No-key flow (multisig)', () => {
    it('signAndBuild() without key produces calldata with empty signature', () => {
      const builder = new TransferBuilderERC7984();
      builder
        .from(senderAddress)
        .to(recipientAddress)
        .tokenContractAddress(tokenContractAddress)
        .encryptedHandle(encryptedHandle)
        .inputProof(inputProof)
        .contractSequenceId(sequenceId)
        .expirationTime(expireTime);

      const calldata = builder.signAndBuild(`${coin.chainId}`);
      should(calldata.startsWith('0x39125215')).be.true();

      // Should still be decodable
      const decoded = decodeConfidentialTransferData(calldata);
      should(decoded.toAddress.toLowerCase()).equal(recipientAddress.toLowerCase());
    });
  });

  // ───────────────────────────────────────────────────────────
  // 4. Full TransactionBuilder integration test
  // ───────────────────────────────────────────────────────────

  describe('TransactionBuilder integration', () => {
    it('builds a complete SendERC7984 transaction with correct structure', async () => {
      const txBuilder = getBuilder('hteth') as TransactionBuilder;
      txBuilder.fee({
        fee: '1000000000',
        gasLimit: '12100000',
      });
      txBuilder.counter(2);
      txBuilder.contract(walletContractAddress);
      txBuilder.type(TransactionType.SendERC7984);

      const transferBuilder = txBuilder.transfer() as TransferBuilderERC7984;
      transferBuilder
        .from(senderAddress)
        .to(recipientAddress)
        .tokenContractAddress(tokenContractAddress)
        .encryptedHandle(encryptedHandle)
        .inputProof(inputProof)
        .contractSequenceId(sequenceId)
        .expirationTime(expireTime)
        .key(key);

      txBuilder.sign({ key: testData.PRIVATE_KEY });
      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      should(txJson.to.toLowerCase()).equal(walletContractAddress.toLowerCase());
      // Outer data starts with sendMultiSig
      should(txJson.data.slice(0, 10).toLowerCase()).equal('0x39125215');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 5. Round-trip decode test
  // ───────────────────────────────────────────────────────────

  describe('Round-trip decode', () => {
    it('decodeConfidentialTransferData() round-trips all fields', () => {
      const builder = new TransferBuilderERC7984();
      builder
        .from(senderAddress)
        .to(recipientAddress)
        .tokenContractAddress(tokenContractAddress)
        .encryptedHandle(encryptedHandle)
        .inputProof(inputProof)
        .contractSequenceId(sequenceId)
        .expirationTime(expireTime)
        .key(key);

      const calldata = builder.signAndBuild(`${coin.chainId}`);
      const decoded = decodeConfidentialTransferData(calldata);

      should(decoded.toAddress.toLowerCase()).equal(recipientAddress.toLowerCase());
      should(decoded.tokenContractAddress.toLowerCase()).equal(tokenContractAddress.toLowerCase());
      should(decoded.encryptedHandle.toLowerCase()).equal(encryptedHandle.toLowerCase());
      should(decoded.inputProof.toLowerCase()).equal(inputProof.toLowerCase());
      should(decoded.expireTime).equal(expireTime.toString());
      should(decoded.sequenceId).equal(sequenceId.toString());
    });
  });

  // ───────────────────────────────────────────────────────────
  // 6. classifyTransaction() test
  // ───────────────────────────────────────────────────────────

  describe('classifyTransaction()', () => {
    it('identifies SendERC7984 transactions correctly', () => {
      const builder = new TransferBuilderERC7984();
      builder
        .from(senderAddress)
        .to(recipientAddress)
        .tokenContractAddress(tokenContractAddress)
        .encryptedHandle(encryptedHandle)
        .inputProof(inputProof)
        .contractSequenceId(sequenceId)
        .expirationTime(expireTime)
        .key(key);

      const calldata = builder.signAndBuild(`${coin.chainId}`);
      const txType = classifyTransaction(calldata);
      should(txType).equal(TransactionType.SendERC7984);
    });
  });

  // ───────────────────────────────────────────────────────────
  // 7. Reconstruction from hex (from() round-trip)
  // ───────────────────────────────────────────────────────────

  describe('Reconstruction from hex', () => {
    it('rebuilds SendERC7984 transaction from serialized hex', async () => {
      // Build original tx
      const txBuilder1 = getBuilder('hteth') as TransactionBuilder;
      txBuilder1.fee({ fee: '1000000000', gasLimit: '12100000' });
      txBuilder1.counter(2);
      txBuilder1.contract(walletContractAddress);
      txBuilder1.type(TransactionType.SendERC7984);

      const transferBuilder = txBuilder1.transfer() as TransferBuilderERC7984;
      transferBuilder
        .from(senderAddress)
        .to(recipientAddress)
        .tokenContractAddress(tokenContractAddress)
        .encryptedHandle(encryptedHandle)
        .inputProof(inputProof)
        .contractSequenceId(sequenceId)
        .expirationTime(expireTime)
        .key(key);

      txBuilder1.sign({ key: testData.PRIVATE_KEY });
      const tx1 = await txBuilder1.build();
      const rawHex = tx1.toBroadcastFormat();

      // Reconstruct from hex
      const txBuilder2 = getBuilder('hteth') as TransactionBuilder;
      txBuilder2.from(rawHex);
      const tx2 = await txBuilder2.build();
      const txJson2 = tx2.toJson();

      should(txJson2.to.toLowerCase()).equal(walletContractAddress.toLowerCase());
      should(txJson2.data.slice(0, 10).toLowerCase()).equal('0x39125215');

      // Verify the type was correctly identified
      should(txBuilder2['_type']).equal(TransactionType.SendERC7984);
    });

    it('reconstructed _transfer is an instance of TransferBuilderERC7984', async () => {
      const txBuilder1 = getBuilder('hteth') as TransactionBuilder;
      txBuilder1.fee({ fee: '1000000000', gasLimit: '12100000' });
      txBuilder1.counter(2);
      txBuilder1.contract(walletContractAddress);
      txBuilder1.type(TransactionType.SendERC7984);

      const transferBuilder = txBuilder1.transfer() as TransferBuilderERC7984;
      transferBuilder
        .from(senderAddress)
        .to(recipientAddress)
        .tokenContractAddress(tokenContractAddress)
        .encryptedHandle(encryptedHandle)
        .inputProof(inputProof)
        .contractSequenceId(sequenceId)
        .expirationTime(expireTime)
        .key(key);

      txBuilder1.sign({ key: testData.PRIVATE_KEY });
      const tx1 = await txBuilder1.build();
      const rawHex = tx1.toBroadcastFormat();

      const txBuilder2 = getBuilder('hteth') as TransactionBuilder;
      txBuilder2.from(rawHex);

      should(txBuilder2['_transfer']).be.instanceof(TransferBuilderERC7984);
    });
  });

  // ───────────────────────────────────────────────────────────
  // 8. Error / edge case tests
  // ───────────────────────────────────────────────────────────

  describe('Error and edge cases', () => {
    it('transfer() returns TransferBuilderERC7984 after setting type to SendERC7984', () => {
      const txBuilder = getBuilder('hteth') as TransactionBuilder;
      txBuilder.fee({ fee: '1000000000', gasLimit: '12100000' });
      txBuilder.counter(2);
      txBuilder.contract(walletContractAddress);
      txBuilder.type(TransactionType.Send); // native send type, not ERC7984
      // Native transfer() returns a TransferBuilder, not ERC7984
      // Attempting to use the native transfer for a ERC7984 tx should fail at build time
      txBuilder.type(TransactionType.SendERC7984);
      // After setting type to ERC7984, calling transfer() should return TransferBuilderERC7984
      const tb = txBuilder.transfer();
      should(tb).be.instanceof(TransferBuilderERC7984);
    });

    it('zero-length inputProof throws on setter', () => {
      const builder = new TransferBuilderERC7984();
      should(() => builder.inputProof('0x')).throw(/inputProof/);
    });

    it('encryptedHandle with wrong length throws', () => {
      const builder = new TransferBuilderERC7984();
      // 31 bytes instead of 32
      should(() => builder.encryptedHandle('0x' + 'ab'.repeat(31))).throw(/encryptedHandle/);
    });

    it('decodeConfidentialTransferData throws on non-sendMultiSig data', () => {
      should(() => decodeConfidentialTransferData('0x12345678')).throw(/Invalid confidential transfer bytecode/);
    });
  });
});
