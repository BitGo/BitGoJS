const should = require('should');
import { AccountCoin, Networks, UnderlyingAsset } from '../../src';
import { txrpToken, xrpToken } from '../../src/account';

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
