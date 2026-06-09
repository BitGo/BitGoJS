import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { XrpMptToken, XrpToken } from '../../src';

describe('Xrp Tokens', function () {
  let bitgo: TestBitGoAPI;
  let xrpTokenCoin;
  const tokenName = 'txrp:rlusd';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    XrpToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    xrpTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    xrpTokenCoin.getChain().should.equal(tokenName);
    xrpTokenCoin.getBaseChain().should.equal('txrp');
    xrpTokenCoin.getFullName().should.equal('Xrp Token');
    xrpTokenCoin.getBaseFactor().should.equal(1000000000000000);
    xrpTokenCoin.type.should.equal(tokenName);
    xrpTokenCoin.name.should.equal('RLUSD');
    xrpTokenCoin.coin.should.equal('txrp');
    xrpTokenCoin.network.should.equal('Testnet');
    xrpTokenCoin.decimalPlaces.should.equal(15);
    xrpTokenCoin.contractAddress.should.equal(
      'rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV::524C555344000000000000000000000000000000'
    );
    xrpTokenCoin.issuerAddress.should.equal('rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV');
    xrpTokenCoin.currencyCode.should.equal('524C555344000000000000000000000000000000');
  });
});

describe('Xrp MPT Tokens', function () {
  let bitgo: TestBitGoAPI;
  let mptCoin: XrpMptToken;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    XrpMptToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    mptCoin = bitgo.coin('txrp:sec0') as XrpMptToken;
  });

  it('should register all testnet MPT tokens', function () {
    const names = XrpMptToken.createTokenConstructors().map(({ name }) => name);
    names.should.containEql('txrp:sec0');
    names.should.containEql('txrp:sec2');
    names.should.containEql('txrp:wrapt');
    names.should.containEql('txrp:ntsec');
    names.should.containEql('txrp:feesec');
  });

  it('should return constants for txrp:sec0', function () {
    mptCoin.getChain().should.equal('txrp:sec0');
    mptCoin.getBaseChain().should.equal('txrp');
    mptCoin.getFullName().should.equal('XRP MPT Token');
    mptCoin.getBaseFactor().should.equal(1); // assetScale 0 → 10^0
    mptCoin.coin.should.equal('txrp');
    mptCoin.network.should.equal('Testnet');
    mptCoin.decimalPlaces.should.equal(0);
    mptCoin.contractAddress.should.equal('01135794225BAA3A7F9DA001AF93FB258C517F50E20DE771');
    mptCoin.canTransfer.should.equal(true);
  });

  it('should reflect canTransfer=false for non-transferable tokens', function () {
    const ntsec = bitgo.coin('txrp:ntsec') as XrpMptToken;
    ntsec.canTransfer.should.equal(false);
    ntsec.contractAddress.should.equal('01135791225BAA3A7F9DA001AF93FB258C517F50E20DE771');
  });

  it('should return correct baseFactor for tokens with non-zero assetScale', function () {
    const sec2 = bitgo.coin('txrp:sec2') as XrpMptToken; // assetScale 2
    sec2.getBaseFactor().should.equal(100); // 10^2

    const wrapt = bitgo.coin('txrp:wrapt') as XrpMptToken; // assetScale 8
    wrapt.getBaseFactor().should.equal(100000000); // 10^8
  });
});
