import should from 'should';
import nacl from 'tweetnacl';
import { coins } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import {
  buildAdvanceNonceAccountInstruction,
  decodeV1Message,
  KeyPair,
  parseWireTransaction,
  Transaction,
  V1TransactionBuilder,
} from '../../../src';
import { verifyV1Signatures } from '../../../src/lib/serialization/parseWireTransaction';
import { InstructionBuilderTypes } from '../../../src/lib/constants';
import { V1CustomInstructionBuilder } from '../../../src/lib/v1CustomInstructionBuilder';
import { SolanaKeys, Transfer } from '../../../src/lib/iface';
import * as testData from '../../resources/sol';

class TestV1Builder extends V1TransactionBuilder {
  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }
}

describe('Solana V1 Transaction Builder (SIMD-0296/0385)', () => {
  const coinConfig = coins.get('tsol');
  const user = new KeyPair(testData.authAccount).getKeys();
  const gasTank = new KeyPair({ prv: testData.prvKeys.prvKey1.base58 }).getKeys();
  const nonceAccount = new KeyPair(testData.nonceAccount).getKeys();
  const recipient = 'ENn8a2tGMS9bR5XV7smGHJvNgzkyxJmnD2eUvQxY5jSP';
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
  const amount = '300000';

  const v1Config = {
    computeUnitLimit: 200_000,
    heapSize: 32_768,
    loadedAccountsDataSizeLimit: 65_536,
    priorityFee: 5_000,
  };

  const transfer: Transfer = {
    type: InstructionBuilderTypes.Transfer,
    params: { fromAddress: user.pub, toAddress: recipient, amount },
  };

  const newBuilder = () => {
    const builder = new TestV1Builder(coinConfig);
    builder.sender(user.pub);
    builder.nonce(recentBlockHash);
    builder.instructions([transfer]);
    builder.transactionConfig(v1Config);
    return builder;
  };

  const signWith = (keyPair: SolanaKeys, messageBytes: Uint8Array): Uint8Array => {
    const prv = keyPair.prv;
    if (typeof prv !== 'string') {
      throw new Error('Missing private key for test signer');
    }
    const kp = new KeyPair({ prv });
    return nacl.sign.detached(messageBytes, kp.getKeys(true).prv as Uint8Array);
  };

  describe('single signer', () => {
    it('builds a v1 message + signed wire and round-trips through parse', async () => {
      const builder = newBuilder();
      builder.sign({ key: user.prv });
      const tx = (await builder.build()) as Transaction;

      tx.v1MessageBytes![0].should.equal(0x81);
      tx.v1TransactionBytes!.length.should.equal(tx.v1MessageBytes!.length + 64);
      // signable payload is the message bytes
      tx.signablePayload.equals(Buffer.from(tx.v1MessageBytes!)).should.be.true();

      const parsed = parseWireTransaction(tx.v1TransactionBytes!);
      parsed.signerPublicKeys.should.deepEqual([user.pub]);
      verifyV1Signatures(parsed.messageBytes, parsed.signatures, parsed.signerPublicKeys);

      // broadcast format round-trips through from()
      const raw = tx.toBroadcastFormat();
      const reparsed = new TestV1Builder(coinConfig);
      reparsed.from(raw);
      (reparsed as unknown as { transaction: Transaction }).transaction.toBroadcastFormat().should.equal(raw);
    });

    it('throws when transactionConfig is missing', async () => {
      const builder = new TestV1Builder(coinConfig);
      builder.sender(user.pub);
      builder.nonce(recentBlockHash);
      builder.instructions([transfer]);
      await builder.build().should.be.rejectedWith(/transactionConfig is required/);
    });
  });

  describe('durable nonce (2 signatures)', () => {
    it('injects the AdvanceNonceAccount instruction and assembles user + gas-tank signatures in signer order', async () => {
      const builder = newBuilder();
      builder.nonce(recentBlockHash, {
        walletNonceAddress: nonceAccount.pub,
        authWalletAddress: gasTank.pub,
      });
      builder.sign({ key: user.prv });

      const unsigned = (await builder.build()) as Transaction;
      const messageBytes = unsigned.v1MessageBytes!;

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
      decoded.staticAccounts.slice(0, 2).should.deepEqual([user.pub, gasTank.pub]);

      // attach the gas-tank HSM signature over the same message bytes
      const gasTankSig = signWith(gasTank, messageBytes);
      builder.addSignature({ pub: gasTank.pub }, Buffer.from(gasTankSig));
      const signed = (await builder.build()) as Transaction;

      // message byte-identity between build and sign
      signed.v1MessageBytes!.should.deepEqual(messageBytes);

      const parsed = parseWireTransaction(signed.v1TransactionBytes!);
      parsed.signerPublicKeys.should.deepEqual([user.pub, gasTank.pub]);
      verifyV1Signatures(parsed.messageBytes, parsed.signatures, parsed.signerPublicKeys);
    });

    it('orders signatures by the compiled message when the gas tank is the fee payer', async () => {
      const builder = newBuilder();
      builder.nonce(recentBlockHash, {
        walletNonceAddress: nonceAccount.pub,
        authWalletAddress: gasTank.pub,
      });
      builder.feePayer(gasTank.pub);
      builder.sign({ key: user.prv });

      const unsigned = (await builder.build()) as Transaction;
      const messageBytes = unsigned.v1MessageBytes!;
      const decoded = decodeV1Message(messageBytes);
      // gas tank (fee payer) is the first signer, user second
      decoded.staticAccounts.slice(0, 2).should.deepEqual([gasTank.pub, user.pub]);

      const userSig = signWith(user, messageBytes);
      const gasTankSig = signWith(gasTank, messageBytes);
      builder.addSignature({ pub: user.pub }, Buffer.from(userSig));
      builder.addSignature({ pub: gasTank.pub }, Buffer.from(gasTankSig));
      const signed = (await builder.build()) as Transaction;

      const parsed = parseWireTransaction(signed.v1TransactionBytes!);
      parsed.signerPublicKeys.should.deepEqual([gasTank.pub, user.pub]);
      verifyV1Signatures(parsed.messageBytes, parsed.signatures, parsed.signerPublicKeys);
    });

    it('zero-fills a missing signature slot so the wire shape stays valid', async () => {
      const builder = newBuilder();
      builder.nonce(recentBlockHash, {
        walletNonceAddress: nonceAccount.pub,
        authWalletAddress: gasTank.pub,
      });
      builder.sign({ key: user.prv });

      const tx = (await builder.build()) as Transaction;
      const parsed = parseWireTransaction(tx.v1TransactionBytes!);
      parsed.signerPublicKeys.should.deepEqual([user.pub, gasTank.pub]);
      parsed.signatures[0].some((b) => b !== 0).should.be.true();
      parsed.signatures[1].every((b) => b === 0).should.be.true();
      should.throws(() => verifyV1Signatures(parsed.messageBytes, parsed.signatures, parsed.signerPublicKeys));
    });
  });

  describe('buildAdvanceNonceAccountInstruction', () => {
    it('constructs the nonce advance instruction with the authority as signer', () => {
      const ix = buildAdvanceNonceAccountInstruction(nonceAccount.pub, gasTank.pub);
      ix.programId.toBase58().should.equal(SystemProgram.programId.toBase58());
      ix.data[0].should.equal(4);
      ix.keys[0].pubkey.toBase58().should.equal(nonceAccount.pub);
      ix.keys[0].isWritable.should.be.true();
      ix.keys[0].isSigner.should.be.false();
      // web3.js nonceAdvance includes the recent-blockhashes sysvar as the second key
      ix.keys[1].pubkey.toBase58().should.equal('SysvarRecentB1ockHashes11111111111111111111');
      ix.keys[2].pubkey.toBase58().should.equal(gasTank.pub);
      ix.keys[2].isSigner.should.be.true();
    });
  });

  describe('nonce validation', () => {
    it('rejects an invalid blockhash', () => {
      const builder = newBuilder();
      should.throws(() => builder.nonce('not-a-blockhash'), /Invalid or missing blockHash/);
    });

    it('rejects a nonce whose authority equals the nonce account', () => {
      const builder = newBuilder();
      should.throws(
        () => builder.nonce(recentBlockHash, { walletNonceAddress: user.pub, authWalletAddress: user.pub }),
        /walletNonceAddress cannot be equal to authWalletAddress/
      );
    });
  });

  describe('from()', () => {
    it('parses a signed v1 wire and exposes toJson via the metadata transaction', async () => {
      const builder = newBuilder();
      builder.sign({ key: user.prv });
      const tx = (await builder.build()) as Transaction;
      const raw = tx.toBroadcastFormat();

      const reparsed = new TestV1Builder(coinConfig);
      reparsed.from(raw);
      const reparsedTx = (reparsed as unknown as { transaction: Transaction }).transaction;
      reparsedTx.toBroadcastFormat().should.equal(raw);

      const json = reparsedTx.toJson();
      json.nonce.should.equal(recentBlockHash);
      json.numSignatures.should.equal(1);
    });
  });
});

