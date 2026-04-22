import * as should from 'should';
import { coins } from '@bitgo/statics';
import { Kaspa } from '../../src';
import { KeyPair } from '../../src/lib/keyPair';
import { TransactionBuilder } from '../../src/lib/transactionBuilder';
import { Transaction } from '../../src/lib/transaction';
import { ADDRESSES, KEYS, UTXOS } from '../fixtures/kaspa.fixtures';

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
  let tkaspa: Kaspa;

  before(function () {
    const mockBitgo = {
      url: () => '',
      microservicesUrl: () => '',
      post: () => ({ result: () => Promise.resolve({}) }),
      get: () => ({ result: () => Promise.resolve({}) }),
    } as any;
    kaspa = new Kaspa(mockBitgo, coins.get('kaspa'));
    tkaspa = new Kaspa(mockBitgo, coins.get('tkaspa'));
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
      kp.pub!.should.have.length(66);
      kp.prv!.should.have.length(64);
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
      kp1.pub!.should.equal(kp2.pub!);
      kp1.prv!.should.equal(kp2.prv!);
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
      const result = await kaspa.isWalletAddress({ address, keychains } as any);
      result.should.be.true();
    });

    it('should throw on invalid address', async function () {
      await kaspa
        .isWalletAddress({ address: 'not-an-address', keychains: [] } as any)
        .should.be.rejectedWith(/invalid address/);
    });

    it('should throw when keychains count is not 3', async function () {
      const kp = new KeyPair({ prv: KEYS.prv });
      const address = kp.getAddress('mainnet');
      await kaspa
        .isWalletAddress({ address, keychains: [{ pub: KEYS.pub }] } as any)
        .should.be.rejectedWith(/Invalid keychains/);
    });

    it('should throw when derived address does not match', async function () {
      const other = new KeyPair().getKeys();
      const kp = new KeyPair({ prv: KEYS.prv });
      const address = kp.getAddress('mainnet');
      const keychains = [{ pub: other.pub }, { pub: other.pub }, { pub: other.pub }];
      await kaspa.isWalletAddress({ address, keychains } as any).should.be.rejectedWith(/address validation failure/);
    });
  });

  describe('parseTransaction', function () {
    it('should return empty object when no txHex is provided', async function () {
      const parsed = await kaspa.parseTransaction({});
      parsed.should.deepEqual({});
    });

    it('should return inputs and outputs for a valid txHex', async function () {
      const txHex = await buildUnsignedTxHex('kaspa');
      const parsed = (await kaspa.parseTransaction({ txHex })) as {
        inputs: { amount: string; coin: string }[];
        outputs: { address: string; amount: string; coin: string }[];
      };
      parsed.inputs.should.have.length(1);
      parsed.inputs[0].amount.should.equal(UTXOS.simple.amount);
      parsed.inputs[0].coin.should.equal('kaspa');
      parsed.outputs.should.have.length(1);
      parsed.outputs[0].amount.should.equal('99998000');
      parsed.outputs[0].address.should.equal(ADDRESSES.recipient);
      parsed.outputs[0].coin.should.equal('kaspa');
    });

    it('should throw on invalid txHex', async function () {
      await kaspa.parseTransaction({ txHex: 'notvalidhex!!' }).should.be.rejectedWith(/Invalid transaction/);
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
      await kaspa.explainTransaction({} as any).should.be.rejectedWith(/missing transaction hex/);
    });
  });

  describe('signTransaction', function () {
    it('should sign a prebuilt transaction', async function () {
      const txHex = await buildUnsignedTxHex('kaspa');
      const result = (await kaspa.signTransaction({
        txPrebuild: { txHex },
        prv: KEYS.prv,
      } as any)) as { txHex: string };
      result.txHex.should.be.a.String();
      const signed = Transaction.fromHex('kaspa', result.txHex);
      signed.signature[0].should.have.length(130);
    });

    it('should throw when txHex is missing', async function () {
      await kaspa.signTransaction({ txPrebuild: {}, prv: KEYS.prv } as any).should.be.rejectedWith(/missing txHex/);
    });
  });

  describe('verifyTransaction', function () {
    it('should verify a valid transaction', async function () {
      const txHex = await buildSignedTxHex('kaspa');
      const result = await kaspa.verifyTransaction({
        txPrebuild: { txHex },
        txParams: { recipients: [{ address: ADDRESSES.recipient, amount: '99998000' }] },
      } as any);
      result.should.be.true();
    });

    it('should throw when txHex is missing', async function () {
      await kaspa
        .verifyTransaction({ txPrebuild: {}, txParams: {} } as any)
        .should.be.rejectedWith(/missing required tx prebuild property txHex/);
    });
  });
});
