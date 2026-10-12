import should from 'should';
import nacl from 'tweetnacl';
import { coins } from '@bitgo/statics';
import { SystemProgram } from '@solana/web3.js';
import { decodeV1Message, KeyPair, parseWireTransaction, Transaction, V1PaymentBuilder } from '../../../src';
import { verifyV1Signatures } from '../../../src/lib/serialization/parseWireTransaction';
import { SolanaKeys } from '../../../src/lib/iface';
import * as testData from '../../resources/sol';

describe('Solana V1 Payment Builder (SIMD-0296/0385) — server-side construction surface', () => {
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

  const newBuilder = () => {
    const builder = new V1PaymentBuilder(coinConfig);
    builder.sender(user.pub);
    builder.send({ address: recipient, amount });
    builder.nonce(recentBlockHash);
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

  it('exposes the structured send() surface', () => {
    const builder = newBuilder();
    builder.send({ address: recipient, amount }).should.equal(builder);
  });

  it('builds a v1 transfer message + signed wire and round-trips through parse', async () => {
    const builder = newBuilder();
    builder.sign({ key: user.prv });
    const tx = (await builder.build()) as Transaction;

    tx.v1MessageBytes![0].should.equal(0x81);
    tx.v1TransactionBytes!.length.should.equal(tx.v1MessageBytes!.length + 64);
    tx.signablePayload.equals(Buffer.from(tx.v1MessageBytes!)).should.be.true();

    // the transfer instruction is a SystemProgram transfer (discriminator 2)
    const decoded = decodeV1Message(tx.v1MessageBytes!);
    decoded.compiledInstructions[0].data[0].should.equal(2);
    decoded.staticAccounts[decoded.compiledInstructions[0].programAddressIndex].should.equal(
      SystemProgram.programId.toBase58()
    );

    const parsed = parseWireTransaction(tx.v1TransactionBytes!);
    parsed.signerPublicKeys.should.deepEqual([user.pub]);
    verifyV1Signatures(parsed.messageBytes, parsed.signatures, parsed.signerPublicKeys);
  });

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
    Buffer.from(signed.v1MessageBytes!).equals(Buffer.from(messageBytes)).should.be.true();
    signed.v1TransactionBytes!.length.should.equal(messageBytes.length + 2 * 64);

    const parsed = parseWireTransaction(signed.v1TransactionBytes!);
    parsed.signerPublicKeys.should.deepEqual([user.pub, gasTank.pub]);
    verifyV1Signatures(parsed.messageBytes, parsed.signatures, parsed.signerPublicKeys);
  });

  it('throws when transactionConfig is missing', async () => {
    const builder = new V1PaymentBuilder(coinConfig);
    builder.sender(user.pub);
    builder.send({ address: recipient, amount });
    builder.nonce(recentBlockHash);
    await builder.build().should.be.rejectedWith(/transactionConfig is required/);
  });

  it('validates recipient address and amount', () => {
    const builder = new V1PaymentBuilder(coinConfig);
    should.throws(() => builder.send({ address: 'not-an-address', amount }), /address/);
    should.throws(() => builder.send({ address: recipient, amount: 'abc' }), /amount/);
  });
});
