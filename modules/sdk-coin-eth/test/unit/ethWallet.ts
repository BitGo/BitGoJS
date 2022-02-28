import should from 'should';
import { bip32 } from '@bitgo/utxo-lib';
import * as secp256k1 from 'secp256k1';
import nock from 'nock';
import sinon from 'sinon';
import { common, Util } from '@bitgo/sdk-core';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import { Capability, Transaction as EthTx } from '@ethereumjs/tx';
const fixtures = require('../fixtures/eth');

import { BitGoAPI } from '@bitgo/sdk-api';
import { Erc20Token, SignTransactionOptions, Teth } from '../../src';
import { getBuilder } from './getBuilder';

describe('Sign ETH Transaction', async function () {
  let bitgo: TestBitGoAPI;
  let ethWallet;
  let recipients;
  let tx;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.initializeTestVars();
    bitgo.safeRegister('teth', Teth.createInstance);
    const coin = bitgo.coin('teth');
    ethWallet = coin.newWalletObject({});
    recipients = [
      {
        address: '0xe59dfe5c67114b39a5662cc856be536c614124c0',
        amount: '100000',
      },
    ];
    tx = { recipients, nextContractSequenceId: 0 };
  });

  it('should read transaction recipients from txPrebuild even if none are specified as top-level params', async function () {
    sinon.stub(Util, 'xprvToEthPrivateKey');
    sinon.stub(Util, 'ethSignMsgHash');
    sinon.stub(ethWallet.getOperationSha3ForExecuteAndConfirm);

    const { halfSigned } = (await ethWallet.signTransaction({ txPrebuild: tx, prv: 'my_user_prv' })) as any;
    halfSigned.should.have.property('recipients', recipients);
    sinon.restore();
  });

  it('should throw an error if no recipients are in the txPrebuild and none are specified as params', async function () {
    await ethWallet
      .signTransaction({ txPrebuild: {}, prv: 'my_user_prv' })
      .should.be.rejectedWith('recipients missing or not array');
  });

  it('should throw an error if the recipients param is not an array', async function () {
    await ethWallet
      .signTransaction({ txPrebuild: { recipients: 'not-array' }, prv: 'my_user_prv' })
      .should.be.rejectedWith('recipients missing or not array');
  });

  it('should set isBatch to false if single recipient', async function () {
    sinon.stub(Util, 'xprvToEthPrivateKey');
    sinon.stub(Util, 'ethSignMsgHash');
    sinon.stub(ethWallet.getOperationSha3ForExecuteAndConfirm);
    const singleRecipientsTx = { recipients: recipients, nextContractSequenceId: 0, isBatch: false };
    const { halfSigned } = (await ethWallet.signTransaction({
      txPrebuild: singleRecipientsTx,
      prv: 'my_user_prv',
    })) as any;
    halfSigned.should.have.property('recipients', recipients);
    halfSigned.should.have.property('isBatch', false);
    sinon.restore();
  });

  it('should set isBatch to true if multiple recipients', async function () {
    const multipleRecipients = [
      {
        address: '0x0c7f3bc5d2b2c0dbee1b45536b82569f41b54331',
        amount: '200',
        data: '0xcf4c58e2000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000431745b89e73230b3bc8a19e019194efb4b99efd000000000000000000000000431745b89e73230b3bc8a19e019194efb4b99efd000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000064',
      },
    ];

    const multipleRecipientsTx = { recipients: multipleRecipients, nextContractSequenceId: 0, isBatch: true };

    sinon.stub(Util, 'xprvToEthPrivateKey');
    sinon.stub(Util, 'ethSignMsgHash');
    sinon.stub(ethWallet.getOperationSha3ForExecuteAndConfirm);
    const { halfSigned } = (await ethWallet.signTransaction({
      txPrebuild: multipleRecipientsTx,
      prv: 'my_user_prv',
    })) as any;
    halfSigned.should.have.property('isBatch', true);
    sinon.restore();
  });
});

