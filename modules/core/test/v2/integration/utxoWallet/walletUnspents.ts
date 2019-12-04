//
// Tests for Wallets
//

import {
  LabelTracer,
  ManagedWallets,
} from './ManagedWallets';

import 'should';

import * as Bluebird from 'bluebird';

import debugLib from 'debug';
import { TestFunction, ExclusiveTestFunction } from 'mocha';
import { GroupPureP2sh, GroupPureP2shP2wsh, GroupPureP2wsh, WalletConfig } from './types';
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

walletTest('should self-send to new default receive addr', async function(testWallets: ManagedWallets) {
  const wallet = await testWallets.getNextWallet();
  const unspents = await testWallets.getUnspents(wallet);
  const address = wallet.receiveAddress();
  const feeRate = 10_000;
  const amount = Math.floor(testWallets.chain.getMaxSpendable(unspents, [address], feeRate) / 2);
  await wallet.sendMany(testWallets.buildParams({
    feeRate,
    recipients: [{ address, amount }],
  }));
});

walletTest('should consolidate the number of unspents to 2', async function(testWallets: ManagedWallets) {
  const wallet = await testWallets.getNextWallet((w, unspents) => unspents.length >= 4);

  const transaction = await wallet.consolidateUnspents(testWallets.buildParams({
    limit: 250,
    numUnspentsToMake: 2,
    minValue: 1000,
    numBlocks: 12,
  }));
  transaction.status.should.equal('signed');
  await wait(20);
  (await wallet.unspents({ limit: 100 })).unspents.length.should.eql(2);
});

walletTest('should fanout the number of unspents to 20', async function(testWallets: ManagedWallets) {
  const wallet = await testWallets.getNextWallet();
  // it sometimes complains with high feeRates
  const feeRate = 1200;
  const transaction = await wallet.fanoutUnspents(testWallets.buildParams({
    feeRate,
    minHeight: 1,
    maxNumInputsToUse: 80,
    numUnspentsToMake: 20,
    numBlocks: 12,
  }));
  transaction.status.should.equal('signed');

  await wait(10);
  const { unspents } = await wallet.unspents({ limit: 100 });
  unspents.length.should.equal(20);
});

walletTest('should sweep funds from one wallet to another', async function(testWallets: ManagedWallets) {
  const sweepWallet = await testWallets.getNextWallet(testWallets.getPredicateUnspentsConfirmed(6));
  const targetWallet = await testWallets.getNextWallet();
  const targetWalletUnspents = await testWallets.getUnspents(targetWallet);

  const transaction = await sweepWallet.sweep(testWallets.buildParams({
    address: targetWallet.receiveAddress(),
  }));
  transaction.status.should.equal('signed');

  await wait(10);

  (await sweepWallet.unspents()).unspents.length.should.equal(0);
  (await targetWallet.unspents()).unspents.length.should.eql(targetWalletUnspents.length + 1);
});

walletTest('should make tx with bnb exactMatch', async function(testWallets: ManagedWallets) {
  const wallet = await testWallets.getNextWallet();
  const unspents = await testWallets.getUnspents(wallet);
  const feeRate = 10_000;
  const address = wallet.receiveAddress();
  const amount = testWallets.chain.getMaxSpendable(unspents, [address], feeRate);
  const prebuild = await wallet.prebuildTransaction(testWallets.buildParams({
    recipients: [{ address, amount }],
    strategy: 'BNB',
    strategyAllowFallback: false,
    feeRate,
  }));
  // FIXME: how do we know BnB was used?
  // At least we have sent strategyAllowFallback=false

  // FIXME: vsize mismatch due to mismatched unspents lib
  // prebuild.feeInfo.size.should.eql(dims.getVSize());
  (prebuild === undefined).should.be.false();
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
        testWallets.debug(title);
        testWallets.setClientLabel(title);
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
