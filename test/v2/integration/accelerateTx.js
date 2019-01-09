require('should');
const co = require('bluebird').coroutine;

const BitGoJS = require('../../../src');

describe('accelerateTransaction', function() {
  // latest.bitgo.com / otto-latest@bitgo.com
  const accessToken = 'v2x0f5a14ab6aa4c3d4a420444ed6494157b7259de634ad3836ba748335812c6252';
  // wallet "cpfptest2"
  const walletId = '5c346da55cb4b705795c5176eb7c70cd';
  const walletPassphrase = 'cpfptest2';
  const coinName = 'tbtc';
  const bitgo = new BitGoJS.BitGo({ env: 'latest', accessToken });

  let wallet;

  // wallet was funded with 10_000_000 sats,
  // so this should be sufficient for 1000 txs with satAmount
  const satAmount = 10000;

  const baseFeeRate = 1;
  const cpfpFeeRate = 10;

  const getUnconfirmedTx = co(function *(wallet) {
    const { address } = yield wallet.createAddress();
    const { transfer } = yield wallet.send({
      amount: satAmount,
      address,
      feeRate: baseFeeRate,
      walletPassphrase
    });
    return transfer.txid;
  }.bind(this));

  const getConfirmedTx = co(function *(wallet) {
    const { transfers } = yield wallet.transfers({ limit: 1, minConfirms: 1 });
    return transfers[0].txid;
  }.bind(this));

  let unconfirmedTx;

  before(co(function *() {
    this.timeout(0);
    console.log('unlocking account...');
    yield bitgo.unlock({ otp: '0000000' });
    console.log('getting wallet...');
    wallet = yield bitgo.coin(coinName).wallets().get({ id: walletId });
    (wallet === undefined).should.eql(false);

    console.log('creating unconfirmed tx...');
    unconfirmedTx = yield getUnconfirmedTx(wallet);
    console.log('created tx', unconfirmedTx);
    (unconfirmedTx === undefined).should.eql(false);
  }));

  it('can accelerate an unconfirmed tx', co(function *() {
    console.log('acclerateTx...');
    // FIXME: the tx is not found in the db when we go to access it
    const result = yield wallet.accelerateTransaction({
      cpfpTxIds: [unconfirmedTx],
      cpfpFeeRate,
      maxFee: 1000000,
      recipients: [] // TODO: remove me when #179 lands
    });
    console.log('result', result);
  }));

  it('fails when there are insufficient funds to bump the transaction', co(function *() {

  }));

  it('fails when the fee needed to accelerate the tx is above the maxFeeRate passed', co(function *() {

  }));

  it('can accelerate an entire ancestor set', co(function *() {

  }));

  it('fails when attempting to bump an already confirmed transaction', co(function *() {
    const confirmedTx = yield getConfirmedTx(wallet);
    try {
      yield wallet.accelerateTransaction({
        cpfpTxIds: [confirmedTx],
        cpfpFeeRate,
        maxFee: 1000000,
        recipients: [] // TODO: remove me when #179 lands
      });
      throw new Error('expected error was not thrown');
    } catch (err) {
      // error message format below
      // no unconfirmed tx with id {tx id} requestId={request id}
      err.message.should.containEql(`no unconfirmed tx with id ${confirmedTx}`);
    }
  }));
});

