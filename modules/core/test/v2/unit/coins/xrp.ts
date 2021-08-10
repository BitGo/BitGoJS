import 'should';

import * as XrpResources from '../../fixtures/coins/xrp';

import { TestBitGo } from '../../../lib/test_bitgo';
import * as accountLib from '@bitgo/account-lib';

import * as nock from 'nock';
nock.disableNetConnect();

describe('XRP:', function () {
  let bitgo;
  let basecoin;

  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('txrp');
  });

  after(function () {
    nock.pendingMocks().should.be.empty();
  });

  it('isValidAddress should be correct', function () {
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=1893500718').should.be.True();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8').should.be.True();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?r=a').should.be.False();
    basecoin.isValidAddress('xrp://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8').should.be.False();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967296').should.be.False();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295').should.be.True();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0x123').should.be.False();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0x0').should.be.False();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0').should.be.True();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=-1').should.be.False();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=1.5').should.be.False();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=a').should.be.False();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=b').should.be.False();
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=a54b').should.be.False();
    basecoin.isValidAddress('xrp://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295').should.be.False();
    basecoin.isValidAddress('http://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295').should.be.False();
    basecoin.isValidAddress('http://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?a=b&dt=4294967295').should.be.False();
  });

  it('verifyAddress should work', function () {
    const makeArgs = (address, rootAddress) => ({ address, rootAddress });

    const nonThrowingArgs = [
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=1893500718', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
    ];

    const throwingArgs = [
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8r=a', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('xrp://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967296', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0x123', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0x0', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=-1', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=1.5', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=a', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=b', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=a54b', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('xrp://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('http://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('http://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?a=b&dt=4294967295', 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'),
      makeArgs('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295', 'rDgocL7QpZh8ZhrPsax4zVqbGGxeAsiBoh'),
    ];

    for (const nonThrowingArg of nonThrowingArgs) {
      basecoin.verifyAddress(nonThrowingArg);
    }

    for (const throwingArg of throwingArgs) {
      (() => basecoin.verifyAddress(throwingArg)).should.throw();
    }
  });

  describe('Explain Xrp Transaction', () => {
    it('Should be able to explain an unsigned transfer XRP transaction', async function () {
      const unSignedExplanation = await basecoin.explainTransaction({ txHex: XrpResources.transactions.transferTransaction.rawUnsigned });
      unSignedExplanation.outputAmount.should.equal('22000000');
      unSignedExplanation.outputs[0].amount.should.equal('22000000');
      unSignedExplanation.outputs[0].address.should.equal(XrpResources.accounts.acc2.address);
      unSignedExplanation.fee.fee.should.equal('12');
      unSignedExplanation.changeAmount.should.equal(0);
    });

    it('Should be able to explain a signed transfer XRP transaction', async function () {
      const signedExplanation = await basecoin.explainTransaction({ txHex: XrpResources.transactions.transferTransaction.rawSigned });
      signedExplanation.outputAmount.should.equal('22000000');
      signedExplanation.outputs[0].amount.should.equal('22000000');
      signedExplanation.outputs[0].address.should.equal(XrpResources.accounts.acc2.address);
      signedExplanation.fee.fee.should.equal('12');
      signedExplanation.changeAmount.should.equal(0);
    });

    it('Should be able to explain an unsigned account set XRP transaction', async function () {
      const unSignedExplanation = await basecoin.explainTransaction({ txHex: XrpResources.transactions.walletInitTransaction.rawUnsigned });
      unSignedExplanation.outputAmount.should.equal(0);
      unSignedExplanation.fee.fee.should.equal('12');
      unSignedExplanation.accountSet.messageKey.should.equal('03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB');
    });

    it('Should be able to explain a signed account set XRP transaction', async function () {
      const signedExplanation = await basecoin.explainTransaction({ txHex: XrpResources.transactions.walletInitTransaction.rawSigned });
      signedExplanation.outputAmount.should.equal(0);
      signedExplanation.fee.fee.should.equal('12');
      signedExplanation.accountSet.messageKey.should.equal('03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB');
    });

    it('Should be fail to explain an invalid XRP transaction', async () => {
      try {
        await basecoin.explainTransaction({ txHex: 'abcdefgH' });
      } catch (e) {
        e.message.should.equal('Transaction cannot be parsed or has an unsupported transaction type');
      }
    });
  });

  it('should be able to cosign XRP transaction in any form', async function () {
    const unsignedTxHex = XrpResources.transactions.transferTransaction.rawSigned;
    const coSignedHexTransaction = await basecoin.signTransaction({ txPrebuild: { txHex: unsignedTxHex }, prv: '007A85695CDE5EEA44D7971B25320AD4E353CCC749B03E0E5A88C15ECE42D82439' });
    const factory = accountLib.getBuilder('xrp') as unknown as accountLib.Xrp.TransactionBuilderFactory;
    const builder = factory.getTransferBuilder();
    builder
      .sender({ address: 'rNm3WGTTXJqUZDTJsiSdEfLo2We9zGXtbu' })
      .flags(2147483648)
      .lastLedgerSequence(19964671)
      .fee({ fee: '12' })
      .sequence(19964661)
      .destination({ address: 'rGCkuB7PBr5tNy68tPEABEtcdno4hE6Y7f' })
      .amount('22000000')
      .sign({ key: '007A85695CDE5EEA44D7971B25320AD4E353CCC749B03E0E5A88C15ECE42D82439' });
    const tx = await builder.build();
    coSignedHexTransaction.halfSigned.txHex.should.equal(tx.toBroadcastFormat());
  });

  describe('Fee Management', () => {
    const nockBitGo = new TestBitGo({ env: 'test' });
    const nockBasecoin = nockBitGo.coin('txrp');

    it('Should supplement wallet generation', async function () {
      const details = await nockBasecoin.supplementGenerateWallet({});
      details.should.have.property('rootPrivateKey');
    });

    it('should validate pub key', () => {
      const { pub } = basecoin.keychains().create();
      basecoin.isValidPub(pub).should.equal(true);
    });
  });
});