describe('V1CustomInstructionBuilder', function () {
  const coinConfig = coins.get('tsol');
  const user = new KeyPair(testData.authAccount).getKeys();
  const gasTank = new KeyPair({ prv: testData.prvKeys.prvKey1.base58 }).getKeys();
  const nonceAccount = new KeyPair(testData.nonceAccount).getKeys();
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
  const v1Config = {
    computeUnitLimit: 200_000,
    heapSize: 32_768,
    loadedAccountsDataSizeLimit: 65_536,
    priorityFee: 5_000,
  };

  const signWith = (keyPair: SolanaKeys, messageBytes: Uint8Array): Uint8Array => {
    const prv = keyPair.prv;
    if (typeof prv !== 'string') {
      throw new Error('Missing private key for test signer');
    }
    const kp = new KeyPair({ prv });
    return nacl.sign.detached(messageBytes, kp.getKeys(true).prv as Uint8Array);
  };

  it('builds a v1 transaction from a custom instruction + 2 signatures in signer order', async function () {
    const recipient = 'C3sGf4xZb7kP1mQr8tYw9uVx2nD5hJ6aLcE4oRqS7iB';
    const builder = new V1CustomInstructionBuilder(coinConfig);
    builder.sender(user.pub);
    builder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: gasTank.pub });
    builder.transactionConfig(v1Config);
    builder.addInstruction(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(user.pub),
        toPubkey: new PublicKey(recipient),
        lamports: 1_000_000,
      })
    );
    builder.sign({ key: user.prv });

    const unsigned = (await builder.build()) as Transaction;
    const gasTankSig = signWith(gasTank, unsigned.v1MessageBytes!);
    builder.addSignature({ pub: gasTank.pub }, Buffer.from(gasTankSig));
    const signed = (await builder.build()) as Transaction;

    const parsed = parseWireTransaction(signed.v1TransactionBytes!);
    parsed.signerPublicKeys.should.deepEqual([user.pub, gasTank.pub]);
    verifyV1Signatures(parsed.messageBytes, parsed.signatures, parsed.signerPublicKeys);
  });
});
