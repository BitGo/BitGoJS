import * as utxoLib from '@bitgo/utxo-lib';
import 'should';
import 'should-sinon';
import nock = require('nock');
import * as sinon from 'sinon';
import { CustomSigningFunction, common } from '@bitgo/sdk-core';

import { defaultBitGo, getDefaultWalletKeys, getUtxoCoin, getUtxoWallet } from './util';

nock.disableNetConnect();

const bgUrl = common.Environments[defaultBitGo.getEnv()].uri;
const basecoin = getUtxoCoin('tbtc');
const wallet = getUtxoWallet(basecoin, {
  id: '5b34252f1bf349930e34020a',
  coin: 'tbtc',
  keys: ['5b3424f91bf349930e340175', '5b3424f91bf349930e340176', '5b3424f91bf349930e340177'],
});

describe('UTXO Custom Signer Function', function () {
  const recipients = [
    { address: 'abc', amount: 123 },
    { address: 'def', amount: 456 },
  ];
  const rootWalletKey = getDefaultWalletKeys();
  let customSigningFunction: CustomSigningFunction;
  let stubs: sinon.SinonStub[];

  beforeEach(function () {
    customSigningFunction = sinon.stub().returns({
      txHex: 'this-is-a-tx',
    });
    stubs = [
      sinon.stub(wallet.baseCoin, 'postProcessPrebuild').returnsArg(0),
      sinon.stub(wallet.baseCoin, 'verifyTransaction').resolves(true),
      sinon.stub(wallet.baseCoin, 'signTransaction').resolves({ txHex: 'this-is-a-tx' }),
    ];
  });

  afterEach(function () {
    stubs.forEach((s) => s.restore());
    nock.cleanAll();
  });

  function nocks(txPrebuild: { txHex: string }) {
    const pubs = rootWalletKey.triple.map((k) => k.neutered().toBase58());
    nock(bgUrl)
      .post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/build`)
      .reply(200, { ...txPrebuild, txInfo: {} });
    nock(bgUrl).get(`/api/v2/${wallet.coin()}/public/block/latest`).reply(200, { height: 1000 });
    nock(bgUrl).persist().get(`/api/v2/${wallet.coin()}/key/${wallet.keyIds()[0]}`).reply(200, { pub: pubs[0] });
    nock(bgUrl).persist().get(`/api/v2/${wallet.coin()}/key/${wallet.keyIds()[1]}`).reply(200, { pub: pubs[1] });
    nock(bgUrl).persist().get(`/api/v2/${wallet.coin()}/key/${wallet.keyIds()[2]}`).reply(200, { pub: pubs[2] });
    return nock(bgUrl).post(`/api/v2/${wallet.coin()}/wallet/${wallet.id()}/tx/send`).reply(200, { ok: true });
  }

  it('should use a custom signing function if provided for PSBT with taprootKeyPathSpend input', async function () {
    const psbt = utxoLib.testutil.constructPsbt(
      [{ scriptType: 'taprootKeyPathSpend', value: BigInt(1000) }],
      [{ scriptType: 'p2sh', value: BigInt(900) }],
      basecoin.network,
      rootWalletKey,
      'unsigned'
    );
    const scope = nocks({ txHex: psbt.toHex() });
    const result = await wallet.sendMany({ recipients, customSigningFunction });

    result.should.have.property('ok', true);
    customSigningFunction.should.have.been.calledTwice();
    scope.done();
  });

  it('should use a custom signing function if provided for PSBT without taprootKeyPathSpend input', async function () {
    const psbt = utxoLib.testutil.constructPsbt(
      [{ scriptType: 'p2wsh', value: BigInt(1000) }],
      [{ scriptType: 'p2sh', value: BigInt(900) }],
      basecoin.network,
      rootWalletKey,
      'unsigned'
    );
    const scope = nocks({ txHex: psbt.toHex() });
    const result = await wallet.sendMany({ recipients, customSigningFunction });

    result.should.have.property('ok', true);
    customSigningFunction.should.have.been.calledOnce();
    scope.done();
  });

  it('should use a custom signing function if provided for Tx without taprootKeyPathSpend input', async function () {
    const tx = utxoLib.testutil.constructTxnBuilder(
      [{ scriptType: 'p2wsh', value: BigInt(1000) }],
      [{ scriptType: 'p2sh', value: BigInt(900) }],
      basecoin.network,
      rootWalletKey,
      'unsigned'
    );
    const scope = nocks({ txHex: tx.buildIncomplete().toHex() });
    const result = await wallet.sendMany({ recipients, customSigningFunction });

    result.should.have.property('ok', true);
    customSigningFunction.should.have.been.calledOnce();
    scope.done();
  });
});
