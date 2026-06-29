import sinon from 'sinon';
import should from 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { CoinFeature, coins } from '@bitgo/statics';
import { register, CosmosSharedCoin } from '../../src';

describe('Cosmos Register', function () {
  let bitgo: BitGoAPI;
  let registerSpy: sinon.SinonSpy;
  let cosmosCoins: Set<string>;

  before(function () {
    // Get all coins with the SHARED_COSMOS_SDK feature
    cosmosCoins = new Set(
      coins.filter((coin) => coin.features.includes(CoinFeature.SHARED_COSMOS_SDK)).map((coin) => coin.name)
    );
  });

  beforeEach(function () {
    bitgo = new BitGoAPI({ env: 'test' });
    registerSpy = sinon.spy(bitgo, 'register');
  });

  afterEach(function () {
    registerSpy.restore();
  });

  it('should register all cosmos coins', function () {
    register(bitgo);

    // Verify that register was called for each cosmos coin
    should.equal(registerSpy.callCount, cosmosCoins.size);

    // Verify that each call was for a cosmos coin with the correct factory
    for (let i = 0; i < registerSpy.callCount; i++) {
      const call = registerSpy.getCall(i);
      const coinName = call.args[0];
      const factory = call.args[1];

      should.ok(cosmosCoins.has(coinName), `${coinName} should be a cosmos coin`);
      should.equal(factory, CosmosSharedCoin.createInstance);
    }
  });

  it('should register each coin only once', function () {
    register(bitgo);

    // Get the list of registered coins
    const registeredCoins = registerSpy.getCalls().map((call) => call.args[0]);

    // Check for duplicates
    const uniqueCoins = new Set(registeredCoins);
    should.equal(uniqueCoins.size, registeredCoins.length, 'There should be no duplicate coin registrations');
  });
});
