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

  it('sol:goamzn should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('sol:goamzn');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('tsol:goamzn should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('tsol:goamzn');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('tsol:stggoamzn should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('tsol:stggoamzn');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofcsol:goamzn should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofcsol:goamzn');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofctsol:goamzn should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofctsol:goamzn');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofctsol:stggoamzn should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofctsol:stggoamzn');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('sol:gobtgo should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('sol:gobtgo');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('tsol:gobtgo should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('tsol:gobtgo');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('tsol:stggobtgo should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('tsol:stggobtgo');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofcsol:gobtgo should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofcsol:gobtgo');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofctsol:gobtgo should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofctsol:gobtgo');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofctsol:stggobtgo should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofctsol:stggobtgo');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('sol:gogoogl should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('sol:gogoogl');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('tsol:gogoogl should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('tsol:gogoogl');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('tsol:stggogoogl should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('tsol:stggogoogl');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofcsol:gogoogl should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofcsol:gogoogl');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofctsol:gogoogl should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofctsol:gogoogl');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofctsol:stggogoogl should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofctsol:stggogoogl');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('sol:gometa should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('sol:gometa');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('tsol:gometa should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('tsol:gometa');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('tsol:stggometa should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('tsol:stggometa');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofcsol:gometa should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofcsol:gometa');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofctsol:gometa should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofctsol:gometa');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofctsol:stggometa should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofctsol:stggometa');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('sol:gomsft should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('sol:gomsft');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('tsol:gomsft should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('tsol:gomsft');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('tsol:stggomsft should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('tsol:stggomsft');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofcsol:gomsft should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofcsol:gomsft');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofctsol:gomsft should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofctsol:gomsft');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofctsol:stggomsft should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofctsol:stggomsft');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('sol:gonvda should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('sol:gonvda');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('tsol:gonvda should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('tsol:gonvda');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('tsol:stggonvda should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('tsol:stggonvda');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofcsol:gonvda should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofcsol:gonvda');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofctsol:gonvda should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofctsol:gonvda');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofctsol:stggonvda should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofctsol:stggonvda');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('sol:gotsla should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('sol:gotsla');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('tsol:gotsla should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('tsol:gotsla');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('tsol:stggotsla should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('tsol:stggotsla');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofcsol:gotsla should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofcsol:gotsla');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofctsol:gotsla should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofctsol:gotsla');
    coin.features.should.containEql(CoinFeature.TOKENIZED_EQUITY);
    coin.features.should.containEql(CoinFeature.BITGO_TOKENIZED_EQUITY);
  });

  it('ofctsol:stggotsla should have both TOKENIZED_EQUITY and BITGO_TOKENIZED_EQUITY', function () {
    const coin = coins.get('ofctsol:stggotsla');
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
describe('ZAMA staking feature', function () {
  it('eth:zama should expose STAKING', function () {
    const coin = coins.get('eth:zama');
    coin.features.should.containEql(CoinFeature.STAKING);
  });

  it('ERC-7984 ZAMA tokens should not expose STAKING', function () {
    ['eth:czama', 'eth:cxaut', 'eth:ctgbp', 'eth:cweth', 'eth:cusdt', 'eth:cusdc', 'hteth:ctest1', 'hteth:cusdt'].forEach(
      (name) => {
        coins.get(name).features.includes(CoinFeature.STAKING).should.be.false();
      }
    );
  });

  it('stZAMA LSTs should not expose STAKING', function () {
    ['hteth:stzamakms', 'hteth:stzamadfns', 'hteth:stzamafig', 'hteth:stzamacop', 'hteth:stzamablco'].forEach(
      (name) => {
        coins.get(name).features.includes(CoinFeature.STAKING).should.be.false();
      }
    );
  });
});
