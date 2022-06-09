import 'should';

import { TestBitGo } from '@bitgo/sdk-test';
import { Txrp } from '@bitgo/sdk-coin-xrp';

const ripple = require('../../../../../sdk-coin-xrp/src/ripple');

import * as nock from 'nock';
nock.disableNetConnect();

describe('XRP:', function () {
  let bitgo;
  let basecoin;

  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    bitgo.safeRegister('txrp', Txrp.createInstance);
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

  it('Should be able to explain an XRP transaction', async function () {
    const signedExplanation = await basecoin.explainTransaction({ txHex: '120000228000000024000000072E00000000201B0018D07161400000000003DE2968400000000000002D73008114726D0D8A26568D5D9680AC80577C912236717191831449EE221CCACC4DD2BF8862B22B0960A84FC771D9F3E010732103AFBB6845826367D738B0D42EA0756C94547E70B064E8FE1260CF21354C898B0B74473045022100CA3A98AA6FC8CCA251C3A2754992E474EA469884EB8D489D2B180EB644AC7695022037EB886DCF57928E5844DB73C2E86DE553FB59DCFC9408F3FD5D802ADB69DFCC8114F0DBA9D34C77B6769F6142AB7C9D0AF67D113EBCE1F1' });
    const unsignedExplanation = await basecoin.explainTransaction({ txHex: '{"TransactionType":"Payment","Account":"rBSpCz8PafXTJHppDcNnex7dYnbe3tSuFG","Destination":"rfjub8A4dpSD5nnszUFTsLprxu1W398jwc","DestinationTag":0,"Amount":"253481","Flags":2147483648,"LastLedgerSequence":1626225,"Fee":"45","Sequence":7}' });
    unsignedExplanation.id.should.equal('CB36F366F1AC25FCDB38A19F17384ED3509D9B7F063520034597852FB10A1B45');
    signedExplanation.id.should.equal('D52681436CC5B94E9D00BC8172047B1A6F3C028D2D0A5CDFB81680039C48ADFD');
    unsignedExplanation.outputAmount.should.equal('253481');
    signedExplanation.outputAmount.should.equal('253481');
  });

  it('Should be able to explain an XRP AccountSet transaction', async function () {
    const signedExplanation = await basecoin.explainTransaction({ txHex: '1200032400E5F4AA201B00E9C54768400000000000002D722102000000000000000000000000415F8315C9948AD91E2CCE5B8583A36DA431FB61730081145FB0771C7BCA6BBB7B2DAF362B7FEFC35AC5DF00F3E01073210228085BA918B150F05B34CE4613AC4A031A816866E143AA7470FB2044D79EAA1474473045022100A8D2B720EFA46A88B4267EB3EFBBA0A6F9432884BC7F8DBF0E962B76E95DE0DE022004430D10DC7B4D1B2D0555EA22FF73FEA2E91636B5715F8909A6D9BC7689A4AC8114E9B5B8F9EC3ACFFB31958A3C1CFBB3CE41CB0725E1F1' });
    signedExplanation.id.should.equal('27D273F44EFDBA63D2473C8C5166C2B912F26B88BF21D147008D8E5E37CCBD21');
    signedExplanation.accountSet.messageKey.should.equal('02000000000000000000000000415F8315C9948AD91E2CCE5B8583A36DA431FB61');
    signedExplanation.fee.fee.should.equal('45');

    const unsignedExplanation = await basecoin.explainTransaction({ txHex: '{"TransactionType":"AccountSet","Account":"r95xbEHFzDfc9XfmXHaDnj6dHNntT9RNcy","Fee":"45","Sequence":15070378,"LastLedgerSequence":15320391,"MessageKey":"02000000000000000000000000415F8315C9948AD91E2CCE5B8583A36DA431FB61"}' });
    unsignedExplanation.id.should.equal('69E8A046124F15749BF75554D82F19282C1FECAA9785444FCC21107528741EDD');
    unsignedExplanation.accountSet.messageKey.should.equal('02000000000000000000000000415F8315C9948AD91E2CCE5B8583A36DA431FB61');
    unsignedExplanation.fee.fee.should.equal('45');
  });

  it('should be able to cosign XRP transaction in any form', function () {
    const unsignedTxHex = '120000228000000024000000072E00000000201B0018D07161400000000003DE2968400000000000002D8114726D0D8A26568D5D9680AC80577C912236717191831449EE221CCACC4DD2BF8862B22B0960A84FC771D9';
    const unsignedTxJson = '{"TransactionType":"Payment","Account":"rBSpCz8PafXTJHppDcNnex7dYnbe3tSuFG","Destination":"rfjub8A4dpSD5nnszUFTsLprxu1W398jwc","DestinationTag":0,"Amount":"253481","Flags":2147483648,"LastLedgerSequence":1626225,"Fee":"45","Sequence":7}';

    const signer = {
      prv: 'xprv9s21ZrQH143K36cPP1rLoWsp9JQp9JEJGo2LFdfaufqcYSp5qJk5S5zN94SnXLiBEnU4dH8RDWfsSSLzdKwdEdqBZrRvZ3LqX1VXYWXFcpD',
      pub: 'xpub661MyMwAqRbcFagrV3PMAepYhLFJYkx9e1ww425CU1NbRF9ENr4KytJqzLWZwWQ7b1CWLDhV3kthPRAyT33CApQ9QWZDvSq4bFHp2yL8Eob',
      rawPub: '02d15efd7200d9da40e10d3f5a3149ed006c6db8f3b2d22912597f0b6b74785490',
      rawPrv: '49187695ec4da97486feb904f532769c8792555e989a050f486a6d3172a137e7',
      xrpAddress: 'rJBWFy35Ya3qDZD89DuWBwm8oBbYmqb3H9',
    };

    const rippleLib = ripple();
    const coSignedHexTransaction = rippleLib.signWithPrivateKey(unsignedTxHex, signer.rawPrv, { signAs: signer.xrpAddress });
    const coSignedJsonTransaction = rippleLib.signWithPrivateKey(unsignedTxJson, signer.rawPrv, { signAs: signer.xrpAddress });
    coSignedHexTransaction.signedTransaction.should.equal(coSignedJsonTransaction.signedTransaction);
    coSignedHexTransaction.id.should.equal(coSignedJsonTransaction.id);
  });

  it('Should be unable to explain bogus XRP transaction', async function () {
    await basecoin.explainTransaction({ txHex: 'abcdefgH' })
      .should.be.rejectedWith('txHex needs to be either hex or JSON string for XRP');
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
