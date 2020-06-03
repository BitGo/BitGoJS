/**
 * @prettier
 */
import 'should';
import * as nock from 'nock';

import { TestBitGo } from '../../lib/test_bitgo';

import { BaseCoin, PendingApprovalData, State, Type, Wallet } from '../../../src/v2';
import { Environments } from '../../../src';

describe('Pending Approvals:', () => {
  let bitgo: typeof TestBitGo;
  let basecoin: BaseCoin;
  let wallet: Wallet;
  let bgUrl: string;

  const coin = 'tbtc';
  const walletId = 'wallet_id';

  const pendingApprovalData: PendingApprovalData = {
    id: 'pa0',
    info: {
      type: Type.TRANSACTION_REQUEST,
      transactionRequest: {
        coinSpecific: {
          [coin]: {},
        },
        recipients: [],
        buildParams: {},
        sourceWallet: walletId,
      },
    },
    state: State.PENDING,
    creator: 'test',
  };
  const walletData = {
    id: walletId,
    coin,
    pendingApprovals: [pendingApprovalData],
  };

  before(async () => {
    nock.disableNetConnect();
    // create wallet
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(coin);

    wallet = new Wallet(bitgo, basecoin, walletData);
    bgUrl = Environments[bitgo.getEnv()].uri;
    (pendingApprovalData as any).wallet = wallet;
  });

  it('should call consolidate instead of build when rebuilding consolidation pending approvals', async () => {
    const scope = nock(bgUrl)
      .post(`/api/v2/${coin}/wallet/${walletId}/consolidateUnspents`)
      .reply(200);
    const pendingApprovals = wallet.pendingApprovals();
    pendingApprovals.should.have.length(1);
    const pendingApproval = pendingApprovals[0];

    // approval will fail when attempting to resign. This is ok - we just want to make sure
    // the consolidateUnspents endpoint was called already before failing
    await pendingApproval.approve({ xprv: 'nonsense' }).should.be.rejected();

    scope.done();
  });
});
