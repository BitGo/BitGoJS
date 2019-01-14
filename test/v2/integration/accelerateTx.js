const should = require('should');
const Promise = require('bluebird');
const co = Promise.coroutine;

const BitGoJS = require('../../../src');

describe('accelerateTransaction', function() {
  // latest.bitgo.com / otto-latest@bitgo.com
  const accessToken = 'v2x0f5a14ab6aa4c3d4a420444ed6494157b7259de634ad3836ba748335812c6252';
  // wallet "cpfptest2"
  const walletId = '5c346da55cb4b705795c5176eb7c70cd';
  const walletPassphrase = 'cpfptest2';
  const coinName = 'tbtc';
  const bitgo = new BitGoJS.BitGo({ env: 'dev', accessToken });
  const unconfirmedTxHeight = 999999999;
  const MILLISECONDS_WAIT_IMS = 5000;

  let wallet;

  // wallet was funded with 10_000_000 sats,
  // so this should be sufficient for 1000 txs with satAmount
  const satAmount = 10000;

  const baseFeeRate = 1000;
  const cpfpFeeRate = 10000;
  const newCpfpFeeRate = 5000;

  const getUnconfirmedTx = co(function *(wallet) {
    // const { address } = yield wallet.createAddress();
    const { transfer } = yield wallet.send({
      amount: satAmount,
      address: '2N3yemSeDJy27zZqq6MaMoFFzXF3aKCX8xp', // address,
      feeRate: baseFeeRate,
      walletPassphrase
    });
    return transfer.txid;
  }.bind(this));

  const getConfirmedTx = co(function *(wallet) {
    const { transfers } = yield wallet.transfers();
    return transfers.find(transfer => transfer.height !== unconfirmedTxHeight).txid;
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

    console.log(`waiting ${MILLISECONDS_WAIT_IMS / 1000}s for IMS to see tx...`);
    yield Promise.delay(MILLISECONDS_WAIT_IMS);
  }));

  it('fails when there are insufficient funds to bump the transaction', co(function *() {

  }));

  it('fails when the fee needed to accelerate the tx is above the maxFee passed', co(function *() {

  }));

  it('can accelerate an unconfirmed tx', co(function *() {
    const result = yield wallet.accelerateTransaction({
      cpfpTxIds: [unconfirmedTx],
      cpfpFeeRate,
      maxFee: 1000000,
      recipients: [], // TODO(#179): remove me when #179 lands
      walletPassphrase
    });

    should.exist(result.txid);
    should.exist(result.transfer);
    should.exist(result.transfer.feeString);
    const fee = Number(result.transfer.feeString);
    const vSize = result.transfer.vSize;
    const minimumFee = (2 * vSize * cpfpFeeRate - vSize * baseFeeRate) / 1000;
    fee.should.be.greaterThanOrEqual(minimumFee);
  }));

  it('does not accelerate high fee ancestor set', co(function *() {
    yield Promise.delay(MILLISECONDS_WAIT_IMS);
    const transactionC = yield getUnconfirmedTx(wallet);
    yield Promise.delay(MILLISECONDS_WAIT_IMS);
    const result = yield wallet.accelerateTransaction({
      cpfpTxIds: [transactionC],
      cpfpFeeRate: newCpfpFeeRate,
      maxFee: 1000000,
      recipients: [], // TODO(#179): remove me when #179 lands
      walletPassphrase
    });

    should.exist(result.txid);
    should.exist(result.transfer);
    should.exist(result.transfer.feeString);
    const fee = Number(result.transfer.feeString);
    const vSize = result.transfer.vSize;
    const minimumFee = (2 * vSize * newCpfpFeeRate - vSize * baseFeeRate) / 1000;
    fee.should.be.greaterThanOrEqual(minimumFee);
    fee.should.be.lessThanOrEqual(minimumFee * 1.1);
  }));

  it('can accelerate an entire ancestor set', co(function *() {
    const evenNewerCpfpFeeRate = 20000;
    yield Promise.delay(MILLISECONDS_WAIT_IMS);
    const result = yield wallet.accelerateTransaction({
      cpfpTxIds: [unconfirmedTx],
      cpfpFeeRate: evenNewerCpfpFeeRate,
      maxFee: 1000000,
      recipients: [], // TODO(#179): remove me when #179 lands
      walletPassphrase
    });

    should.exist(result.txid);
    should.exist(result.transfer);
    should.exist(result.transfer.feeString);
    const fee = Number(result.transfer.feeString);
    const vSize = result.transfer.vSize;
    const minimumFee = (5 * vSize * evenNewerCpfpFeeRate - 2 * vSize * cpfpFeeRate - 2 * vSize * newCpfpFeeRate) / 1000;
    fee.should.be.greaterThanOrEqual(minimumFee);
  }));

  it('fails when attempting to bump an already confirmed transaction', co(function *() {
    const confirmedTx = yield getConfirmedTx(wallet);
    try {
      yield wallet.accelerateTransaction({
        cpfpTxIds: [confirmedTx],
        cpfpFeeRate,
        maxFee: 1000000,
        recipients: [], // TODO(#179): remove me when #179 lands
        walletPassphrase
      });
      throw new Error('expected error was not thrown');
    } catch (err) {
      // error message format below
      // no unconfirmed tx with id {tx id} requestId={request id}
      err.message.should.containEql(`no unconfirmed tx with id ${confirmedTx}`);
    }
  }));
});