describe('Ethereum Hop Transactions', function () {
  let bitgo: TestBitGoAPI;
  let ethWallet;
  let tx;
  let txid;
  let bitgoSignature;
  let bitgoKeyXprv;
  let bgUrl;
  let env;

  const userKeypair = {
    xprv: 'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k',
    xpub: 'xpub661MyMwAqRbcF9Nc7TbBo1rZAagiWEVPWKbDKThNG8zqjk76HAKLkaSbTn6dK2dQPfuD7xjicxCZVWvj67fP5nQ9W7QURmoMVAX8m6jZsGp',
    rawPub: '02c103ac74481874b5ef0f385d12725e4f14aedc9e00bc814ce96f47f62ce7adf2',
    rawPrv: '936c5af3f8af81f75cdad1b08f29e7d9c01e598e2db2d7be18b9e5a8646e87c6',
    path: 'm',
    walletSubPath: '/0/0',
  };

  before(function () {
    tx =
      '0xf86c82015285012a05f200825208945208d8e80c6d1aef9be37b4bd19a9cf75ed93dc886b5e620f480008026a00e13f9e0e11337b2b0227e3412211d3625e43f1083fda399cc361dd4bf89083ba06c801a761e0aa3bc8db0ac2568d575b0fb306a1f04f4d5ba82ba3cc0ea0a83bd';
    txid = '0x0ac669c5fef8294443c75a31e32c44b97bbc9e43a18ea8beabcc2a3b45eb6ffa';
    bitgoKeyXprv =
      'xprv9s21ZrQH143K3tpWBHWe31sLoXNRQ9AvRYJgitkKxQ4ATFQMwvr7hHNqYRUnS7PsjzB7aK1VxqHLuNQjj1sckJ2Jwo2qxmsvejwECSpFMfC';
    const bitgoKey = bip32.fromBase58(bitgoKeyXprv);
    if (!bitgoKey.privateKey) {
      throw new Error('no privateKey');
    }
    const bitgoXpub = bitgoKey.neutered().toBase58();
    bitgoSignature =
      '0xaa' +
      Buffer.from(secp256k1.ecdsaSign(Buffer.from(txid.slice(2), 'hex'), bitgoKey.privateKey).signature).toString(
        'hex'
      );

    env = 'test';
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    bitgo.safeRegister('teth', Teth.createInstance);
    common.Environments[env].hsmXpub = bitgoXpub;
    bitgo.initializeTestVars();
    bgUrl = common.Environments[bitgo.getEnv()].uri;
    const coin = bitgo.coin('teth');
    ethWallet = coin.newWalletObject({ keys: ['user', 'backup', 'bitgo'] });
  });

  describe('Verify HSM Hop prebuild', function () {
    let prebuild;
    let buildParams;
    let finalRecipient;
    let sendAmount;

    before(function () {
      finalRecipient = '0x5208d8e80c6d1aef9be37b4bd19a9cf75ed93dc8';
      sendAmount = '200000000000000';
      prebuild = {
        tx,
        id: txid,
        signature: bitgoSignature,
      };
      buildParams = {
        recipients: [
          {
            address: finalRecipient,
            amount: sendAmount,
          },
        ],
      };
    });

    it('should accept a valid hop prebuild', async function () {
      await ethWallet.baseCoin.validateHopPrebuild(ethWallet, prebuild, buildParams).should.be.resolved();
    });

    it('should fail if the HSM prebuild recipient is wrong', async function () {
      const badBuildParams = JSON.parse(JSON.stringify(buildParams));
      badBuildParams.recipients[0].address = '0x54bf1609aeed804aa231f08c53dbb18f7d374615';

      await ethWallet.baseCoin
        .validateHopPrebuild(ethWallet, prebuild, badBuildParams)
        .should.be.rejectedWith(/does not equal original recipient/);
    });

    it('should fail if the HSM prebuild tx amount is wrong', async function () {
      const badBuildParams = JSON.parse(JSON.stringify(buildParams));
      badBuildParams.recipients[0].amount = '50000000';

      await ethWallet.baseCoin
        .validateHopPrebuild(ethWallet, prebuild, badBuildParams)
        .should.be.rejectedWith(/does not equal original amount/);
    });

    it('should fail if the HSM signature is invalid', async function () {
      // Mocking a different BitGo key means the signing key should be wrong (it maps to a different address than this xpub)
      const goodXpub = common.Environments[env].hsmXpub;
      common.Environments[env].hsmXpub =
        'xpub661MyMwAqRbcErFqVXGiUFv9YeoPbhN72UiNCUdj9nj3T6M8h7iKNmbCYpMVWVZP7LA2ma3HWcPngz1gRTm4FPdtm9mHfrNvU93MCoszsGL';

      await ethWallet.baseCoin
        .validateHopPrebuild(ethWallet, prebuild, buildParams)
        .should.be.rejectedWith(/Hop txid signature invalid/);
      common.Environments[env].hsmXpub = goodXpub;
    });

    it('should fail if the HSM signature signed the wrong HSM commitment digest', async function () {
      const badTxid = '0xb4b3827a529c9166786e796528017889ac5027255b65b3fa2a3d3ad91244a12b';
      const badTxidBuffer = Buffer.from(badTxid.slice(2), 'hex');
      const xprvNode = bip32.fromBase58(bitgoKeyXprv);
      if (!xprvNode.privateKey) {
        throw new Error('no privateKey');
      }
      const badSignature =
        '0xaa' + Buffer.from(secp256k1.ecdsaSign(badTxidBuffer, xprvNode.privateKey).signature).toString('hex');
      const badPrebuild = JSON.parse(JSON.stringify(prebuild));
      badPrebuild.signature = badSignature;

      await ethWallet.baseCoin
        .validateHopPrebuild(ethWallet, badPrebuild, buildParams)
        .should.be.rejectedWith(/Hop txid signature invalid/);
    });
  });

  describe('Prebuild hop transaction', function () {
    let prebuild;
    let buildParams;
    let finalRecipient;
    let sendAmount;
    let gasLimitEstimate;
    let gasPrice;

    const nockUserKey = function () {
      nock(bgUrl)
        .get(`/api/v2/teth/key/user`)
        .reply(200, {
          encryptedPrv: bitgo.encrypt({ input: userKeypair.xprv, password: TestBitGo.TEST_WALLET1_PASSCODE }),
          path: userKeypair.path + userKeypair.walletSubPath,
        });
    };
    const nockFees = function () {
      const scope = nock(bgUrl)
        .get('/api/v2/teth/tx/fee')
        .query(true)
        .reply(200, {
          gasLimitEstimate: gasLimitEstimate,
          feeEstimate: gasLimitEstimate * gasPrice,
        });
      return scope;
    };

    const nockBuild = function (walletId) {
      nock(bgUrl)
        .post('/api/v2/teth/wallet/' + walletId + '/tx/build')
        .reply(200, { hopTransaction: prebuild, buildParams });
    };

    before(function () {
      gasLimitEstimate = 100000;
      gasPrice = 50000000;
      finalRecipient = '0x5208d8e80c6d1aef9be37b4bd19a9cf75ed93dc8';
      sendAmount = '200000000000000';
      prebuild = {
        tx,
        id: txid,
        signature: bitgoSignature,
      };
      buildParams = {
        recipients: [
          {
            address: finalRecipient,
            amount: sendAmount,
          },
        ],
        hop: true,
        walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE,
      };
    });

    it('should prebuild a hop transaction if given the correct args', async function () {
      nockUserKey();
      const feeScope = nockFees();
      nockBuild(ethWallet.id());
      const res = (await ethWallet.prebuildTransaction(buildParams)) as any;
      should.exist(res.hopTransaction);
      should.exist(res.hopTransaction.tx);
      should.exist(res.hopTransaction.tx);
      should.exist(res.hopTransaction.id);
      should.exist(res.hopTransaction.signature);
      should.not.exist(res.wallet);
      should.not.exist(res.buildParams);
      feeScope.isDone().should.equal(true);
      const feeReq = (feeScope as any).interceptors[0].req;
      feeReq.path.should.containEql('hop=true');
      feeReq.path.should.containEql('recipient=' + finalRecipient);
      feeReq.path.should.containEql('amount=' + sendAmount);
    });
  });
});

