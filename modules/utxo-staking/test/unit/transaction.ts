import * as assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import { buildFixedWalletStakingPsbt } from '../../src';

describe('transactions', function () {
  describe('fixed wallets', function () {
    const rootWalletKeys = utxolib.testutil.getDefaultWalletKeys();
    const network = utxolib.networks.bitcoin;
    const chain = 20;
    const index = 0;
    const changeAddress = utxolib.address.fromOutputScript(
      utxolib.bitgo.outputScripts.createOutputScript2of3(
        rootWalletKeys.deriveForChainAndIndex(chain, index).publicKeys,
        'p2wsh',
        network
      ).scriptPubKey,
      network
    );
    const changeAddressInfo = { chain: chain as utxolib.bitgo.ChainCode, index, address: changeAddress };

    const unspents = utxolib.testutil.mockUnspents(
      rootWalletKeys,
      ['p2sh', 'p2wsh'],
      BigInt(1e8),
      network
    ) as utxolib.bitgo.WalletUnspent<bigint>[];

    const outputs = [
      {
        script: utxolib.bitgo.outputScripts.createOutputScript2of3(
          rootWalletKeys.deriveForChainAndIndex(40, 0).publicKeys,
          'p2trMusig2',
          network
        ).scriptPubKey,
        value: BigInt(1e7),
      },
    ];

    it('should fail if fee rate is negative', function () {
      assert.throws(() => {
        buildFixedWalletStakingPsbt({
          rootWalletKeys,
          unspents,
          outputs,
          changeAddressInfo,
          feeRateSatKB: 999,
          network,
        });
      }, /Fee rate must be at least 1 sat\/vbyte/);
    });

    it('should fail if the changeAddressInfo does not match the derived change script', function () {
      assert.throws(() => {
        buildFixedWalletStakingPsbt({
          rootWalletKeys,
          unspents,
          outputs,
          changeAddressInfo: { ...changeAddressInfo, index: 1 },
          feeRateSatKB: 1000,
          network,
        });
      }, /Change address info does not match the derived change script/);
    });

    it('should fail if there are no unspents or outputs', function () {
      assert.throws(() => {
        buildFixedWalletStakingPsbt({
          rootWalletKeys,
          unspents: [],
          outputs: [],
          changeAddressInfo,
          feeRateSatKB: 1000,
          network,
        });
      }, /Must have at least one input and one output/);
    });

    it('should fail if the input amount cannot cover the staking amount and the fee', function () {
      assert.throws(() => {
        buildFixedWalletStakingPsbt({
          rootWalletKeys,
          unspents: unspents.slice(0, 1),
          outputs: [
            { script: outputs[0].script, value: unspents.reduce((sum, unspent) => sum + unspent.value, BigInt(0)) },
          ],
          changeAddressInfo,
          feeRateSatKB: 1000,
          network,
        });
      }, /Input amount \d+ cannot cover the staking amount \d+ and  the fee: \d+/);
    });

    it('should be able to create a psbt for a fixed wallet', function () {
      const psbt = buildFixedWalletStakingPsbt({
        rootWalletKeys,
        unspents,
        outputs,
        changeAddressInfo,
        feeRateSatKB: 1000,
        network,
      });

      assert.deepStrictEqual(psbt.data.inputs.length, 2);
      assert.deepStrictEqual(psbt.data.outputs.length, 2);
      assert.deepStrictEqual(psbt.txOutputs[0].script, outputs[0].script);
    });
  });
});
