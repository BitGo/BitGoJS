import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Txrp } from '../../src';
import { Transaction } from '../../src/lib/transaction';
import { KeyPair } from '../../src/lib/keyPair';

import * as nock from 'nock';
import assert from 'assert';
import should from 'should';
import { coins } from '@bitgo/statics';

nock.disableNetConnect();

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
bitgo.safeRegister('txrp', Txrp.createInstance);

// TODO: move non xrp functions tests to their file tests
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
      await assert.rejects(async () => basecoin.verifyAddress(throwingArg));
    }
  });

  it('Should be able to explain an XRP Transfer', async function () {
    const signedExplanation = await basecoin.explainTransaction({
      txHex:
        '120000228000000024000000072E00000000201B0018D07161400000000003DE2968400000000000002D73008114726D0D8A26568D5D9680AC80577C912236717191831449EE221CCACC4DD2BF8862B22B0960A84FC771D9F3E010732103AFBB6845826367D738B0D42EA0756C94547E70B064E8FE1260CF21354C898B0B74473045022100CA3A98AA6FC8CCA251C3A2754992E474EA469884EB8D489D2B180EB644AC7695022037EB886DCF57928E5844DB73C2E86DE553FB59DCFC9408F3FD5D802ADB69DFCC8114F0DBA9D34C77B6769F6142AB7C9D0AF67D113EBCE1F1',
    });
    const unsignedExplanation = await basecoin.explainTransaction({
      txHex:
        '{"TransactionType":"Payment","Account":"rBSpCz8PafXTJHppDcNnex7dYnbe3tSuFG","Destination":"rfjub8A4dpSD5nnszUFTsLprxu1W398jwc","DestinationTag":0,"Amount":"253481","Flags":2147483648,"LastLedgerSequence":1626225,"Fee":"45","Sequence":7}',
    });
    unsignedExplanation.id.should.equal('37486621138DFB0C55FEF45FD275B565254464651A04CB02EE371F8C4A84D8CA');
    signedExplanation.id.should.equal('D52681436CC5B94E9D00BC8172047B1A6F3C028D2D0A5CDFB81680039C48ADFD');
    unsignedExplanation.outputAmount.should.equal('253481');
    signedExplanation.outputAmount.should.equal('253481');
  });

  it('Should be able to explain an XRP AccountSet transaction with MessageKey', async function () {
    const signedExplanation = await basecoin.explainTransaction({
      txHex:
        '1200032400E5F4AA201B00E9C54768400000000000002D722102000000000000000000000000415F8315C9948AD91E2CCE5B8583A36DA431FB61730081145FB0771C7BCA6BBB7B2DAF362B7FEFC35AC5DF00F3E01073210228085BA918B150F05B34CE4613AC4A031A816866E143AA7470FB2044D79EAA1474473045022100A8D2B720EFA46A88B4267EB3EFBBA0A6F9432884BC7F8DBF0E962B76E95DE0DE022004430D10DC7B4D1B2D0555EA22FF73FEA2E91636B5715F8909A6D9BC7689A4AC8114E9B5B8F9EC3ACFFB31958A3C1CFBB3CE41CB0725E1F1',
    });
    signedExplanation.id.should.equal('27D273F44EFDBA63D2473C8C5166C2B912F26B88BF21D147008D8E5E37CCBD21');
    signedExplanation.accountSet.messageKey.should.equal(
      '02000000000000000000000000415F8315C9948AD91E2CCE5B8583A36DA431FB61'
    );
    should(signedExplanation.accountSet.setFlag).equal(undefined);
    signedExplanation.fee.fee.should.equal('45');

    const unsignedExplanation = await basecoin.explainTransaction({
      txHex:
        '{"TransactionType":"AccountSet","Account":"r95xbEHFzDfc9XfmXHaDnj6dHNntT9RNcy","Fee":"45","Sequence":15070378,"LastLedgerSequence":15320391,"MessageKey":"02000000000000000000000000415F8315C9948AD91E2CCE5B8583A36DA431FB61"}',
    });
    unsignedExplanation.id.should.equal('A0F2AF7A3E0936BCFEE0D047789502D01518D9A4F1287D50568D66474475B3E7');
    unsignedExplanation.accountSet.messageKey.should.equal(
      '02000000000000000000000000415F8315C9948AD91E2CCE5B8583A36DA431FB61'
    );
    should(signedExplanation.accountSet.setFlag).equal(undefined);
    unsignedExplanation.fee.fee.should.equal('45');
  });

  it('Should be able to explain an XRP AccountSet transaction with Flag', async function () {
    const signedExplanation = await basecoin.explainTransaction({
      txHex:
        '12000322800000002402232F4C202100000004684000000000001D4C7321020CE46AA850561EB8391FC37C169CBAECF872FDA43AB72655B55A9D24EFDB3115744630440220490D496C69965CA3E754B3A01EBA768CDFD0D8BA1295D786B9A069584A004B9B022035E7824E76A4D4563115391FD3764544FAF87899BDC6B51BCD4C26947C86E26F81148D638995CB80B13D82EC5B9B2B9FF7E0575F9E8E',
    });
    signedExplanation.id.should.equal('393C6AC51D6D5E78F770B34178D02A54730D739C901549D6240DBAC70F4F7FF3');
    signedExplanation.accountSet.setFlag.should.equal(4);
    should(signedExplanation.accountSet.messageKey).equal(undefined);
    signedExplanation.fee.fee.should.equal('7500');

    const unsignedExplanation = await basecoin.explainTransaction({
      txHex:
        '{"TransactionType":"AccountSet","Account":"rDtbXp8cXxMx6EKLBRZucYkFtcmxoPKE6G","Fee":"7500","Flags":2147483648,"Sequence":35860300,"SetFlag":4,"SigningPubKey":"020CE46AA850561EB8391FC37C169CBAECF872FDA43AB72655B55A9D24EFDB3115","TxnSignature":"30440220490D496C69965CA3E754B3A01EBA768CDFD0D8BA1295D786B9A069584A004B9B022035E7824E76A4D4563115391FD3764544FAF87899BDC6B51BCD4C26947C86E26F"}',
    });
    unsignedExplanation.id.should.equal('393C6AC51D6D5E78F770B34178D02A54730D739C901549D6240DBAC70F4F7FF3');
    signedExplanation.accountSet.setFlag.should.equal(4);
    should(signedExplanation.accountSet.messageKey).equal(undefined);
    unsignedExplanation.fee.fee.should.equal('7500');
  });

  it('Should be able to explain an XRP SignerListSet transaction', async function () {
    const signedExplanation = await basecoin.explainTransaction({
      txHex:
        '12000C22800000002402232F4A202300000002684000000000001D4C7321020CE46AA850561EB8391FC37C169CBAECF872FDA43AB72655B55A9D24EFDB31157446304402200BE53855F3757F14577D9FAE11E732E8FDB0EACB8C3BA053EEA48C9685FD894502207BF0AD2A2DC0CF0F0EA30A7356F30AD5179B075BDABB3C7FC93A441778E065CF81148D638995CB80B13D82EC5B9B2B9FF7E0575F9E8EF4EB130001811466245A6A3DF5BAD09E075144CEEF501609772FD5E1EB1300018114DCC7B213AB4A8962CE4F6DDDF1878CAD0FD9A8FFE1EB1300018114A3936C08697C0964DCE1C4B3DBD01D6A4998EA59E1F1',
    });
    signedExplanation.id.should.equal('96E2F78D26CF76AAA38261D63CD042F744D6E73CB07D6886E53D544144819783');
    signedExplanation.signerListSet.signerQuorum.should.equal(2);
    signedExplanation.signerListSet.signerEntries.length.should.equal(3);
    signedExplanation.signerListSet.signerEntries[0].SignerEntry.Account.should.equal(
      'rwKn7Rx3kXupDb26KPE3UiLoUionqkvj9E'
    );
    signedExplanation.signerListSet.signerEntries[0].SignerEntry.SignerWeight.should.equal(1);
    signedExplanation.signerListSet.signerEntries[1].SignerEntry.Account.should.equal(
      'rM34tJNTdRVkXZfmihVXNp1bGvk4Ct6dgW'
    );
    signedExplanation.signerListSet.signerEntries[1].SignerEntry.SignerWeight.should.equal(1);
    signedExplanation.signerListSet.signerEntries[2].SignerEntry.Account.should.equal(
      'rEuukLhqfCrYrShnZNs3pqGv6qiARmEqrh'
    );
    signedExplanation.signerListSet.signerEntries[2].SignerEntry.SignerWeight.should.equal(1);
    signedExplanation.fee.fee.should.equal('7500');

    const unsignedExplanation = await basecoin.explainTransaction({
      txHex:
        '{"Account":"rDtbXp8cXxMx6EKLBRZucYkFtcmxoPKE6G","Fee":"7500","Flags":2147483648,"Sequence":35860298,"SignerEntries":[{"SignerEntry":{"Account":"rwKn7Rx3kXupDb26KPE3UiLoUionqkvj9E","SignerWeight":1}},{"SignerEntry":{"Account":"rM34tJNTdRVkXZfmihVXNp1bGvk4Ct6dgW","SignerWeight":1}},{"SignerEntry":{"Account":"rEuukLhqfCrYrShnZNs3pqGv6qiARmEqrh","SignerWeight":1}}],"SignerQuorum":2,"SigningPubKey":"020CE46AA850561EB8391FC37C169CBAECF872FDA43AB72655B55A9D24EFDB3115","TransactionType":"SignerListSet","TxnSignature":"304402200BE53855F3757F14577D9FAE11E732E8FDB0EACB8C3BA053EEA48C9685FD894502207BF0AD2A2DC0CF0F0EA30A7356F30AD5179B075BDABB3C7FC93A441778E065CF"}',
    });
    unsignedExplanation.id.should.equal('96E2F78D26CF76AAA38261D63CD042F744D6E73CB07D6886E53D544144819783');
    signedExplanation.signerListSet.signerQuorum.should.equal(2);
    signedExplanation.signerListSet.signerEntries.length.should.equal(3);
    signedExplanation.signerListSet.signerEntries[0].SignerEntry.Account.should.equal(
      'rwKn7Rx3kXupDb26KPE3UiLoUionqkvj9E'
    );
    signedExplanation.signerListSet.signerEntries[0].SignerEntry.SignerWeight.should.equal(1);
    signedExplanation.signerListSet.signerEntries[1].SignerEntry.Account.should.equal(
      'rM34tJNTdRVkXZfmihVXNp1bGvk4Ct6dgW'
    );
    signedExplanation.signerListSet.signerEntries[1].SignerEntry.SignerWeight.should.equal(1);
    signedExplanation.signerListSet.signerEntries[2].SignerEntry.Account.should.equal(
      'rEuukLhqfCrYrShnZNs3pqGv6qiARmEqrh'
    );
    signedExplanation.signerListSet.signerEntries[2].SignerEntry.SignerWeight.should.equal(1);
    unsignedExplanation.fee.fee.should.equal('7500');
  });

  it('should be able to cosign XRP transaction in any form', async function () {
    const coin = coins.get('txrp');
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

    const txFromHex = new Transaction(coin);
    txFromHex.fromRawTransaction(unsignedTxHex);
    const keypair = new KeyPair({ prv: signer.prv });
    txFromHex.sign(keypair);
    const coSignedHexTransaction = txFromHex.toJson();

    const txFromJson = new Transaction(coin);
    txFromJson.fromRawTransaction(unsignedTxJson);
    txFromJson.sign(keypair);
    const coSignedJsonTransaction = txFromJson.toJson();

    coSignedHexTransaction.should.deepEqual(coSignedJsonTransaction);
    txFromHex.toBroadcastFormat().should.equal(txFromJson.toBroadcastFormat());
    txFromHex.id.should.equal(txFromJson.id);
  });

  it('Should be unable to explain bogus XRP transaction', async function () {
    await basecoin.explainTransaction({ txHex: 'abcdefgH' }).should.be.rejectedWith('Invalid transaction');
  });

  describe('Fee Management', () => {
    const nockBasecoin = bitgo.coin('txrp') as Txrp;

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