describe('Add final signature to ETH tx from offline vault', function () {
  let paramsFromVault, expectedResult, bitgo, coin;
  before(function () {
    const vals = fixtures.getHalfSignedTethFromVault();
    paramsFromVault = vals.paramsFromVault;
    expectedResult = vals.expectedResult;
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    coin = bitgo.coin('teth');
  });

  it('should successfully fully sign a half-signed transaction from the offline vault', async function () {
    const response = (await coin.signTransaction(paramsFromVault)) as any;
    const expectedTx = EthTx.fromSerializedTx(Buffer.from(expectedResult.txHex, 'hex'));
    const actualTx = EthTx.fromSerializedTx(Buffer.from(response.txHex, 'hex'));
    actualTx.nonce.toString().should.deepEqual(expectedTx.nonce.toString());
    should.exist(actualTx.to);
    actualTx.to?.should.deepEqual(expectedTx.to);
    actualTx.value.should.deepEqual(expectedTx.value);
    actualTx.data.should.deepEqual(expectedTx.data);
    actualTx.isSigned().should.equal(true);
    actualTx.supports(Capability.EIP155ReplayProtection).should.equal(false);
    actualTx.verifySignature().should.equal(true);
    should.exist(actualTx.v);
    actualTx?.v?.toString().should.deepEqual(expectedTx?.v?.toString());
    actualTx?.r?.toString().should.deepEqual(expectedTx?.r?.toString());
    actualTx?.s?.toString().should.deepEqual(expectedTx?.s?.toString());
    actualTx.gasPrice.toString().should.deepEqual(expectedTx.gasPrice.toString());
    actualTx.gasLimit.toString().should.deepEqual(expectedTx.gasLimit.toString());
    response.txHex.toString().should.equal(expectedResult.txHex.toString());
  });
});

