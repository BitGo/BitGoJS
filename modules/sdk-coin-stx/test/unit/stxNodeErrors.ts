import assert from 'assert';

import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import { Stx } from '../../src';

type GetStub = (url: string) => Promise<{ statusCode: number; body: unknown }>;
type PostStub = (url: string) => { send: (body: unknown) => Promise<{ statusCode: number; body: unknown }> };

describe('Stx node request error handling', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: Stx;
  const address = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';

  const call = <T>(method: string, arg: unknown): Promise<T> =>
    (basecoin as unknown as Record<string, (a: unknown) => Promise<T>>)[method](arg);

  const stubBitgo = (get: GetStub, post: PostStub) => {
    const bg = (basecoin as unknown as { bitgo: { get: unknown; post: unknown } }).bitgo;
    const originalGet = bg.get;
    const originalPost = bg.post;
    bg.get = get;
    bg.post = post;
    return () => {
      bg.get = originalGet;
      bg.post = originalPost;
    };
  };

  const errorStubs = () =>
    stubBitgo(
      async () => ({ statusCode: 500, body: {} }),
      () => ({ send: async () => ({ statusCode: 500, body: {} }) })
    );

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.initializeTestVars();
    bitgo.safeRegister('stx', Stx.createInstance);
    basecoin = bitgo.coin('stx') as Stx;
  });

  it('wraps a failed native stx balance request', async function () {
    const restore = errorStubs();
    try {
      await assert.rejects(
        call('getNativeStxBalanceFromNode', { address }),
        /unable to get native stx balance from node/
      );
    } finally {
      restore();
    }
  });

  it('wraps a failed fungible token balance request', async function () {
    const restore = errorStubs();
    try {
      await assert.rejects(
        call('getSingleFungibleTokenBalanceFromNode', {
          address,
          assetId: 'ST000000000000000000002AMW42H.token::token',
        }),
        /unable to get native stx balance from node/
      );
    } finally {
      restore();
    }
  });

  it('wraps a failed account nonce request', async function () {
    const restore = errorStubs();
    try {
      await assert.rejects(call('getAccountNonceFromNode', { address }), /unable to get account nonce from node/);
    } finally {
      restore();
    }
  });

  it('wraps a failed transaction fee estimation request', async function () {
    const restore = stubBitgo(
      async () => ({ statusCode: 200, body: {} }),
      () => ({ send: async () => ({ statusCode: 500, body: {} }) })
    );
    try {
      await assert.rejects(
        call('getTransactionFeeEstimation', { txHex: '00', txHexLength: 1 }),
        /unable to get transaction fee estimation/
      );
    } finally {
      restore();
    }
  });

  it('rejects a fee estimation response with an unexpected number of estimations', async function () {
    const restore = stubBitgo(
      async () => ({ statusCode: 200, body: {} }),
      () => ({ send: async () => ({ statusCode: 200, body: { estimations: [] } }) })
    );
    try {
      await assert.rejects(
        call('getTransactionFeeEstimation', { txHex: '00', txHexLength: 1 }),
        /unable to get transaction fee estimation/
      );
    } finally {
      restore();
    }
  });

  it('rejects an unsupported token contract when selecting a builder', function () {
    const selectBuilder = basecoin as unknown as {
      getTokenOrNativeTransferBuilder: (contractAddress?: string, contractName?: string) => unknown;
    };
    assert.throws(
      () => selectBuilder.getTokenOrNativeTransferBuilder('ST000000000000000000002AMW42H', 'not-a-token'),
      /invalid contract address or contract name, not supported/
    );
  });

  it('rejects building a token transfer for an unsupported contract', async function () {
    const build = basecoin as unknown as { buildTokenTransferTransaction: (params: unknown) => Promise<unknown> };
    await assert.rejects(
      build.buildTokenTransferTransaction({
        builder: {},
        contractAddress: 'ST000000000000000000002AMW42H',
        contractName: 'not-a-token',
        pubs: [],
        nonce: 0,
        rootAddressDetails: { address },
        destinationAddressDetails: { address },
        stxBalance: '0',
      }),
      /invalid contract address or contract name, not supported/
    );
  });

  it('rejects building a token transfer with no recoverable token balance', async function () {
    const restore = stubBitgo(
      async () => ({ statusCode: 200, body: { balance: '0' } }),
      () => ({ send: async () => ({ statusCode: 200, body: {} }) })
    );
    const build = basecoin as unknown as { buildTokenTransferTransaction: (params: unknown) => Promise<unknown> };
    try {
      await assert.rejects(
        build.buildTokenTransferTransaction({
          builder: {},
          contractAddress: 'STAG18E45W613FZ3H4ZMF6QHH426EXM5QTSAVWYH',
          contractName: 'tsip6dp-token',
          pubs: [],
          nonce: 0,
          rootAddressDetails: { address },
          destinationAddressDetails: { address },
          stxBalance: '0',
        }),
        /no token balance found to recover/
      );
    } finally {
      restore();
    }
  });
});
