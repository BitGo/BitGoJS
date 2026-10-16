import assert from 'assert';
import should from 'should';
import algosdk from 'algosdk';
import nacl from 'tweetnacl';
import { coins } from '@bitgo/statics';
import * as AlgoResources from '../../fixtures/resources';
import { Transaction } from '../../../src/lib/transaction';
import { KeyPair, AssetTransferBuilder, TransactionBuilderFactory } from '../../../src/lib';

describe('Algo Transaction', () => {
  let tx: Transaction;
  let txnBuilder: AssetTransferBuilder;
  const address = 'RIJVLDYWASZZNGOSQNOK7HN6JNFLMMZ3FFBBFG2NNROM5CE744DAJSPZJ4';

  beforeEach(() => {
    const config = coins.get('algo');
    const tokenConfig = coins.get('talgo:USON-16026728');
    const firstRound = 167;
    const lastRound = 1167;
    const fee = 1000;
    const tokenId = 1;
    const amount = '0';

    tx = new Transaction(config);
    txnBuilder = new TransactionBuilderFactory(tokenConfig).getAssetTransferBuilder();
    txnBuilder
      .fee({ fee: fee.toString() })
      .isFlatFee(true)
      .firstRound(firstRound)
      .lastRound(lastRound)
      .testnet()
      .sender({ address: address })
      .tokenId(tokenId)
      .amount(BigInt(amount))
      .to({ address: address });
  });

  describe('empty transaction', () => {
    it('should throw empty transaction', () => {
      assert.throws(() => tx.toJson(), /Empty transaction/);
      assert.throws(() => tx.toBroadcastFormat(), /Empty transaction/);
    });

    it('should not sign', () => {
      assert.throws(
        () => tx.sign([new KeyPair({ prv: AlgoResources.accounts.default.secretKey.toString('hex') })]),
        /Empty transaction/
      );
      tx.setNumberOfRequiredSigners(2);
      assert.throws(
        () => tx.sign([new KeyPair({ prv: AlgoResources.accounts.default.secretKey.toString('hex') })]),
        /Empty transaction/
      );
    });
  });

  describe('sign transaction', () => {
    it('cannot sign - no signer required', () => {
      should.deepEqual(tx.canSign({ key: 'some' }), false);
    });

    it('cannot sign - wrong account secret', () => {
      tx.setNumberOfRequiredSigners(1);
      tx.sender(AlgoResources.accounts.account1.address);
      should.deepEqual(tx.canSign({ key: AlgoResources.accounts.account2.secretKey.toString('hex') }), false);
    });

    it('can sign', () => {
      tx.setNumberOfRequiredSigners(1);
      tx.sender(AlgoResources.accounts.account2.address);
      should.deepEqual(tx.canSign({ key: AlgoResources.accounts.account2.secretKey.toString('hex') }), true);
    });
  });

  describe('Transaction type', () => {
    it('field txType and tokenName are added on enableToken transaction', async () => {
      const tx = await txnBuilder.build();

      const txHex = tx.toBroadcastFormat();
      const txInfo = tx.toJson();

      should.exists(txHex);

      txInfo.to.should.equal(address);
      txInfo.from.should.equal(address);
      txInfo.amount.should.equal('0');
      txInfo.firstRound.should.equal(167);
      txInfo.tokenId.should.equal(1);
      txInfo.fee.should.equal(1000);
      txInfo.lastRound.should.equal(1167);
      txInfo.genesisID.should.equal('testnet-v1.0');
      txInfo.genesisHash.should.equal('SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=');
      txInfo.should.have.property('txType');
      txInfo.txType.should.equal('enableToken');
      txInfo.should.have.property('tokenName');
      txInfo.tokenName.should.equal('USON');
    });

    it('field txType and tokenName are added on disableToken transaction', async () => {
      const closeRemainderTo = 'SP745JJR4KPRQEXJZHVIEN736LYTL2T2DFMG3OIIFJBV66K73PHNMDCZVM';

      const tx = await txnBuilder.closeRemainderTo({ address: closeRemainderTo }).build();

      const txHex = tx.toBroadcastFormat();
      const txInfo = tx.toJson();

      should.exists(txHex);

      txInfo.to.should.equal(address);
      txInfo.from.should.equal(address);
      txInfo.amount.should.equal('0');
      txInfo.firstRound.should.equal(167);
      txInfo.tokenId.should.equal(1);
      txInfo.fee.should.equal(1000);
      txInfo.closeRemainderTo.should.equal(closeRemainderTo);
      txInfo.lastRound.should.equal(1167);
      txInfo.genesisID.should.equal('testnet-v1.0');
      txInfo.genesisHash.should.equal('SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=');
      txInfo.should.have.property('txType');
      txInfo.txType.should.equal('disableToken');
      txInfo.should.have.property('txType');
      txInfo.tokenName.should.equal('USON');
    });

    it('field txType and tokenName are added on transferToken transaction', async () => {
      const tx = await txnBuilder.amount(BigInt('1000')).build();

      const txHex = tx.toBroadcastFormat();
      const txInfo = tx.toJson();

      should.exists(txHex);

      txInfo.to.should.equal(address);
      txInfo.from.should.equal(address);
      txInfo.amount.should.equal('1000');
      txInfo.firstRound.should.equal(167);
      txInfo.tokenId.should.equal(1);
      txInfo.fee.should.equal(1000);
      txInfo.lastRound.should.equal(1167);
      txInfo.genesisID.should.equal('testnet-v1.0');
      txInfo.genesisHash.should.equal('SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=');
      txInfo.txType.should.equal('transferToken');
      txInfo.should.have.property('txType');
      txInfo.tokenName.should.equal('USON');
    });
  });

  describe('addRawMultisigSignature', () => {
    it('throws when the transaction is empty', () => {
      assert.throws(() => tx.addRawMultisigSignature(address, new Uint8Array(64)), /Empty transaction/);
    });

    it('appends a raw external signature and produces a valid multisig transaction', async () => {
      const a1 = AlgoResources.accounts.account1;
      const a2 = AlgoResources.accounts.account2;
      const a3 = AlgoResources.accounts.account3;

      txnBuilder.numberOfRequiredSigners(2).setSigners([a1.address, a2.address, a3.address]);
      txnBuilder.sign({ key: a1.prvKey });

      const built = (await txnBuilder.build()) as Transaction;
      const algoTxn = built.getAlgoTransaction()!;
      const rawSig = nacl.sign.detached(algoTxn.bytesToSign(), nacl.sign.keyPair.fromSeed(a2.secretKey).secretKey);

      built.addRawMultisigSignature(a2.address, rawSig);

      const msigAddr = algosdk.multisigAddress({
        version: 1,
        threshold: 2,
        addrs: [a1.address, a2.address, a3.address],
      });
      const expectedPk = algosdk.decodeAddress(msigAddr).publicKey;
      const decoded = algosdk.decodeSignedTransaction(built.toBroadcastFormat());
      const msig = decoded.msig;
      if (!msig) {
        throw new Error('Expected a multisig signature');
      }
      algosdk.verifyMultisig(algoTxn.bytesToSign(), msig, expectedPk).should.equal(true);
    });
  });
});
