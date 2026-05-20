import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';

import { getDustThresholdSat } from '../src/dustThreshold';

describe('getDustThresholdSat', function () {
  it('has expected values', function () {
    assert.deepStrictEqual(
      utxolib.getNetworkList().flatMap((n): [unknown, unknown][] => {
        if (n === utxolib.networks.bitcoin) {
          return [
            ['bitcoin', getDustThresholdSat(n, 34, false)],
            ['bitcoin (segwit)', getDustThresholdSat(n, 31, true)],
          ];
        }
        try {
          return [[utxolib.getNetworkName(n), getDustThresholdSat(n, 34, false)]];
        } catch (e) {
          assert(e instanceof Error);
          return [[utxolib.getNetworkName(n), e.message]];
        }
      }),
      [
        /*

        https://github.com/bitcoin/bitcoin/blob/v28.0/src/policy/policy.cpp#L28

        >> "Dust" is defined in terms of dustRelayFee,
        >> which has units satoshis-per-kilobyte.
        >> If you'd pay more in fees than the value of the output
        >> to spend something, then we consider it dust.
        >> A typical spendable non-segwit txout is 34 bytes big, and will
        >> need a CTxIn of at least 148 bytes to spend:
        >> so dust is a spendable txout less than
        >> 182*dustRelayFee/1000 (in satoshis).
        >> 546 satoshis at the default rate of 3000 sat/kvB.

         */
        ['bitcoin', 546],
        /*

        >> A typical spendable segwit P2WPKH txout is 31 bytes big, and will
        >> need a CTxIn of at least 67 bytes to spend:
        >> so dust is a spendable txout less than
        >> 98*dustRelayFee/1000 (in satoshis).
        >> 294 satoshis at the default rate of 3000 sat/kvB.

        for us it is 297 because we round up

         */
        ['bitcoin (segwit)', 297],
        ['testnet', 546],
        ['bitcoinPublicSignet', 546],
        ['bitcoinTestnet4', 546],
        ['bitcoinBitGoSignet', 546],
        ['bitcoincash', 182],
        ['bitcoincashTestnet', 182],
        ['bitcoingold', 546],
        ['bitcoingoldTestnet', 546],
        ['bitcoinsv', 'deprecated coin'],
        ['bitcoinsvTestnet', 'deprecated coin'],
        ['dash', 546],
        ['dashTest', 546],
        ['dogecoin', 1000000],
        ['dogecoinTest', 1000000],
        ['ecash', 'unsupported network'],
        ['ecashTest', 'unsupported network'],
        ['litecoin', 5460],
        ['litecoinTest', 5460],
        ['zcash', 300],
        ['zcashTest', 300],
      ]
    );
  });
});
