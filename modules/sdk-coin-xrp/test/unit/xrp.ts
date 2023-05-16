import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Txrp } from '../../src/txrp';
const ripple = require('../../src/ripple');

import * as nock from 'nock';
import assert from 'assert';
import * as rippleBinaryCodec from 'ripple-binary-codec';

nock.disableNetConnect();

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
bitgo.safeRegister('txrp', Txrp.createInstance);

describe('XRP:', function () {
  let basecoin;

  before(function () {
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

  it('verifyAddress should work', async function () {
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
      await basecoin.verifyAddress(nonThrowingArg);
    }

    for (const throwingArg of throwingArgs) {
      assert.rejects(async () => basecoin.verifyAddress(throwingArg));
    }
  });

  it('Should be able to explain an XRP transaction', async function () {
    const signedExplanation = await basecoin.explainTransaction({
      txHex:
        '120000228000000024000000072E00000000201B0018D07161400000000003DE2968400000000000002D73008114726D0D8A26568D5D9680AC80577C912236717191831449EE221CCACC4DD2BF8862B22B0960A84FC771D9F3E010732103AFBB6845826367D738B0D42EA0756C94547E70B064E8FE1260CF21354C898B0B74473045022100CA3A98AA6FC8CCA251C3A2754992E474EA469884EB8D489D2B180EB644AC7695022037EB886DCF57928E5844DB73C2E86DE553FB59DCFC9408F3FD5D802ADB69DFCC8114F0DBA9D34C77B6769F6142AB7C9D0AF67D113EBCE1F1',
    });
    const unsignedExplanation = await basecoin.explainTransaction({
      txHex:
        '{"TransactionType":"Payment","Account":"rBSpCz8PafXTJHppDcNnex7dYnbe3tSuFG","Destination":"rfjub8A4dpSD5nnszUFTsLprxu1W398jwc","DestinationTag":0,"Amount":"253481","Flags":2147483648,"LastLedgerSequence":1626225,"Fee":"45","Sequence":7}',
    });
    unsignedExplanation.id.should.equal('CB36F366F1AC25FCDB38A19F17384ED3509D9B7F063520034597852FB10A1B45');
    signedExplanation.id.should.equal('D52681436CC5B94E9D00BC8172047B1A6F3C028D2D0A5CDFB81680039C48ADFD');
    unsignedExplanation.outputAmount.should.equal('253481');
    signedExplanation.outputAmount.should.equal('253481');
  });

  it('Should be able to explain a half signed XRP transaction', async function () {
    const halfSigned = await basecoin.explainTransaction({
      txHex:
        '12000022800000002402364C9A2E00000000201B0251041E614000000000E4E1A268400000000000001E730081146ED6833681CD87DBC055D8DC5A92BC9E3CD287848314CF522A61021FA485553A6CE48E226D973258B9BBF3E01073210335479B7F82FC3280B72ED8659BC621A3284544DA9704B518EBC9275F669429CF7447304502210098AF70338FF43B9BEC9916BB8762E54C95CA85DBCE418F30A9640BF804DCB2DA02204221C2480BE44D9F6ED7331FD5FE580E42177873BA796B00255A6F55672BE26081149460A1C4C25209500B55D09F8CD13BD330968521E1F1',
    });

    halfSigned.id.should.equal('22254B2799C961E9D919A4B5FB9B24722163EBD11671C17F215BEAFC750D6D89');
    halfSigned.outputAmount.should.equal('14999970');
  });

  it('Should be able to explain an XRP AccountSet transaction', async function () {
    const signedExplanation = await basecoin.explainTransaction({
      txHex:
        '1200032400E5F4AA201B00E9C54768400000000000002D722102000000000000000000000000415F8315C9948AD91E2CCE5B8583A36DA431FB61730081145FB0771C7BCA6BBB7B2DAF362B7FEFC35AC5DF00F3E01073210228085BA918B150F05B34CE4613AC4A031A816866E143AA7470FB2044D79EAA1474473045022100A8D2B720EFA46A88B4267EB3EFBBA0A6F9432884BC7F8DBF0E962B76E95DE0DE022004430D10DC7B4D1B2D0555EA22FF73FEA2E91636B5715F8909A6D9BC7689A4AC8114E9B5B8F9EC3ACFFB31958A3C1CFBB3CE41CB0725E1F1',
    });
    signedExplanation.id.should.equal('27D273F44EFDBA63D2473C8C5166C2B912F26B88BF21D147008D8E5E37CCBD21');
    signedExplanation.accountSet.messageKey.should.equal(
      '02000000000000000000000000415F8315C9948AD91E2CCE5B8583A36DA431FB61'
    );
    signedExplanation.fee.fee.should.equal('45');

    const unsignedExplanation = await basecoin.explainTransaction({
      txHex:
        '{"TransactionType":"AccountSet","Account":"r95xbEHFzDfc9XfmXHaDnj6dHNntT9RNcy","Fee":"45","Sequence":15070378,"LastLedgerSequence":15320391,"MessageKey":"02000000000000000000000000415F8315C9948AD91E2CCE5B8583A36DA431FB61"}',
    });
    unsignedExplanation.id.should.equal('69E8A046124F15749BF75554D82F19282C1FECAA9785444FCC21107528741EDD');
    unsignedExplanation.accountSet.messageKey.should.equal(
      '02000000000000000000000000415F8315C9948AD91E2CCE5B8583A36DA431FB61'
    );
    unsignedExplanation.fee.fee.should.equal('45');
  });

  it('should be able to add second signature to half signed XRP transaction', function () {
    const halfSignedTxHex =
      '12000022800000002402364C9A2E00000000201B0251041E614000000000E4E1A268400000000000001E730081146ED6833681CD87DBC055D8DC5A92BC9E3CD287848314CF522A61021FA485553A6CE48E226D973258B9BBF3E01073210335479B7F82FC3280B72ED8659BC621A3284544DA9704B518EBC9275F669429CF7447304502210098AF70338FF43B9BEC9916BB8762E54C95CA85DBCE418F30A9640BF804DCB2DA02204221C2480BE44D9F6ED7331FD5FE580E42177873BA796B00255A6F55672BE26081149460A1C4C25209500B55D09F8CD13BD330968521E1F1';

    const signer = {
      prv: 'xprv9s21ZrQH143K36cPP1rLoWsp9JQp9JEJGo2LFdfaufqcYSp5qJk5S5zN94SnXLiBEnU4dH8RDWfsSSLzdKwdEdqBZrRvZ3LqX1VXYWXFcpD',
      pub: 'xpub661MyMwAqRbcFagrV3PMAepYhLFJYkx9e1ww425CU1NbRF9ENr4KytJqzLWZwWQ7b1CWLDhV3kthPRAyT33CApQ9QWZDvSq4bFHp2yL8Eob',
      rawPub: '02d15efd7200d9da40e10d3f5a3149ed006c6db8f3b2d22912597f0b6b74785490',
      rawPrv: '49187695ec4da97486feb904f532769c8792555e989a050f486a6d3172a137e7',
      xrpAddress: 'rJBWFy35Ya3qDZD89DuWBwm8oBbYmqb3H9',
    };

    const rippleLib = ripple();
    const fullySigned = rippleLib.signWithPrivateKey(halfSignedTxHex, signer.rawPrv, {
      signAs: signer.xrpAddress,
    });

    const signedTransaction = rippleBinaryCodec.decode(fullySigned.signedTransaction);
    signedTransaction.TransactionType.should.equal('Payment');
    signedTransaction.Amount.should.equal('14999970');
    signedTransaction.Account.should.equal('rBfhJ6HopLW69xK83nyShdNxC3uggjs46K');
    signedTransaction.Destination.should.equal('rKuDJCu188nbLDs2zfaT2RNScS6aa63PLC');
    signedTransaction.Signers.length.should.equal(2);
  });

  it('should be able to cosign XRP transaction in any form', function () {
    const unsignedTxHex =
      '120000228000000024000000072E00000000201B0018D07161400000000003DE2968400000000000002D8114726D0D8A26568D5D9680AC80577C912236717191831449EE221CCACC4DD2BF8862B22B0960A84FC771D9';
    const unsignedTxJson =
      '{"TransactionType":"Payment","Account":"rBSpCz8PafXTJHppDcNnex7dYnbe3tSuFG","Destination":"rfjub8A4dpSD5nnszUFTsLprxu1W398jwc","DestinationTag":0,"Amount":"253481","Flags":2147483648,"LastLedgerSequence":1626225,"Fee":"45","Sequence":7}';

    const signer = {
      prv: 'xprv9s21ZrQH143K36cPP1rLoWsp9JQp9JEJGo2LFdfaufqcYSp5qJk5S5zN94SnXLiBEnU4dH8RDWfsSSLzdKwdEdqBZrRvZ3LqX1VXYWXFcpD',
      pub: 'xpub661MyMwAqRbcFagrV3PMAepYhLFJYkx9e1ww425CU1NbRF9ENr4KytJqzLWZwWQ7b1CWLDhV3kthPRAyT33CApQ9QWZDvSq4bFHp2yL8Eob',
      rawPub: '02d15efd7200d9da40e10d3f5a3149ed006c6db8f3b2d22912597f0b6b74785490',
      rawPrv: '49187695ec4da97486feb904f532769c8792555e989a050f486a6d3172a137e7',
      xrpAddress: 'rJBWFy35Ya3qDZD89DuWBwm8oBbYmqb3H9',
    };

    const rippleLib = ripple();
    const coSignedHexTransaction = rippleLib.signWithPrivateKey(unsignedTxHex, signer.rawPrv, {
      signAs: signer.xrpAddress,
    });
    const coSignedJsonTransaction = rippleLib.signWithPrivateKey(unsignedTxJson, signer.rawPrv, {
      signAs: signer.xrpAddress,
    });
    coSignedHexTransaction.signedTransaction.should.equal(coSignedJsonTransaction.signedTransaction);
    coSignedHexTransaction.id.should.equal(coSignedJsonTransaction.id);
  });

  it('Should be unable to explain bogus XRP transaction', async function () {
    await basecoin
      .explainTransaction({ txHex: 'abcdefgH' })
      .should.be.rejectedWith('txHex needs to be either hex or JSON string for XRP');
  });

  describe('Fee Management', () => {
    const nockBasecoin: any = bitgo.coin('txrp');

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
