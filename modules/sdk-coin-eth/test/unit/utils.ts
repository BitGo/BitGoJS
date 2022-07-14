import should from 'should';
import {
  sign,
  isValidEthAddress,
  getAddressInitializationData,
  calculateForwarderAddress,
  calculateForwarderV1Address,
  getProxyInitcode,
  getEthAddressFromCompressedPub,
} from '../../src';
import * as testData from '../resources/eth';
import * as walletUtilConstants from '../../src/lib/walletUtil';
import { bufferToHex, setLengthLeft } from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';
import assert from 'assert';

describe('ETH util library', function () {
  describe('sign operation', function () {
    it('should return a correct signed transaction', async () => {
      const SIGNATURE = await sign(testData.LEGACY_TXDATA, testData.KEYPAIR_PRV);
      should.equal(SIGNATURE, testData.ENCODED_LEGACY_TRANSACTION);
    });

    it('should fail with missing prv key', function () {
      sign(testData.LEGACY_TXDATA, testData.KEYPAIR_PUB).should.be.rejectedWith(new RegExp('Missing private key'));
    });
  });

  it('Should validate valid createForwarder Id', function () {
    should.equal(getAddressInitializationData(), walletUtilConstants.createForwarderMethodId);
  });

  it('should validate valid address', function () {
    should.equal(isValidEthAddress(testData.ACCOUNT_1), true);
  });

  it('should validate invalid address', function () {
    should.equal(isValidEthAddress(testData.INVALID_ACCOUNT), false);
  });

  it('should generate a proper address', function () {
    should.equal(calculateForwarderAddress(testData.CONTRACT_ADDRESS, 1), '0x016e4eee27f3f355bbb78d0e5eb813c4761822c9');
  });

  it('should generate a proper forwarder version 1 address', function () {
    const initCode = getProxyInitcode(testData.FORWARDER_IMPLEMENTATION_ADDRESS);
    const saltBuffer = setLengthLeft('0x02', 32);

    // Hash the wallet base address with the given salt, so the address directly relies on the base address
    const calculationSalt = bufferToHex(
      EthereumAbi.soliditySHA3(['address', 'bytes32'], [testData.BASE_ADDRESS, saltBuffer])
    );
    should.equal(
      calculateForwarderV1Address(testData.FORWARDER_FACTORY_ADDRESS, calculationSalt, initCode),
      '0x7cdc37afc70221410bea40ce3b62c2f7bf383890'
    );
  });

  it('should generate valid public key from compressed secp256k1 point', function () {
    const pointA = '0x0253d1672988675b36aaa3e905058667ff1559cb8edd8de2c5a4a0349db98238c5';
    const pointB = '031d4cf63e53a54ea472ab4533b89031c20788c70043563c996c52bf655a078619';
    const ethAddress = getEthAddressFromCompressedPub(pointA);
    const ethAddressTwo = getEthAddressFromCompressedPub(pointB);
    ethAddress.should.equal('0x5ddb50e341c8f222811450d1cb5b7a8cb134e35a');
    ethAddressTwo.should.equal('0xb42817ef5f281ba8c7bc107f6e173ed2f014aed4');
    assert.throws(() => getEthAddressFromCompressedPub(pointB.slice(2)));
  });
});
