import * as should from 'should';
import { coins } from '@bitgo/statics';
import { BitGoBase } from '@bitgo/sdk-core';
import { ecc } from '@bitgo/secp256k1';
import { Kaspa, Tkaspa } from '../../src';
import { KeyPair } from '../../src/lib/keyPair';
import { TransactionBuilder } from '../../src/lib/transactionBuilder';
import { Transaction } from '../../src/lib/transaction';
import { KaspaVerifyTransactionOptions } from '../../src/lib/iface';
import { ADDRESSES, KEYS, UTXOS } from '../fixtures/kaspa.fixtures';

type ParsedTx = {
  inputs: { amount: string; coin: string }[];
  outputs: { address: string; amount: string; coin: string }[];
};

async function buildSignedTxHex(coinName: string): Promise<string> {
  const builder = new TransactionBuilder(coins.get(coinName));
  builder.addInput(UTXOS.simple).to(ADDRESSES.recipient, '99998000').fee('2000');
  const tx = (await builder.build()) as Transaction;
  tx.sign(Buffer.from(KEYS.prv, 'hex'));
  return tx.toHex();
}

async function buildUnsignedTxHex(coinName: string): Promise<string> {
  const builder = new TransactionBuilder(coins.get(coinName));
  builder.addInput(UTXOS.simple).to(ADDRESSES.recipient, '99998000').fee('2000');
  const tx = (await builder.build()) as Transaction;
  return tx.toHex();
}

