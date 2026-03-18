import should from 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { InvalidAddressError } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { Canton, Tcanton } from '../../src';
import { CANTON_ADDRESSES } from '../resources';

describe('Canton:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: Canton;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('canton', Canton.createInstance);
    bitgo.safeRegister('tcanton', Tcanton.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('canton') as Canton;
  });

  describe('getAddressDetails', function () {
    it('should get address details without memoId', function () {
      const addressDetails = basecoin.getAddressDetails(CANTON_ADDRESSES.VALID_ADDRESS);
      addressDetails.address.should.equal(CANTON_ADDRESSES.VALID_ADDRESS);
      should.not.exist(addressDetails.memoId);
    });

    it('should get address details with memoId', function () {
      const addressWithMemoId = CANTON_ADDRESSES.VALID_MEMO_ID;
      const addressDetails = basecoin.getAddressDetails(addressWithMemoId);
      addressDetails.address.should.equal(CANTON_ADDRESSES.VALID_ADDRESS);
      should.exist(addressDetails.memoId);
      addressDetails.memoId!.should.equal('1');
    });

    it('should throw on multiple memoId query params', function () {
      (() => basecoin.getAddressDetails(`${CANTON_ADDRESSES.VALID_ADDRESS}?memoId=1&memoId=2`)).should.throw(
        InvalidAddressError
      );
    });

    it('should throw on unknown query params', function () {
      (() => basecoin.getAddressDetails(`${CANTON_ADDRESSES.VALID_ADDRESS}?foo=bar`)).should.throw(InvalidAddressError);
    });
  });
});
