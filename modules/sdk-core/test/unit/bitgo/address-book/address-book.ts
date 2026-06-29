import * as sinon from 'sinon';
import * as superagent from 'superagent';
import 'should';
import { AddressBook } from '../../../../src/bitgo/address-book/address-book';

describe('AddressBook', function () {
  let addressBook: AddressBook;
  let mockBitGo: any;
  const enterpriseId = 'test-enterprise-id';

  function makeGetStub() {
    const queryStub = sinon.stub().returns({ result: sinon.stub().resolves({}) });
    const setStub = sinon.stub().returns({ query: queryStub });
    mockBitGo.get.returns({ set: setStub });
    return { setStub, queryStub };
  }

  function makeParameterlessGetStub(response: Record<string, unknown> = {}) {
    const resultStub = sinon.stub().resolves(response);
    const setStub = sinon.stub().returns({ result: resultStub });
    mockBitGo.get.returns({ set: setStub });
    return { setStub, resultStub };
  }

  beforeEach(function () {
    mockBitGo = {
      get: sinon.stub(),
      microservicesUrl: sinon.stub().callsFake((path: string) => `https://app.bitgo.com${path}`),
    };
    addressBook = new AddressBook(enterpriseId, mockBitGo);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('getConnections', function () {
    it('should pass params as query string, not request body', async function () {
      const { queryStub } = makeGetStub();
      const params = { connectionType: 'DVP' as const, status: 'INACTIVE' as const, offset: 0, limit: 10 };

      await addressBook.getConnections(params);

      sinon.assert.calledWith(mockBitGo.get, 'https://app.bitgo.com/api/address-book/v1/connections');
      sinon.assert.calledOnce(queryStub);
      sinon.assert.calledWith(queryStub, params);
    });

    it('should work with no params', async function () {
      const { queryStub } = makeGetStub();

      await addressBook.getConnections();

      sinon.assert.calledWith(mockBitGo.get, 'https://app.bitgo.com/api/address-book/v1/connections');
      sinon.assert.calledOnce(queryStub);
      sinon.assert.calledWith(queryStub, {});
    });

    it('should pass array filters to query unchanged', async function () {
      const { queryStub } = makeGetStub();
      const params = {
        ownerWalletId: ['wallet-a', 'wallet-b'],
        targetWalletId: ['wallet-c'],
      };

      await addressBook.getConnections(params);

      sinon.assert.calledWith(mockBitGo.get, 'https://app.bitgo.com/api/address-book/v1/connections');
      sinon.assert.calledOnce(queryStub);
      sinon.assert.calledWith(queryStub, params);
    });
  });

  describe('getConnections array query param serialization', function () {
    it('superagent serializes string[] as repeated keys, which address-book accepts via nonEmptyArrayFromQueryParam', function () {
      const req = superagent.get('https://example.com').query({
        ownerWalletId: ['wallet-a', 'wallet-b'],
        targetWalletId: ['wallet-c'],
      });
      // Trigger superagent's query-string assembly without sending the request.
      req.end(() => undefined);

      req.url!.should.equal(
        'https://example.com?ownerWalletId=wallet-a&ownerWalletId=wallet-b&targetWalletId=wallet-c'
      );
    });
  });

  describe('getListing', function () {
    it('should use GET with enterprise-id header and no query or body', async function () {
      const listing = {
        id: 'listing-id',
        enterpriseId,
        name: 'Test Listing',
        owner: 'owner',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      const { setStub, resultStub } = makeParameterlessGetStub(listing);

      const result = await addressBook.getListing();

      sinon.assert.calledWith(mockBitGo.get, 'https://app.bitgo.com/api/address-book/v1/listing/global');
      sinon.assert.calledOnce(setStub);
      sinon.assert.calledWith(setStub, 'enterprise-id', enterpriseId);
      sinon.assert.calledOnce(resultStub);
      result.should.deepEqual(listing);
    });
  });

  describe('getListingEntryContacts', function () {
    it('should pass params as query string, not request body', async function () {
      const { queryStub } = makeGetStub();
      const params = { status: 'ACTIVE' as const, limit: 5 };

      await addressBook.getListingEntryContacts(params);

      sinon.assert.calledWith(mockBitGo.get, 'https://app.bitgo.com/api/address-book/v1/listing/entry/contacts');
      sinon.assert.calledOnce(queryStub);
      sinon.assert.calledWith(queryStub, params);
    });

    it('should work with no params', async function () {
      const { queryStub } = makeGetStub();

      await addressBook.getListingEntryContacts();

      sinon.assert.calledWith(mockBitGo.get, 'https://app.bitgo.com/api/address-book/v1/listing/entry/contacts');
      sinon.assert.calledOnce(queryStub);
      sinon.assert.calledWith(queryStub, {});
    });
  });

  describe('getListingEntryDirectory', function () {
    it('should pass params as query string, not request body', async function () {
      const { queryStub } = makeGetStub();
      const params = { status: 'ACTIVE' as const, limit: 5 };

      await addressBook.getListingEntryDirectory(params);

      sinon.assert.calledWith(mockBitGo.get, 'https://app.bitgo.com/api/address-book/v1/listing/entry/directory');
      sinon.assert.calledOnce(queryStub);
      sinon.assert.calledWith(queryStub, params);
    });

    it('should work with no params', async function () {
      const { queryStub } = makeGetStub();

      await addressBook.getListingEntryDirectory();

      sinon.assert.calledWith(mockBitGo.get, 'https://app.bitgo.com/api/address-book/v1/listing/entry/directory');
      sinon.assert.calledOnce(queryStub);
      sinon.assert.calledWith(queryStub, {});
    });
  });
});
