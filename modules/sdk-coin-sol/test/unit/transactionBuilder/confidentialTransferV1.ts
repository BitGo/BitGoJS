import 'should';
import { KeyPair, Sol, Transaction, Utils } from '../../../src';
import * as testData from '../../resources/sol';
import { getBuilderFactory } from '../getBuilderFactory';
import { getTransactionDecoder, decompileTransactionMessage, getCompiledTransactionMessageDecoder } from '@solana/kit';

describe('Solana Confidential Transfer Builder - v1', () => {
  const factory = getBuilderFactory('sol');
  const account = new KeyPair(testData.associatedTokenAccounts.accounts[0]).getKeys();
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';

  const mintAddress = testData.associatedTokenAccountsForSol2022.mintId;
  const tokenAddress = testData.associatedTokenAccountsForSol2022.accounts[0].ata;
  const destinationTokenAddress = 'ENn8a2tGMS9bR5XV7smGHJvNgzkyxJmnD2eUvQxY5jSP';
  const authorityAddress = account.pub;

  const zeroBytes36 = '00'.repeat(36);
  const zeroBytes64 = '00'.repeat(64);
  const proofDataHex = '00'.repeat(320);

  const v1Config = {
    computeUnitLimit: 200_000,
    heapSize: 32_768,
    loadedAccountsDataSizeLimit: 65_536,
    priorityFee: 5_000,
  };

  const ctBuilder = () => {
    const txBuilder = factory.getConfidentialTransferBuilder();
    txBuilder.nonce(recentBlockHash);
    txBuilder.sender(account.pub);
    txBuilder.sign({ key: account.prv });
    return txBuilder;
  };

  const addTransfer = (builder: ReturnType<typeof ctBuilder>) => {
    builder
      .applyPendingBalance({
        tokenAddress,
        authorityAddress,
        expectedPendingBalanceCreditCounter: '2',
        newDecryptableAvailableBalance: zeroBytes36,
      })
      .verifyEqualityProof({ proofData: proofDataHex })
      .verifyValidityProof({ proofData: proofDataHex })
      .verifyRangeProof({ proofData: '00'.repeat(1000) })
      .confidentialTransfer({
        sourceTokenAddress: tokenAddress,
        mintAddress,
        destinationTokenAddress,
        authorityAddress,
        newSourceDecryptableAvailableBalance: zeroBytes36,
        transferAmountAuditorCiphertextLo: zeroBytes64,
        transferAmountAuditorCiphertextHi: zeroBytes64,
        equalityProofInstructionOffset: 1,
        ciphertextValidityProofInstructionOffset: 2,
        rangeProofInstructionOffset: 3,
      });
  };

  const decodeV1Message = (wire: Uint8Array) => {
    const decoded = getTransactionDecoder().decode(wire);
    const compiled = getCompiledTransactionMessageDecoder().decode(decoded.messageBytes);
    const message = decompileTransactionMessage(compiled) as unknown as {
      version: number;
      config?: { computeUnitLimit?: number; priorityFeeLamports?: bigint; loadedAccountsDataSizeLimit?: number };
    };
    return message;
  };

  it('should build a v1 confidential transfer transaction (0x81 prefix, config preserved, within 4096 bytes)', async () => {
    const builder = ctBuilder();
    addTransfer(builder);
    builder.version(1).transactionConfig(v1Config);

    const tx = await builder.build();

    (tx as Transaction).isVersionedTransaction().should.equal(true);
    (tx as Transaction).v1TransactionBytes!.should.be.an.instanceOf(Uint8Array);

    const rawTx = tx.toBroadcastFormat();
    const wire = Buffer.from(rawTx, 'base64');

    // v1 version byte prefix
    wire[0].should.equal(0x81);
    // within the v1 wire size limit
    wire.length.should.be.lessThanOrEqual(4096);

    // config preserved in the decoded v1 message
    const message = decodeV1Message(wire);
    message.version.should.equal(1);
    message.config!.computeUnitLimit!.should.equal(v1Config.computeUnitLimit);
    message.config!.loadedAccountsDataSizeLimit!.should.equal(v1Config.loadedAccountsDataSizeLimit);
    message.config!.priorityFeeLamports!.should.equal(BigInt(v1Config.priorityFee));
  });

  it('should require transactionConfig when version(1) is set', async () => {
    const builder = ctBuilder();
    addTransfer(builder);
    builder.version(1);

    await builder.build().should.be.rejectedWith(/transactionConfig is required/);
  });

  it('should reject v1 transactions that exceed the 4096-byte wire limit at broadcast', async () => {
    const builder = ctBuilder();
    addTransfer(builder);
    builder.version(1).transactionConfig(v1Config);

    const tx = await builder.build();
    const rawTx = (tx as Transaction).toBroadcastFormat();

    // Force an oversized v1 payload by padding the wire bytes past the limit.
    const wire = Buffer.from(rawTx, 'base64');
    const oversized = Buffer.concat([wire, Buffer.alloc(4097)]);
    oversized[0].should.equal(0x81);

    // Broadcast the oversized v1 tx through Sol.prototype.broadcastTransaction with an RPC
    // stub that must not be reached - the size guard short-circuits before the RPC call.
    const coin = { getDataFromNode: () => Promise.reject(new Error('RPC should not be reached')) } as unknown as Sol;
    await (Sol.prototype.broadcastTransaction as (opts: { serializedSignedTransaction: string }) => Promise<never>)
      .call(coin, { serializedSignedTransaction: oversized.toString('base64') })
      .should.be.rejectedWith(/exceeds the 4096-byte size limit/);
  });

  it('should leave the non-v1 path unchanged (v0/legacy default)', async () => {
    const builder = ctBuilder();
    builder.configureAccount({
      tokenAddress,
      mintAddress,
      authorityAddress,
      decryptableZeroBalance: zeroBytes36,
      maximumPendingBalanceCreditCounter: '65536',
      proofInstructionOffset: 1,
    });

    const tx = await builder.build();
    const rawTx = (tx as Transaction).toBroadcastFormat();
    // legacy transaction does not carry the 0x81 v1 prefix
    Buffer.from(rawTx, 'base64')[0].should.not.equal(0x81);
    (tx as Transaction).isVersionedTransaction().should.equal(false);
    Utils.isValidRawTransaction(rawTx).should.equal(true);
  });
});
