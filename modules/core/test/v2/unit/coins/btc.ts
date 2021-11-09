import * as should from 'should';

import { TestBitGo } from '../../../lib/test_bitgo';
import { Btc } from '../../../../src/v2/coins';
import { Unspent } from '../../../../src/v2/coins/abstractUtxoCoin';

describe('BTC:', function () {
  let bitgo;

  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
  });

  describe('Explain transaction:', () => {

    describe('Signature count:', () => {
      // p2sh, p2wsh, p2shP2wsh does not matter for unsigned inputs, so we will only test one
      const unsignedTx = '0100000002ece0eb669e085aeb13527e3f20873caa2845a9196c5dc23bd3d366da46996c9e0100000000ffffffff471f27cdf9f75a0e610281cb8d7b5caa44cd3a5d7048fabf9acbededdb709a590100000000ffffffff0240420f000000000017a914a364c319fddbc93dafdaa9d006d728961958a03f87eee80a000000000017a914e006ca6b2a68ce7ee9d9e3cbf62af153b8ae3420876e011600';

      const p2shP2wshUnspents = [
        {
          id: 'c1675aebce249a45631e9c9c5093aedfe803099fddde81dec08d7b9ef93cc983:1',
          value: 998214,
        },
        {
          id: '1cd6b605b1ac6e39eb26cdd7ef85699ea1669970a8f3c7be023ab7986a8a22d7:0',
          value: 1000000,
        },
      ] as Unspent[];

      const p2wshUnspents = [
        {
          id: '52fcd5cceef2350b7f380a232a41dafc496afd7f186b203c04ad1201549c98b6:0',
          value: 10000000,
        },
      ] as Unspent[];

      const txs = {
        p2sh: {
          halfSigned: '0100000001accf0cd2599ea4d6d8b032405f9396fe218c247b661e58cf3e9e4bb3c095426828000000b700483045022100cd5a6a660f56da89f7b27e566406e90282f4120bffef1918518f744a6bb3209f022055774755ee323dae0b555a2f5b8f548c20b905b6a7fe954d1d93e415c71e77060100004c6952210272ed48816a9600b7262388e3ae9d9faf1a14ff773350835c784dde916ce7bfff2103c388215ac5a6400db9ec2a3d69e965f3c30ad6935d729c9cef083124646ae5482102bc24b831b847b501dbcbb383fbc64138043573ad766968e0ee66744e00bf08a353aeffffffff01ce15fa020000000017a9147676db43fea61814cf0e2317b5e9b336054f8a2e87ad600800',
          fullySigned: '0100000001accf0cd2599ea4d6d8b032405f9396fe218c247b661e58cf3e9e4bb3c095426828000000fdfd0000483045022100cd5a6a660f56da89f7b27e566406e90282f4120bffef1918518f744a6bb3209f022055774755ee323dae0b555a2f5b8f548c20b905b6a7fe954d1d93e415c71e77060147304402200476814f5ec0b4ded9b57414395ac7deda570339fb5d71377b9fc896c1d6e78b0220249237943e11062592c32f4f68d8ef03372bf16a83e8846d6effdba0a6ada020014c6952210272ed48816a9600b7262388e3ae9d9faf1a14ff773350835c784dde916ce7bfff2103c388215ac5a6400db9ec2a3d69e965f3c30ad6935d729c9cef083124646ae5482102bc24b831b847b501dbcbb383fbc64138043573ad766968e0ee66744e00bf08a353aeffffffff01ce15fa020000000017a9147676db43fea61814cf0e2317b5e9b336054f8a2e87ad600800',
        },
        p2shP2wsh: {
          halfSigned: '0100000000010283c93cf99e7b8dc0de81dedd9f0903e8dfae93509c9c1e63459a24ceeb5a67c10100000023220020dced90433eee50a13a9a5e3a01d4f011eda3832cfe7078202f435125908a8023ffffffffd7228a6a98b73a02bec7f3a8709966a19e6985efd7cd26eb396eacb105b6d61c0000000023220020d3943e78dc44bbaddb8c5ff3f24956efb3175a019d01b5690841910c219b5f01ffffffff02c9370f000000000017a9142f2ddab3f793ceab164ed186afa4dfec9eb9c9e58740420f000000000017a9145bac3641fa38b9dad47a2a027d3a39e38b476124870500483045022100ec86cfba7d76fa7b9fb39ff56a3b708eee06d1cfefe9266455f16db5b37654c80220219158789c81dac85d04bbb584255c4cd0fdc2dbc3690cc18b29f04a2ffa193201000069522102d31024f6184956b730294a1275383c6d57c8fcfdfebb4870fd91882b1c08a8a821028f4b8d4508169c746a2381155bf7cbfa56eeff237937040597e7be632ff74719210315f8700de6902daa99e4c511b008e5018d8f3b586143183f80ab97db8fde770a53ae0500483045022100e37c1cf55b9f23b4ef0bfb018fb54eaae8a5541635269f06176b4f715151a9d102202b057455a3353ba1e2e32526d55e267e957ba00fe416ac59458bf9c1b5044e690100006952210311322726192eb6cbbec6445514d148722a936d5805360be2faf2f8adc8b5aec42102d2e6cf4c6dcdc8e3e1633e7e64b2e41f5be4a583934adbf1f2372240f41b59ae21023799f2560c321587ae734da2d1faafa7c4931145b4b785a3263fa5aa193a208753ae7f011600',
          fullySigned: '0100000000010283c93cf99e7b8dc0de81dedd9f0903e8dfae93509c9c1e63459a24ceeb5a67c10100000023220020dced90433eee50a13a9a5e3a01d4f011eda3832cfe7078202f435125908a8023ffffffffd7228a6a98b73a02bec7f3a8709966a19e6985efd7cd26eb396eacb105b6d61c0000000023220020d3943e78dc44bbaddb8c5ff3f24956efb3175a019d01b5690841910c219b5f01ffffffff02c9370f000000000017a9142f2ddab3f793ceab164ed186afa4dfec9eb9c9e58740420f000000000017a9145bac3641fa38b9dad47a2a027d3a39e38b476124870400483045022100ec86cfba7d76fa7b9fb39ff56a3b708eee06d1cfefe9266455f16db5b37654c80220219158789c81dac85d04bbb584255c4cd0fdc2dbc3690cc18b29f04a2ffa19320147304402206c6c7760d7acbd595e8649e80e64a67aee8a7b1d16ca9e6b090d31235252fb2902200e2655df8a4f3c230df6e4a1ca881a7b4781963b786479f4ebc02aaa9b6031e90169522102d31024f6184956b730294a1275383c6d57c8fcfdfebb4870fd91882b1c08a8a821028f4b8d4508169c746a2381155bf7cbfa56eeff237937040597e7be632ff74719210315f8700de6902daa99e4c511b008e5018d8f3b586143183f80ab97db8fde770a53ae0400483045022100e37c1cf55b9f23b4ef0bfb018fb54eaae8a5541635269f06176b4f715151a9d102202b057455a3353ba1e2e32526d55e267e957ba00fe416ac59458bf9c1b5044e690148304502210097cab2c37d2335328f169fb0c8420e9abd4dd81dff988ea657707a43512b5df1022075aeeb099e75565e205743419b3b756e34a6f0d68a4e7d0e6f2a482ab70e276e016952210311322726192eb6cbbec6445514d148722a936d5805360be2faf2f8adc8b5aec42102d2e6cf4c6dcdc8e3e1633e7e64b2e41f5be4a583934adbf1f2372240f41b59ae21023799f2560c321587ae734da2d1faafa7c4931145b4b785a3263fa5aa193a208753ae7f011600',
          txInfo: {
            unspents: p2shP2wshUnspents,
          },
        },
        p2wsh: {
          halfSigned: '01000000000101b6989c540112ad043c206b187ffd6a49fcda412a230a387f0b35f2eeccd5fc520000000000ffffffff0222073d000000000017a914d795501e88704dd652de6b9a5cf30ca980ed07d687808d5b0000000000220020a5400adb4650be7a0f333dfd030496bb01ba44754e475532f5596a275dc973b6050047304402201715b6e3acb548ed90bd72b670e311434292666e01c5aa74a9a1b341dc6015780220376fa2d22465d7d2919d0ce2e96065559e4fadd90edea79543ee5f03d0c4828801000069522103f539e7cd897e676f07c55e5d672ae9686db91e626827f083139ca855e80e11832102ef4cbc39ee4abe37198ae095f3d4fef2716af7951f9bb9265aa9b9181e408342210345fb5ab601bad203c6ca6eb5ac5a5b4bf46986834419e6e87684e1e63c6a799e53ae99ac1600',
          fullySigned: '01000000000101b6989c540112ad043c206b187ffd6a49fcda412a230a387f0b35f2eeccd5fc520000000000ffffffff0222073d000000000017a914d795501e88704dd652de6b9a5cf30ca980ed07d687808d5b0000000000220020a5400adb4650be7a0f333dfd030496bb01ba44754e475532f5596a275dc973b6040047304402201715b6e3acb548ed90bd72b670e311434292666e01c5aa74a9a1b341dc6015780220376fa2d22465d7d2919d0ce2e96065559e4fadd90edea79543ee5f03d0c4828801483045022100bee8fa7548d99245b83599b657c310b4f4cc9c463002d4f843d8f8ed663f4df602204955fcd17ef02228e8e49c0d122fd0a77da76700376735625c90385d5ff43c3e0169522103f539e7cd897e676f07c55e5d672ae9686db91e626827f083139ca855e80e11832102ef4cbc39ee4abe37198ae095f3d4fef2716af7951f9bb9265aa9b9181e408342210345fb5ab601bad203c6ca6eb5ac5a5b4bf46986834419e6e87684e1e63c6a799e53ae99ac1600',
          txInfo: {
            unspents: p2wshUnspents,
          },
        },
      };

      let coin: Btc;
      before(() => {
        coin = bitgo.coin('btc');
      });

      describe('failure', () => {
        it('should fail for invalid transaction hexes', async function () {
          await (coin as any).explainTransaction().should.be.rejectedWith('invalid transaction hex, must be a valid hex string');

          await coin.explainTransaction({ txHex: '' }).should.be.rejectedWith('invalid transaction hex, must be a valid hex string');

          await coin.explainTransaction({ txHex: 'nonsense' }).should.be.rejectedWith('invalid transaction hex, must be a valid hex string');

          await (coin as any).explainTransaction({ txHex: 1234 }).should.be.rejectedWith('invalid transaction hex, must be a valid hex string');

          await coin.explainTransaction({ txHex: '1234a' }).should.be.rejectedWith('invalid transaction hex, must be a valid hex string');

          await coin.explainTransaction({ txHex: '1234ab' }).should.be.rejectedWith('failed to parse transaction hex');
        });
      });

      describe('success', () => {
        it('should handle undefined tx info for segwit transactions', async function () {
          const { signatures, inputSignatures } = await coin.explainTransaction({
            txHex: txs.p2shP2wsh.halfSigned,
          });

          should.exist(signatures);
          signatures.should.equal(0);

          should.exist(inputSignatures);
          inputSignatures.should.have.length(2);
          inputSignatures.should.deepEqual([0, 0]);
        });

        it('should count zero signatures on an unsigned transaction', async function () {
          const { signatures, inputSignatures } = await coin.explainTransaction({
            txHex: unsignedTx,
          });

          should.exist(signatures);
          signatures.should.equal(0);

          should.exist(inputSignatures);
          inputSignatures.should.have.length(2);
          inputSignatures.should.deepEqual([0, 0]);
        });

        it('should count one signature on a half-signed p2sh transaction', async function () {
          const { signatures, inputSignatures } = await coin.explainTransaction({
            txHex: txs.p2sh.halfSigned,
          });

          should.exist(signatures);
          signatures.should.equal(1);

          should.exist(inputSignatures);
          inputSignatures.should.have.length(1);
          inputSignatures.should.deepEqual([1]);
        });

        it('should count two signatures on a fully-signed p2sh transaction', async function () {
          const { signatures, inputSignatures } = await coin.explainTransaction({
            txHex: txs.p2sh.fullySigned,
          });

          should.exist(signatures);
          signatures.should.equal(2);

          should.exist(inputSignatures);
          inputSignatures.should.have.length(1);
          inputSignatures.should.deepEqual([2]);
        });

        it('should count one signature on a half-signed p2shP2wsh transaction', async function () {
          const { signatures, inputSignatures } = await coin.explainTransaction({
            txHex: txs.p2shP2wsh.halfSigned,
            txInfo: txs.p2shP2wsh.txInfo,
          });

          should.exist(signatures);
          signatures.should.equal(1);

          should.exist(inputSignatures);
          inputSignatures.should.have.length(2);
          inputSignatures.should.deepEqual([1, 1]);
        });

        it('should count two signatures on a fully-signed p2shP2wsh transaction', async function () {
          const { signatures, inputSignatures } = await coin.explainTransaction({
            txHex: txs.p2shP2wsh.fullySigned,
            txInfo: txs.p2shP2wsh.txInfo,
          });

          should.exist(signatures);
          signatures.should.equal(2);

          should.exist(inputSignatures);
          inputSignatures.should.have.length(2);
          inputSignatures.should.deepEqual([2, 2]);
        });

        it('should count one signature on a half-signed p2wsh transaction', async function () {
          const { signatures, inputSignatures } = await coin.explainTransaction({
            txHex: txs.p2wsh.halfSigned,
            txInfo: txs.p2wsh.txInfo,
          });

          should.exist(signatures);
          signatures.should.equal(1);

          should.exist(inputSignatures);
        });

        it('should count two signatures on a fully-signed p2wsh transaction', async function () {
          const { signatures, inputSignatures } = await coin.explainTransaction({
            txHex: txs.p2wsh.fullySigned,
            txInfo: txs.p2wsh.txInfo,
          });

          should.exist(signatures);
          signatures.should.equal(2);

          should.exist(inputSignatures);
        });
      });
    });
  });

  describe('Address validation:', () => {
    let coin: Btc;
    before(() => {
      coin = bitgo.coin('tbtc');
    });

    it('should validate a base58 address', () => {
      const validBase58Address = '2Mv1fGp8gHSqsiXYG7WqcYmHZdurDGVtUbn';
      coin.isValidAddress(validBase58Address).should.be.true();
    });

    it('should validate a bech32 address', () => {
      const validBech32Address = 'tb1qtxxqmkkdx4n4lcp0nt2cct89uh3h3dlcu940kw9fcqyyq36peh0st94hfp';
      coin.isValidAddress(validBech32Address).should.be.true();
    });

    it('should validate a bech32m address', () => {
      // https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki#Test_vectors_for_Bech32m
      const validBech32mAddress = 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7';
      coin.isValidAddress(validBech32mAddress).should.be.true();
    });
  });
});
