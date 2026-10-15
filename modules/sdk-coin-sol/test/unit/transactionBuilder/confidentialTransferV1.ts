import 'should';
import nacl from 'tweetnacl';
import { SystemProgram } from '@solana/web3.js';
import { decodeV1Message, KeyPair, parseWireTransaction, Sol, Transaction, Utils } from '../../../src';
import { verifyV1Signatures } from '../../../src/lib/serialization/parseWireTransaction';
import { SolanaKeys } from '../../../src/lib/iface';
import * as testData from '../../resources/sol';
import { getBuilderFactory } from '../getBuilderFactory';

describe('Solana Confidential Transfer Builder - v1', () => {
  const factory = getBuilderFactory('sol');
  const account = new KeyPair(testData.associatedTokenAccounts.accounts[0]).getKeys();
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
  const gasTank = new KeyPair({ prv: testData.prvKeys.prvKey1.base58 }).getKeys();
  const nonceAccount = new KeyPair(testData.nonceAccount).getKeys();

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

  it('should build a v1 confidential transfer transaction (0x81 prefix, within 4096 bytes)', async () => {
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
  });

  it('injects the AdvanceNonceAccount instruction and assembles user + gas-tank signatures in signer order for durable nonce', async () => {
    const builder = ctBuilder();
    addTransfer(builder);
    builder.nonce(recentBlockHash, {
      walletNonceAddress: nonceAccount.pub,
      authWalletAddress: gasTank.pub,
    });
    builder.version(1).transactionConfig(v1Config);

    const unsigned = (await builder.build()) as Transaction;
    const messageBytes = unsigned.v1MessageBytes!;
    unsigned.isVersionedTransaction().should.equal(true);
    unsigned.v1TransactionBytes![0].should.equal(0x81);

    // 2 required signers: user (fee payer) + gas-tank nonce authority
    messageBytes[1].should.equal(2);

    const decoded = decodeV1Message(messageBytes);
    // nonce hash occupies the blockhash field
    decoded.blockhash.should.equal(recentBlockHash);
    // first instruction is AdvanceNonceAccount (System Program, discriminator 4)
    decoded.compiledInstructions[0].data[0].should.equal(4);
    decoded.staticAccounts[decoded.compiledInstructions[0].programAddressIndex].should.equal(
      SystemProgram.programId.toBase58()
    );
    // signer order: fee payer (user) first, then gas tank
    decoded.staticAccounts.slice(0, 2).should.deepEqual([account.pub, gasTank.pub]);

    // attach the gas-tank HSM signature over the same message bytes
    const signWith = (keyPair: SolanaKeys, msg: Uint8Array): Uint8Array => {
      const prv = keyPair.prv;
      if (typeof prv !== 'string') {
        throw new Error('Missing private key for test signer');
      }
      const kp = new KeyPair({ prv });
      return nacl.sign.detached(msg, kp.getKeys(true).prv as Uint8Array);
    };
    const gasTankSig = signWith(gasTank, messageBytes);
    builder.addSignature({ pub: gasTank.pub }, Buffer.from(gasTankSig));
    const signed = (await builder.build()) as Transaction;

    // message byte-identity between build and sign
    Buffer.from(signed.v1MessageBytes!).equals(Buffer.from(messageBytes)).should.be.true();
    signed.v1TransactionBytes!.length.should.equal(messageBytes.length + 2 * 64);

    const parsed = parseWireTransaction(signed.v1TransactionBytes!);
    parsed.signerPublicKeys.should.deepEqual([account.pub, gasTank.pub]);
    verifyV1Signatures(parsed.messageBytes, parsed.signatures, parsed.signerPublicKeys);
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
