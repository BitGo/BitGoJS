const should = require('should');
import { AccountCoin, BaseUnit, CoinFeature, KeyCurve, Networks, UnderlyingAsset } from '../../src';
import { account, txrpToken, xrpToken } from '../../src/account';

describe('account', function () {
  it('should create an account coin with default properties', function () {
    const foo = account(
      'a3a12458-47a2-4b67-a8a6-a16a0779b5e8',
      'tfoo',
      'Foo Coin',
      Networks.test.goerli,
      123,
      UnderlyingAsset.ETH,
      BaseUnit.ETH
    );
    should(foo.id).equal('a3a12458-47a2-4b67-a8a6-a16a0779b5e8');
    should(foo.name).equal('tfoo');
    should(foo.fullName).equal('Foo Coin');
    should(foo.network).deepEqual(Networks.test.goerli);
    should(foo.decimalPlaces).equal(123);
    should(foo.asset).equal(UnderlyingAsset.ETH);
    should(foo.baseUnit).equal(BaseUnit.ETH);
    should(foo.isToken).equal(false);
    should(foo.features).deepEqual(AccountCoin.DEFAULT_FEATURES);
    should(foo.prefix).equal('');
    should(foo.suffix).equal('TFOO');
    should(foo.primaryKeyCurve).equal('secp256k1');
    should(foo.baseUnit).equal('wei');
    should(foo.kind).equal('crypto');
    should(foo.family).equal('eth');
    should(foo.asset).equal('eth');
    should(foo.restrictedCountries).equal(undefined);
  });

  it('should create an account coin with additional properties', function () {
    const foo = account(
      'a3a12458-47a2-4b67-a8a6-a16a0779b5e8',
      'tfoo',
      'Foo Coin',
      Networks.test.goerli,
      123,
      UnderlyingAsset.ETH,
      BaseUnit.ETH,
      [...AccountCoin.DEFAULT_FEATURES, CoinFeature.DEPRECATED],
      KeyCurve.Ed25519,
      'prefix',
      'TFOO Suffix',
      true,
      { restrictedCountries: ['USA'] }
    );
    should(foo.id).equal('a3a12458-47a2-4b67-a8a6-a16a0779b5e8');
    should(foo.name).equal('tfoo');
    should(foo.fullName).equal('Foo Coin');
    should(foo.network).deepEqual(Networks.test.goerli);
    should(foo.decimalPlaces).equal(123);
    should(foo.asset).equal(UnderlyingAsset.ETH);
    should(foo.baseUnit).equal(BaseUnit.ETH);
    should(foo.isToken).equal(true);
    should(foo.features).deepEqual([...AccountCoin.DEFAULT_FEATURES, CoinFeature.DEPRECATED]);
    should(foo.prefix).equal('prefix');
    should(foo.suffix).equal('TFOO Suffix');
    should(foo.primaryKeyCurve).equal('ed25519');
    should(foo.baseUnit).equal('wei');
    should(foo.kind).equal('crypto');
    should(foo.family).equal('eth');
    should(foo.asset).equal('eth');
    should(foo.restrictedCountries).deepEqual(['USA']);
  });
});

describe('XRP', () => {
  it('should create a new XRP token with the correct properties', () => {
    const token = xrpToken(
      'cebb0ba8-6736-46bb-a006-5db7b5b3c376',
      'token-name',
      'Token fullname',
      15,
      'issuer-address',
      'TST',
      'www.example.com',
      UnderlyingAsset.XRP
    );
    should(token.id).equal('cebb0ba8-6736-46bb-a006-5db7b5b3c376');
    should(token.name).equal('token-name');
    should(token.fullName).equal('Token fullname');
    should(token.decimalPlaces).equal(15);
    should(token.issuerAddress).equal('issuer-address');
    should(token.currencyCode).equal('TST');
    should(token.domain).equal('www.example.com');
    should(token.asset).equal(UnderlyingAsset.XRP);
    should(token.features).deepEqual(AccountCoin.DEFAULT_FEATURES);
    should(token.prefix).equal('');
    should(token.suffix).equal('TOKEN-NAME');
    should(token.network).deepEqual(Networks.main.xrp);
    should(token.primaryKeyCurve).equal('secp256k1');
    should(token.isToken).equal(true);
    should(token.baseUnit).equal('drop');
  });
  it('should create a new TXRP token with the correct properties', () => {
    const token = txrpToken(
      'cebb0ba8-6736-46bb-a006-5db7b5b3c376',
      'token-name',
      'Token fullname',
      15,
      'issuer-address',
      'TST',
      'www.example.com',
      UnderlyingAsset.XRP
    );
    should(token.id).equal('cebb0ba8-6736-46bb-a006-5db7b5b3c376');
    should(token.name).equal('token-name');
    should(token.fullName).equal('Token fullname');
    should(token.decimalPlaces).equal(15);
    should(token.issuerAddress).equal('issuer-address');
    should(token.currencyCode).equal('TST');
    should(token.domain).equal('www.example.com');
    should(token.asset).equal(UnderlyingAsset.XRP);
    should(token.features).deepEqual(AccountCoin.DEFAULT_FEATURES);
    should(token.prefix).equal('');
    should(token.suffix).equal('TOKEN-NAME');
    should(token.network).deepEqual(Networks.test.xrp);
    should(token.primaryKeyCurve).equal('secp256k1');
    should(token.isToken).equal(true);
    should(token.baseUnit).equal('drop');
  });
});
