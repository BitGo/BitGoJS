import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Icp, Ticp } from '../../src/index';
import nock from 'nock';
nock.enableNetConnect();

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
bitgo.safeRegister('ticp', Ticp.createInstance);

describe('Internet computer', function () {
  let bitgo;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('icp', Icp.createInstance);
    bitgo.safeRegister('ticp', Ticp.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('ticp');
  });

  after(function () {
    nock.pendingMocks().should.be.empty();
    nock.cleanAll();
  });

  it('should return the right info', function () {
    const icp = bitgo.coin('icp');
    const ticp = bitgo.coin('ticp');

    icp.getChain().should.equal('icp');
    icp.getFamily().should.equal('icp');
    icp.getFullName().should.equal('Internet Computer');
    icp.getBaseFactor().should.equal(1e8);
    icp.supportsTss().should.equal(true);

    ticp.getChain().should.equal('ticp');
    ticp.getFamily().should.equal('ticp');
    ticp.getFullName().should.equal('Testnet Internet Computer');
    ticp.getBaseFactor().should.equal(1e8);
    icp.supportsTss().should.equal(true);
  });

  describe('Address creation', () => {
    const hexEncodedPublicKey =
      '047a83e378053f87b49aeae53b3ed274c8b2ffbe59d9a51e3c4d850ca8ac1684f7131b778317c0db04de661c7d08321d60c0507868af41fe3150d21b3c6c757367';
    const invalidPublicKey = '02a83e378053f87b49aeae53b3ed274c8b2ffbe59d9a51e3c4d850ca8ac1684f7';
    const validAccountID = '8b84c3a3529d02a9decb5b1a27e7c8d886e17e07ea0a538269697ef09c2a27b4';

    it('should return true when validating a hex encoded public key', function () {
      basecoin.isValidPub(hexEncodedPublicKey).should.equal(true);
    });

    it('should return false when validating a invalid public key', function () {
      basecoin.isValidPub(invalidPublicKey).should.equal(false);
    });

    it('should return valid address from a valid hex encoded public key', async function () {
      const accountID = await basecoin.getAddressFromPublicKey(hexEncodedPublicKey);
      accountID.should.deepEqual(validAccountID);
    });

    it('should throw an error when invalid public key is provided', async function () {
      await basecoin
        .getAddressFromPublicKey(invalidPublicKey)
        .should.be.rejectedWith(`Public Key is not in a valid Hex Encoded Format`);
    });
  });
});
