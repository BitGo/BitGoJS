import { common, Triple, Wallet } from '@bitgo/sdk-core';
import nock = require('nock');

import { psbtTxHex } from './fixtures/psbtHexProof';
import { defaultBitGo, getUtxoCoin } from './util';

nock.disableNetConnect();

const bgUrl = common.Environments[defaultBitGo.getEnv()].uri;

describe('Explain Transaction', function () {
  afterEach(function () {
    nock.cleanAll();
  });

  describe('Verify paygo output when explaining psbt transaction', function () {
    const coin = getUtxoCoin('tbtc4');

    const pubs: Triple<string> = [
      'xpub661MyMwAqRbcFaKvNBFdV6HY7ibXxFSbL7rDjY1cVM8s3pGPTNKfjTu8SmatNZ7AcZQehSqcEnC7vezMoprQvhqQUszLhuY4G8ruv6PGEr7',
      'xpub661MyMwAqRbcGkAVVQVHrEYQA4hfbDW9Rpn35b6sXA9TSBd5Qzjwz7F6Weje57kBVeVfimfJjXutwUDBSMz5yRwsWik9gNyxrdvSaJbjgi6',
      'xpub661MyMwAqRbcGCCL3GYNbvKs1t5k5yeKZcV5smto9T5Z17zkcgRF4X9uzDfPxMHHedwF4JcJ6kpg8M2NWHEFC5LMSv1t3nMMm1GC9PcVmq5',
    ];

    const keyIds = ['key-user', 'key-backup', 'key-bitgo'];

    function nockKeyFetch(): void {
      keyIds.forEach((id, i) => {
        nock(bgUrl).get(`/api/v2/${coin.getChain()}/key/${id}`).reply(200, { pub: pubs[i] });
      });
    }

    it('should detect and verify paygo address proof in PSBT', async function () {
      nockKeyFetch();
      const wallet = new Wallet(defaultBitGo, coin, {
        id: 'mock-wallet-id',
        coin: coin.getChain(),
        keys: keyIds,
      });
      await coin.explainTransaction(psbtTxHex, wallet);
    });
  });
});
