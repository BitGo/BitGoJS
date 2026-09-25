import assert from 'assert';
import { ComputeBudgetProgram, Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { BuildTransactionError } from '@bitgo/sdk-core';
import nacl from 'tweetnacl';
import { compileTransactionMessage } from '../../../src/lib/serialization/compileTransactionMessage';
import { serializeWireTransaction } from '../../../src/lib/serialization/wire-transaction';

const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

function buildTransfer(feePayer: PublicKey, token: PublicKey): TransactionInstruction {
  return new TransactionInstruction({
    keys: [
      { pubkey: feePayer, isSigner: true, isWritable: true },
      { pubkey: token, isSigner: false, isWritable: true },
    ],
    programId: new PublicKey(TOKEN_2022_PROGRAM_ID),
    data: Buffer.from([27, 5, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0f, 6]),
  });
}

function buildProof(size: number): TransactionInstruction {
  return new TransactionInstruction({
    keys: [{ pubkey: new PublicKey(TOKEN_2022_PROGRAM_ID), isSigner: false, isWritable: false }],
    programId: new PublicKey(TOKEN_2022_PROGRAM_ID),
    data: Buffer.alloc(size, 0xab),
  });
}

const config = {
  computeUnitLimit: 200_000,
  heapSize: 32_768,
  loadedAccountsDataSizeLimit: 65_536,
  priorityFee: 5_000,
};

describe('v1 transaction compilation and serialization (plain TS)', () => {
  const feePayer = Keypair.generate().publicKey;
  const tokenAddress = Keypair.generate().publicKey;
  const recentBlockhash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';

  it('compiles a v1 message with the 0x81 version prefix', () => {
    const bytes = compileTransactionMessage({
      version: 1,
      instructions: [buildTransfer(feePayer, tokenAddress)],
      feePayer,
      recentBlockhash,
      transactionConfig: config,
    });
    assert.strictEqual(bytes[0], 0x81);
    // header: 1 signer (fee payer), 0 readonly signers, 0 readonly non-signers
    assert.strictEqual(bytes[1], 1); // numSignerAccounts
    assert.strictEqual(bytes[2], 0); // numReadonlySignerAccounts
    assert.strictEqual(bytes[3], 1); // numReadonlyNonSignerAccounts (the invoked program)
  });

  it('encodes the transaction config mask and values', () => {
    const bytes = compileTransactionMessage({
      version: 1,
      instructions: [buildTransfer(feePayer, tokenAddress)],
      feePayer,
      recentBlockhash,
      transactionConfig: config,
    });
    // configMask is u32 LE at bytes 4..8: priorityFee(0b11) + cuLimit(0b100) + loaded(0b1000) + heap(0b10000) = 0b11111 = 31
    assert.strictEqual(bytes[4], 0x1f);
    assert.strictEqual(bytes[5], 0x00);
    assert.strictEqual(bytes[6], 0x00);
    assert.strictEqual(bytes[7], 0x00);
  });

  it('serializes and round-trips a >2048-byte v1 transaction within the size limit', () => {
    const messageBytes = compileTransactionMessage({
      version: 1,
      instructions: [buildTransfer(feePayer, tokenAddress), buildProof(2300)],
      feePayer,
      recentBlockhash,
      transactionConfig: config,
    });
    const secretKey = Keypair.generate().secretKey;
    const signature = nacl.sign.detached(messageBytes, secretKey);
    const wire = serializeWireTransaction(messageBytes, [signature]);
    assert.ok(wire.length > 2048);
    assert.ok(wire.length <= 4096);
    assert.strictEqual(wire[0], 0x81);
    // message-first framing: message bytes first, then the 64-byte signature
    const sigStart = wire.length - 64;
    assert.deepStrictEqual(wire.slice(sigStart), signature);
  });

  it('strips ComputeBudget instructions and folds them into the config', () => {
    const cuLimit = ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 });
    const price = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 250_000 });
    const noBudgetConfig = {
      computeUnitLimit: null,
      heapSize: null,
      loadedAccountsDataSizeLimit: null,
      priorityFee: null,
    };
    const bytes = compileTransactionMessage({
      version: 1,
      instructions: [cuLimit, price, buildTransfer(feePayer, tokenAddress)],
      feePayer,
      recentBlockhash,
      transactionConfig: noBudgetConfig,
    });
    // configMask = priorityFee(0b11) + cuLimit(0b100) = 0b111 = 7
    assert.strictEqual(bytes[4], 0x07);
  });

  it('throws on empty instructions or missing config', () => {
    assert.throws(
      () =>
        compileTransactionMessage({
          version: 1,
          instructions: [],
          feePayer,
          recentBlockhash,
          transactionConfig: config,
        }),
      BuildTransactionError
    );
    assert.throws(
      () =>
        compileTransactionMessage({
          version: 1,
          instructions: [buildTransfer(feePayer, tokenAddress)],
          feePayer,
          recentBlockhash,
          transactionConfig: undefined as never,
        }),
      BuildTransactionError
    );
  });

  it('throws on invalid recent blockhash', () => {
    assert.throws(
      () =>
        compileTransactionMessage({
          version: 1,
          instructions: [buildTransfer(feePayer, tokenAddress)],
          feePayer,
          recentBlockhash: 'not-a-valid-blockhash',
          transactionConfig: config,
        }),
      BuildTransactionError
    );
  });

  it('serializeV1Transaction enforces version prefix, signature count, and size', () => {
    assert.throws(() => serializeWireTransaction(new Uint8Array(), []), BuildTransactionError);
    assert.throws(
      () => serializeWireTransaction(new Uint8Array([0x80, 1]), [new Uint8Array(64)]),
      BuildTransactionError
    );
    assert.throws(() => serializeWireTransaction(new Uint8Array([0x81, 1, 0, 0]), []), BuildTransactionError);
  });
});
