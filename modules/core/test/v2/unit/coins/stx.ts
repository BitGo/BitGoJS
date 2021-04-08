import * as PromiseB from 'bluebird';
import { Stx, Tstx } from '../../../../src/v2/coins/';

const co = PromiseB.coroutine;
import { TestBitGo } from '../../../lib/test_bitgo';
import * as testData from '../../fixtures/coins/stx';

describe('STX:', function() {
  let bitgo;
  let basecoin;

  before(function() {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tstx');
  });

  it('should instantiate the coin', function() {
    let localBasecoin = bitgo.coin('tstx');
    localBasecoin.should.be.an.instanceof(Tstx);

    localBasecoin = bitgo.coin('stx');
    localBasecoin.should.be.an.instanceof(Stx);
  });


  it('should check valid addresses', (function() {
    const badAddresses = [
      '',
      null,
      'abc',
      'SP244HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6',
      'ST1T758K6T2YRKG9Q0TJ16B6FP5QQREWZSESRS0PY',
    ];
    const goodAddresses = [
      'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6',
      'ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y',
      'SP2T758K6T2YRKG9Q0TJ16B6FP5QQREWZSESRS0PY',
      'SP2T758K6T2YRKG9Q0TJ16B6FP5QQREWZSESRS0PY',
    ];

    badAddresses.map(addr => { basecoin.isValidAddress(addr).should.equal(false); });
    goodAddresses.map(addr => { basecoin.isValidAddress(addr).should.equal(true); });
  }));


  it('should explain a transfer transaction', async function() {
    const explain = await basecoin.explainTransaction({
      txHex: testData.txForExplainTransfer,
      feeInfo: { fee: '' },
    });
    explain.id.should.equal(testData.txExplainedTransfer.id);
    explain.outputAmount.should.equal(testData.txExplainedTransfer.outputAmount);
    explain.outputs[0].amount.should.equal(testData.txExplainedTransfer.outputAmount);
    explain.outputs[0].address.should.equal(testData.txExplainedTransfer.recipient);
    explain.outputs[0].memo.should.equal(testData.txExplainedTransfer.memo);
    explain.fee.should.equal(testData.txExplainedTransfer.fee);
    explain.changeAmount.should.equal('0');
  });


  it('should explain a contract call transaction', async function() {
    const explain = await basecoin.explainTransaction({
      txHex: testData.txForExplainContract,
      feeInfo: { fee: '' },
    });
    explain.id.should.equal(testData.txExplainedContract.id);
    explain.fee.should.equal(testData.txExplainedContract.fee);
    explain.contractAddress.should.equal(testData.txExplainedContract.contractAddress);
    explain.contractName.should.equal(testData.txExplainedContract.contractName);
    explain.contractFunction.should.equal(testData.txExplainedContract.functionName);
    explain.contractFunctionArgs[0].type.should.equal(testData.txExplainedContract.functionArgs[0].type);
    explain.contractFunctionArgs[0].value.should.equal(testData.txExplainedContract.functionArgs[0].value);
  });


  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function() {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');
    });

    it('should generate a keypair from a seed', function() {
      const seedText = '80350b4208d381fbfe2276a326603049fe500731c46d3c9936b5ce036b51377f24bab7dd0c2af7f107416ef858ff79b0670c72406dad064e72bb17fc0a9038bb';
      const seed = Buffer.from(seedText, 'hex');
      const keyPair = basecoin.generateKeyPair(seed);
      keyPair.pub.should.equal('xpub661MyMwAqRbcFAwqvSGbk35kJf7CQqdN1w4CMUBBTqH5e3ivjU6D8ugv9hRSgRbRenC4w3ahXdLVahwjgjXhSuQKMdNdn55Y9TNSagBktws');
      keyPair.prv.should.equal('xprv9s21ZrQH143K2gsNpQjbNu91kdGi1NuWei8bZ5mZuVk6mFPnBvmxb7NSJQdbZW3FGpK3Ycn7jorAXcEzMvviGtbyBz5tBrjfnWyQp3g75FK');
    });
  });
});
