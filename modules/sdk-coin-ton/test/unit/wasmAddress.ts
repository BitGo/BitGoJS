import should from 'should';
import { encodeAddress, validateAddress } from '@bitgo/wasm-ton';
import utils from '../../src/lib/utils';
import * as testData from '../resources/ton';

describe('TON WASM Address', () => {
  it('should derive address from public key using WASM encodeAddress', () => {
    const address = utils.getAddressFromPublicKey(testData.sender.publicKey);
    address.should.be.a.String();
    address.length.should.equal(48);
    validateAddress(address).should.be.true();
  });

  it('should derive non-bounceable address from public key', () => {
    const bounceable = utils.getAddressFromPublicKey(testData.sender.publicKey, true);
    const nonBounceable = utils.getAddressFromPublicKey(testData.sender.publicKey, false);
    bounceable.should.not.equal(nonBounceable);
    validateAddress(bounceable).should.be.true();
    validateAddress(nonBounceable).should.be.true();
  });

  it('should derive consistent addresses via encodeAddress directly', () => {
    const pubKeyBytes = Buffer.from(testData.sender.publicKey, 'hex');
    const address = encodeAddress(pubKeyBytes, true);
    const addressFromUtils = utils.getAddressFromPublicKey(testData.sender.publicKey);
    address.should.equal(addressFromUtils);
  });

  it('should validate known valid addresses', () => {
    for (const addr of testData.addresses.validAddresses) {
      validateAddress(addr).should.be.true();
    }
  });

  it('should reject known invalid addresses', () => {
    for (const addr of testData.addresses.invalidAddresses) {
      validateAddress(addr).should.be.false();
    }
  });
});
