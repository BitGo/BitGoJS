import { CoinFamily, CoinFeature, coins } from '../../src';

const should = require('should');
const { UnderlyingAsset } = require('../../src/base');
const { solToken, ProgramID } = require('../../src/account');

describe('UnderlyingAsset', function () {
  it('UnderlyingAsset values should be unique', function () {
    const underlyingAssetSet = new Set();
    const duplicateAssets: (typeof UnderlyingAsset)[] = [];

    for (const asset in UnderlyingAsset) {
      const assetValue = UnderlyingAsset[asset].toUpperCase();
      if (underlyingAssetSet.has(assetValue)) {
        duplicateAssets.push(assetValue);
      }
      underlyingAssetSet.add(assetValue);
    }

    if (duplicateAssets.length !== 0) {
      const failureMessage = `
        Added duplicate UnderlyingAssets with values: ${duplicateAssets}
        You should re-use the existing asset if this refers to the same asset, but on different chains.
        If they are different assets, pick a unique name.
        `;
      should.fail(undefined, undefined, failureMessage);
    }
  });
});

describe('zkSync Era Base Types', function () {
  it('should have ZKSYNCERA in CoinFamily enum', function () {
    CoinFamily.ZKSYNCERA.should.equal('zksyncera');
  });

  it('should have ZKSYNCERA in UnderlyingAsset enum', function () {
    UnderlyingAsset.ZKSYNCERA.should.equal('zksyncera');
  });
});

describe('Tokenized Equity CoinFeatures', function () {
  it('TOKENIZED_EQUITY feature value should be tokenized-equity', function () {
    CoinFeature.TOKENIZED_EQUITY.should.equal('tokenized-equity');
  });

  it('BITGO_TOKENIZED_EQUITY feature value should be bitgo-tokenized-equity', function () {
    CoinFeature.BITGO_TOKENIZED_EQUITY.should.equal('bitgo-tokenized-equity');
  });

  it('sol:gospcx should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('sol:gospcx');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('tsol:gospcx should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('tsol:gospcx');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('tsol:stggospcx should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('tsol:stggospcx');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofcsol:gospcx should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofcsol:gospcx');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofctsol:gospcx should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofctsol:gospcx');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofctsol:stggospcx should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofctsol:stggospcx');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('invariant: BITGO_TOKENIZED_EQUITY without TOKENIZED_EQUITY should throw MissingRequiredCoinFeatureError', function () {
    let threw = false;
    let errorMessage = '';
    let errorType = '';
    try {
      solToken(
        '00000000-0000-0000-0000-000000000001',
        'test:invalidgostock',
        'Invalid goStock',
        6,
        'AAVvaNDwkGfxGNaf1HJ5JzfwDb1PYmAgXSixRsczyrk4',
        'AAVvaNDwkGfxGNaf1HJ5JzfwDb1PYmAgXSixRsczyrk4',
        UnderlyingAsset['sol:gospcx'],
        [
          CoinFeature.ACCOUNT_MODEL,
          CoinFeature.REQUIRES_BIG_NUMBER,
          CoinFeature.VALUELESS_TRANSFER,
          CoinFeature.TRANSACTION_DATA,
          CoinFeature.CUSTODY,
          CoinFeature.CUSTODY_BITGO_TRUST,
          CoinFeature.TSS,
          CoinFeature.TSS_COLD,
          CoinFeature.BULK_TRANSACTION,
          CoinFeature.BITGO_TOKENIZED_EQUITY,
        ],
        ProgramID.Token2022ProgramId
      );
    } catch (err: unknown) {
      threw = true;
      if (err instanceof Error) {
        errorMessage = err.message;
        errorType = err.constructor.name;
      }
    }
    threw.should.be.true();
    errorType.should.equal('MissingRequiredCoinFeatureError');
    errorMessage.should.containEql('tokenized-equity');
  });
});