describe('Add signature to EIP1559 tx from offline vault', function () {
  let bitgo: TestBitGoAPI;
  let paramsFromVault, expectedResult, coin;
  before(function () {
    const vals = fixtures.getUnsignedEip1559TethFromVault();
    paramsFromVault = vals.paramsFromVault;
    expectedResult = vals.expectedResult;
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('teth', Teth.createInstance);
    coin = bitgo.coin('teth');
  });

  it('should successfully sign an unsigned transaction from the offline vault', async function* () {
    const response = await coin.signTransaction(paramsFromVault);
    should.exist(response.halfSigned);
    response.halfSigned.eip1559.should.deepEqual(expectedResult.halfSigned.eip1559);
    response.halfSigned.recipients.should.deepEqual(expectedResult.halfSigned.recipients);
  });
});

describe('prebuildTransaction', function () {
  let bitgo: TestBitGoAPI;
  let ethWallet;
  let recipients;
  let bgUrl;
  let gasLimit;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    Erc20Token.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.safeRegister('teth', Teth.createInstance);
    bitgo.initializeTestVars();
    const coin = bitgo.coin('teth');
    ethWallet = coin.newWalletObject({});
    gasLimit = 2100000;
    recipients = [
      {
        address: '0xe59dfe5c67114b39a5662cc856be536c614124c0',
        amount: '100000',
      },
    ];
    bgUrl = common.Environments[bitgo.getEnv()].uri;
  });

  it('should successfully accept gasLimit as a param', async function () {
    const scope = nock(bgUrl)
      .post('/api/v2/teth/wallet/' + ethWallet.id() + '/tx/build', {
        recipients,
        gasLimit,
      })
      .reply(200, { success: true });
    const prebuild = await ethWallet.prebuildTransaction({ recipients, gasLimit });
    scope.isDone().should.equal(true);
    prebuild.success.should.equal(true);
  });

  it('should reject hop param for an erc20 token build', async function () {
    const token = bitgo.coin('terc');
    const tokenWallet = token.newWalletObject({});
    recipients = [
      {
        address: '0xe59dfe5c67114b39a5662cc856be536c614124c0',
        amount: '100',
      },
    ];
    await tokenWallet
      .prebuildTransaction({ recipients, hop: true, walletPassphrase: 'hi' })
      .should.be.rejectedWith(
        `Hop transactions are not enabled for ERC-20 tokens, nor are they necessary. Please remove the 'hop' parameter and try again.`
      );
  });
});

