import * as should from 'should';
import * as nock from 'nock';

import { mockSerializedChallengeWithProofs, TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../src';
import { krsProviders } from '@bitgo/sdk-core';
import { EcdsaRangeProof, EcdsaTypes } from '@bitgo/sdk-lib-mpc';
import { TransactionFactory } from '@ethereumjs/tx';
import * as sinon from 'sinon';
import { ethLikeDKLSKeycard, ethLikeGG18Keycard } from '../fixtures/tss/recoveryFixtures';

const recoveryNocks = require('../lib/recovery-nocks');

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
      return basecoin
        .recover({
          userKey:
            '{"iv":"rU++mEtIHtbp3d4jg5EulA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"ip1rb59uYnM=","ct":"ssmP9abPoVyXkW4Io0SUy+AAS8lr+wgIerTMw+lDYnkUh0sjlI4A6Fpve0q1riQ3Dy/J0bNu7dgoZkO4xs/X6dzwEwlmPhk3pEQ7Yd4CXa1zA01y0Geu900FLe4LdaS8jt6fixui2tTd4Vi3JYglF1/HmCjG1Ug="}',
          backupKey:
            '{"iv":"uB/BTcn1rXmgYGfncXOowg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"I3WrumxkuMQ=","ct":"sgyDNAzNsBruTRm0d04oBTBf8lheHNKS+dRgl8FeMEhodKsiyjtRVHG0CHPf5rV3g5ixVnZ+iwsSCv3PKyyeoy7RGnT0AG9YYpi0me+OvP8331iO+n5quzstrGbV1j8uEh5IMW78S+YUZKSx6zbbdZ0xNu8D5WM="}',
          rootAddress: 'raGZWRkRBUWdQJsKYEzwXJNbCZMTqX56aA',
          walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
          recoveryDestination: 'rsv2kremJSSFbbaLqrf8fWxxN5QnsynNm2?dt=12345',
        })
        .then(function (recovery) {
          recovery.txHex.should.equal(
            '120000228000000024000000042E00003039201B0015519161400000024F37EDC068400000000000001E7300811439CA010E0E0198150F8DDD5768CCD2B095701D8C8314201276ADC469C4F10D1369E0F5C5A7DEF37B2267F3E0107321026C91974146427889C801BD26CE31CE0E10307A69DFE4139DE45E5E35933A6B03744630440220692763F79B6C61D50BE57C613C589EF33FC7A5063169F7E21ABDBF9BFB84A26C022062DC329F27F678AAE51C85896298C54D9D1174E891D52199DED13898F94ECA1A8114ABB5B7C843F3AA8D8EFACC3C5A7D9B0484C17442E1E010732102F4E376133012F5404990C7E1DF83A9F943B30D55F0D856632C8E8378FCEB70D27446304402203F8DAA9F0B26D902A20BBDE426B80941E2E75784EE40290203607BAEEFF080E802207C651C9DE5DB949A3231A70F199939624FB92B36BDA23D2A5858643CA0C288EC8114ACEF9F0A2FCEC44A9A213444A9E6C57E2D02856AE1F1'
          );
          recovery.id.should.equal('0123383D6E12E9F7B3A13727CCE4D15895014FB3957D29610D308E300EA742C1');
          recovery.outputAmount.should.equal('9919000000');
          recovery.outputs.length.should.equal(1);
          recovery.outputs[0].address.should.equal('rsv2kremJSSFbbaLqrf8fWxxN5QnsynNm2?dt=12345');
          recovery.outputs[0].amount.should.equal('9919000000');
          recovery.fee.fee.should.equal('30');
        });
    });

    it('should generate XRP recovery tx with KRS', function () {
      recoveryNocks.nockXrpRecovery();

      const basecoin = bitgo.coin('txrp');
      return basecoin
        .recover({
          userKey:
            '{"iv":"rU++mEtIHtbp3d4jg5EulA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"ip1rb59uYnM=","ct":"ssmP9abPoVyXkW4Io0SUy+AAS8lr+wgIerTMw+lDYnkUh0sjlI4A6Fpve0q1riQ3Dy/J0bNu7dgoZkO4xs/X6dzwEwlmPhk3pEQ7Yd4CXa1zA01y0Geu900FLe4LdaS8jt6fixui2tTd4Vi3JYglF1/HmCjG1Ug="}',
          backupKey:
            'xpub661MyMwAqRbcFtWdmWHKZEh9pYiJrAGTu1NNSwxY2S63tU9nGcfCAbNUKQuFqXRTRk8KkuBabxo6YjeBri8Q7dkMsmths6MVxSd6MTaeCmd',
          rootAddress: 'raGZWRkRBUWdQJsKYEzwXJNbCZMTqX56aA',
          walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
          krsProvider: 'keyternal',
          recoveryDestination: 'rsv2kremJSSFbbaLqrf8fWxxN5QnsynNm2?dt=12345',
        })
        .then(function (recovery) {
          recovery.txHex.should.equal(
            '120000228000000024000000042E00003039201B0015519161400000024F37EDC068400000000000001E7300811439CA010E0E0198150F8DDD5768CCD2B095701D8C8314201276ADC469C4F10D1369E0F5C5A7DEF37B2267F3E010732102F4E376133012F5404990C7E1DF83A9F943B30D55F0D856632C8E8378FCEB70D27446304402203F8DAA9F0B26D902A20BBDE426B80941E2E75784EE40290203607BAEEFF080E802207C651C9DE5DB949A3231A70F199939624FB92B36BDA23D2A5858643CA0C288EC8114ACEF9F0A2FCEC44A9A213444A9E6C57E2D02856AE1F1'
          );
          recovery.id.should.equal('397C13D060B4BE43E7F2EEAE5B35E27DA306A7F6766A38C4F0570E359E71D090');
          recovery.outputAmount.should.equal('9919000000');
          recovery.outputs.length.should.equal(1);
          recovery.outputs[0].address.should.equal('rsv2kremJSSFbbaLqrf8fWxxN5QnsynNm2?dt=12345');
          recovery.outputs[0].amount.should.equal('9919000000');
          recovery.fee.fee.should.equal('30');
        });
    });

    it('should generate an XRP unsigned sweep', function () {
      recoveryNocks.nockXrpRecovery();

      const basecoin = bitgo.coin('txrp');
      return basecoin
        .recover({
          userKey:
            'xpub661MyMwAqRbcF9Ya4zDHGzDtJz3NaaeEGbQ6rnqnNxL9RXDJNHcfzAyPUBXuKXjytvJNzQxqbjBwmPveiYX323Zp8Zx2RYQN9gGM7ntiXxr',
          backupKey:
            'xpub661MyMwAqRbcFtWdmWHKZEh9pYiJrAGTu1NNSwxY2S63tU9nGcfCAbNUKQuFqXRTRk8KkuBabxo6YjeBri8Q7dkMsmths6MVxSd6MTaeCmd',
          rootAddress: 'raGZWRkRBUWdQJsKYEzwXJNbCZMTqX56aA',
          walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
          krsProvider: 'keyternal',
          recoveryDestination: 'rsv2kremJSSFbbaLqrf8fWxxN5QnsynNm2?dt=12345',
        })
        .then(function (recovery) {
          const json = JSON.parse(recovery.txHex);
          json.TransactionType.should.equal('Payment');
          json.Account.should.equal('raGZWRkRBUWdQJsKYEzwXJNbCZMTqX56aA');
          json.Destination.should.equal('rsv2kremJSSFbbaLqrf8fWxxN5QnsynNm2');
          json.DestinationTag.should.equal(12345);
          json.Amount.should.equal('9919000000');
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

      recovery.should.have.property('txBase64');
      recovery.should.have.property('recoveryAmount', recoveryAmount);

      await checkRecoveryTxExplanation(basecoin, recovery.txBase64, recoveryAmount, recoveryParams.recoveryDestination);
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

      recovery.should.have.property('txBase64');
      recovery.should.have.property('recoveryAmount', recoveryAmount);

      await checkRecoveryTxExplanation(basecoin, recovery.txBase64, recoveryAmount, recoveryParams.recoveryDestination);
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

      recovery.should.have.property('txBase64');
      recovery.should.have.property('recoveryAmount', recoveryAmount);

      await checkRecoveryTxExplanation(basecoin, recovery.txBase64, recoveryAmount, recoveryParams.recoveryDestination);
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

      recovery.should.have.property('txBase64');
      recovery.should.have.property('recoveryAmount', 74999500);

      await checkRecoveryTxExplanation(basecoin, recovery.txBase64, recoveryAmount, recoveryParams.recoveryDestination);
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

      recovery.should.have.property('txBase64');
      recovery.should.have.property('recoveryAmount', 74999500);

      await checkRecoveryTxExplanation(basecoin, recovery.txBase64, recoveryAmount, recoveryParams.recoveryDestination);
    });
  });

  describe('Recover TRON', function () {
    let baseCoin;

    before(function () {
      baseCoin = bitgo.coin('ttrx');
    });

    afterEach(function () {
      nock.cleanAll();
    });

    it('should generate recovery tx from encrypted user and backup keys', async function () {
      recoveryNocks.nockTronRecovery();
      const recoveryTx = await baseCoin.recover({
        userKey:
          '{"iv":"eXwYIygDyRy1R1lw9EwEgQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"NNOxF+LR7aU=","ct":"qX/G+AiZJ35XwUmL9alYitRwvYgE/bS24DSAVV7tBaoTs40tsVB/kWx+hV/J5acKIA6Z/wSucxbKrQlJB69xJJl/OirYqmXRBirH+rag1aC1zj7ZVnbO+h+P5GHqHJltLc4UyDf+p22+NjoDLfR+fEPtG8c4v5o="}',
        backupKey:
          '{"iv":"QaoXCEkibo4VMEyo3fSUUQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"iqqtrBtC5vY=","ct":"JHbHJ8U2Ala2cRFcoqTAftLYmDDSOTfhdVmZkmW/ORJeP60Vf5T1m661yWQT3ADKSsq2CSRV49OqSfH2lIOBU3EfXdFXkWQeTNX+bhzC6E2o/us3SnwlXhO659DQMPmLthvgCTX8xM+5UzgV/PYnqFpSuxl379s="}',
        bitgoKey:
          'xpub661MyMwAqRbcEx6zKTBrgZkWPBGvx8qguEd1NqEDp6yW3srBGhTUdFkcdcBjp5FQgXkDNiQBdj6Fsgka8D9VFYt32M2GsCTRuffnXMhq1ho',
        walletPassphrase: 'test_wallet_passphrase',
        recoveryDestination: 'TYPgx8NfDxB8pyiyTeiMkYzem1dNA6G12i',
      });

      should.exist(recoveryTx);

      recoveryTx.coin.should.equal('ttrx');
      recoveryTx.feeInfo.fee.should.equal('2100000');
      recoveryTx.recoveryAmount.should.equal(899047400);
      recoveryTx.txHex.should.equal(
        '{"visible":false,"txID":"98b398e3027e601870a86b0785f1f1d301f087dbaafe44337507b5001bae0d49","raw_data":{"contract":[{"parameter":{"value":{"amount":10000000,"owner_address":"41e7e11df2c5704888c3cb63fb43a9498bd1812cb2","to_address":"41f5f414d447aafe70bb9b9d93912cbc4c54f0c014"},"type_url":"type.googleapis.com/protocol.TransferContract"},"type":"TransferContract"}],"ref_block_bytes":"a762","ref_block_hash":"18dfe946fbf7a0ac","expiration":1676746443000,"timestamp":1676659983799},"raw_data_hex":"0a02a762220818dfe946fbf7a0ac40f89181afe6305a69080112650a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412340a1541e7e11df2c5704888c3cb63fb43a9498bd1812cb2121541f5f414d447aafe70bb9b9d93912cbc4c54f0c01418c8d19cad0370b78be485e630","signature":["79a110116657e75be81400ad4a9f738fd098695fc5fc6009176aa1c27924c4cdb2989fe2052b70c739b10cd3881c9872660b83998dc9316e6c8d11fb588d731d00","250d0bae2491596bd800d830aa9d4c6d25e1d01a4c860b856d6000a8ab8fa2082a1ae20168e0ab97c9ffd64824b483b9843db74e9553d5d9e68a3a64d414dd1201"]}'
      );
      recoveryTx.tx.signature[0].should.equal(
        '79a110116657e75be81400ad4a9f738fd098695fc5fc6009176aa1c27924c4cdb2989fe2052b70c739b10cd3881c9872660b83998dc9316e6c8d11fb588d731d00'
      );
      recoveryTx.tx.signature[1].should.equal(
        '250d0bae2491596bd800d830aa9d4c6d25e1d01a4c860b856d6000a8ab8fa2082a1ae20168e0ab97c9ffd64824b483b9843db74e9553d5d9e68a3a64d414dd1201'
      );
      recoveryTx.tx.txID.should.equal('98b398e3027e601870a86b0785f1f1d301f087dbaafe44337507b5001bae0d49');
      recoveryTx.tx.raw_data_hex.should.equal(
        '0a02a762220818dfe946fbf7a0ac40f89181afe6305a69080112650a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412340a1541e7e11df2c5704888c3cb63fb43a9498bd1812cb2121541f5f414d447aafe70bb9b9d93912cbc4c54f0c01418c8d19cad0370b78be485e630'
      );
    });

    it('should generate recovery tx from encrypted user and backup keys from a receive address', async function () {
      nock.cleanAll();
      recoveryNocks.nockTronReceiveRecovery();
      const recoveryTx = await baseCoin.recover({
        userKey:
          '{"iv":"eXwYIygDyRy1R1lw9EwEgQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"NNOxF+LR7aU=","ct":"qX/G+AiZJ35XwUmL9alYitRwvYgE/bS24DSAVV7tBaoTs40tsVB/kWx+hV/J5acKIA6Z/wSucxbKrQlJB69xJJl/OirYqmXRBirH+rag1aC1zj7ZVnbO+h+P5GHqHJltLc4UyDf+p22+NjoDLfR+fEPtG8c4v5o="}',
        backupKey:
          '{"iv":"QaoXCEkibo4VMEyo3fSUUQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"iqqtrBtC5vY=","ct":"JHbHJ8U2Ala2cRFcoqTAftLYmDDSOTfhdVmZkmW/ORJeP60Vf5T1m661yWQT3ADKSsq2CSRV49OqSfH2lIOBU3EfXdFXkWQeTNX+bhzC6E2o/us3SnwlXhO659DQMPmLthvgCTX8xM+5UzgV/PYnqFpSuxl379s="}',
        bitgoKey:
          'xpub661MyMwAqRbcEx6zKTBrgZkWPBGvx8qguEd1NqEDp6yW3srBGhTUdFkcdcBjp5FQgXkDNiQBdj6Fsgka8D9VFYt32M2GsCTRuffnXMhq1ho',
        walletPassphrase: 'test_wallet_passphrase',
        recoveryDestination: 'TEbha9FhQMZ3FRtZgok8QBunPQU4pZvBxX',
      });

      should.exist(recoveryTx);

      recoveryTx.coin.should.equal('ttrx');
      recoveryTx.feeInfo.fee.should.equal('2100000');
      recoveryTx.recoveryAmount.should.equal(197900000);
      recoveryTx.addressInfo.address.should.equal('TNeGpwAurk7kjQLdcdWhFr8YP8E9Za8w1x');
      recoveryTx.addressInfo.chain.should.equal(0);
      recoveryTx.addressInfo.index.should.equal(1);
      recoveryTx.txHex.should.equal(
        '{"visible":false,"txID":"da67e32e9ea3bd022f3d93ed259771dda9b444d41d1e63e54c8254a6ebb6332f","raw_data":{"contract":[{"parameter":{"value":{"amount":199000000,"owner_address":"418b04ecdc3db7e8da7cd838492f66e424a051e2cd","to_address":"4132c753bf8d3de7358748a75fcf299f146dff6e4e"},"type_url":"type.googleapis.com/protocol.TransferContract"},"type":"TransferContract"}],"ref_block_bytes":"81e0","ref_block_hash":"5b1b20e9ebeaa4f8","expiration":1686038682000,"timestamp":1685952224483},"raw_data_hex":"0a0281e022085b1b20e9ebeaa4f84090b3f2fd88315a68080112640a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412330a15418b04ecdc3db7e8da7cd838492f66e424a051e2cd12154132c753bf8d3de7358748a75fcf299f146dff6e4e18c0fff15e70e3b9d5d48831","signature":["94a31cdd64e93e375c3eebae5db4f66761cb49550f2cee9388b618e6836bc471ecf33e14122d62244737358e33a9d14a056ce8c7dc34dcfcb8ef2db15d40d83600"]}'
      );
      recoveryTx.tx.signature[0].should.equal(
        '94a31cdd64e93e375c3eebae5db4f66761cb49550f2cee9388b618e6836bc471ecf33e14122d62244737358e33a9d14a056ce8c7dc34dcfcb8ef2db15d40d83600'
      );
      recoveryTx.tx.txID.should.equal('da67e32e9ea3bd022f3d93ed259771dda9b444d41d1e63e54c8254a6ebb6332f');
      recoveryTx.tx.raw_data_hex.should.equal(
        '0a0281e022085b1b20e9ebeaa4f84090b3f2fd88315a68080112640a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412330a15418b04ecdc3db7e8da7cd838492f66e424a051e2cd12154132c753bf8d3de7358748a75fcf299f146dff6e4e18c0fff15e70e3b9d5d48831'
      );
    });

    it('should throw an error when there is no funds to flush', async function () {
      recoveryNocks.nockTronReceiveRecoveryZeroFunds();
      await baseCoin
        .recover({
          userKey:
            '{"iv":"eXwYIygDyRy1R1lw9EwEgQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"NNOxF+LR7aU=","ct":"qX/G+AiZJ35XwUmL9alYitRwvYgE/bS24DSAVV7tBaoTs40tsVB/kWx+hV/J5acKIA6Z/wSucxbKrQlJB69xJJl/OirYqmXRBirH+rag1aC1zj7ZVnbO+h+P5GHqHJltLc4UyDf+p22+NjoDLfR+fEPtG8c4v5o="}',
          backupKey:
            '{"iv":"QaoXCEkibo4VMEyo3fSUUQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"iqqtrBtC5vY=","ct":"JHbHJ8U2Ala2cRFcoqTAftLYmDDSOTfhdVmZkmW/ORJeP60Vf5T1m661yWQT3ADKSsq2CSRV49OqSfH2lIOBU3EfXdFXkWQeTNX+bhzC6E2o/us3SnwlXhO659DQMPmLthvgCTX8xM+5UzgV/PYnqFpSuxl379s="}',
          bitgoKey:
            'xpub661MyMwAqRbcEx6zKTBrgZkWPBGvx8qguEd1NqEDp6yW3srBGhTUdFkcdcBjp5FQgXkDNiQBdj6Fsgka8D9VFYt32M2GsCTRuffnXMhq1ho',
          walletPassphrase: 'test_wallet_passphrase',
          recoveryDestination: 'TEbha9FhQMZ3FRtZgok8QBunPQU4pZvBxX',
        })
        .should.be.rejectedWith(
          "Amount of funds to recover undefined is less than 2100000 and wouldn't be able to fund a send"
        );
    });

    it('should generate recovery tx with unencrypted keys', async function () {
      recoveryNocks.nockTronRecovery();
      const recoveryTx = await baseCoin.recover({
        userKey:
          'xpub661MyMwAqRbcGKN3UxRqwKdVNRbJvqxiNaWBCfXcUJaEf56wqRsGR6R7tmWrpnjbdQLryb6hzx8RfXXsvRqBuB2idGg1NeD1yueWcsBoq7A',
        backupKey:
          'xpub661MyMwAqRbcF5b9fJAfJp6P9p2LmeZV7YbfgDkttGJrGdmLtsLxyHTQaoPE1pJr5EA7SBwMSzFmv2TvsDLtG42FeesyaVQazBX4YmD28bh',
        bitgoKey:
          'xpub661MyMwAqRbcEx6zKTBrgZkWPBGvx8qguEd1NqEDp6yW3srBGhTUdFkcdcBjp5FQgXkDNiQBdj6Fsgka8D9VFYt32M2GsCTRuffnXMhq1ho',
        recoveryDestination: 'TYPgx8NfDxB8pyiyTeiMkYzem1dNA6G12i',
      });

      should.exist(recoveryTx);

      recoveryTx.coin.should.equal('ttrx');
      recoveryTx.feeInfo.fee.should.equal('2100000');
      recoveryTx.recoveryAmount.should.equal(899047400);
      recoveryTx.tx.txID.should.equal('98b398e3027e601870a86b0785f1f1d301f087dbaafe44337507b5001bae0d49');
      recoveryTx.tx.raw_data_hex.should.equal(
        '0a02a762220818dfe946fbf7a0ac40f89181afe6305a69080112650a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412340a1541e7e11df2c5704888c3cb63fb43a9498bd1812cb2121541f5f414d447aafe70bb9b9d93912cbc4c54f0c01418c8d19cad0370b78be485e630'
      );
    });

    it('should generate an unsigned sweep', async function () {
      recoveryNocks.nockTronRecovery();
      const recoveryTx = await baseCoin.recover({
        userKey:
          '{"iv":"eXwYIygDyRy1R1lw9EwEgQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"NNOxF+LR7aU=","ct":"qX/G+AiZJ35XwUmL9alYitRwvYgE/bS24DSAVV7tBaoTs40tsVB/kWx+hV/J5acKIA6Z/wSucxbKrQlJB69xJJl/OirYqmXRBirH+rag1aC1zj7ZVnbO+h+P5GHqHJltLc4UyDf+p22+NjoDLfR+fEPtG8c4v5o="}',
        backupKey:
          'xpub661MyMwAqRbcF5b9fJAfJp6P9p2LmeZV7YbfgDkttGJrGdmLtsLxyHTQaoPE1pJr5EA7SBwMSzFmv2TvsDLtG42FeesyaVQazBX4YmD28bh',
        bitgoKey:
          'xpub661MyMwAqRbcEx6zKTBrgZkWPBGvx8qguEd1NqEDp6yW3srBGhTUdFkcdcBjp5FQgXkDNiQBdj6Fsgka8D9VFYt32M2GsCTRuffnXMhq1ho',
        walletPassphrase: 'test_wallet_passphrase',
        recoveryDestination: 'TYPgx8NfDxB8pyiyTeiMkYzem1dNA6G12i',
      });

      should.exist(recoveryTx);

      recoveryTx.coin.should.equal('ttrx');
      recoveryTx.feeInfo.fee.should.equal('2100000');
      recoveryTx.recoveryAmount.should.equal(899047400);
      recoveryTx.tx.txID.should.equal('98b398e3027e601870a86b0785f1f1d301f087dbaafe44337507b5001bae0d49');
      recoveryTx.tx.raw_data_hex.should.equal(
        '0a02a762220818dfe946fbf7a0ac40f89181afe6305a69080112650a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412340a1541e7e11df2c5704888c3cb63fb43a9498bd1812cb2121541f5f414d447aafe70bb9b9d93912cbc4c54f0c01418c8d19cad0370b78be485e630'
      );
    });

    it('should generate a token recovery tx from encrypted user and backup keys', async function () {
      recoveryNocks.nockTronTokenRecovery();
      const recoveryTx = await baseCoin.recover({
        userKey:
          '{"iv":"RyjTV4B09tQT576jAM2nLg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"nJdtmecHNME=","ct":"5rCeihO3pZmd+vMYStP0f0zLbJkHhdvax+6ZAr5R4VmvjJnQqWjKkz4iqV2F1dSZVzNTU97hHjZE5d3DpJhy7rFsFFIFVutjORSZv8Wnr0g99XOiEDbuDENE2BQyTkOzSYLLGIi71myuwgAjBuQMomk0+7gtfjY="}',
        backupKey:
          '{"iv":"vnbzx3YnSRHRMUnEOTmHLw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"2D32eMOgkZc=","ct":"yKP0jnRkv/XnMHP6mJMQGozvtkkiHJpYxD6o1n7FcN44oOJHoQAI0xrew7WyGTzOpzoA0E0BH00Abi9XINNnQ5LLgJRdIF0HbJxfkj1QvElckMH94DMxn14s9cYQgIkI676vhwFBhAAwvbN8458wqtXsl+0Lnrs="}',
        bitgoKey:
          'xpub661MyMwAqRbcGYq9RtWYzKuvqba2EHr9vAkDbPsNi1L9TmiHSRUXHqxe18P4DHXtDFtUy4Sb9bhpShHEWW9h3LwHM9bB2qoP2cwWTduV9nP',
        walletPassphrase: 'test_wallet_passphrase',
        tokenContractAddress: 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
        recoveryDestination: 'TYPgx8NfDxB8pyiyTeiMkYzem1dNA6G12i',
      });

      should.exist(recoveryTx);

      recoveryTx.tx.signature[0].should.equal(
        '3a67eee7ae067cd85cae86530be338af2cff4034a30f39656e2d8117ff7915ad256176afcfbe8177c4195ea887d79740420b12f9ea7c5698a6d2eeec260f34df01'
      );
      recoveryTx.tx.signature[1].should.equal(
        '551d41e007b8b36b2ac50297fd53678f196067848731f4340f7ee0eb6d963c24b11dde96727f3cf4d051af586869daa51394db0853e6d4c80e41fee414a9c95201'
      );
      recoveryTx.tx.txID.should.equal('28117d9f0c3ac1fe22fa2cb10412537763fea8ad6b4b8d0504d8f25c6141f43c');
      recoveryTx.tx.raw_data_hex.should.equal(
        '0a02a71c2208d0ecb53aa03882a640d89cf3aee6305aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a15416a0a05e098c628f7f3ca63dbb5756e5c0c01852112154142a1e39aefa49290f2b3f9ed688d7cecf86cd6e02244a9059cbb000000000000000000000000f5f414d447aafe70bb9b9d93912cbc4c54f0c014000000000000000000000000000000000000000000000000000000012410110070a2a9d685e630900180c2d72f'
      );
    });
  });

  describe('Recover EOS', function () {
    let baseCoin;
    const expectedPackedTrx =
      '7122315d5e91d408e1b3000000000100a6823403ea3055000000572d3ccdcd0150f3ea2e4cf4bc8300000000a8ed32322150f3ea2e4cf4bc83e0f27c27cc0adf7f40420f000000000004454f53000000000000';
    const expectedTxId = '99c6a4eedf5cff246314bdc0a053c12d75488df3aa09474bad4ceca88d8b2498';
    before(function () {
      baseCoin = bitgo.coin('teos');
    });
    beforeEach(function () {
      recoveryNocks.nockEosRecovery();
    });

    it('should generate EOS recovery tx with correct expiration date', async function () {
      const recoveryTx = await baseCoin.recover({
        userKey:
          '{"iv":"jRBZi43c7t4tvx7SgP8h0g==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"TgZqHtZrmLU=","ct":"hRntzrbcH81dOzlyr49nbAIJdHWqEKKVJx0s55kNV+fqUjKKoEuWqVGF1dPfQkkTkcIjFTNvuHsiGicVGSRf5RI3Q0ZD6YtCqO2bWX6t7HgBio5yYMaPy+cNJHmp6jHBQFZ9cCjqwAam/V+1mRvpJpn2dSWPotw="}',
        backupKey:
          '{"iv":"qE+D+C6KXaZKFXXTM/AF5w==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"a/YD7/8gJFw=","ct":"tc2c1PfSjDS9TshXEIKKlToDcdCeL45fpGUWEPIM2+6CrvIuaXZC6/Hx9bza7VIoEPhJWHmgvoeAouto4PUpnyKJUuz+T46RY09XJs2rcDvbfMKblRsh6lzUc8O7ubTzJRNgFOUqkZM6qGB22A0FtL8yNlFqc3c="}',
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
        userKey:
          'xprv9s21ZrQH143K4NDgnKH8zTTLpJuCmv6dtykRJwapBH73bvcvTvCQAMmQLxRGqg5YbvXBN5VGD3y2cPGUGyrVcjWDJM573RVseHg4oL64AXx',
        backupKey:
          'xprv9s21ZrQH143K4Gh3snX8z5d24djEVwCwVwdHGEssUpKwHqKDtAz8gRPw7Fi12NC3ur94CsJ2KormunQQm3gNkXQiTy534NdfuQ4C2EpdmRp',
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
        userKey:
          'xpub661MyMwAqRbcGrJ9tLp9MbQ5NLjhBNpVGCg27KzRjce2Uix51TWeiA5tCDyBFHENmKSf6BiWg3tAjYgrhTz9bZGdXj7pfksXaEpVLQqzYEE',
        backupKey:
          'xpub661MyMwAqRbcGkmWyp49MDZkcfZiuPvnsAYt4dHV39rvAdeNRiJPEDiQxYTNrbFEHJVBJWBdxW7DgCqRUyVpYAbT3D6LGsZpynYpMFAgAZr',
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
      recoveryNocks.nockEthLikeRecovery(bitgo);

      const basecoin = bitgo.coin('tdai');

      // There should be 1 TDAI token in our test wallet (based on nock)
      const transaction = await basecoin.recover({
        userKey:
          'xpub661MyMwAqRbcFXDcWD2vxuebcT1ZpTF4Vke6qmMW8yzddwNYpAPjvYEEL5jLfyYXW2fuxtAxY8TgjPUJLcf1C8qz9N6VgZxArKX4EwB8rH5',
        backupKey:
          'xpub661MyMwAqRbcGhSaXikpuTC9KU88Xx9LrjKSw1JKsvXNgabpTdgjy7LSovh9ZHhcqhAHQu7uthu7FguNGdcC4aXTKK5gqTcPe4WvLYRbCSG',
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

    it('should use user provided gas params when building recovery transaction', async function () {
      recoveryNocks.nockEthLikeRecovery(bitgo);

      const basecoin = bitgo.coin('tdai');

      // There should be 1 TDAI token in our test wallet (based on nock)
      const transaction = await basecoin.recover({
        userKey:
          'xpub661MyMwAqRbcFXDcWD2vxuebcT1ZpTF4Vke6qmMW8yzddwNYpAPjvYEEL5jLfyYXW2fuxtAxY8TgjPUJLcf1C8qz9N6VgZxArKX4EwB8rH5',
        backupKey:
          'xpub661MyMwAqRbcGhSaXikpuTC9KU88Xx9LrjKSw1JKsvXNgabpTdgjy7LSovh9ZHhcqhAHQu7uthu7FguNGdcC4aXTKK5gqTcPe4WvLYRbCSG',
        walletContractAddress: TestBitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS,
        tokenContractAddress: TestBitGo.V2.TEST_ERC20_TOKEN_ADDRESS,
        recoveryDestination: TestBitGo.V2.TEST_ERC20_TOKEN_RECIPIENT,
        gasLimit: '400000',
        eip1559: {
          maxFeePerGas: '10000000000',
          maxPriorityFeePerGas: '5000',
        },
      });
      should.exist(transaction);
      transaction.should.have.property('tx');

      transaction.should.have.property('contractSequenceId');
      transaction.should.have.property('expireTime');
      transaction.should.have.property('gasLimit');
      transaction.should.have.property('eip1559');
      transaction.gasLimit.should.equal('400000');
      transaction.should.have.property('gasPrice');
      transaction.gasPrice.should.equal('10000000000');
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

    const nockTSSData: any[] = [
      {
        params: {
          module: 'account',
          action: 'txlist',
          address: '0xe7406dc43d13f698fb41a345c7783d39a4c2d191',
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
          address: '0xe7406dc43d13f698fb41a345c7783d39a4c2d191',
        },
        response: {
          status: '1',
          message: 'OK',
          result: '1000000000000000000',
        },
      },
    ];

    let recoverEthSandbox: sinon.SinonSandbox;

    before(() => {
      recoveryParams = {
        userKey:
          '{"iv":"+TkmT3GJ5msVWQjBrt3lsw==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
          ':"ccm","adata":"","cipher":"aes","salt":"cCE20fGIobs=","ct":"NVIdYIh91J3aRI\n' +
          '8GG0JE3DhXW3AUmz2G5RqMejdz1+t4/vovIP7lleegI7VYyWiiLvlM0OCFf3EVvV/RyXr8+2vsn\n' +
          'Q0Vn8c2CV5FRZ80OjGYrW3A/6T/zpOz6E8CMvnD++iIpeO4r2eZJavejZxdzlxF0BRz7VI="}',
        backupKey:
          '{"iv":"asB356ofC7nZtg4NBvQkiQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
          ':"ccm","adata":"","cipher":"aes","salt":"1hr2HhBbBIk=","ct":"8CZc6upt+XNOto\n' +
          'KDD38TUg3ZUjzW+DraZlkcku2bNp0JS2s1g/iC6YTGUGtPoxDxumDlXwlWQx+5WPjZu79M8DCrI\n' +
          't9aZaOvHkGH9aFtMbavFX419TcrwDmpUeQFN0hRkfrIHXyHNbTpGSVAjHvHMtzDMaw+ACg="}',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        walletContractAddress: '0x5df5a96b478bb1808140d87072143e60262e8670',
        recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054',
        replayProtectionOptions: {
          chain: 42,
          hardfork: 'london',
        },
      };
      recoverEthSandbox = sinon.createSandbox();
      recoverEthSandbox
        .stub(EcdsaRangeProof, 'generateNtilde')
        .resolves(EcdsaTypes.deserializeNtildeWithProofs(mockSerializedChallengeWithProofs));
    });

    after(() => {
      recoverEthSandbox.restore();
    });

    it('should throw on invalid gasLimit', async function () {
      recoveryNocks.nockEthLikeRecovery(bitgo);

      const basecoin = bitgo.coin('hteth');
      await basecoin
        .recover({
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
      recoveryNocks.nockEthLikeRecovery(bitgo, nockUnsuccessfulEtherscanData);

      const basecoin = bitgo.coin('hteth');
      await basecoin
        .recover(recoveryParams)
        .should.be.rejectedWith(
          'Could not obtain address balance for 0x74c2137d54b0fc9f907e13f14e0dd18485fee924 from the explorer, got: Rate limit exceeded'
        );
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
      recoveryNocks.nockEthLikeRecovery(bitgo, insufficientFeeData);

      const basecoin = bitgo.coin('hteth');
      await basecoin
        .recover({
          ...recoveryParams,
          gasLimit: 300000,
          gasPrice: 1000000000,
        })
        .should.be.rejectedWith(
          'Backup key address 0x74c2137d54b0fc9f907e13f14e0dd18485fee924 has balance 0.000001234 Gwei.' +
            'This address must have a balance of at least 300000 Gwei to perform recoveries. Try sending some ETH to this address then retry.'
        );
    });

    it('should throw on invalid gasPrice', async function () {
      recoveryNocks.nockEthLikeRecovery(bitgo);

      const basecoin = bitgo.coin('hteth');
      await basecoin
        .recover({
          ...recoveryParams,
          gasLimit: 400000,
          gasPrice: 2500000,
        })
        .should.be.rejectedWith('Gas price must be between 1000000000 and 2500000000000');
    });

    it('should successfully construct a tx with custom gas price and limit', async function () {
      recoveryNocks.nockEthLikeRecovery(bitgo);

      const basecoin = bitgo.coin('hteth');
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
      recoveryNocks.nockEthLikeRecovery(bitgo);

      const basecoin = bitgo.coin('hteth');
      const recovery = await basecoin.recover(recoveryParams);
      // id and tx will always be different because of expireTime
      should.exist(recovery);
      recovery.should.have.property('id');
      recovery.should.have.property('tx');
    });

    it('should construct an eip1559 recovery transaction without BitGo', async function () {
      const eip1559RecoveryParams = {
        ...recoveryParams,
        eip1559: {
          maxPriorityFeePerGas: 3,
          maxFeePerGas: 20,
        },
      };
      recoveryNocks.nockEthLikeRecovery(bitgo);

      const basecoin = bitgo.coin('hteth');
      const recovery = await basecoin.recover(eip1559RecoveryParams);
      // id and tx will always be different because of expireTime
      should.exist(recovery);
      recovery.should.have.property('id');
      recovery.should.have.property('tx');
    });

    it('should construct a recovery transaction without BitGo and with KRS', async function () {
      recoveryNocks.nockEthLikeRecovery(bitgo);

      const basecoin = bitgo.coin('hteth');
      const recovery = await basecoin.recover({
        ...recoveryParams,
        backupKey:
          'xpub661MyMwAqRbcGsCNiG4BzbxLmXnJFo4K5gVSE2b9AxufAtpuTun1SYwg9Uykqqf4DrKrDZ6KqPm9ehthWbCma7pnaMrtXY11nY7MeFbEDPm',
        krsProvider: 'keyternal',
      });

      // id and tx will always be different because of expireTime
      should.exist(recovery);
      recovery.should.have.property('id');
      recovery.should.have.property('tx');
    });

    it('should error when the backup key is unfunded (cannot pay gas)', async function () {
      recoveryNocks.nockEthLikeRecovery(bitgo);

      const basecoin = bitgo.coin('hteth');
      await basecoin
        .recover({
          userKey:
            '{"iv":"VNvG6t3fHfxMcfvNuafYYA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
            ':"ccm","adata":"","cipher":"aes","salt":"mc9pCk3H43w=","ct":"Qe4Z1evaXcrOMC\n' +
            'cQ/XMVVBO9M/99D1QQ6LxkG8z3fQtwwOVXM3/6doNrriprUqs+adpFC93KRcAaDroL1E6o17J2k\n' +
            'mcpXRd2CuXRFORZmZ/6QBfjKfCJ3aq0kEkDVv37gZNVT3aNtGkNSQdCEWKQLwd1++r5AkA="}\n',
          backupKey:
            '{"iv":"EjD7x0OJX9kNM/C3yEDvyQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
            ':"ccm","adata":"","cipher":"aes","salt":"Na9NvRRe3n8=","ct":"B/AtSLHolsdNLr\n' +
            '4Dlij4kQ0E6NyUUs6wo6T2HtPDAPO0hyhPPbh1OAYqIS7VlL9xmJRFC2zPxwRJvzf6OWC/m48HX\n' +
            'vgLoXYgahArhalzJVlRxcXUz4HOhozRWfv/eK3t5HJfm+25+WBOiW8YgSE7hVEYTbeBRD4="}',
          walletContractAddress: '0x22ff743216b58aeb3efc46985406b50112e9e176',
          walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
          recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054',
        })
        .should.be.rejectedWith(
          'Backup key address 0xba6d9d82cf2920c544b834b72f4c6d11a3ef3de6 has balance 0 Gwei.This address must have a balance of at least 10000000 Gwei to perform recoveries. Try sending some ETH to this address then retry.'
        );
    });

    it('should throw error when the etherscan rate limit is reached', async function () {
      const basecoin = bitgo.coin('hteth');
      recoveryNocks.nockEtherscanRateLimitError();
      await basecoin.recover(recoveryParams).should.be.rejectedWith('Etherscan rate limit reached');
    });

    it('should generate an ETH unsigned sweep', async function () {
      recoveryNocks.nockEthLikeRecovery(bitgo);

      const basecoin = bitgo.coin('hteth');

      const transaction = await basecoin.recover({
        userKey:
          'xpub661MyMwAqRbcFXDcWD2vxuebcT1ZpTF4Vke6qmMW8yzddwNYpAPjvYEEL5jLfyYXW2fuxtAxY8TgjPUJLcf1C8qz9N6VgZxArKX4EwB8rH5',
        backupKey:
          'xpub661MyMwAqRbcGhSaXikpuTC9KU88Xx9LrjKSw1JKsvXNgabpTdgjy7LSovh9ZHhcqhAHQu7uthu7FguNGdcC4aXTKK5gqTcPe4WvLYRbCSG',
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

    it('should construct a recovery tx with TSS', async function () {
      recoveryNocks.nockEthLikeRecovery(bitgo, nockTSSData);
      const basecoin = bitgo.coin('hteth');
      const baseAddress = ethLikeGG18Keycard.senderAddress;

      const nockTSSDataWithBaseAddress = nockTSSData.map((data) => {
        return {
          ...data,
          params: {
            ...data.params,
            address: baseAddress,
          },
        };
      });

      recoveryNocks.nockEthLikeRecovery(bitgo, nockTSSDataWithBaseAddress);
      recoveryParams = {
        userKey: ethLikeGG18Keycard.userKey,
        backupKey: ethLikeGG18Keycard.backupKey,
        walletContractAddress: ethLikeGG18Keycard.senderAddress,
        recoveryDestination: ethLikeGG18Keycard.destinationAddress,
        walletPassphrase: ethLikeGG18Keycard.walletPassphrase,
        eip1559: {
          maxPriorityFeePerGas: 3,
          maxFeePerGas: 20,
        },
        isTss: true,
        replayProtectionOptions: {
          chain: 5,
          hardfork: 'london',
        },
      };

      const recovery = await basecoin.recover(recoveryParams);

      should.exist(recovery);
      recovery.should.have.property('id');
      recovery.should.have.property('tx');

      // verify data after signing is correct
      const finalTx = TransactionFactory.fromSerializedData(Buffer.from(recovery.tx.substr(2), 'hex'));

      const senderAddress = finalTx.getSenderAddress().toString();

      baseAddress.should.equal(senderAddress);
      recoveryParams.recoveryDestination.should.equal(finalTx.to?.toString());
      Number(finalTx.value).should.equal(999999999990000000);
    });

    it('should construct a recovery tx with MPCv2 TSS', async function () {
      for (const { coin, chain } of [
        { coin: 'hteth', chain: 17000 },
        { coin: 'tpolygon', chain: 80002 },
        { coin: 'tbsc', chain: 97 },
      ]) {
        recoveryNocks.nockEthLikeRecovery(bitgo, nockTSSData);
        const basecoin = bitgo.coin(coin);
        const baseAddress = ethLikeDKLSKeycard.senderAddress;
        const nockTSSDataWithBaseAddress = nockTSSData.map((data) => {
          return {
            ...data,
            params: {
              ...data.params,
              address: baseAddress,
            },
          };
        });

        recoveryNocks.nockEthLikeRecovery(bitgo, nockTSSDataWithBaseAddress);
        recoveryParams = {
          userKey: ethLikeDKLSKeycard.userKey,
          backupKey: ethLikeDKLSKeycard.backupKey,
          walletContractAddress: baseAddress,
          recoveryDestination: ethLikeDKLSKeycard.destinationAddress,
          walletPassphrase: ethLikeDKLSKeycard.walletPassphrase,
          eip1559: {
            maxPriorityFeePerGas: 3,
            maxFeePerGas: 20,
          },
          isTss: true,
          replayProtectionOptions: {
            chain: chain,
          },
        };

        const recovery = await basecoin.recover(recoveryParams);

        should.exist(recovery);
        recovery.should.have.property('id');
        recovery.should.have.property('tx');

        // verify data after signing is correct
        const finalTx = TransactionFactory.fromSerializedData(Buffer.from(recovery.tx.substr(2), 'hex'));

        const senderAddress = finalTx.getSenderAddress().toString();
        finalTx.common.chainIdBN().toNumber().should.equal(chain);
        baseAddress.should.equal(senderAddress);
        recoveryParams.recoveryDestination.should.equal(finalTx.to?.toString());
        Number(finalTx.value).should.equal(999999999990000000);
      }
    });

    it('should construct an unsigned sweep tx with TSS', async function () {
      recoveryNocks.nockEthLikeRecovery(bitgo, nockTSSData);

      const basecoin = bitgo.coin('hteth');

      const userKey = '03f8606a595917de4cf2244e27b7fba172505469392ad385d2dd2b3588a6bb878c';
      const backupKey = '03f8606a595917de4cf2244e27b7fba172505469392ad385d2dd2b3588a6bb878c';

      recoveryParams = {
        userKey: userKey,
        backupKey: backupKey,
        walletContractAddress: '0xe7406dc43d13f698fb41a345c7783d39a4c2d191',
        recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054',
        walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
        isTss: true,
        gasPrice: '20000000000',
        gasLimit: '500000',
        replayProtectionOptions: {
          chain: 42,
          hardfork: 'london',
        },
      };

      const transaction = await basecoin.recover(recoveryParams);
      should.exist(transaction);
      transaction.should.have.property('tx');
      transaction.should.have.property('expireTime');
      transaction.should.have.property('gasLimit');
      transaction.gasLimit.should.equal('500000');
      transaction.should.have.property('gasPrice');
      transaction.gasPrice.should.equal('20000000000');
      transaction.should.have.property('recipient');
      transaction.recipient.should.have.property('address');
      transaction.recipient.address.should.equal('0xac05da78464520aa7c9d4c19bd7a440b111b3054');
      transaction.recipient.should.have.property('amount');
      transaction.recipient.amount.should.equal('990000000000000000');
    });
  });
});
