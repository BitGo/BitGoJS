import {
  CoinFamily,
  CoinFeature,
  CoinKind,
  KeyCurve,
  Networks,
  AccountCoin,
  BaseUnit,
  OfcCoin,
  coins,
} from '../../src';
import { MAX_BIP32_INDEX } from '../../src/constants';
import { InvalidBip44CoinTypeError } from '../../src/errors';

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
  it('eth:zama should not expose STAKING', function () {
    const coin = coins.get('eth:zama');
    coin.features.includes(CoinFeature.STAKING).should.be.false();
  });

  it('hteth:zamamock should expose correct staking metadata', function () {
    const coin = coins.get('hteth:zamamock');
    coin.fullName.should.equal('ZAMAMock');
    coin.decimalPlaces.should.equal(18);
    coin.contractAddress.should.equal('0x58713eca04e01114480b30be8ca0d8838f342a55');
    coin.network.name.should.equal(Networks.test.hoodi.name);
    coin.features.should.containEql(CoinFeature.STAKING);
  });

  it('ERC-7984 ZAMA tokens should not expose STAKING', function () {
    [
      'eth:czama',
      'eth:cxaut',
      'eth:ctgbp',
      'eth:cweth',
      'eth:cusdt',
      'eth:cusdc',
      'hteth:ctest1',
      'hteth:cusdt',
    ].forEach((name) => {
      coins.get(name).features.includes(CoinFeature.STAKING).should.be.false();
    });
  });

  it('stZAMA LSTs should not expose STAKING', function () {
    ['hteth:stzamakms', 'hteth:stzamadfns', 'hteth:stzamafig', 'hteth:stzamacop', 'hteth:stzamablco'].forEach(
      (name) => {
        coins.get(name).features.includes(CoinFeature.STAKING).should.be.false();
      }
    );
  });
});

describe('bip44CoinType', function () {
  function accountCoinOptions(bip44CoinType?: number): ConstructorParameters<typeof AccountCoin>[0] {
    return {
      id: '00000000-0000-4000-8000-000000000001',
      fullName: 'Test Coin',
      name: 'testcoin',
      network: Networks.main.ethereum,
      baseUnit: BaseUnit.ETH,
      features: AccountCoin.DEFAULT_FEATURES,
      decimalPlaces: 18,
      isToken: false,
      asset: UnderlyingAsset.ETH,
      primaryKeyCurve: KeyCurve.Secp256k1,
      bip44CoinType,
    };
  }

  it('should default to the coin type of its family', function () {
    new AccountCoin(accountCoinOptions()).bip44CoinType.should.equal(60);
  });

  it('should carry the coin type on the coin when provided', function () {
    new AccountCoin(accountCoinOptions(519)).bip44CoinType.should.equal(519);
  });

  [MAX_BIP32_INDEX + 1, -1, 0.5].forEach((bip44CoinType) => {
    it(`should reject out-of-range or non-integer coin type ${bip44CoinType}`, function () {
      should(() => new AccountCoin(accountCoinOptions(bip44CoinType))).throw(InvalidBip44CoinTypeError);
    });
  });

  it('should accept boundary coin types 0 and 0x7fffffff', function () {
    new AccountCoin(accountCoinOptions(0)).bip44CoinType.should.equal(0);
    new AccountCoin(accountCoinOptions(MAX_BIP32_INDEX)).bip44CoinType.should.equal(MAX_BIP32_INDEX);
  });

  it('invariant: OFC and fiat coins carry no bip44CoinType', function () {
    coins.forEach((coin, name) => {
      should(coin instanceof OfcCoin || coin.kind === CoinKind.FIAT ? coin.bip44CoinType === undefined : true).be.true(
        `'${name}' must not carry a bip44CoinType`
      );
    });
  });
});