describe('Kaspa (KASPA)', function () {
  let kaspa: Kaspa;
  let tkaspa: Tkaspa;

  before(function () {
    const mockBitgo = {
      url: () => '',
      microservicesUrl: () => '',
      post: () => ({ result: () => Promise.resolve({}) }),
      get: () => ({ result: () => Promise.resolve({}) }),
    } as unknown as BitGoBase;
    kaspa = Kaspa.createInstance(mockBitgo);
    tkaspa = Tkaspa.createInstance(mockBitgo);
  });

  describe('Coin Properties', function () {
    it('should have the correct chain name', function () {
      kaspa.getChain().should.equal('kaspa');
      tkaspa.getChain().should.equal('tkaspa');
    });

    it('should have the correct family', function () {
      kaspa.getFamily().should.equal('kaspa');
    });

    it('should have the correct full name', function () {
      kaspa.getFullName().should.equal('Kaspa');
      tkaspa.getFullName().should.equal('Testnet Kaspa');
    });

    it('should have the correct base factor (10^8)', function () {
      kaspa.getBaseFactor().should.equal(100000000);
    });

    it('should support TSS (ECDSA MPC)', function () {
      kaspa.supportsTss().should.be.true();
      kaspa.getMPCAlgorithm().should.equal('ecdsa');
    });
  });

  describe('Key Validation', function () {
    it('should validate a valid public key', function () {
      kaspa.isValidPub('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798').should.be.true();
    });

    it('should reject an invalid public key', function () {
      kaspa.isValidPub('not-a-key').should.be.false();
    });

    it('should validate a valid private key', function () {
      kaspa.isValidPrv('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2').should.be.true();
    });
  });

  describe('Key Generation', function () {
    it('should generate a key pair', function () {
      const kp = kaspa.generateKeyPair();
      should.exist(kp.pub);
      should.exist(kp.prv);
      (kp.pub as string).should.have.length(66);
      (kp.prv as string).should.have.length(64);
    });

    it('should generate a key pair from seed', function () {
      const seed = Buffer.alloc(32, 1);
      const kp = kaspa.generateKeyPair(seed);
      should.exist(kp.pub);
      should.exist(kp.prv);
    });

    it('should generate consistent keys from same seed', function () {
      const seed = Buffer.alloc(32, 42);
      const kp1 = kaspa.generateKeyPair(seed);
      const kp2 = kaspa.generateKeyPair(seed);
      (kp1.pub as string).should.equal(kp2.pub as string);
      (kp1.prv as string).should.equal(kp2.prv as string);
    });
  });

  describe('Address Validation', function () {
    it('should validate a mainnet address', function () {
      const kp = new KeyPair();
      const address = kp.getAddress('mainnet');
      kaspa.isValidAddress(address).should.be.true();
    });

    it('should reject an invalid address', function () {
      kaspa.isValidAddress('not-an-address').should.be.false();
    });

    it('should reject empty address', function () {
      kaspa.isValidAddress('').should.be.false();
    });
  });

  describe('isWalletAddress', function () {
    it('should return true when address matches derived address from keychains[0]', async function () {
      const kp = new KeyPair({ prv: KEYS.prv });
      const address = kp.getAddress('mainnet');
      const keychains = [{ pub: KEYS.pub }, { pub: KEYS.pub }, { pub: KEYS.pub }];
      const result = await kaspa.isWalletAddress({ address, keychains } as Parameters<typeof kaspa.isWalletAddress>[0]);
      result.should.be.true();
    });

    it('should throw on invalid address', async function () {
      await kaspa
        .isWalletAddress({ address: 'not-an-address', keychains: [] } as Parameters<typeof kaspa.isWalletAddress>[0])
        .should.be.rejectedWith(/invalid address/);
    });

    it('should throw when keychains count is not 3', async function () {
      const kp = new KeyPair({ prv: KEYS.prv });
      const address = kp.getAddress('mainnet');
      await kaspa
        .isWalletAddress({ address, keychains: [{ pub: KEYS.pub }] } as Parameters<typeof kaspa.isWalletAddress>[0])
        .should.be.rejectedWith(/Invalid keychains/);
    });

    it('should throw when derived address does not match', async function () {
      const other = new KeyPair().getKeys();
      const kp = new KeyPair({ prv: KEYS.prv });
      const address = kp.getAddress('mainnet');
      const keychains = [{ pub: other.pub }, { pub: other.pub }, { pub: other.pub }];
      await kaspa
        .isWalletAddress({ address, keychains } as Parameters<typeof kaspa.isWalletAddress>[0])
        .should.be.rejectedWith(/address validation failure/);
    });
  });

  describe('parseTransaction', function () {
    it('should return empty object when no txHex is provided', async function () {
      const parsed = await kaspa.parseTransaction({} as Parameters<typeof kaspa.parseTransaction>[0]);
      parsed.should.deepEqual({});
    });

    it('should return inputs and outputs for a valid txHex', async function () {
      const txHex = await buildUnsignedTxHex('kaspa');
      const parsed = (await kaspa.parseTransaction({ txHex } as unknown as Parameters<
        typeof kaspa.parseTransaction
      >[0])) as unknown as ParsedTx;
      parsed.inputs.should.have.length(1);
      parsed.inputs[0].amount.should.equal(UTXOS.simple.amount);
      parsed.inputs[0].coin.should.equal('kaspa');
      parsed.outputs.should.have.length(1);
      parsed.outputs[0].amount.should.equal('99998000');
      parsed.outputs[0].address.should.equal(ADDRESSES.recipient);
      parsed.outputs[0].coin.should.equal('kaspa');
    });

    it('should throw on invalid txHex', async function () {
      await kaspa
        .parseTransaction({ txHex: 'notvalidhex!!' } as unknown as Parameters<typeof kaspa.parseTransaction>[0])
        .should.be.rejectedWith(/Invalid transaction/);
    });
  });

  describe('explainTransaction', function () {
    it('should explain a valid transaction', async function () {
      const txHex = await buildUnsignedTxHex('kaspa');
      const explained = await kaspa.explainTransaction({ txHex });
      explained.outputs.should.have.length(1);
      explained.outputs[0].amount.should.equal('99998000');
    });

    it('should throw when txHex is missing', async function () {
      await kaspa
        .explainTransaction({} as Parameters<typeof kaspa.explainTransaction>[0])
        .should.be.rejectedWith(/missing transaction hex/);
    });
  });

  describe('signTransaction', function () {
    it('Path A — prv: signs all inputs with private key', async function () {
      const txHex = await buildUnsignedTxHex('kaspa');
      const result = (await kaspa.signTransaction({
        txPrebuild: { txHex },
        prv: KEYS.prv,
      } as unknown as Parameters<typeof kaspa.signTransaction>[0])) as { txHex: string };
      result.txHex.should.be.a.String();
      const signed = Transaction.fromHex('kaspa', result.txHex);
      signed.signature[0].should.have.length(132);
    });

    it('Path B — signatures[]: applies per-input TSS signatures for multi-input tx', async function () {
      // Build a 2-input unsigned transaction (simulating what the platform would build)
      const builder = new TransactionBuilder(coins.get('kaspa'));
      builder.addInput(UTXOS.simple).addInput(UTXOS.second).to(ADDRESSES.recipient, '299996000').fee('4000');
      const unsignedTx = (await builder.build()) as Transaction;
      const txHex = unsignedTx.toHex();

      // Simulate what the platform does: read per-input sighashes and sign each
      // independently (normally via N DKLS sessions; here using the raw key directly)
      const prv = Buffer.from(KEYS.prv, 'hex');
      const pub = Buffer.from(KEYS.pub, 'hex');
      const payloads = unsignedTx.signablePayloads; // Buffer[2]
      payloads.should.have.length(2);

      const signatures = payloads.map((hash, inputIndex) => ({
        inputIndex,
        pubKey: KEYS.pub,
        signature: Buffer.from(ecc.signSchnorr(hash, prv)).toString('hex'),
      }));

      // Both signatures were produced over different messages — they are distinct
      signatures[0].signature.should.not.equal(signatures[1].signature);

      const result = (await kaspa.signTransaction({
        txPrebuild: { txHex },
        signatures,
      } as unknown as Parameters<typeof kaspa.signTransaction>[0])) as { txHex: string };

      result.txHex.should.be.a.String();
      const signed = Transaction.fromHex('kaspa', result.txHex);

      // Both inputs must carry a valid 65-byte signature (64 Schnorr + 1 sighash type)
      signed.signature.should.have.length(2);
      signed.signature[0].should.have.length(132);
      signed.signature[1].should.have.length(132);

      // Each signature must verify against its own input's sighash, not the other's
      signed.verifySignature(pub, 0).should.be.true();
      signed.verifySignature(pub, 1).should.be.true();
    });

    it('Path B — halfSigned returned when only some inputs are signed', async function () {
      const builder = new TransactionBuilder(coins.get('kaspa'));
      builder.addInput(UTXOS.simple).addInput(UTXOS.second).to(ADDRESSES.recipient, '299996000').fee('4000');
      const unsignedTx = (await builder.build()) as Transaction;
      const txHex = unsignedTx.toHex();

      const prv = Buffer.from(KEYS.prv, 'hex');
      const hash0 = unsignedTx.signablePayloads[0];

      // Only sign input 0 — simulates a partial TSS result
      const result = await kaspa.signTransaction({
        txPrebuild: { txHex },
        signatures: [
          { inputIndex: 0, pubKey: KEYS.pub, signature: Buffer.from(ecc.signSchnorr(hash0, prv)).toString('hex') },
        ],
      } as unknown as Parameters<typeof kaspa.signTransaction>[0]);

      // Should come back as halfSigned since input 1 is still unsigned
      const halfResult = result as unknown as { halfSigned?: { txHex: string }; txHex?: string };
      should.exist(halfResult.halfSigned);
      should.not.exist(halfResult.txHex);
    });

    it('should throw when txHex is missing', async function () {
      await kaspa
        .signTransaction({ txPrebuild: {}, prv: KEYS.prv } as unknown as Parameters<typeof kaspa.signTransaction>[0])
        .should.be.rejectedWith(/missing txHex/);
    });
  });

  describe('verifyTransaction', function () {
    it('should verify a valid transaction', async function () {
      const txHex = await buildSignedTxHex('kaspa');
      const result = await kaspa.verifyTransaction({
        txPrebuild: { txHex },
        txParams: { recipients: [{ address: ADDRESSES.recipient, amount: '99998000' }] },
      } as unknown as KaspaVerifyTransactionOptions);
      result.should.be.true();
    });

    it('should pass when recipients is absent (no recipient check)', async function () {
      const txHex = await buildSignedTxHex('kaspa');
      const result = await kaspa.verifyTransaction({
        txPrebuild: { txHex },
        txParams: {},
      } as unknown as KaspaVerifyTransactionOptions);
      result.should.be.true();
    });

    it('should throw when expected recipient count exceeds actual outputs', async function () {
      const txHex = await buildSignedTxHex('kaspa');
      // tx has 1 output, we claim 2 recipients
      await kaspa
        .verifyTransaction({
          txPrebuild: { txHex },
          txParams: {
            recipients: [
              { address: ADDRESSES.recipient, amount: '50000000' },
              { address: ADDRESSES.recipient, amount: '49998000' },
            ],
          },
        } as unknown as KaspaVerifyTransactionOptions)
        .should.be.rejectedWith(/Expected at least 2 outputs/);
    });

    it('should throw when txHex is missing', async function () {
      await kaspa
        .verifyTransaction({ txPrebuild: {}, txParams: {} } as unknown as KaspaVerifyTransactionOptions)
        .should.be.rejectedWith(/missing required tx prebuild property txHex/);
    });

    it('should throw when txHex is invalid', async function () {
      await kaspa
        .verifyTransaction({
          txPrebuild: { txHex: 'deadbeef' },
          txParams: {},
        } as unknown as KaspaVerifyTransactionOptions)
        .should.be.rejectedWith(/Invalid transaction/);
    });
  });

  describe('parseTransaction — halfSigned path', function () {
    it('should parse a transaction passed via halfSigned.txHex', async function () {
      const txHex = await buildUnsignedTxHex('kaspa');
      const parsed = (await kaspa.parseTransaction({ halfSigned: { txHex } } as unknown as Parameters<
        typeof kaspa.parseTransaction
      >[0])) as unknown as ParsedTx;
      parsed.inputs.should.have.length(1);
      parsed.inputs[0].coin.should.equal('kaspa');
      parsed.outputs.should.have.length(1);
      parsed.outputs[0].amount.should.equal('99998000');
    });
  });

  describe('explainTransaction — halfSigned path', function () {
    it('should explain a transaction passed via halfSigned.txHex', async function () {
      const txHex = await buildUnsignedTxHex('kaspa');
      const explained = await kaspa.explainTransaction({ halfSigned: { txHex } } as unknown as Parameters<
        typeof kaspa.explainTransaction
      >[0]);
      explained.outputs.should.have.length(1);
      explained.outputs[0].amount.should.equal('99998000');
    });
  });

  describe('signTransaction — edge cases', function () {
    it('should return halfSigned when neither prv nor signatures provided', async function () {
      const txHex = await buildUnsignedTxHex('kaspa');
      const result = await kaspa.signTransaction({ txPrebuild: { txHex } } as unknown as Parameters<
        typeof kaspa.signTransaction
      >[0]);
      // no signing happened — all signature scripts are empty, so halfSigned is returned
      const typed = result as unknown as { halfSigned?: { txHex: string }; txHex?: string };
      should.exist(typed.halfSigned);
      should.not.exist(typed.txHex);
    });
  });
});
