import assert from 'assert';
import { ComputeBudgetProgram, Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { decompileTransactionMessage, getCompiledTransactionMessageDecoder, getTransactionDecoder } from '@solana/kit';
import { BuildTransactionError } from '@bitgo/sdk-core';
import { compileV1Message } from '../../../src/lib/v1/compileV1Message';
import { serializeV1Transaction } from '../../../src/lib/v1/serializeV1Transaction';
import { ZK_ELGAMAL_PROOF_PROGRAM_ID } from '../../../src/lib/constants';

const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

function buildTransferInstruction(feePayer: PublicKey, tokenAddress: PublicKey): TransactionInstruction {
  return new TransactionInstruction({
    keys: [
      { pubkey: tokenAddress, isSigner: false, isWritable: true },
      { pubkey: feePayer, isSigner: true, isWritable: true },
    ],
    programId: new PublicKey(TOKEN_2022_PROGRAM_ID),
    data: Buffer.from([0x07, 0x01, 0x02, 0x03]),
  });
}

function buildProofInstruction(payloadSize: number): TransactionInstruction {
  return new TransactionInstruction({
    keys: [],
    programId: new PublicKey(ZK_ELGAMAL_PROOF_PROGRAM_ID),
    data: Buffer.alloc(payloadSize, 0xab),
  });
}

function decodeV1Message(wire: Uint8Array) {
  const decoded = getTransactionDecoder().decode(wire);
  const compiled = getCompiledTransactionMessageDecoder().decode(decoded.messageBytes);
  const message = decompileTransactionMessage(compiled) as unknown as {
    version: number;
    instructions: unknown[];
    config?: { computeUnitLimit?: number; priorityFeeLamports?: bigint; loadedAccountsDataSizeLimit?: number };
  };
  return { message, signatures: decoded.signatures };
}

const config = {
  computeUnitLimit: 200_000,
  heapSize: 32_768,
  loadedAccountsDataSizeLimit: 65_536,
  priorityFee: 5_000,
};

describe('v1 transaction compilation and serialization', function () {
  const feePayer = Keypair.generate().publicKey;
  const tokenAddress = Keypair.generate().publicKey;
  const recentBlockhash = '11111111111111111111111111111111';

  it('should compile a v1 message starting with the 0x81 version prefix', function () {
    const instructions = [buildTransferInstruction(feePayer, tokenAddress)];
    const messageBytes = compileV1Message({ instructions, feePayer, recentBlockhash, transactionConfig: config });
    assert.strictEqual(messageBytes[0], 0x81);
  });

  it('should serialize and decode a >2048-byte v1 transaction round-trip', function () {
    const instructions = [buildTransferInstruction(feePayer, tokenAddress), buildProofInstruction(2300)];
    const messageBytes = compileV1Message({ instructions, feePayer, recentBlockhash, transactionConfig: config });
    const secretKey = Keypair.generate().secretKey;
    const signature = nacl.sign.detached(messageBytes, secretKey);
    const wire = serializeV1Transaction(messageBytes, [signature]);

    assert.ok(wire.length > 2048);
    assert.ok(wire.length <= 4096);

    const { message } = decodeV1Message(wire);
    assert.strictEqual(message.version, 1);
    assert.strictEqual(message.config?.computeUnitLimit, config.computeUnitLimit);
    assert.strictEqual(message.config?.loadedAccountsDataSizeLimit, config.loadedAccountsDataSizeLimit);
    assert.strictEqual(message.config?.priorityFeeLamports, BigInt(config.priorityFee));
  });

  it('should strip ComputeBudget instructions and fold them into the config', function () {
    const cuLimit = ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 });
    const price = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 250_000 });
    const instructions = [cuLimit, price, buildTransferInstruction(feePayer, tokenAddress)];
    const noBudgetConfig = { ...config, computeUnitLimit: null, priorityFee: null };
    const messageBytes = compileV1Message({
      instructions,
      feePayer,
      recentBlockhash,
      transactionConfig: noBudgetConfig,
    });

    const secretKey = Keypair.generate().secretKey;
    const wire = serializeV1Transaction(messageBytes, [nacl.sign.detached(messageBytes, secretKey)]);
    const { message } = decodeV1Message(wire);

    // Only the transfer instruction remains; both ComputeBudget instructions are stripped
    assert.strictEqual(message.instructions.length, 1);
    assert.strictEqual(message.config?.computeUnitLimit, 500_000);
    // 250_000 micro-lamports/CU * 500_000 CU / 1_000_000 = 125_000 total lamports
    assert.strictEqual(message.config?.priorityFeeLamports, 125_000n);
  });

  it('should throw when compiling with no instructions or missing config', function () {
    const instructions = [buildTransferInstruction(feePayer, tokenAddress)];
    assert.throws(
      () => compileV1Message({ instructions: [], feePayer, recentBlockhash, transactionConfig: config }),
      BuildTransactionError
    );
    assert.throws(
      () => compileV1Message({ instructions, feePayer, recentBlockhash, transactionConfig: undefined as never }),
      BuildTransactionError
    );
  });

  it('should throw when serializing with no message bytes or no signatures', function () {
    assert.throws(() => serializeV1Transaction(new Uint8Array(), []), BuildTransactionError);
    assert.throws(() => serializeV1Transaction(new Uint8Array([0x81]), []), BuildTransactionError);
    assert.throws(() => serializeV1Transaction(new Uint8Array([0x81]), [new Uint8Array(32)]), BuildTransactionError);
  });

  it('should throw when serializing a non-v1 message', function () {
    const messageBytes = new Uint8Array([0x80, 1]);
    const signature = nacl.sign.detached(messageBytes, Keypair.generate().secretKey);
    assert.throws(() => serializeV1Transaction(messageBytes, [signature]), BuildTransactionError);
  });

  it('should throw when the signature count does not match the message header', function () {
    const messageBytes = new Uint8Array([0x81, 1, 0x00, 0x00]);
    const signature = nacl.sign.detached(messageBytes, Keypair.generate().secretKey);
    assert.throws(() => serializeV1Transaction(messageBytes, [signature, signature]), BuildTransactionError);
  });

  it('should throw when the serialized transaction exceeds the v1 size limit', function () {
    const messageBytes = new Uint8Array(4096);
    messageBytes[0] = 0x81;
    messageBytes[1] = 1;
    const signature = nacl.sign.detached(messageBytes, Keypair.generate().secretKey);
    assert.throws(() => serializeV1Transaction(messageBytes, [signature]), BuildTransactionError);
  });
});
