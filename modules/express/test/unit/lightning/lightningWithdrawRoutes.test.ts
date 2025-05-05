import * as sinon from 'sinon';
import * as should from 'should';
import * as express from 'express';
import { PayInvoiceResponse } from '@bitgo/abstract-lightning';
import { BitGo } from 'bitgo';
import { handleLightningWithdraw } from '../../../src/lightning/lightningWithdrawRoutes';

describe('Lightning Withdraw Routes', () => {
  let bitgo;
  const coin = 'tlnbtc';

  const mockRequestObject = (params: { body?: any; params?: any; query?: any; bitgo?: any }) => {
    const req: Partial<express.Request> = {};
    req.body = params.body || {};
    req.params = params.params || {};
    req.query = params.query || {};
    req.bitgo = params.bitgo;
    return req as express.Request;
  };

  afterEach(() => {
    sinon.restore();
  });

  describe('On chain withdrawal', () => {
    it('should successfully make a on chain withdrawal', async () => {
      const inputParams = {
        recipients: [
          {
            amountSat: '500000',
            address: 'bcrt1qjq48cqk2u80hewdcndf539m8nnnvt845nl68x7',
          },
        ],
        satsPerVbyte: '15',
      };

      const expectedResponse: PayInvoiceResponse = {
        txRequestState: 'delivered',
        txRequestId: '123',
      };

      const onchainWithdrawStub = sinon.stub().resolves(expectedResponse);
      const mockLightningWallet = {
        withdrawOnchain: onchainWithdrawStub,
      };

      // Mock the module import
      const proxyquire = require('proxyquire');
      const lightningWithdrawRoutes = proxyquire('../../../src/lightning/lightningWithdrawRoutes', {
        '@bitgo/abstract-lightning': {
          getLightningWallet: () => mockLightningWallet,
        },
      });

      const walletStub = {};
      const coinStub = {
        wallets: () => ({ get: sinon.stub().resolves(walletStub) }),
      };
      const stubBitgo = sinon.createStubInstance(BitGo as any, { coin: coinStub });

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        body: inputParams,
        bitgo: stubBitgo,
      });

      const result = await lightningWithdrawRoutes.handleLightningWithdraw(req);

      should(result).deepEqual(expectedResponse);
      should(onchainWithdrawStub).be.calledOnce();
      const [firstArg] = onchainWithdrawStub.getCall(0).args;

      const decodedRecipients = inputParams.recipients.map((recipient) => {
        return {
          ...recipient,
          amountSat: BigInt(recipient.amountSat),
        };
      });

      // we decode the amountMsat string to bigint, it should be in bigint format when passed to payInvoice
      should(firstArg).have.property('recipients', decodedRecipients);
      should(firstArg).have.property('satsPerVbyte', BigInt(inputParams.satsPerVbyte));
    });

    it('should throw an error if the satsPerVbyte is missing in the request params', async () => {
      const inputParams = {
        recipients: [
          {
            amountSat: '500000',
            address: 'bcrt1qjq48cqk2u80hewdcndf539m8nnnvt845nl68x7',
          },
        ],
      };

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        body: inputParams,
      });
      req.bitgo = bitgo;

      await should(handleLightningWithdraw(req)).be.rejectedWith(
        'Invalid request body for withdrawing on chain lightning balance'
      );
    });

    it('should throw an error if the recipients is missing in the request params', async () => {
      const inputParams = {
        satsPerVbyte: '15',
      };

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        body: inputParams,
      });
      req.bitgo = bitgo;

      await should(handleLightningWithdraw(req)).be.rejectedWith(
        'Invalid request body for withdrawing on chain lightning balance'
      );
    });
  });
});