describe('final-sign transaction from WRW', function () {
  it('should add a second signature to unsigned sweep for teth', async function () {
    const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });

    const basecoin: any = bitgo.coin('teth');
    const gasPrice = 200000000000;
    const gasLimit = 500000;
    const prv =
      'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2'; // placeholder test prv
    const tx = {
      txPrebuild: fixtures.WRWUnsignedSweepETHTx,
      prv,
    };
    // sign transaction once
    const halfSigned = await basecoin.signTransaction(tx);

    const wrapper = {} as SignTransactionOptions;
    wrapper.txPrebuild = halfSigned;
    wrapper.txPrebuild.recipients = halfSigned.halfSigned.recipients;
    wrapper.txPrebuild.gasPrice = gasPrice.toString();
    wrapper.txPrebuild.gasLimit = gasLimit.toString();
    wrapper.isLastSignature = true;
    wrapper.walletContractAddress = fixtures.WRWUnsignedSweepETHTx.walletContractAddress;
    wrapper.prv = prv;

    // sign transaction twice with the "isLastSignature" flag
    const finalSignedTx = await basecoin.signTransaction(wrapper);
    finalSignedTx.should.have.property('txHex');
    const txBuilder = getBuilder('eth');
    txBuilder.from('0x' + finalSignedTx.txHex); // add a 0x in front of this txhex
    const rebuiltTx = await txBuilder.build();
    const outputs = rebuiltTx.outputs.map((output) => {
      return {
        address: output.address,
        amount: output.value,
      };
    });
    rebuiltTx.signature.length.should.equal(2);
    outputs.length.should.equal(1);
    outputs[0].address.should.equal(fixtures.WRWUnsignedSweepETHTx.recipient.address);
    outputs[0].amount.should.equal(fixtures.WRWUnsignedSweepETHTx.recipient.amount);
  });

  it('should add a second signature to unsigned sweep for erc20 token', async function () {
    const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    Erc20Token.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    const basecoin: any = bitgo.coin('tdai');
    const gasPrice = 200000000000;
    const gasLimit = 500000;
    const prv =
      'xprv9s21ZrQH143K3399QBVvbmhs4RB5QzXD8XiW3NwtaeTem93QGd5VNjukUnwJQ94nUgugHSVzSVVe3RP16Urv1ZyijpYdyDamsxf2Shbq4w1'; // placeholder test prv
    const tx = {
      txPrebuild: fixtures.WRWUnsignedSweepERC20Tx,
      prv,
    };
    // sign transaction once
    const halfSigned = await basecoin.signTransaction(tx);

    const wrapper = {} as SignTransactionOptions;
    wrapper.txPrebuild = halfSigned;
    wrapper.txPrebuild.recipients = halfSigned.halfSigned.recipients;
    wrapper.txPrebuild.gasPrice = gasPrice.toString();
    wrapper.txPrebuild.gasLimit = gasLimit.toString();
    wrapper.isLastSignature = true;
    wrapper.walletContractAddress = fixtures.WRWUnsignedSweepERC20Tx.walletContractAddress;
    wrapper.prv = prv;

    // sign transaction twice with the "isLastSignature" flag
    const finalSignedTx = await basecoin.signTransaction(wrapper);
    finalSignedTx.should.have.property('txHex');
    const txBuilder = getBuilder('eth');
    txBuilder.from('0x' + finalSignedTx.txHex); // add a 0x in front of this txhex
    const rebuiltTx = await txBuilder.build();
    const outputs = rebuiltTx.outputs.map((output) => {
      return {
        address: output.address,
        amount: output.value,
      };
    });
    rebuiltTx.signature.length.should.equal(2);
    outputs.length.should.equal(1);
    outputs[0].address.should.equal(fixtures.WRWUnsignedSweepERC20Tx.recipient.address);
    outputs[0].amount.should.equal(fixtures.WRWUnsignedSweepERC20Tx.recipient.amount);
  });
});
