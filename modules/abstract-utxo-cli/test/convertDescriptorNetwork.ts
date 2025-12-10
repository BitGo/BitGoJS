import * as assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import { Descriptor } from '@bitgo/wasm-miniscript';

import { convertDescriptorXpubs, getXpubsFromDescriptor } from '../src/commands/createWallet';

describe('convertDescriptorNetwork', function () {
  it('should convert descriptor network', function () {
    const v =
      'wsh(multi(2,xpub661MyMwAqRbcFVG2oSHt1P9ZgjyBmTfEmBFmjgRAkN5BUmjqfovhCdopAyaisLpUXZLP98gZu8Hxx76q4F6voPCY2CfxVPMj3wGMukHUoad/0/*,xpub661MyMwAqRbcGnBbqmKZUft1oNr9L6Gb6xSkiNafqhbWRtdZrupSCgCidbsXNyKYiPV5ZHuqtE5DRqCXigdGmUnpwSQ2c98mKjfiDHF3UMf/0/*,xpub661MyMwAqRbcGbzvzdNqgdErTSTLK3GX4x47C1HU29Y2r9KVbPa3nFPs7KY9gmfr79PrRQmoA5X2K7oZBdyCeod7JDYrPip971V3PaMtRnQ/0/*))#9hscq479';
    const vTestnet =
      'wsh(multi(2,tpubD6NzVbkrYhZ4XHStFdGyDJUw1s4qkrAJJor56EUK6Gq5E4QYk2mnM5UeR1fWPqmiKTsHkiCSSE81eHbST6xAgpeq5oRGAv1xdtrmfqL4bTt/0/*,tpubD6NzVbkrYhZ4YaNTHxJegbDP8VwoKUmeeb344vdpBcMQBBJGw8fXM7sYsdxJuUGnWJ1zAsRiRKuG81h97YUWevF8139LHfnzuhG7yMEYDEW/0/*,tpubD6NzVbkrYhZ4YQBnSpMvtYaDnZYzJRmacaeQYZLcN4HvbRzCfcR8vh4hMMcwDGd5u3vm2zHfhBM51JJAaVpSYF5QMpJA5FUNgy5T9bpj3qd/0/*))#hhgk0yrv';
    assert.deepStrictEqual(getXpubsFromDescriptor(Descriptor.fromString(v, 'string')), [
      'xpub661MyMwAqRbcFVG2oSHt1P9ZgjyBmTfEmBFmjgRAkN5BUmjqfovhCdopAyaisLpUXZLP98gZu8Hxx76q4F6voPCY2CfxVPMj3wGMukHUoad',
      'xpub661MyMwAqRbcGnBbqmKZUft1oNr9L6Gb6xSkiNafqhbWRtdZrupSCgCidbsXNyKYiPV5ZHuqtE5DRqCXigdGmUnpwSQ2c98mKjfiDHF3UMf',
      'xpub661MyMwAqRbcGbzvzdNqgdErTSTLK3GX4x47C1HU29Y2r9KVbPa3nFPs7KY9gmfr79PrRQmoA5X2K7oZBdyCeod7JDYrPip971V3PaMtRnQ',
    ]);

    assert.strictEqual(
      convertDescriptorXpubs(
        Descriptor.fromString(v, 'string'),
        utxolib.networks.bitcoin,
        utxolib.networks.testnet
      ).toString(),
      vTestnet
    );
  });
});
