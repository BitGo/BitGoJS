import assert from 'assert';

import nock = require('nock');
import * as sinon from 'sinon';
import { common, PendingApproval, PendingApprovalData, State, Type, Wallet } from '@bitgo/sdk-core';

import type { ParsedTransaction } from '../../src/transaction/types';

import { defaultBitGo, getUtxoCoin } from './util';

nock.disableNetConnect();

const coin = getUtxoCoin('tbtc');
const bgUrl = common.Environments[defaultBitGo.getEnv()].uri;
const walletId = 'wallet0';
const paId = 'pa0';

const paData: PendingApprovalData = {
  id: paId,
  wallet: walletId,
  state: State.PENDING,
  creator: 'test',
  info: {
    type: Type.TRANSACTION_REQUEST,
    transactionRequest: {
      coinSpecific: {
        tbtc: { txHex: 'legacy-hex', txHexPsbt: 'psbt-hex' },
      },
      recipients: [],
      // non-empty buildParams.recipients → canRecreateTransaction returns true for tbtc
      buildParams: { recipients: [{ address: '2NAuziD75WnPPHJVwnd4ckgY4SuJaDVVbMD', amount: '100000' }] },
      sourceWallet: walletId,
    },
  },
};

describe('PendingApproval txHexPsbt flow', function () {
  let sandbox: sinon.SinonSandbox;
  let wallet: Wallet;
  let pendingApproval: PendingApproval;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    wallet = new Wallet(defaultBitGo, coin, { id: walletId, coin: 'tbtc', keys: [] });
    pendingApproval = new PendingApproval(defaultBitGo, coin, paData, wallet);
  });

  afterEach(function () {
    sandbox.restore();
    nock.cleanAll();
  });

  it('passes coinSpecific.txHexPsbt to parseTransaction as txPrebuild.txHexPsbt', async function () {
    // Stub prebuildAndSignTransaction so we don't need /tx/build nocks or real signing
    sandbox.stub(wallet, 'prebuildAndSignTransaction').resolves({ txHex: 'rebuilt' });

    // Capture the args passed to parseTransaction; returning no implicitExternalSpendAmount
    // causes recreateAndSignTransaction to return early after the first parseTransaction call
    const parseStub = sandbox
      .stub(coin, 'parseTransaction')
      .resolves({ outputs: [], changeOutputs: [] } as unknown as ParsedTransaction<number>);

    nock(bgUrl)
      .put(`/api/v2/tbtc/pendingapprovals/${paId}`)
      .reply(200, { ...paData, state: 'approved' });

    await pendingApproval.approve({ xprv: 'dummy' });

    // recreateAndSignTransaction calls parseTransaction twice:
    // first with originalPrebuild (coinSpecific), then with the rebuilt tx.
    // The first call must carry txHexPsbt from coinSpecific.
    assert.ok(parseStub.callCount >= 1, 'parseTransaction should have been called');
    assert.strictEqual(
      parseStub.firstCall.args[0].txPrebuild.txHexPsbt,
      'psbt-hex',
      'first parseTransaction call should carry txHexPsbt from coinSpecific'
    );
  });
});
