import { BaseKey, DotAddressFormat, Eddsa, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig, coins, DotNetwork } from '@bitgo/statics';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import assert from 'assert';
import should from 'should';
import sinon from 'sinon';
import { KeyPair, Transaction, TransactionBuilder, TransactionBuilderFactory } from '../../../src/lib';
import { Material } from '../../../src/lib/iface';
import utils from '../../../src/lib/utils';
import { accounts, chainName, genesisHash, rawTx, specName, specVersion } from '../../resources';

export interface TestDotNetwork extends DotNetwork {
  genesisHash: string;
  specVersion: number;
  metadataRpc: `0x${string}`;
}

export const buildTestConfig = (): Readonly<CoinConfig> => {
  return coins.get('tdot');
};

class StubTransactionBuilder extends TransactionBuilder {
  protected validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx): void {
    return;
  }
  protected buildTransaction(): UnsignedTransaction {
    throw new Error('Method not implemented.');
  }

  getSender(): string {
    return this._sender;
  }

  getReferenceBlock(): string {
    return this._referenceBlock;
  }

  getNonce(): number {
    return this._nonce;
  }

  getTip(): number | undefined {
    return this._tip;
  }

  getEraPeriod(): number | undefined {
    return this._eraPeriod;
  }

  buildImplementation(): Promise<Transaction> {
    return super.buildImplementation();
  }

  fromImplementation(rawTransaction: string): Transaction {
    return super.fromImplementation(rawTransaction);
  }

  signImplementation(key: BaseKey): Transaction {
    return super.signImplementation(key);
  }

  protected get transactionType(): TransactionType {
    throw new Error('Method not implemented.');
  }

  getTransaction(): Transaction {
    return this._transaction;
  }

  getMaterial(): Material {
    return this._material;
  }
}

