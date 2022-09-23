import * as sinon from 'sinon';

import 'should-http';
import 'should-sinon';
import '../../lib/asserts';

import { Request } from 'express';
import { handleV2PrebuildAndSignTransaction } from '../../../src/clientRoutes';

import { BitGo } from 'bitgo';

describe('Prebuild and Sign (and Send) transaction', function () {
  const coin = 'polygon';
  const txParams = {
    isTss: true,
    recipients: [
      {
        amount: '0',
        address: '0xe514ee5028934565c3f839429ea3c091efe4c701',
        tokenName: 'erc721:collectionName',
        contractAddress: '0x8397b091514c1f7bebb9dea6ac267ea23b570605',
        tokenId: '38',
        // ERC721 transfers have quantity of 1
        // ERC1155 can transfer > 1 for a given tokenId
        tokenQuantity: '1',
      },
    ],
    type: 'token-transfer',
    walletPassphrase: 'wallet-password-12345',
    feeOptions: {
      maxFeePerGas: 2000000000,
      maxPriorityFeePerGas: 1000000000,
    },
  };

  it('should return a txRequestId after building, signing, sending a tx for a TSS wallet', async function () {
    const expectedResponse = 'transfer-nft-tx-request-id';

    const prebuildAndSignTransactionStub = sinon.stub().resolves(expectedResponse);
    const walletStub = { prebuildAndSignTransaction: prebuildAndSignTransactionStub };
    const coinStub = {
      wallets: () => ({ get: () => Promise.resolve(walletStub) }),
    };
    const bitGoStub = sinon.createStubInstance(BitGo as any, { coin: coinStub });
    const req = {
      bitgo: bitGoStub,
      params: {
        coin,
        id: '632874c8be7b040007104869d2fee228',
      },
      query: {},
      body: txParams,
    } as unknown as Request;
    await handleV2PrebuildAndSignTransaction(req).should.be.resolvedWith(expectedResponse);
  });
});
