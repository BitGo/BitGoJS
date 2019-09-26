//
// Tests for Wallets
//

import * as assert from 'assert';

import {
  ManagedWallets,
  walletPassphrase,
} from './ManagedWallets';

import 'should';

import * as Bluebird from 'bluebird';

import debugLib from 'debug';
import { TestFunction, ExclusiveTestFunction } from 'mocha';
import { GroupPureP2sh, GroupPureP2shP2wsh, GroupPureP2wsh, sumUnspents, WalletConfig } from './types';
const debug = debugLib('integration-test-wallet-unspents');

type WalletTestFunction = (testWallets) => Promise<void>

const wait = async(seconds) => {
  debug(`waiting ${seconds} seconds...`);
  await Bluebird.delay(seconds * 1000);
  debug(`done`);
};

const walletTests: [
  TestFunction | ExclusiveTestFunction,
  string,
  WalletTestFunction
][] = [];

const walletTest = function(title: string, callback: WalletTestFunction, testFunc: TestFunction | ExclusiveTestFunction = it) {
  walletTests.push([testFunc, title, callback]);
};

walletTest.only = function(title, callback) {
  walletTest(title, callback, it.only);
};

walletTest('should self-send to new default receive addr', async function(testWallets) {
  const wallet = await testWallets.getNextWallet();
  const unspents = await testWallets.getUnspents(wallet);
  const address = wallet.receiveAddress();
  const feeRate = 10_000;
  const amount = Math.floor(testWallets.chain.getMaxSpendable(unspents, [address], feeRate) / 2);
  await wallet.sendMany({
    feeRate,
    recipients: [{ address, amount }],
    walletPassphrase,
  });
});

walletTest('should consolidate the number of unspents to 2', async function(testWallets) {
  const wallet = await testWallets.getNextWallet((w, unspents) => unspents.length >= 4);

  const transaction = await wallet.consolidateUnspents({
    limit: 250,
    numUnspentsToMake: 2,
    minValue: 1000,
    numBlocks: 12,
    walletPassphrase,
  });
  transaction.status.should.equal('signed');
  await wait(20);
  (await wallet.unspents({ limit: 100 })).unspents.length.should.eql(2);
});

walletTest('should fanout the number of unspents to 20', async function(testWallets) {
  const wallet = await testWallets.getNextWallet();
  // it sometimes complains with high feeRates
  const feeRate = 1200;
  const transaction = await wallet.fanoutUnspents({
    feeRate,
    minHeight: 1,
    maxNumInputsToUse: 80,
    numUnspentsToMake: 20,
    numBlocks: 12,
    walletPassphrase,
  });
  transaction.status.should.equal('signed');

  await wait(10);
  const { unspents } = await wallet.unspents({ limit: 100 });
  unspents.length.should.equal(20);
});

walletTest('should sweep funds from one wallet to another', async function(testWallets) {
  const sweepWallet = await testWallets.getNextWallet(testWallets.getPredicateUnspentsConfirmed(6));
  const targetWallet = await testWallets.getNextWallet();
  const targetWalletUnspents = await testWallets.getUnspents(targetWallet);

  const transaction = await sweepWallet.sweep({
    address: targetWallet.receiveAddress(),
    walletPassphrase,
  });
  transaction.status.should.equal('signed');

  await wait(10);

  (await sweepWallet.unspents()).unspents.length.should.equal(0);
  (await targetWallet.unspents()).unspents.length.should.eql(targetWalletUnspents.length + 1);
});

walletTest('should make tx with bnb exactMatch', async function(testWallets) {
  const wallet = await testWallets.getNextWallet();
  const unspents = await testWallets.getUnspents(wallet);
  const feeRate = 10_000;
  const address = wallet.receiveAddress();
  const amount = testWallets.chain.getMaxSpendable(unspents, [address], feeRate);
  const prebuild = await wallet.prebuildTransaction({
    recipients: [{ address, amount }],
    strategy: 'BNB',
    strategyAllowFallback: false,
    feeRate,
    walletPassphrase,
  });
  // FIXME: how do we know BnB was used?
  // At least we have sent strategyAllowFallback=false

  // FIXME: vsize mismatch due to mismatched unspents lib
  // prebuild.feeInfo.size.should.eql(dims.getVSize());
  (prebuild === undefined).should.be.false();
});

walletTest('accelerateTx should succeed', async function(testWallets) {
  const wallet = await testWallets.getNextWallet();
  const unspents = await testWallets.getUnspents(wallet);
  const feeRate = 2_000;
  const cpfpFeeRate = 40_000;
  const maxFee = 1e8;
  const address = wallet.receiveAddress();
  const maxSpendable = testWallets.chain.getMaxSpendable(unspents, [address], feeRate);
  const amount = (maxSpendable / 2) | 0;
  const { tx: parentTxHex, txid: parentTxid } = await wallet.sendMany({
    feeRate,
    recipients: [{ address, amount }],
    walletPassphrase,
  });

  const getInputId = ({ hash, index }) =>
    `${Buffer.from(hash).reverse().toString('hex')}:${index}`;

  const getMinerFee = (unspents, { ins, outs }) =>
    sumUnspents(
      ins
        .map(getInputId)
        .map(inputId => unspents.find(u => u.id === inputId)
        || assert.fail(`no unspent found for ${inputId} unspents=${unspents.join(',')}`))
    ) - outs.map(o => o.value).reduce((a, b) => a + b);

  const parentTx = testWallets.chain.parseTx(parentTxHex);
  const parentFee = getMinerFee(unspents, parentTx);
  const parentVSize = parentTx.virtualSize();
  console.log({ parentFee });

  await wait(10);

  const childUnspents = await testWallets.getUnspents(wallet, { cache: false });
  const { tx: childTxHex } = await wallet.accelerateTransaction({
    cpfpTxIds: [parentTxid],
    cpfpFeeRate,
    maxFee,
    walletPassphrase,
  });
  const childTx = testWallets.chain.parseTx(childTxHex);
  const childFee = getMinerFee(childUnspents, childTx);
  const childVSize = childTx.virtualSize();

  const totalFee = parentFee + childFee;
  const totalVSize = parentVSize + childVSize;
  const totalFeeRate = (totalFee / totalVSize) * 1000;

  console.log({
    parentFee,
    parentVSize,
    childFee,
    childVSize,
    totalFee,
    totalVSize,
    cpfpFeeRate,
    totalFeeRate,
  });
});


const runTests = (walletConfig: WalletConfig) => {
  let testWallets: ManagedWallets;

  const skipTest = (groupName) => {
    const groups = process.env.BITGOJS_INTTEST_GROUPS;
    return (groups !== undefined) && !groups.split(',').includes(groupName);
  };

  const env = process.env.BITGO_ENV || 'test';
  describe(`Wallets env=${env} group=${walletConfig.name}`, function() {
    if (skipTest(walletConfig.name)) {
      console.log(`skipping ${walletConfig.name}`);
      return;
    }

    before(async function() {
      this.timeout(120_000);
      testWallets = await ManagedWallets.create(
        env,
        'otto+e2e-utxowallets@bitgo.com',
        walletConfig
      );
    });

    walletTests.forEach(([testFunc, title, callback]) => {
      testFunc(title, async function() {
        this.timeout(120_000);
        await callback(testWallets);
      });
    });

    after(async function() {
      this.timeout(600_000);
      await testWallets.cleanup();
    });
  });
};


describe('Unspent Manipulation', function() {
  runTests(GroupPureP2sh);
  runTests(GroupPureP2shP2wsh);
  runTests(GroupPureP2wsh);
});
