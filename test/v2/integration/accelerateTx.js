require('should');
const co = require('bluebird').coroutine;

const BitGoJS = require('../../../src');

describe('AccelerateTx', function() {
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

  it('can accelerate unconfirmed tx', co(function *() {
    console.log('acclerateTx..');
    const result = yield wallet.accelerateTransaction({
      cpfpTxIds: [unconfirmedTx],
      cpfpFeeRate,
      maxFee: 1000000
    });
    console.log('result', result);
  }));
});