describe('Dot Transfer Builder Base', () => {
  let builder: StubTransactionBuilder;

  const sender = accounts.account1;
  const receiver = accounts.account2;

  beforeEach(() => {
    builder = new StubTransactionBuilder(buildTestConfig());
  });

  describe('setter validation', () => {
    it('should validate sender address', () => {
      const spy = sinon.spy(builder, 'validateAddress');
      assert.throws(
        () => builder.sender({ address: 'asd' }),
        (e: Error) => e.message === `The address 'asd' is not a well-formed dot address`
      );
      should.doesNotThrow(() => builder.sender({ address: sender.address }));
      sinon.assert.calledTwice(spy);
    });

    it('should validate eraPeriod', () => {
      const spy = sinon.spy(builder, 'validateValue');
      assert.throws(
        () => builder.validity({ maxDuration: -1 }),
        (e: Error) => e.message === 'Value cannot be less than zero'
      );
      should.doesNotThrow(() => builder.validity({ maxDuration: 64 }));
      sinon.assert.calledTwice(spy);
    });

    it('should validate nonce', () => {
      const spy = sinon.spy(builder, 'validateValue');
      assert.throws(
        () => builder.sequenceId({ name: 'Nonce', keyword: 'nonce', value: -1 }),
        (e: Error) => e.message === 'Value cannot be less than zero'
      );
      should.doesNotThrow(() => builder.sequenceId({ name: 'Nonce', keyword: 'nonce', value: 10 }));
      sinon.assert.calledTwice(spy);
    });

    it('should validate tip', () => {
      const spy = sinon.spy(builder, 'validateValue');
      assert.throws(
        () => builder.fee({ amount: -1, type: 'tip' }),
        (e: Error) => e.message === 'Value cannot be less than zero'
      );
      should.doesNotThrow(() => builder.fee({ amount: 10, type: 'tip' }));
      sinon.assert.calledTwice(spy);
    });

    it('should validate blockNumber', () => {
      const spy = sinon.spy(builder, 'validateValue');
      assert.throws(
        () => builder.validity({ firstValid: -1 }),
        (e: Error) => e.message === 'Value cannot be less than zero'
      );
      should.doesNotThrow(() => builder.validity({ firstValid: 10 }));
      sinon.assert.calledTwice(spy);
    });
  });

  describe('build base transaction', () => {
    it('should build validate base fields', async () => {
      builder
        .material(utils.getMaterial(buildTestConfig()))
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      should.doesNotThrow(() => builder.validateTransaction(builder.getTransaction()));
    });

    it('should build a base transaction on testnet', async () => {
      const material = builder.getMaterial();
      should.deepEqual(material.specName, specName);
      should.deepEqual(material.genesisHash, genesisHash);
      should.deepEqual(material.specVersion, specVersion);
      should.deepEqual(material.chainName, chainName);
    });

    it('should build from raw signed tx', async () => {
      builder.from(rawTx.transfer.signed);
      should.deepEqual(builder.getSender(), sender.address);
      should.deepEqual(builder.getNonce(), 200);
      should.deepEqual(builder.getEraPeriod(), 64);
      should.deepEqual(builder.getTip(), undefined);
    });

    it('should build from raw unsigned tx', async () => {
      builder.from(rawTx.transfer.unsigned);
      should.deepEqual(
        builder.getReferenceBlock(),
        '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d'
      );
      should.deepEqual(builder.getNonce(), 200);
      should.deepEqual(builder.getEraPeriod(), 64);
      should.deepEqual(builder.getTip(), undefined);
    });
  });

  describe('add TSS signature', function () {
    let MPC: Eddsa;
    before('initialize mpc module', async () => {
      MPC = await Eddsa.initialize();
    });
    it('should add TSS signature', async () => {
      const factory = new TransactionBuilderFactory(coins.get('tdot'));

      const A = MPC.keyShare(1, 2, 3);
      const B = MPC.keyShare(2, 2, 3);
      const C = MPC.keyShare(3, 2, 3);

      const A_combine = MPC.keyCombine(A.uShare, [B.yShares[1], C.yShares[1]]);
      const B_combine = MPC.keyCombine(B.uShare, [A.yShares[2], C.yShares[2]]);
      const C_combine = MPC.keyCombine(C.uShare, [A.yShares[3], B.yShares[3]]);

      const commonPub = A_combine.pShare.y;
      const dotKeyPair = new KeyPair({ pub: commonPub });
      const sender = dotKeyPair.getAddress(DotAddressFormat.substrate);

      let transferBuilder = factory
        .getTransferBuilder()
        .amount('90034235235322')
        .to({ address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq' })
        .sender({ address: sender })
        .to({ address: receiver.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      const unsignedTransaction = await transferBuilder.build();
      const signablePayload = unsignedTransaction.signablePayload;

      // signing with A and B
      let A_sign_share = MPC.signShare(signablePayload, A_combine.pShare, [A_combine.jShares[2]]);
      let B_sign_share = MPC.signShare(signablePayload, B_combine.pShare, [B_combine.jShares[1]]);
      let A_sign = MPC.sign(signablePayload, A_sign_share.xShare, [B_sign_share.rShares[1]], [C.yShares[1]]);
      let B_sign = MPC.sign(signablePayload, B_sign_share.xShare, [A_sign_share.rShares[2]], [C.yShares[2]]);
      // sign the message_buffer (unsigned txHex)
      let signature = MPC.signCombine([A_sign, B_sign]);
      let rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);
      transferBuilder = factory
        .getTransferBuilder()
        .amount('90034235235322')
        .to({ address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq' })
        .sender({ address: sender })
        .to({ address: receiver.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      transferBuilder.addSignature({ pub: dotKeyPair.getKeys().pub }, rawSignature);
      let signedTransaction = await transferBuilder.build();
      signedTransaction.signature.length.should.equal(1);
      signedTransaction.signature[0].should.equal(rawSignature.toString('hex'));

      // signing with A and C
      A_sign_share = MPC.signShare(signablePayload, A_combine.pShare, [A_combine.jShares[3]]);
      let C_sign_share = MPC.signShare(signablePayload, C_combine.pShare, [C_combine.jShares[1]]);
      A_sign = MPC.sign(signablePayload, A_sign_share.xShare, [C_sign_share.rShares[1]], [B.yShares[1]]);
      let C_sign = MPC.sign(signablePayload, C_sign_share.xShare, [A_sign_share.rShares[3]], [B.yShares[3]]);
      signature = MPC.signCombine([A_sign, C_sign]);
      rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);
      transferBuilder = factory
        .getTransferBuilder()
        .amount('90034235235322')
        .to({ address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq' })
        .sender({ address: sender })
        .to({ address: receiver.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      transferBuilder.addSignature({ pub: dotKeyPair.getKeys().pub }, rawSignature);
      signedTransaction = await transferBuilder.build();
      signedTransaction.signature.length.should.equal(1);
      signedTransaction.signature[0].should.equal(rawSignature.toString('hex'));

      // signing with B and C
      B_sign_share = MPC.signShare(signablePayload, B_combine.pShare, [B_combine.jShares[3]]);
      C_sign_share = MPC.signShare(signablePayload, C_combine.pShare, [C_combine.jShares[2]]);
      B_sign = MPC.sign(signablePayload, B_sign_share.xShare, [C_sign_share.rShares[2]], [A.yShares[2]]);
      C_sign = MPC.sign(signablePayload, C_sign_share.xShare, [B_sign_share.rShares[3]], [A.yShares[3]]);
      signature = MPC.signCombine([B_sign, C_sign]);
      rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);
      transferBuilder = factory
        .getTransferBuilder()
        .amount('90034235235322')
        .to({ address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq' })
        .sender({ address: sender })
        .to({ address: receiver.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      transferBuilder.addSignature({ pub: dotKeyPair.getKeys().pub }, rawSignature);
      signedTransaction = await transferBuilder.build();
      signedTransaction.signature.length.should.equal(1);
      signedTransaction.signature[0].should.equal(rawSignature.toString('hex'));

      const rebuiltTransaction = await factory
        .from(signedTransaction.toBroadcastFormat())
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .build();

      rebuiltTransaction.signature[0].should.equal(rawSignature.toString('hex'));
    });
  });
});
