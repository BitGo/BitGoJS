//
// Tests for Wallets
//

import * as should from 'should';
import * as nock from 'nock';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../src/bitgo';
const recoveryNocks = require('../lib/recovery-nocks');

import { krsProviders } from '@bitgo/sdk-core';
nock.disableNetConnect();

describe('Recovery:', function () {
  let bitgo;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
    bitgo.initializeTestVars();

    // pretend that Keyternal accepts recoveries for all coins
    krsProviders.keyternal.supportedCoins = ['btc', 'eth', 'xrp', 'bch', 'bcha', 'ltc', 'zec', 'dash', 'xlm', 'bsv'];
    (krsProviders.keyternal.feeAddresses as any) = {
      tbtc: '2Mujz9eicmgpPcdScRJTywVK3EQNHDJG3yN',
      tbch: '2Mujz9eicmgpPcdScRJTywVK3EQNHDJG3yN',
      tbsv: '2Mujz9eicmgpPcdScRJTywVK3EQNHDJG3yN',
      tbcha: '2Mujz9eicmgpPcdScRJTywVK3EQNHDJG3yN',
      tltc: 'QffXMViM8DYgPRf1Hoczjw7BS5CVdSWaBL',
      tzec: 't2ATLAhBP1uTuyiWs5DY5CPH1VuYkGUindt',
      tdash: '8euHug4dbmPy3CLawwWdeTjGLqPYEGz3Kt',
    };
  });

  after(function () {
    nock.cleanAll();
  });


  describe('Recover Ripple', function () {
    it('should generate XRP recovery tx', function () {
      recoveryNocks.nockXrpRecovery();

      const basecoin = bitgo.coin('txrp');
      return basecoin.recover({
        userKey: '{"iv":"rU++mEtIHtbp3d4jg5EulA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"ip1rb59uYnM=","ct":"ssmP9abPoVyXkW4Io0SUy+AAS8lr+wgIerTMw+lDYnkUh0sjlI4A6Fpve0q1riQ3Dy/J0bNu7dgoZkO4xs/X6dzwEwlmPhk3pEQ7Yd4CXa1zA01y0Geu900FLe4LdaS8jt6fixui2tTd4Vi3JYglF1/HmCjG1Ug="}',
        backupKey: '{"iv":"uB/BTcn1rXmgYGfncXOowg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"I3WrumxkuMQ=","ct":"sgyDNAzNsBruTRm0d04oBTBf8lheHNKS+dRgl8FeMEhodKsiyjtRVHG0CHPf5rV3g5ixVnZ+iwsSCv3PKyyeoy7RGnT0AG9YYpi0me+OvP8331iO+n5quzstrGbV1j8uEh5IMW78S+YUZKSx6zbbdZ0xNu8D5WM="}',
        rootAddress: 'raGZWRkRBUWdQJsKYEzwXJNbCZMTqX56aA',
        walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
        recoveryDestination: 'rsv2kremJSSFbbaLqrf8fWxxN5QnsynNm2?dt=12345',
      })
        .then(function (recovery) {
          recovery.txHex.should.equal('120000228000000024000000042E00003039201B0015519161400000024E06C0C068400000000000001E7300811439CA010E0E0198150F8DDD5768CCD2B095701D8C8314201276ADC469C4F10D1369E0F5C5A7DEF37B2267F3E0107321026C91974146427889C801BD26CE31CE0E10307A69DFE4139DE45E5E35933A6B037446304402204AA3D2F344729B0BB9075C4AEA07EBB2EAF6D3F36309BCAEF10B2C9734AC943E022032D55EC19E27B2E90E3D9444FD26CC06FD47BB3E3D85B0FCC0CC4DE7038563FD8114ABB5B7C843F3AA8D8EFACC3C5A7D9B0484C17442E1E010732102F4E376133012F5404990C7E1DF83A9F943B30D55F0D856632C8E8378FCEB70D2744630440220568F1D49F5810458E7204A1D2D23B86B694505327E8410A215AB9C9324EA8A3102207A93211ACFB5E9C1441B701A7954B72A3054265BA3FD61965D709E4C4E9080F38114ACEF9F0A2FCEC44A9A213444A9E6C57E2D02856AE1F1');
          recovery.id.should.equal('F2005B392E9454FF1E8217B816C87866A56770382B8FCAC0AAE2FA8D12A53B98');
          recovery.outputAmount.should.equal('9899000000');
          recovery.outputs.length.should.equal(1);
          recovery.outputs[0].address.should.equal('rsv2kremJSSFbbaLqrf8fWxxN5QnsynNm2?dt=12345');
          recovery.outputs[0].amount.should.equal('9899000000');
          recovery.fee.fee.should.equal('30');
        });

    });

    it('should generate XRP recovery tx with KRS', function () {
      recoveryNocks.nockXrpRecovery();

      const basecoin = bitgo.coin('txrp');
      return basecoin.recover({
        userKey: '{"iv":"rU++mEtIHtbp3d4jg5EulA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"ip1rb59uYnM=","ct":"ssmP9abPoVyXkW4Io0SUy+AAS8lr+wgIerTMw+lDYnkUh0sjlI4A6Fpve0q1riQ3Dy/J0bNu7dgoZkO4xs/X6dzwEwlmPhk3pEQ7Yd4CXa1zA01y0Geu900FLe4LdaS8jt6fixui2tTd4Vi3JYglF1/HmCjG1Ug="}',
        backupKey: 'xpub661MyMwAqRbcFtWdmWHKZEh9pYiJrAGTu1NNSwxY2S63tU9nGcfCAbNUKQuFqXRTRk8KkuBabxo6YjeBri8Q7dkMsmths6MVxSd6MTaeCmd',
        rootAddress: 'raGZWRkRBUWdQJsKYEzwXJNbCZMTqX56aA',
        walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
        krsProvider: 'keyternal',
        recoveryDestination: 'rsv2kremJSSFbbaLqrf8fWxxN5QnsynNm2?dt=12345',
      })
        .then(function (recovery) {
          recovery.txHex.should.equal('120000228000000024000000042E00003039201B0015519161400000024E06C0C068400000000000001E7300811439CA010E0E0198150F8DDD5768CCD2B095701D8C8314201276ADC469C4F10D1369E0F5C5A7DEF37B2267F3E010732102F4E376133012F5404990C7E1DF83A9F943B30D55F0D856632C8E8378FCEB70D2744630440220568F1D49F5810458E7204A1D2D23B86B694505327E8410A215AB9C9324EA8A3102207A93211ACFB5E9C1441B701A7954B72A3054265BA3FD61965D709E4C4E9080F38114ACEF9F0A2FCEC44A9A213444A9E6C57E2D02856AE1F1');
          recovery.id.should.equal('6EA1728B0CC0C047E54AAF578D81822EDE1107908B979868299657E74A8E18C0');
          recovery.outputAmount.should.equal('9899000000');
          recovery.outputs.length.should.equal(1);
          recovery.outputs[0].address.should.equal('rsv2kremJSSFbbaLqrf8fWxxN5QnsynNm2?dt=12345');
          recovery.outputs[0].amount.should.equal('9899000000');
          recovery.fee.fee.should.equal('30');
        });
    });

    it('should generate an XRP unsigned sweep', function () {
      recoveryNocks.nockXrpRecovery();

      const basecoin = bitgo.coin('txrp');
      return basecoin.recover({
        userKey: 'xpub661MyMwAqRbcF9Ya4zDHGzDtJz3NaaeEGbQ6rnqnNxL9RXDJNHcfzAyPUBXuKXjytvJNzQxqbjBwmPveiYX323Zp8Zx2RYQN9gGM7ntiXxr',
        backupKey: 'xpub661MyMwAqRbcFtWdmWHKZEh9pYiJrAGTu1NNSwxY2S63tU9nGcfCAbNUKQuFqXRTRk8KkuBabxo6YjeBri8Q7dkMsmths6MVxSd6MTaeCmd',
        rootAddress: 'raGZWRkRBUWdQJsKYEzwXJNbCZMTqX56aA',
        walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
        krsProvider: 'keyternal',
        recoveryDestination: 'rsv2kremJSSFbbaLqrf8fWxxN5QnsynNm2?dt=12345',
      })
        .then(function (recovery) {
          const json = JSON.parse(recovery);
          json.TransactionType.should.equal('Payment');
          json.Account.should.equal('raGZWRkRBUWdQJsKYEzwXJNbCZMTqX56aA');
          json.Destination.should.equal('rsv2kremJSSFbbaLqrf8fWxxN5QnsynNm2');
          json.DestinationTag.should.equal(12345);
          json.Amount.should.equal('9899000000');
          json.Flags.should.equal(2147483648);
          json.LastLedgerSequence.should.equal(1397137);
          json.Fee.should.equal('30');
          json.Sequence.should.equal(4);
        });
    });
  });

  describe('Recover Stellar', function () {

    async function checkRecoveryTxExplanation(basecoin, tx, recoveryAmount, recoveryDestination) {
      const explanation = await basecoin.explainTransaction({ txBase64: tx });
      explanation.should.have.property('outputs');
      explanation.outputs.should.containEql({
        amount: recoveryAmount.toFixed(),
        address: recoveryDestination,
        coin: basecoin.getChain(),
      });
      explanation.should.have.property('changeOutputs', []);
      explanation.should.have.property('changeAmount', '0');
      explanation.should.have.property('fee', { fee: '100', feeRate: null, size: null });
      explanation.should.have.property('operations', []);
    }

    it('should generate XLM recovery tx', async function () {
      recoveryNocks.nockXlmRecovery();

      const recoveryParams = {
        userKey: `{"iv":"PiLveA+5AFPURwaU7iijBQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"KlJc8NSKHpw=","ct":"YcdNOFpzXgDnRqjlR3W9R+5eztysyhpCTuRBHsnPyPDst9nvL+GeSORbLY9xVThTdyV6llRgfUr5O7y4l9s9Fg=="}`,
        backupKey: `{"iv":"TmiAIHr0vCX6g2BKkc6/7g==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"wOkMJEm5B6U=","ct":"HJPS56/FuMieiH6K2s5k5jFp8RPHQqZa9qi8hDkjOqNUFjD4XKq8Sy3BDhpwzozTBW6EmQGSF0kpc7eZ9CucKw=="}`,
        rootAddress: 'GAUAGTL3NBZ7NP3UIMZCVJYM6O2NKUP6XRTK4E5VZDVIQX3CBYIVMDIB',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: 'GASW277S2ZOE7H7A5EQ5H5AKLP6UA6Z5AKOSWV6ARBEGTSIGMZMC7AIZ',
      };
      const recoveryAmount = 74999500;

      const basecoin = bitgo.coin('txlm');
      const recovery = await basecoin.recover(recoveryParams);

      recovery.should.have.property('tx');
      recovery.should.have.property('recoveryAmount', recoveryAmount);

      await checkRecoveryTxExplanation(basecoin, recovery.tx, recoveryAmount, recoveryParams.recoveryDestination);
    });

    it('should recover to an unfunded XLM wallet', async function () {
      recoveryNocks.nockXlmRecovery();

      const recoveryParams = {
        userKey: `{"iv":"PiLveA+5AFPURwaU7iijBQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"KlJc8NSKHpw=","ct":"YcdNOFpzXgDnRqjlR3W9R+5eztysyhpCTuRBHsnPyPDst9nvL+GeSORbLY9xVThTdyV6llRgfUr5O7y4l9s9Fg=="}`,
        backupKey: `{"iv":"TmiAIHr0vCX6g2BKkc6/7g==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"wOkMJEm5B6U=","ct":"HJPS56/FuMieiH6K2s5k5jFp8RPHQqZa9qi8hDkjOqNUFjD4XKq8Sy3BDhpwzozTBW6EmQGSF0kpc7eZ9CucKw=="}`,
        rootAddress: 'GAUAGTL3NBZ7NP3UIMZCVJYM6O2NKUP6XRTK4E5VZDVIQX3CBYIVMDIB',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: 'GAGCQLUGMX76XC24JRCRJWOHXK23ONURH4433JOEPU6CH7Z44CCYUCEL',
      };
      const recoveryAmount = 74999500;

      const basecoin = bitgo.coin('txlm');
      const recovery = await basecoin.recover(recoveryParams);

      recovery.should.have.property('tx');
      recovery.should.have.property('recoveryAmount', recoveryAmount);

      await checkRecoveryTxExplanation(basecoin, recovery.tx, recoveryAmount, recoveryParams.recoveryDestination);
    });

    it('should generate XLM recovery tx with unencrypted keys', async function () {
      recoveryNocks.nockXlmRecovery();

      const recoveryParams = {
        userKey: `SAMF5XS7O5BL4OOTB625DELCVNW5JMHF2DDM7NSIVPNQQEKPKLBQFNJ3`,
        backupKey: `SCXZ7UFVSIFIYJVPLWEAY22TZJOR4L2Z4HE6BMZGZHBBJ4UAABTFMK3V`,
        rootAddress: 'GAUAGTL3NBZ7NP3UIMZCVJYM6O2NKUP6XRTK4E5VZDVIQX3CBYIVMDIB',
        recoveryDestination: 'GASW277S2ZOE7H7A5EQ5H5AKLP6UA6Z5AKOSWV6ARBEGTSIGMZMC7AIZ',
      };
      const recoveryAmount = 74999500;

      const basecoin = bitgo.coin('txlm');
      const recovery = await basecoin.recover(recoveryParams);

      recovery.should.have.property('tx');
      recovery.should.have.property('recoveryAmount', recoveryAmount);

      await checkRecoveryTxExplanation(basecoin, recovery.tx, recoveryAmount, recoveryParams.recoveryDestination);
    });

    it('should generate XLM recovery tx with KRS', async function () {
      recoveryNocks.nockXlmRecovery();

      const recoveryParams = {
        userKey: `{"iv":"PiLveA+5AFPURwaU7iijBQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"KlJc8NSKHpw=","ct":"YcdNOFpzXgDnRqjlR3W9R+5eztysyhpCTuRBHsnPyPDst9nvL+GeSORbLY9xVThTdyV6llRgfUr5O7y4l9s9Fg=="}`,
        backupKey: 'GCBABJPE3UTZ3JPUEIZEXAQQ5CMNX5UPYKOB7HHXSHBCIGD7VV64H6KU',
        rootAddress: 'GAUAGTL3NBZ7NP3UIMZCVJYM6O2NKUP6XRTK4E5VZDVIQX3CBYIVMDIB',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: 'GASW277S2ZOE7H7A5EQ5H5AKLP6UA6Z5AKOSWV6ARBEGTSIGMZMC7AIZ',
        krsProvider: 'keyternal',
      };
      const recoveryAmount = 74999500;

      const basecoin = bitgo.coin('txlm');
      const recovery = await basecoin.recover(recoveryParams);


      recovery.should.have.property('tx');
      recovery.should.have.property('recoveryAmount', 74999500);

      await checkRecoveryTxExplanation(basecoin, recovery.tx, recoveryAmount, recoveryParams.recoveryDestination);
    });

    it('should generate an XLM unsigned sweep', async function () {
      recoveryNocks.nockXlmRecovery();

      const recoveryParams = {
        userKey: 'GBNK4FJO6FDQNBVLUP7MICEJUVINPNJZCDDTTYS3LVFC6J7LKEXLOBKM',
        backupKey: 'GCBABJPE3UTZ3JPUEIZEXAQQ5CMNX5UPYKOB7HHXSHBCIGD7VV64H6KU',
        rootAddress: 'GAUAGTL3NBZ7NP3UIMZCVJYM6O2NKUP6XRTK4E5VZDVIQX3CBYIVMDIB',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: 'GASW277S2ZOE7H7A5EQ5H5AKLP6UA6Z5AKOSWV6ARBEGTSIGMZMC7AIZ',
        krsProvider: 'keyternal',
      };
      const recoveryAmount = 74999500;

      const basecoin = bitgo.coin('txlm');
      const recovery = await basecoin.recover(recoveryParams);

      recovery.should.have.property('tx');
      recovery.should.have.property('recoveryAmount', 74999500);

      await checkRecoveryTxExplanation(basecoin, recovery.tx, recoveryAmount, recoveryParams.recoveryDestination);
    });
  });

  describe('Recover TRON', function () {
    let baseCoin;

    before(function () {
      baseCoin = bitgo.coin('ttrx');
    });

    beforeEach(function () {
      recoveryNocks.nockTronRecovery();
    });

    it('should generate recovery tx from encrypted user and backup keys', async function () {
      const recoveryTx = await baseCoin.recover({
        userKey: '{"iv":"QPX3xtGROshqHW8kGPAYCw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"LJ4YYCyClRE=","ct":"hlJH8lWk/FaciymG8UsscxVFCnOduLRjoWxaK8xU7TjsqUDXsQjj0BpH7aNm64p6ldueaGoU2/VfrrzX9lWrcVmXspFp2oON5EyK45JbI13hirqG2dkOqoT8G8mrMydMp6zG5iOA+EtXRy69kYDCI1Re6mR7k1c="}',
        backupKey: '{"iv":"xbOCFaZVnrQLAYKcgMvdNw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"86cZ+hT+S0Y=","ct":"RH7Uks/JjNARX9wuIw6r4Map2C9FtLlWYk4zjLcrjzkBuNTCUNQgxF7kU5/SWzD+tomVBj6P9CLkXYzPlR1NhVi+aT9mTW6LK9nJ+ErpLKXzbIAxBLezDjJ5xqUS5cGkjoHCtANL7qTZcDBvOfejLDrUjQdw2WQ="}',
        bitgoKey: 'xpub661MyMwAqRbcFcaxCPsEyhj79VUuVVThWinZnjhvAPnFLB1SBp7Yk4gvqWsGE3MHdw1tPRLnHRRQLNcrKqaCyBnFK5XTrZUrLyY94LXn4v9',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: 'TYBTURKpanKxnx91uyfvvtztNeHE3EQf6G',
      });

      should.exist(recoveryTx.tx);

      recoveryTx.tx.signature[0].should.equal('f4b0b12f1226765c7d4f775244693da0d95726cd4f9dc7c16c67a211a372390ad0fe9dde01dbd418c502c3282c7ac8417132f86544c37b64e1526ffa8b43dead01');
      recoveryTx.tx.signature[1].should.equal('1c637c8c317df0b815cdc27637e4403964d74e3b1751efda08c11acdf226c83263ef4c9f4b7731514ded6b19dc846efb58371b653bbadc8040ac18101cafedb501');
      recoveryTx.tx.txID.should.equal('55d76a068b97933a98e5d02e6fecd4c2971f1d37f0bb850a919b17def906a239');
      recoveryTx.tx.raw_data_hex.should.equal('0a023ffb2208c1647593403d263b40b8b2e6fce72d5a69080112650a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412340a15414d0941161d0f7e1da0c8989b1566c9d9b43e1226121541f3a3d6d514e7d43fbbf632a687acd65aafb8a50c18c0cdd6ac03709deae2fce72d');
    });

    it('should generate recovery tx with unencrypted keys', async function () {
      const recoveryTx = await baseCoin.recover({
        userKey: 'xpub661MyMwAqRbcEvKZzdcvuU1nesKjFz8Gh8P1gTsowTCkGCByHRu1JsZwZYPJV6mUT3s3pQYxUtDU3JjkNruSGDK3kZUpgXqTfDAY6664a2H',
        backupKey: 'xpub661MyMwAqRbcF2zqeVjGdDJgEoZMFi5Vksfk3DtD9v4sBraTdgTzV3rTifJGWWudUxswBza3RotmQGxDCVKLNcRh7nW8ECB3BNSU6Xx91fL',
        bitgoKey: 'xpub661MyMwAqRbcFcaxCPsEyhj79VUuVVThWinZnjhvAPnFLB1SBp7Yk4gvqWsGE3MHdw1tPRLnHRRQLNcrKqaCyBnFK5XTrZUrLyY94LXn4v9',
        recoveryDestination: 'TYBTURKpanKxnx91uyfvvtztNeHE3EQf6G',
      });

      should.exist(recoveryTx.tx);

      recoveryTx.tx.txID.should.equal('55d76a068b97933a98e5d02e6fecd4c2971f1d37f0bb850a919b17def906a239');
      recoveryTx.tx.raw_data_hex.should.equal('0a023ffb2208c1647593403d263b40b8b2e6fce72d5a69080112650a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412340a15414d0941161d0f7e1da0c8989b1566c9d9b43e1226121541f3a3d6d514e7d43fbbf632a687acd65aafb8a50c18c0cdd6ac03709deae2fce72d');
    });

    it('should generate an unsigned sweep', async function () {
      const recoveryTx = await baseCoin.recover({
        userKey: '{"iv":"QPX3xtGROshqHW8kGPAYCw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"LJ4YYCyClRE=","ct":"hlJH8lWk/FaciymG8UsscxVFCnOduLRjoWxaK8xU7TjsqUDXsQjj0BpH7aNm64p6ldueaGoU2/VfrrzX9lWrcVmXspFp2oON5EyK45JbI13hirqG2dkOqoT8G8mrMydMp6zG5iOA+EtXRy69kYDCI1Re6mR7k1c="}',
        backupKey: 'xpub661MyMwAqRbcF2zqeVjGdDJgEoZMFi5Vksfk3DtD9v4sBraTdgTzV3rTifJGWWudUxswBza3RotmQGxDCVKLNcRh7nW8ECB3BNSU6Xx91fL',
        bitgoKey: 'xpub661MyMwAqRbcFcaxCPsEyhj79VUuVVThWinZnjhvAPnFLB1SBp7Yk4gvqWsGE3MHdw1tPRLnHRRQLNcrKqaCyBnFK5XTrZUrLyY94LXn4v9',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: 'TYBTURKpanKxnx91uyfvvtztNeHE3EQf6G',
      });

      should.exist(recoveryTx.tx);

      recoveryTx.tx.txID.should.equal('55d76a068b97933a98e5d02e6fecd4c2971f1d37f0bb850a919b17def906a239');
      recoveryTx.tx.raw_data_hex.should.equal('0a023ffb2208c1647593403d263b40b8b2e6fce72d5a69080112650a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412340a15414d0941161d0f7e1da0c8989b1566c9d9b43e1226121541f3a3d6d514e7d43fbbf632a687acd65aafb8a50c18c0cdd6ac03709deae2fce72d');
    });
  });

  describe('Recover EOS', function () {
    let baseCoin;
    const expectedPackedTrx = '7122315d5e91d408e1b3000000000100a6823403ea3055000000572d3ccdcd0150f3ea2e4cf4bc8300000000a8ed32322150f3ea2e4cf4bc83e0f27c27cc0adf7f40420f000000000004454f53000000000000';
    const expectedTxId = '99c6a4eedf5cff246314bdc0a053c12d75488df3aa09474bad4ceca88d8b2498';
    before(function () {
      baseCoin = bitgo.coin('teos');
    });
    beforeEach(function () {
      recoveryNocks.nockEosRecovery();
    });

    it('should generate EOS recovery tx with correct expiration date', async function () {
      const recoveryTx = await baseCoin.recover({
        userKey: '{\"iv\":\"jRBZi43c7t4tvx7SgP8h0g==\",\"v\":1,\"iter\":10000,\"ks\":256,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"salt\":\"TgZqHtZrmLU=\",\"ct\":\"hRntzrbcH81dOzlyr49nbAIJdHWqEKKVJx0s55kNV+fqUjKKoEuWqVGF1dPfQkkTkcIjFTNvuHsiGicVGSRf5RI3Q0ZD6YtCqO2bWX6t7HgBio5yYMaPy+cNJHmp6jHBQFZ9cCjqwAam/V+1mRvpJpn2dSWPotw=\"}',
        backupKey: '{\"iv\":\"qE+D+C6KXaZKFXXTM/AF5w==\",\"v\":1,\"iter\":10000,\"ks\":256,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"salt\":\"a/YD7/8gJFw=\",\"ct\":\"tc2c1PfSjDS9TshXEIKKlToDcdCeL45fpGUWEPIM2+6CrvIuaXZC6/Hx9bza7VIoEPhJWHmgvoeAouto4PUpnyKJUuz+T46RY09XJs2rcDvbfMKblRsh6lzUc8O7ubTzJRNgFOUqkZM6qGB22A0FtL8yNlFqc3c=\"}',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        rootAddress: 'kiyjcn1ixftp',
        recoveryDestination: 'jzjkpn1bjnti',
      });

      recoveryTx.should.have.property('transaction');
      recoveryTx.transaction.compression.should.equal('none');
      recoveryTx.transaction.packed_trx.should.equal(expectedPackedTrx);
      recoveryTx.transaction.signatures.length.should.equal(2);
      recoveryTx.txid.should.equal(expectedTxId);

      const deserializeTransactionParams = {
        transaction: {
          packed_trx: recoveryTx.transaction.packed_trx,
        },
      };

      const deserializedTx = await baseCoin.deserializeTransaction(deserializeTransactionParams);
      const mockedHeadBlockTime = '2019-07-18T17:52:49.000';
      const hoursUntilExpiration = 8;
      const hourDiff = (new Date(deserializedTx.expiration).getTime() - new Date(mockedHeadBlockTime).getTime()) / 36e5;
      hourDiff.should.equal(hoursUntilExpiration);
    });

    it('should generate EOS recovery tx with unencrypted keys', async function () {
      const recoveryTx = await baseCoin.recover({
        userKey: 'xprv9s21ZrQH143K4NDgnKH8zTTLpJuCmv6dtykRJwapBH73bvcvTvCQAMmQLxRGqg5YbvXBN5VGD3y2cPGUGyrVcjWDJM573RVseHg4oL64AXx',
        backupKey: 'xprv9s21ZrQH143K4Gh3snX8z5d24djEVwCwVwdHGEssUpKwHqKDtAz8gRPw7Fi12NC3ur94CsJ2KormunQQm3gNkXQiTy534NdfuQ4C2EpdmRp',
        rootAddress: 'kiyjcn1ixftp',
        recoveryDestination: 'jzjkpn1bjnti',
      });

      recoveryTx.should.have.property('transaction');
      recoveryTx.transaction.compression.should.equal('none');
      recoveryTx.transaction.packed_trx.should.equal(expectedPackedTrx);
      recoveryTx.transaction.signatures.length.should.equal(2);
      recoveryTx.txid.should.equal(expectedTxId);
    });

    it('should generate an EOS unsigned sweep', async function () {
      const recoveryTx = await baseCoin.recover({
        userKey: 'xpub661MyMwAqRbcGrJ9tLp9MbQ5NLjhBNpVGCg27KzRjce2Uix51TWeiA5tCDyBFHENmKSf6BiWg3tAjYgrhTz9bZGdXj7pfksXaEpVLQqzYEE',
        backupKey: 'xpub661MyMwAqRbcGkmWyp49MDZkcfZiuPvnsAYt4dHV39rvAdeNRiJPEDiQxYTNrbFEHJVBJWBdxW7DgCqRUyVpYAbT3D6LGsZpynYpMFAgAZr',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        rootAddress: 'kiyjcn1ixftp',
        recoveryDestination: 'jzjkpn1bjnti',
      });

      recoveryTx.should.have.property('transaction');
      recoveryTx.transaction.compression.should.equal('none');
      recoveryTx.transaction.packed_trx.should.equal(expectedPackedTrx);
      recoveryTx.transaction.signatures.length.should.equal(0);
      recoveryTx.txid.should.equal(expectedTxId);
    });
  });

  describe('Recover ERC20', function () {
    it('should successfully construct a recovery transaction for tokens stuck in a wallet', async function () {
      const wallet = bitgo.nockEthWallet();

      // There should be 24 Potatokens stuck in our test wallet (based on nock)
      const tx = await wallet.recoverToken({
        tokenContractAddress: TestBitGo.V2.TEST_ERC20_TOKEN_ADDRESS,
        recipient: TestBitGo.V2.TEST_ERC20_TOKEN_RECIPIENT,
        walletPassphrase: TestBitGo.V2.TEST_ETH_WALLET_PASSPHRASE,
      });

      should.exist(tx);
      tx.should.have.property('halfSigned');

      const txInfo = tx.halfSigned;
      txInfo.should.have.property('contractSequenceId');
      txInfo.contractSequenceId.should.equal(1101);
      txInfo.should.have.property('expireTime');
      txInfo.should.have.property('gasLimit');
      txInfo.gasLimit.should.equal(500000);
      txInfo.should.have.property('gasPrice');
      txInfo.gasPrice.should.equal(20000000000);
      txInfo.should.have.property('operationHash');
      txInfo.should.have.property('signature');
      txInfo.should.have.property('tokenContractAddress');
      txInfo.tokenContractAddress.should.equal(TestBitGo.V2.TEST_ERC20_TOKEN_ADDRESS);
      txInfo.should.have.property('walletId');
      txInfo.walletId.should.equal(TestBitGo.V2.TEST_ETH_WALLET_ID);
      txInfo.should.have.property('recipient');
      txInfo.recipient.should.have.property('address');
      txInfo.recipient.address.should.equal(TestBitGo.V2.TEST_ERC20_TOKEN_RECIPIENT);
      txInfo.recipient.should.have.property('amount');
      txInfo.recipient.amount.should.equal('2400');
    });

    it('should successfully generate an ERC20 unsigned sweep', async function () {
      recoveryNocks.nockEthRecovery(bitgo);

      const basecoin = bitgo.coin('tdai');

      // There should be 1 TDAI token in our test wallet (based on nock)
      const transaction = await basecoin.recover({
        userKey: 'xpub661MyMwAqRbcFXDcWD2vxuebcT1ZpTF4Vke6qmMW8yzddwNYpAPjvYEEL5jLfyYXW2fuxtAxY8TgjPUJLcf1C8qz9N6VgZxArKX4EwB8rH5',
        backupKey: 'xpub661MyMwAqRbcGhSaXikpuTC9KU88Xx9LrjKSw1JKsvXNgabpTdgjy7LSovh9ZHhcqhAHQu7uthu7FguNGdcC4aXTKK5gqTcPe4WvLYRbCSG',
        walletContractAddress: TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS,
        tokenContractAddress: TestBitGo.V2.TEST_ERC20_TOKEN_ADDRESS,
        recoveryDestination: TestBitGo.V2.TEST_ERC20_TOKEN_RECIPIENT,
      });
      should.exist(transaction);
      transaction.should.have.property('tx');

      transaction.should.have.property('contractSequenceId');
      transaction.should.have.property('expireTime');
      transaction.should.have.property('gasLimit');
      transaction.gasLimit.should.equal('500000');
      transaction.should.have.property('gasPrice');
      transaction.gasPrice.should.equal('20000000000');
      transaction.should.have.property('tokenContractAddress');
      transaction.tokenContractAddress.should.equal(TestBitGo.V2.TEST_TDAI_TOKEN_ADDRESS);
      transaction.should.have.property('walletContractAddress');
      transaction.walletContractAddress.should.equal(TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS);
      transaction.should.have.property('recipient');
      transaction.recipient.should.have.property('address');
      transaction.recipient.address.should.equal(TestBitGo.V2.TEST_ERC20_TOKEN_RECIPIENT);
      transaction.recipient.should.have.property('amount');
      transaction.recipient.amount.should.equal('1000000000000000000');
    });

  });


  describe('Recover Ethereum', function () {
    beforeEach(() => {
      nock.cleanAll();
    });
    let recoveryParams;
    before(() => {
      recoveryParams = {
        userKey: '{"iv":"+TkmT3GJ5msVWQjBrt3lsw==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
          ':"ccm","adata":"","cipher":"aes","salt":"cCE20fGIobs=","ct":"NVIdYIh91J3aRI\n' +
          '8GG0JE3DhXW3AUmz2G5RqMejdz1+t4/vovIP7lleegI7VYyWiiLvlM0OCFf3EVvV/RyXr8+2vsn\n' +
          'Q0Vn8c2CV5FRZ80OjGYrW3A/6T/zpOz6E8CMvnD++iIpeO4r2eZJavejZxdzlxF0BRz7VI="}',
        backupKey: '{"iv":"asB356ofC7nZtg4NBvQkiQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
          ':"ccm","adata":"","cipher":"aes","salt":"1hr2HhBbBIk=","ct":"8CZc6upt+XNOto\n' +
          'KDD38TUg3ZUjzW+DraZlkcku2bNp0JS2s1g/iC6YTGUGtPoxDxumDlXwlWQx+5WPjZu79M8DCrI\n' +
          't9aZaOvHkGH9aFtMbavFX419TcrwDmpUeQFN0hRkfrIHXyHNbTpGSVAjHvHMtzDMaw+ACg="}',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        walletContractAddress: '0x5df5a96b478bb1808140d87072143e60262e8670',
        recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054',
      };
    });

    it('should throw on invalid gasLimit', async function () {
      recoveryNocks.nockEthRecovery(bitgo);

      const basecoin = bitgo.coin('teth');
      await basecoin.recover({
        ...recoveryParams,
        gasLimit: -400000,
        gasPrice: 25000000000,
      })
        .should.be.rejectedWith('Gas limit must be between 30000 and 20000000');
    });

    it('should throw if etherscan errs', async function () {
      const nockUnsuccessfulEtherscanData: any[] = [
        {
          params: {
            module: 'account',
            action: 'txlist',
            address: '0x74c2137d54b0fc9f907e13f14e0dd18485fee924',
          },
          response: {
            status: '0',
            message: 'No transactions found',
            result: [],
          },
        },
        {
          params: {
            module: 'account',
            action: 'balance',
            address: '0x74c2137d54b0fc9f907e13f14e0dd18485fee924',
          },
          response: {
            status: '1',
            message: 'NOTOK',
            result: 'Rate limit exceeded',
          },
        },
      ];
      recoveryNocks.nockEthRecovery(bitgo, nockUnsuccessfulEtherscanData);

      const basecoin = bitgo.coin('teth');
      await basecoin.recover(recoveryParams)
        .should.be.rejectedWith('Could not obtain address balance for 0x74c2137d54b0fc9f907e13f14e0dd18485fee924 from Etherscan, got: Rate limit exceeded');
    });

    it('should throw if backup key address has insufficient balance', async function () {
      const insufficientFeeData: any[] = [
        {
          params: {
            module: 'account',
            action: 'txlist',
            address: '0x74c2137d54b0fc9f907e13f14e0dd18485fee924',
          },
          response: {
            status: '0',
            message: 'No transactions found',
            result: [],
          },
        },
        {
          params: {
            module: 'account',
            action: 'balance',
            address: '0x74c2137d54b0fc9f907e13f14e0dd18485fee924',
          },
          response: {
            status: '1',
            message: 'OK',
            result: '1234',
          },
        },
      ];
      recoveryNocks.nockEthRecovery(bitgo, insufficientFeeData);

      const basecoin = bitgo.coin('teth');
      await basecoin.recover({
        ...recoveryParams,
        gasLimit: 300000,
        gasPrice: 1000000000,
      })
        .should.be.rejectedWith('Backup key address 0x74c2137d54b0fc9f907e13f14e0dd18485fee924 has balance 0.000001234 Gwei.' +
        'This address must have a balance of at least 300000 Gwei to perform recoveries. Try sending some ETH to this address then retry.');
    });

    it('should throw on invalid gasPrice', async function () {
      recoveryNocks.nockEthRecovery(bitgo);

      const basecoin = bitgo.coin('teth');
      await basecoin.recover({
        ...recoveryParams,
        gasLimit: 400000,
        gasPrice: 2500000,
      }).should.be.rejectedWith('Gas price must be between 1000000000 and 2500000000000');
    });

    it('should successfully construct a tx with custom gas price and limit', async function () {
      recoveryNocks.nockEthRecovery(bitgo);

      const basecoin = bitgo.coin('teth');
      const recovery = await basecoin.recover({
        ...recoveryParams,
        gasLimit: 400000,
        gasPrice: 1000000000,
      });
      // id and tx will always be different because of expireTime
      should.exist(recovery);
      recovery.should.have.property('id');
      recovery.should.have.property('tx');
    });


    it('should construct a recovery transaction without BitGo', async function () {
      recoveryNocks.nockEthRecovery(bitgo);

      const basecoin = bitgo.coin('teth');
      const recovery = await basecoin.recover(recoveryParams);
      // id and tx will always be different because of expireTime
      should.exist(recovery);
      recovery.should.have.property('id');
      recovery.should.have.property('tx');
    });

    it('should construct a recovery transaction without BitGo and with KRS', async function () {
      recoveryNocks.nockEthRecovery(bitgo);

      const basecoin = bitgo.coin('teth');
      const recovery = await basecoin.recover({
        ...recoveryParams,
        backupKey: 'xpub661MyMwAqRbcGsCNiG4BzbxLmXnJFo4K5gVSE2b9AxufAtpuTun1SYwg9Uykqqf4DrKrDZ6KqPm9ehthWbCma7pnaMrtXY11nY7MeFbEDPm',
        krsProvider: 'keyternal',
      });

      // id and tx will always be different because of expireTime
      should.exist(recovery);
      recovery.should.have.property('id');
      recovery.should.have.property('tx');
    });

    it('should error when the backup key is unfunded (cannot pay gas)', async function () {
      recoveryNocks.nockEthRecovery(bitgo);

      const basecoin = bitgo.coin('teth');
      await basecoin.recover({
        userKey: '{"iv":"VNvG6t3fHfxMcfvNuafYYA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"mc9pCk3H43w=","ct":"Qe4Z1evaXcrOMC\n' +
        'cQ/XMVVBO9M/99D1QQ6LxkG8z3fQtwwOVXM3/6doNrriprUqs+adpFC93KRcAaDroL1E6o17J2k\n' +
        'mcpXRd2CuXRFORZmZ/6QBfjKfCJ3aq0kEkDVv37gZNVT3aNtGkNSQdCEWKQLwd1++r5AkA="}\n',
        backupKey: '{"iv":"EjD7x0OJX9kNM/C3yEDvyQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"Na9NvRRe3n8=","ct":"B/AtSLHolsdNLr\n' +
        '4Dlij4kQ0E6NyUUs6wo6T2HtPDAPO0hyhPPbh1OAYqIS7VlL9xmJRFC2zPxwRJvzf6OWC/m48HX\n' +
        'vgLoXYgahArhalzJVlRxcXUz4HOhozRWfv/eK3t5HJfm+25+WBOiW8YgSE7hVEYTbeBRD4="}',
        walletContractAddress: '0x22ff743216b58aeb3efc46985406b50112e9e176',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054',
      }).should.be.rejectedWith('Backup key address 0xba6d9d82cf2920c544b834b72f4c6d11a3ef3de6 has balance 0 Gwei.This address must have a balance of at least 10000000 Gwei to perform recoveries. Try sending some ETH to this address then retry.');
    });

    it('should throw error when the etherscan rate limit is reached', async function () {
      const basecoin = bitgo.coin('teth');
      recoveryNocks.nockEtherscanRateLimitError();
      await basecoin.recover(recoveryParams).should.be.rejectedWith('Etherscan rate limit reached');
    });

    it('should generate an ETH unsigned sweep', async function () {
      recoveryNocks.nockEthRecovery(bitgo);

      const basecoin = bitgo.coin('teth');

      const transaction = await basecoin.recover({
        userKey: 'xpub661MyMwAqRbcFXDcWD2vxuebcT1ZpTF4Vke6qmMW8yzddwNYpAPjvYEEL5jLfyYXW2fuxtAxY8TgjPUJLcf1C8qz9N6VgZxArKX4EwB8rH5',
        backupKey: 'xpub661MyMwAqRbcGhSaXikpuTC9KU88Xx9LrjKSw1JKsvXNgabpTdgjy7LSovh9ZHhcqhAHQu7uthu7FguNGdcC4aXTKK5gqTcPe4WvLYRbCSG',
        walletContractAddress: TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS,
        recoveryDestination: TestBitGo.V2.TEST_ERC20_TOKEN_RECIPIENT,
        gasPrice: '20000000000',
        gasLimit: '500000',
      });
      should.exist(transaction);
      transaction.should.have.property('tx');
      transaction.should.have.property('contractSequenceId');
      transaction.should.have.property('expireTime');
      transaction.should.have.property('gasLimit');
      transaction.gasLimit.should.equal('500000');
      transaction.should.have.property('gasPrice');
      transaction.gasPrice.should.equal('20000000000');
      transaction.should.have.property('walletContractAddress');
      transaction.walletContractAddress.should.equal(TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS);
      transaction.should.have.property('recipient');
      transaction.recipient.should.have.property('address');
      transaction.recipient.address.should.equal(TestBitGo.V2.TEST_ERC20_TOKEN_RECIPIENT);
      transaction.recipient.should.have.property('amount');
      transaction.recipient.amount.should.equal('9999999999999999928');
    });
  });
});
