import { BitGoAPI } from '@bitgo/sdk-api';
import { BaseTransaction, HalfSignedAccountTransaction, TransactionType } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { coins } from '@bitgo/statics';
import assert from 'assert';
import { AvaxP, TavaxP } from '../../../src';
import * as AvaxpLib from '../../../src/lib';
import { TransactionBuilderFactory } from '../../../src/lib';
import { PermissionlessValidatorTxBuilder } from '../../../src/lib/permissionlessValidatorTxBuilder';
import * as testData from '../../resources/avaxp';
// import { pvm } from '@bitgo-forks/avalanchejs';

describe('AvaxP permissionlessValidatorTxBuilder', () => {
  let basecoin;
  let bitgo: TestBitGoAPI;
  const factory = new TransactionBuilderFactory(coins.get('tavaxp'));

  before(() => {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('avaxp', AvaxP.createInstance);
    bitgo.safeRegister('tavaxp', TavaxP.createInstance);
    basecoin = bitgo.coin('tavaxp');
  });

  it('should create transaction builder from hex', () => {
    const txBuilder = factory.from(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.halfSignedTx);
    txBuilder.should.be.an.instanceOf(PermissionlessValidatorTxBuilder);
  });

  describe('Transaction readable', () => {
    let tx: BaseTransaction;
    before(async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADD_VALIDATOR_ID_SAMPLE.fullsigntxHex
      );
      tx = await txBuilder.build();
    });

    it('Should json stringifiy addPermissionlessValidator transaction', async () => {
      const txJson = tx.toJson();
      assert(typeof JSON.stringify(tx.toJson()), 'string');
      txJson.id.should.equal(testData.ADD_VALIDATOR_ID_SAMPLE.txid);
    });

    it('Should get a txid', async () => {
      tx.id.should.equal(testData.ADD_VALIDATOR_ID_SAMPLE.txid);
    });
  });

  describe('should explains transaction', () => {
    it('should explains a Signed AddPermissionlessValidatorTx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        // https://testnet.snowtrace.io/pvm/tx/2tt3KE6gAG7qpMLL6xoynSyk7ht4egQ74wcF7AuGm25vQ3QNWB?chainId=43113
        '0x000000000019000000050000000000000000000000000000000000000000000000000000000000000000000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000007000000000baeb90000000000000000000000000200000003ac03c0ca71a1dde84702d272fbdd08600186701242e19ad9a617fb95dcf8843ade66e06e578f549a8be54f016ab748127ab1a184626cba44c748a1ee000000024f194d8e066b11dfe92f593cfa5c2fa1ae450927ecd5b093952e61834f4d8aa4000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000050000000023a4c180000000030000000200000000000000014f194d8e066b11dfe92f593cfa5c2fa1ae450927ecd5b093952e61834f4d8aa4000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000050000000023a4c180000000030000000200000000000000010000000094a8b8179f0b6e7e7ce55b4d6ec5ad56dae1de9f0000000062bb03e60000000062e32556000000003b9aca0000000000000000000000000000000000000000000000000000000000000000000000001c8f95423f7142d00a48e1014a3de8d28907d420dc33b3052a6dee03a3f2941a393c2351e354704ca66a3fc29870282e1586a3ab4c45cfe31cae34c1d06f212434ac71b1be6cfe046c80c162e057614a94a5bc9f1ded1a7029deb0ba4ca7c9b71411e293438691be79c2dbf19d1ca7c3eadb9c756246fc5de5b7b89511c7d7302ae051d9e03d7991138299b5ed6a570a98000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000007000000003b9aca0000000000000000000000000200000003ac03c0ca71a1dde84702d272fbdd08600186701242e19ad9a617fb95dcf8843ade66e06e578f549a8be54f016ab748127ab1a184626cba44c748a1ee0000000b00000000000000000000000200000003ac03c0ca71a1dde84702d272fbdd08600186701242e19ad9a617fb95dcf8843ade66e06e578f549a8be54f016ab748127ab1a184626cba44c748a1ee0000000b00000000000000000000000200000003ac03c0ca71a1dde84702d272fbdd08600186701242e19ad9a617fb95dcf8843ade66e06e578f549a8be54f016ab748127ab1a184626cba44c748a1ee00030d40000000020000000900000002b631e9553a8721978bffed3e778de7eb904e167599c1d26d5a8d3c46158df661164c6ca6029f24988020ccfcd673e5c19817ff74d012651f245d009a749591160170eae73d7e19b045671d41050b11791643567d1bc9cc51fa226d2be95a65689f19cda06a242a9749f6a150fcc2a5b50af12a1bc3564d1b76ac1e3826b5e21361010000000900000002b631e9553a8721978bffed3e778de7eb904e167599c1d26d5a8d3c46158df661164c6ca6029f24988020ccfcd673e5c19817ff74d012651f245d009a749591160170eae73d7e19b045671d41050b11791643567d1bc9cc51fa226d2be95a65689f19cda06a242a9749f6a150fcc2a5b50af12a1bc3564d1b76ac1e3826b5e2136101'
      );
      const tx = await txBuilder.build();
      const txExplain = tx.explainTransaction();
      txExplain.outputAmount.should.equal(testData.ADDVALIDATOR_SAMPLES.minValidatorStake);
      txExplain.type.should.equal(TransactionType.AddPermissionlessValidator);
      txExplain.outputs[0].address.should.equal(testData.ADDVALIDATOR_SAMPLES.nodeID);
    });

    it('should explains a Signed AddPermissionlessValidatorTx and order inputs', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('avaxp')).from(
        // https://testnet.snowtrace.io/pvm/tx/2tt3KE6gAG7qpMLL6xoynSyk7ht4egQ74wcF7AuGm25vQ3QNWB?chainId=43113
        '0x0000000000190000000100000000000000000000000000000000000000000000000000000000000000000000000121e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff0000000700000000773594000000000000000000000000020000000393ca93e4cb3b6c10d167d41fbabeb8e94ed2deb5dc787323d722ff40fdfe56040fb98f7aee2075eff4dd7a368ddb6ef7132bff693cbfd9ba30f17c18000000046f8bdc3c893edd2c7f24a6190d6233fda5ccf517d96dd6c08d134179abb2d14e0000000021e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff0000000500000047036aaa00000000020000000100000002865cc8568b9c4c7d36bb96e086619d8c85218d653ff56d051334f839e58977c30000000221e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff00000005000000005fb5d590000000020000000100000002865cc8568b9c4c7d36bb96e086619d8c85218d653ff56d051334f839e58977c30000000121e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff0000000500000007ae61e378000000020000000100000002865cc8568b9c4c7d36bb96e086619d8c85218d653ff56d051334f839e58977c30000000021e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff00000005000003ffb6db3f6900000002000000010000000200000000953cc95e84f29dc6ee7589ef6acb01c9d561cba3000000006616c6750000000066560e750000044e51280e7100000000000000000000000000000000000000000000000000000000000000000000001ca7a2f29ca580c4254e3beabce2047e04ea8c3c7c69a5817b5461c2239593561a3843bc7cb14576390378b145135301478ff8cb5a651e3d082fd6cd1e1777edeabd5b0924ca648f3890d82ebd6259b3cca00e30faa249482fef10293f42e28afb15f0a5dd3f37e5524cd5de3f3c2b909df49873b8196af60004d3f3a84baa46ba08df7baf8e486b0b79a9c207095e1a430000000121e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff000000070000044e51280e710000000000000000000000020000000393ca93e4cb3b6c10d167d41fbabeb8e94ed2deb5dc787323d722ff40fdfe56040fb98f7aee2075eff4dd7a368ddb6ef7132bff693cbfd9ba30f17c180000000b0000000000000000000000020000000393ca93e4cb3b6c10d167d41fbabeb8e94ed2deb5dc787323d722ff40fdfe56040fb98f7aee2075eff4dd7a368ddb6ef7132bff693cbfd9ba30f17c180000000b0000000000000000000000020000000393ca93e4cb3b6c10d167d41fbabeb8e94ed2deb5dc787323d722ff40fdfe56040fb98f7aee2075eff4dd7a368ddb6ef7132bff693cbfd9ba30f17c1800004e2000000004000000090000000208304e8841ab96169ea2b28dc358df3594523b3ce87593f1f579b51b7bfb844d49d690f71edb4e6530b8800436a4ef7357046a2155c5b52c15414ae76ca956c8007bbd8dbea9071c1bf1788f853472e08362b1afadc9d0a4412b13b0ea43b703e010df1204d88c6fe0484140b1bb91fdbf7a032d262475a419f80829411a04114001000000090000000208304e8841ab96169ea2b28dc358df3594523b3ce87593f1f579b51b7bfb844d49d690f71edb4e6530b8800436a4ef7357046a2155c5b52c15414ae76ca956c8007bbd8dbea9071c1bf1788f853472e08362b1afadc9d0a4412b13b0ea43b703e010df1204d88c6fe0484140b1bb91fdbf7a032d262475a419f80829411a04114001000000090000000208304e8841ab96169ea2b28dc358df3594523b3ce87593f1f579b51b7bfb844d49d690f71edb4e6530b8800436a4ef7357046a2155c5b52c15414ae76ca956c8007bbd8dbea9071c1bf1788f853472e08362b1afadc9d0a4412b13b0ea43b703e010df1204d88c6fe0484140b1bb91fdbf7a032d262475a419f80829411a04114001000000090000000208304e8841ab96169ea2b28dc358df3594523b3ce87593f1f579b51b7bfb844d49d690f71edb4e6530b8800436a4ef7357046a2155c5b52c15414ae76ca956c8007bbd8dbea9071c1bf1788f853472e08362b1afadc9d0a4412b13b0ea43b703e010df1204d88c6fe0484140b1bb91fdbf7a032d262475a419f80829411a0411400127efec04'
      );
      const tx = await txBuilder.build();
      const txExplain = tx.explainTransaction();
      txExplain.inputs[0].id.should.equal('r8JUUYFv9NWcNe5cxMFdBRjqkL6FZewDf2GtkttmxWCdeFFMK:0');
      txExplain.inputs[1].id.should.equal('22B7GH7fDarBqyw8W7atC8ED3euVnefTiEWBPBmaSXrAhAQ4Lk:0');
      txExplain.inputs[2].id.should.equal('22B7GH7fDarBqyw8W7atC8ED3euVnefTiEWBPBmaSXrAhAQ4Lk:1');
      txExplain.inputs[3].id.should.equal('22B7GH7fDarBqyw8W7atC8ED3euVnefTiEWBPBmaSXrAhAQ4Lk:2');
    });

    it('should explains a Signed AddPermissionlessValidatorTx from raw', async () => {
      const oldHex =
        '0x000000000019000000050000000000000000000000000000000000000000000000000000000000000000000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000007000000001cbabc80000000000000000000000002000000037086fbc36717c7a407bdb198bd7925296727d6b97565285409e200fdc67c7b63759b5ad29bf01fc2b471d54e58e4c5fadee622abd663bebad3ad63720000000264d9b5eab8c4a1a25bfa9e3e1a60d78f1ae88e7352e22ef90107648b738a30e3000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000005000000003b6d03400000000200000001000000026ccb2a4fea281a8737d33b2535ee3f70518b354c91f0adcfaa70e459c4b1881c000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000005000000001ce8834000000002000000010000000200000000129a271ff407b1101f35aec82a2f715c5239bd3900000000660f17de0000000066106bb6000000003b9aca0000000000000000000000000000000000000000000000000000000000000000000000001cad9e9476b701edec88e53b1c314456053b3cf846a1192117872e41455f440c074d6ee89530d45e88f79ac0eda06f2887a94d6182edbd953516b262f17565a65d98f5741549cd70d2423abff750bb4b8d982d482376b189142ff8aa4705615fee14be6174610860e9c003aa4aeaa613b1732abf3cd0c9c42fa5856345644068c0d1f9fa1d9af32e20b14fca02983260bc000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000007000000003b9aca00000000000000000000000002000000037086fbc36717c7a407bdb198bd7925296727d6b97565285409e200fdc67c7b63759b5ad29bf01fc2b471d54e58e4c5fadee622abd663bebad3ad63720000000b000000000000000000000002000000037086fbc36717c7a407bdb198bd7925296727d6b97565285409e200fdc67c7b63759b5ad29bf01fc2b471d54e58e4c5fadee622abd663bebad3ad63720000000b000000000000000000000002000000037086fbc36717c7a407bdb198bd7925296727d6b97565285409e200fdc67c7b63759b5ad29bf01fc2b471d54e58e4c5fadee622abd663bebad3ad637200004e200000000200000009000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007565285409e200fdc67c7b63759b5ad29bf01fc2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007565285409e200fdc67c7b63759b5ad29bf01fc2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000047becda9';
      const sortedBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(oldHex);
      const sortedTx = await sortedBuilder.build();
      const txExplain = sortedTx.explainTransaction();
      // this tx is sorted and can be broadcasted
      const newHex = sortedTx.toBroadcastFormat();
      assert(newHex === oldHex);
      txExplain.outputAmount.should.equal(testData.ADDVALIDATOR_SAMPLES.minValidatorStake);
      txExplain.type.should.equal(TransactionType.AddPermissionlessValidator);
      txExplain.outputs[0].address.should.equal('NodeID-2hMqBQdjZMWdHvYu7ZPLA2CmrAdbTvpGf');
    });

    it('should explain AddPermissionlessValidatorTx with 1 input', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        '0x000000000019000000050000000000000000000000000000000000000000000000000000000000000000000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000007000000003b9aca00000000000000000000000002000000032a00839550f75ee8879cacd97ff350a51d47ae14db94335f2f668b9707c78903c3b5ac54c6f4054783c4a6ecd5b18fa07692d35ee4c3f8b74d425721000000014f194d8e066b11dfe92f593cfa5c2fa1ae450927ecd5b093952e61834f4d8aa4000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000005000000007735940000000002000000000000000100000000e25c9a09eb9c68d4807a39f97893facd9a6a7da100000000660d750900000000660ec689000000003b9aca0000000000000000000000000000000000000000000000000000000000000000000000001c8f95423f7142d00a48e1014a3de8d28907d420dc33b3052a6dee03a3f2941a393c2351e354704ca66a3fc29870282e1586a3ab4c45cfe31cae34c1d06f212434ac71b1be6cfe046c80c162e057614a94a5bc9f1ded1a7029deb0ba4ca7c9b71411e293438691be79c2dbf19d1ca7c3eadb9c756246fc5de5b7b89511c7d7302ae051d9e03d7991138299b5ed6a570a98000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000007000000003b9aca00000000000000000000000002000000032a00839550f75ee8879cacd97ff350a51d47ae14db94335f2f668b9707c78903c3b5ac54c6f4054783c4a6ecd5b18fa07692d35ee4c3f8b74d4257210000000b000000000000000000000002000000032a00839550f75ee8879cacd97ff350a51d47ae14db94335f2f668b9707c78903c3b5ac54c6f4054783c4a6ecd5b18fa07692d35ee4c3f8b74d4257210000000b000000000000000000000002000000032a00839550f75ee8879cacd97ff350a51d47ae14db94335f2f668b9707c78903c3b5ac54c6f4054783c4a6ecd5b18fa07692d35ee4c3f8b74d42572100030d40000000010000000900000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000db94335f2f668b9707c78903c3b5ac54c6f4054700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003c5543b0'
      );
      const tx = await txBuilder.build();
      const txExplain = tx.explainTransaction();
      txExplain.outputAmount.should.equal(testData.ADDVALIDATOR_SAMPLES.minValidatorStake);
      txExplain.type.should.equal(TransactionType.AddPermissionlessValidator);
      txExplain.outputs[0].address.should.equal('NodeID-MdteS9U987PY7iwA5Pcz3sKVprJAbAvE7');
    });

    it('should explains a Half Signed AddPermissionlessValidatorTx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.halfsigntxHex
      );
      const tx = await txBuilder.build();
      const txExplain = tx.explainTransaction();
      txExplain.outputAmount.should.equal(testData.ADDVALIDATOR_SAMPLES.minValidatorStake);
      txExplain.type.should.equal(TransactionType.AddValidator);
      txExplain.outputs[0].address.should.equal(testData.ADDVALIDATOR_SAMPLES.nodeID);
    });

    it('should explains a unsigned AddPermissionlessValidatorTx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.unsignedTxHex
      );
      const tx = await txBuilder.build();
      const txExplain = tx.explainTransaction();
      txExplain.outputAmount.should.equal(testData.ADDVALIDATOR_SAMPLES.minValidatorStake);
      txExplain.type.should.equal(TransactionType.AddValidator);
      txExplain.outputs[0].address.should.equal(testData.ADDVALIDATOR_SAMPLES.nodeID);
    });
  });

  describe('Sign Transaction', () => {
    it('build and sign an AddPermissionlessValidator transaction and broadcast', async () => {
      /*

    const keyMapping: Record<string, any> = {
      f45d1c9bf57d3c02299a727d6e5d8d4e76498846b1a289b4e31a2ecccbc212fb: {
        source: 'user',
        encoded: 'BhjEzaXMSFj4aQBhw27Dsn73b8rR9gCTX',
        pub: '02abb451c0cc240e9a4fb97a130846d90a87247264e57014e41dc226ebf4965724',
        prv: 'f45d1c9bf57d3c02299a727d6e5d8d4e76498846b1a289b4e31a2ecccbc212fb',
        address: 'P-fuji1w4jjs4qfugq0m3nu0d3htx6662dlq87zq5nz33',
      },
      '2e0ffe6efbfcc27e9aaf4bce6af78d4c66e89b0955b85f02d7e15910e16ed4cd': {
        source: 'backup',
        encoded: 'BFzPJNifqdf6Z8H2P76gTEbd8RmCjMSzL',
        pub: '025523fa48a5b0c8ed4a8344aab8396061fb42cb4f168ba5d3ae19f034c4ea2d4d',
        prv: '2e0ffe6efbfcc27e9aaf4bce6af78d4c66e89b0955b85f02d7e15910e16ed4cd',
        address: 'P-fuji1wzr0hsm8zlr6gpaakxvt67f999nj044ete07uw',
      },
      '5a360c848021024528dfc02e79ba441f1727c765b4d0dcec288ffbd2772cd432': {
        source: 'bitgo',
        encoded: 'HT6zoSecYyqJX63Hqaj1usvyqJbrnc8ia',
        pub: '03d71cda3b1c32eed044866ec96c2ac54af43e7edb8f1535df51f341e49674ffaa',
        prv: '5a360c848021024528dfc02e79ba441f1727c765b4d0dcec288ffbd2772cd432',
        address: 'P-fuji1k3ca2njcunzl4hhxy24avca7htf66cmjjukl0n',
      },
    };
       */
      const unixNow = BigInt(Math.round(new Date().getTime() / 1000));
      const startTime = unixNow + BigInt(60);
      const endTime = startTime + BigInt(60 * 60 * 24 + 600); // 24 hours + 10 minutes

      // const AVAX_PUBLIC_URL = 'https://api.avax-test.network';
      // const pvmapi = new pvm.PVMApi(AVAX_PUBLIC_URL);
      // const { utxos } = await pvmapi.getUTXOs({
      //   addresses: testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.bitgoAddresses,
      // });
      // console.log(utxos);

      const recoveryMode = false;
      const txBuilder = new AvaxpLib.TransactionBuilderFactory(coins.get('tavaxp'))
        .getPermissionlessValidatorTxBuilder()
        .threshold(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.threshold)
        .locktime(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.locktime)
        .recoverMode(recoveryMode)
        .fromPubKey(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.bitgoAddresses)
        .startTime(startTime.toString())
        .endTime(endTime.toString())
        .stakeAmount(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.stakeAmount)
        .delegationFeeRate(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.delegationFeeRate)
        .nodeID(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.nodeId)
        .blsPublicKey(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.blsPublicKey)
        .blsSignature(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.blsSignature)
        .utxos(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.utxos);
      const tx = await txBuilder.build();
      const txExplain = tx.explainTransaction();
      const txJson = tx.toJson();
      assert(txExplain.outputAmount === testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.stakeAmount);
      txExplain.inputs[0].id.should.equal('WyjYJHa7Ye1KMsBZiQ8hQJzY7YYxTJTTyMkxcVrKRDiNytTY8:0');
      txExplain.inputs[1].id.should.equal('WyjYJHa7Ye1KMsBZiQ8hQJzY7YYxTJTTyMkxcVrKRDiNytTY8:1');
      txExplain.inputs[2].id.should.equal('s92SjoZQemgG97HocX9GgyFy6ZKmapgcgqQ3y5J2uwP3qWBUy:0');
      assert(txJson.outputs[0].value === testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.stakeAmount);
      tx.type.should.equal(TransactionType.AddPermissionlessValidator);
      console.log(tx.toBroadcastFormat());

      const txBuilder2 = new TransactionBuilderFactory(coins.get('tavaxp'))
        .from(tx.toBroadcastFormat())
        .recoverMode(false);
      const tx2 = await txBuilder2.build();
      tx2.type.should.equal(TransactionType.AddPermissionlessValidator);
      // Test sign with user key
      txBuilder2.sign({ key: testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.userPrivateKey });
      const halfSigned = await txBuilder2.build();
      const halfSignedTxHex = halfSigned.toBroadcastFormat();
      assert(txBuilder['_stakeAmount'] === txBuilder2['_stakeAmount']);
      console.log(halfSignedTxHex);

      // const txBuilder2 = factory.from(halfSignedTxHex);
      // txBuilder2.sign({ key: testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.backupPrivateKey });
      // const fullSignedTx = await txBuilder2.build();
      // console.log(fullSignedTx.toJson());

      // const res = await pvmapi.issueTx({ tx: fullSignedTx.toBroadcastFormat() });
      // const txSigned =
      //   '0x000000000019000000050000000000000000000000000000000000000000000000000000000000000000000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000070000000005c81a40000000000000000000000002000000037086fbc36717c7a407bdb198bd7925296727d6b97565285409e200fdc67c7b63759b5ad29bf01fc2b471d54e58e4c5fadee622abd663bebad3ad6372000000024411af9d9877c52c1be3f77825a74ca11869128478c4145910e92695a24c7d80000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000005000000003b9aca0000000002000000010000000271d8644c9199e30b9fef53af56aef243e5431c6b1b09d5f11a6622c86db3f39d000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa000000050000000005c81a4000000002000000010000000200000000129a271ff407b1101f35aec82a2f715c5239bd3900000000660f4ab50000000066109e8d000000003b9aca0000000000000000000000000000000000000000000000000000000000000000000000001cad9e9476b701edec88e53b1c314456053b3cf846a1192117872e41455f440c074d6ee89530d45e88f79ac0eda06f2887a94d6182edbd953516b262f17565a65d98f5741549cd70d2423abff750bb4b8d982d482376b189142ff8aa4705615fee14be6174610860e9c003aa4aeaa613b1732abf3cd0c9c42fa5856345644068c0d1f9fa1d9af32e20b14fca02983260bc000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000007000000003b9aca00000000000000000000000002000000037086fbc36717c7a407bdb198bd7925296727d6b97565285409e200fdc67c7b63759b5ad29bf01fc2b471d54e58e4c5fadee622abd663bebad3ad63720000000b000000000000000000000002000000037086fbc36717c7a407bdb198bd7925296727d6b97565285409e200fdc67c7b63759b5ad29bf01fc2b471d54e58e4c5fadee622abd663bebad3ad63720000000b000000000000000000000002000000037086fbc36717c7a407bdb198bd7925296727d6b97565285409e200fdc67c7b63759b5ad29bf01fc2b471d54e58e4c5fadee622abd663bebad3ad637200030d4000000002000000090000000228a59420971953aa61b4b4c90b934ef76e6e9c8ad256e9417e9a6b5017d836813b2b5cad2a890c66c8295f104d74192c4964cf289e2a45adb57a7b05b5e9529e004ec2dae5c48ba6fa4d1e0b1c6b9d9bbe79c481ff16848c1fa3fa3a6ed47431a12af4b2d9779bb192bb3f254408731798b50c8f03f25b7e7d7313738892e71d6601000000090000000228a59420971953aa61b4b4c90b934ef76e6e9c8ad256e9417e9a6b5017d836813b2b5cad2a890c66c8295f104d74192c4964cf289e2a45adb57a7b05b5e9529e004ec2dae5c48ba6fa4d1e0b1c6b9d9bbe79c481ff16848c1fa3fa3a6ed47431a12af4b2d9779bb192bb3f254408731798b50c8f03f25b7e7d7313738892e71d660151aa291f';
      // const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(tx);
      // const decode = await txBuilder.build();
      // console.log(decode.toJson());

      // const res = await pvmapi.issueTx({ tx: txSigned });
      // console.log(res);
    });

    it('build and sign an AddPermissionlessValidator transaction', async () => {
      const recoveryMode = false;
      const txBuilder = new AvaxpLib.TransactionBuilderFactory(coins.get('tavaxp'))
        .getPermissionlessValidatorTxBuilder()
        .threshold(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.threshold)
        .locktime(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.locktime)
        .recoverMode(recoveryMode)
        .fromPubKey(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.bitgoAddresses)
        .startTime(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.startTime)
        .endTime(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.endTime)
        .stakeAmount(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.stakeAmount)
        .delegationFeeRate(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.delegationFeeRate)
        .nodeID(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.nodeId)
        .blsPublicKey(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.blsPublicKey)
        .blsSignature(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.blsSignature)
        .utxos(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.utxos);
      const tx = await txBuilder.build();
      tx.type.should.equal(TransactionType.AddPermissionlessValidator);

      // Test sign with user key
      txBuilder.sign({ key: testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.userPrivateKey });
      txBuilder.sign({ key: testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.backupPrivateKey });
      const fullSignedTx = await txBuilder.build();
      console.log(fullSignedTx.toJson());
    });

    it('build and sign a transaction in recovery mode', async () => {
      const recoveryMode = true;
      const txBuilder = new AvaxpLib.TransactionBuilderFactory(coins.get('tavaxp'))
        .getPermissionlessValidatorTxBuilder()
        .threshold(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.threshold)
        .locktime(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.locktime)
        .recoverMode(recoveryMode)
        .fromPubKey(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.bitgoAddresses)
        .startTime(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.startTime)
        .endTime(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.endTime)
        .stakeAmount(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.stakeAmount)
        .delegationFeeRate(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.delegationFeeRate)
        .nodeID(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.nodeId)
        .blsPublicKey(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.blsPublicKey)
        .blsSignature(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.blsSignature)
        .utxos(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.utxos);
      const tx = await txBuilder.build();

      let txHex = tx.toBroadcastFormat();
      txHex.should.equal(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.unsignedRawtxRecovery);

      const privateKey = recoveryMode
        ? testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.backupPrivateKey
        : testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.userPrivateKey;

      const params = {
        txPrebuild: {
          txHex: tx.toBroadcastFormat(),
        },
        prv: privateKey,
      };

      const halfSignedTransaction = await basecoin.signTransaction(params);
      txHex = (halfSignedTransaction as HalfSignedAccountTransaction)?.halfSigned?.txHex;
      txHex.should.equal(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_SAMPLE.halfSignedRawTxRecovery);
    });

    it('build and sign an AddPermissionlessValidator transaction and broadcast in recovery mode', async () => {
      const unixNow = BigInt(Math.round(new Date().getTime() / 1000));
      const startTime = unixNow + BigInt(60);
      const endTime = startTime + BigInt(60 * 60 * 24 + 600);

      const recoveryMode = true;
      const txBuilder = new AvaxpLib.TransactionBuilderFactory(coins.get('tavaxp'))
        .getPermissionlessValidatorTxBuilder()
        .threshold(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.threshold)
        .locktime(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.locktime)
        .recoverMode(recoveryMode)
        .fromPubKey(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.bitgoAddresses)
        .startTime(startTime.toString())
        .endTime(endTime.toString())
        .stakeAmount(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.stakeAmount)
        .delegationFeeRate(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.delegationFeeRate)
        .nodeID(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.nodeId)
        .blsPublicKey(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.blsPublicKey)
        .blsSignature(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.blsSignature)
        .utxos(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.utxos);
      const tx = await txBuilder.build();
      tx.type.should.equal(TransactionType.AddPermissionlessValidator);

      // Test sign with user key
      txBuilder.sign({ key: testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.backupPrivateKey });
      const halfSigned = await txBuilder.build();
      const halfSignedTxHex = halfSigned.toBroadcastFormat();

      const txBuilder2 = factory.from(halfSignedTxHex);
      txBuilder2.sign({ key: testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.userPrivateKey });
      const fullSignedTx = await txBuilder2.build();
      console.log(fullSignedTx.toJson());
    });
  });
  it('Should fail to build if utxos change output 0', async () => {
    const unixNow = BigInt(Math.round(new Date().getTime() / 1000));
    const startTime = unixNow + BigInt(60);
    const endTime = startTime + BigInt(60 * 60 * 24 + 600);

    const txBuilder = new AvaxpLib.TransactionBuilderFactory(coins.get('tavaxp'))
      .getPermissionlessValidatorTxBuilder()
      .threshold(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.threshold)
      .locktime(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.locktime)
      .recoverMode(false)
      .fromPubKey(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.bitgoAddresses)
      .startTime(startTime.toString())
      .endTime(endTime.toString())
      .stakeAmount(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.stakeAmountNoOutput)
      .delegationFeeRate(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.delegationFeeRate)
      .nodeID(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.nodeId)
      .blsPublicKey(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.blsPublicKey)
      .blsSignature(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.blsSignature)
      .utxos(testData.BUILD_AND_SIGN_ADD_PERMISSIONLESS_VALIDATOR_SAMPLE.utxos);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();
    const txExplain = tx.explainTransaction();
    txJson.changeOutputs.length.should.equal(0);
    txExplain.changeOutputs.length.should.equal(0);
    txExplain.changeAmount.should.equal('0');
  });
});
