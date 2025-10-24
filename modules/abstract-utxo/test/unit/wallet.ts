import * as utxoLib from '@bitgo/utxo-lib';
import 'should';
import nock = require('nock');
import * as _ from 'lodash';
import { Wallet, ManageUnspentsOptions, common } from '@bitgo/sdk-core';

import { defaultBitGo, getDefaultWalletKeys, toKeychainObjects, getUtxoCoin } from './util';

const bgUrl = common.Environments[defaultBitGo.getEnv()].uri;
const bitgo = defaultBitGo;

describe('manage unspents', function () {
  let rootWalletKey;
  let walletPassphrase;
  let basecoin;
  let wallet;
  let keysObj;

  before(async function () {
    rootWalletKey = getDefaultWalletKeys();
    walletPassphrase = 'fixthemoneyfixtheworld';
    keysObj = toKeychainObjects(rootWalletKey, walletPassphrase);
    basecoin = getUtxoCoin('tbtc');
    const walletData = {
      id: '5b34252f1bf349930e34020a',
      coin: 'tbtc',
      keys: keysObj.map((k) => k.id),
    };
    wallet = new Wallet(bitgo, basecoin, walletData);
  });

  it('should pass for bulk consolidating unspents', async function () {
    const psbts = (['p2wsh', 'p2shP2wsh'] as const).map((scriptType) =>
      utxoLib.testutil.constructPsbt(
        [{ scriptType, value: BigInt(1000) }],
        [{ scriptType, value: BigInt(900) }],
        basecoin.network,
        rootWalletKey,
        'unsigned'
      )
    );
    psbts.forEach((psbt) => utxoLib.bitgo.addXpubsToPsbt(psbt, rootWalletKey));
    const txHexes = psbts.map((psbt) => ({ txHex: psbt.toHex() }));

    const nocks: nock.Scope[] = [];
    nocks.push(
      nock(bgUrl).post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/consolidateUnspents`).reply(200, txHexes)
    );

    nocks.push(
      ...keysObj.map((k, i) => nock(bgUrl).get(`/api/v2/${wallet.coin()}/key/${wallet.keyIds()[i]}`).reply(200, k))
    );

    nocks.push(
      ...psbts.map((psbt) =>
        nock(bgUrl)
          .post(
            `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`,
            _.matches({ txHex: psbt.signAllInputsHD(rootWalletKey.user).toHex() })
          )
          .reply(200)
      )
    );

    await wallet.consolidateUnspents({ bulk: true, walletPassphrase });

    nocks.forEach((n) => {
      n.isDone().should.be.true();
    });
  });

  it('should pass for single consolidating unspents', async function () {
    const psbt = utxoLib.testutil.constructPsbt(
      [{ scriptType: 'p2wsh', value: BigInt(1000) }],
      [{ scriptType: 'p2shP2wsh', value: BigInt(900) }],
      basecoin.network,
      rootWalletKey,
      'unsigned'
    );
    utxoLib.bitgo.addXpubsToPsbt(psbt, rootWalletKey);

    const nocks: nock.Scope[] = [];
    nocks.push(
      nock(bgUrl)
        .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/consolidateUnspents`)
        .reply(200, { txHex: psbt.toHex() })
    );

    nocks.push(
      ...keysObj.map((k, i) => nock(bgUrl).get(`/api/v2/${wallet.coin()}/key/${wallet.keyIds()[i]}`).reply(200, k))
    );

    nocks.push(
      nock(bgUrl)
        .post(
          `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`,
          _.matches({ txHex: psbt.signAllInputsHD(rootWalletKey.user).toHex() })
        )
        .reply(200)
    );

    await wallet.consolidateUnspents({ walletPassphrase });

    nocks.forEach((n) => {
      n.isDone().should.be.true();
    });
  });
});
describe('max recipient', function () {
  const address = '5b34252f1bf349930e34020a';
  const recipients = [
    {
      address,
      amount: 'max',
    },
  ];
  let basecoin;
  let wallet;

  before(async function () {
    basecoin = getUtxoCoin('tbtc');
    const walletData = {
      id: '5b34252f1bf349930e34020a',
      coin: 'tbtc',
      keys: ['5b3424f91bf349930e340175'],
    };
    wallet = new Wallet(bitgo, basecoin, walletData);
  });

  it('should pass maxFeeRate parameter when building transactions', async function () {
    const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`;
    const response = nock(bgUrl)
      .post(
        path,
        _.matches({
          recipients,
        })
      ) // use _.matches to do a partial match on request body object instead of strict matching
      .reply(200);

    try {
      await wallet.prebuildTransaction({ recipients });
    } catch (e) {
      // the prebuildTransaction method will probably throw an exception for not having all of the correct nocks
      // we only care about /tx/build and whether maxFeeRate is an allowed parameter
    }

    response.isDone().should.be.true();
  });
});

describe('maxFeeRate verification', function () {
  const address = '5b34252f1bf349930e34020a';
  const recipients = [
    {
      address,
      amount: 0,
    },
  ];
  const maxFeeRate = 10000;
  let basecoin;
  let wallet;

  before(async function () {
    basecoin = getUtxoCoin('tbtc');
    const walletData = {
      id: '5b34252f1bf349930e34020a',
      coin: 'tbtc',
      keys: ['5b3424f91bf349930e340175'],
    };
    wallet = new Wallet(bitgo, basecoin, walletData);
  });

  it('should pass maxFeeRate parameter when building transactions', async function () {
    const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`;
    const response = nock(bgUrl)
      .post(path, _.matches({ recipients, maxFeeRate })) // use _.matches to do a partial match on request body object instead of strict matching
      .reply(200);

    try {
      await wallet.prebuildTransaction({ recipients, maxFeeRate });
    } catch (e) {
      // the prebuildTransaction method will probably throw an exception for not having all of the correct nocks
      // we only care about /tx/build and whether maxFeeRate is an allowed parameter
    }

    response.isDone().should.be.true();
  });

  it('should pass maxFeeRate parameter when consolidating unspents', async function () {
    const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/consolidateUnspents`;
    const response = nock(bgUrl)
      .post(path, _.matches({ maxFeeRate })) // use _.matches to do a partial match on request body object instead of strict matching
      .reply(200);

    nock(bgUrl).get(`/api/v2/${wallet.coin()}/key/${wallet.keyIds()[0]}`).reply(200);

    try {
      await wallet.consolidateUnspents({ recipients, maxFeeRate });
    } catch (e) {
      // the consolidateUnspents method will probably throw an exception for not having all of the correct nocks
      // we only care about /consolidateUnspents and whether maxFeeRate is an allowed parameter
    }

    response.isDone().should.be.true();
  });

  it('should only build tx (not sign/send) while consolidating unspents', async function () {
    const toBeUsedNock = nock(bgUrl);
    toBeUsedNock.post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/consolidateUnspents`).reply(200);

    const unusedNocks = nock(bgUrl);
    unusedNocks.get(`/api/v2/${wallet.coin()}/key/${wallet.keyIds()[0]}`).reply(200);
    unusedNocks.post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`).reply(200);

    await wallet.consolidateUnspents({ recipients }, ManageUnspentsOptions.BUILD_ONLY);

    toBeUsedNock.isDone().should.be.true();
    unusedNocks.pendingMocks().length.should.eql(2);
    nock.cleanAll();
  });

  it('should pass maxFeeRate parameter when calling sweep wallets', async function () {
    const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/sweepWallet`;
    const response = nock(bgUrl)
      .post(path, _.matches({ address, maxFeeRate })) // use _.matches to do a partial match on request body object instead of strict matching
      .reply(200);

    try {
      await wallet.sweep({ address, maxFeeRate });
    } catch (e) {
      // the sweep method will probably throw an exception for not having all of the correct nocks
      // we only care about /sweepWallet and whether maxFeeRate is an allowed parameter
    }

    response.isDone().should.be.true();
  });

  it('should pass maxFeeRate parameter when calling fanout unspents', async function () {
    const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/fanoutUnspents`;
    const response = nock(bgUrl)
      .post(path, _.matches({ maxFeeRate })) // use _.matches to do a partial match on request body object instead of strict matching
      .reply(200);

    try {
      await wallet.fanoutUnspents({ address, maxFeeRate });
    } catch (e) {
      // the fanoutUnspents method will probably throw an exception for not having all of the correct nocks
      // we only care about /fanoutUnspents and whether maxFeeRate is an allowed parameter
    }

    response.isDone().should.be.true();
  });
});

describe('allowPartialSweep verification', function () {
  const address = '5b34252f1bf349930e34020a';
  const allowPartialSweep = true;
  let basecoin;
  let wallet;

  before(async function () {
    basecoin = getUtxoCoin('tbtc');
    const walletData = {
      id: '5b34252f1bf349930e34020a',
      coin: 'tbtc',
      keys: ['5b3424f91bf349930e340175'],
    };
    wallet = new Wallet(bitgo, basecoin, walletData);
  });

  it('should pass allowPartialSweep parameter when calling sweep wallets', async function () {
    const path = `/api/v2/${wallet.coin()}/wallet/${wallet.id()}/sweepWallet`;
    const response = nock(bgUrl)
      .post(path, _.matches({ address, allowPartialSweep })) // use _.matches to do a partial match on request body object instead of strict matching
      .reply(200);

    try {
      await wallet.sweep({ address, allowPartialSweep });
    } catch (e) {
      // the sweep method will probably throw an exception for not having all of the correct nocks
      // we only care about /sweepWallet and whether allowPartialSweep is an allowed parameter
    }

    response.isDone().should.be.true();
  });
});
