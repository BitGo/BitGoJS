import 'should';
import { ApiVersion, IWallet } from '../../../../src';
import { getTxRequestApiVersion } from '../../../../src/bitgo/utils/txRequest';

describe('txRequest utils', () => {
  describe('getTxRequestApiVersion', function () {
    const testCases = [
      {
        wallet: {
          baseCoin: { getMPCAlgorithm: () => 'ecdsa' },
          type: () => 'hot',
          multisigType: () => 'tss',
        } as any as IWallet,
        requestedApiVersion: 'lite',
        expectedApiVersion: '',
        expectedErrorMessage: 'For ECDSA tss wallets, parameter `apiVersion` must be `full`.',
      },
      {
        wallet: {
          baseCoin: { getMPCAlgorithm: () => 'eddsa' },
          type: () => 'cold',
          multisigType: () => 'tss',
        } as any as IWallet,
        requestedApiVersion: 'lite',
        expectedApiVersion: '',
        expectedErrorMessage: 'For non self-custodial (hot) tss wallets, parameter `apiVersion` must be `full`.',
      },
      {
        wallet: {
          baseCoin: { getMPCAlgorithm: () => 'eddsa' },
          type: () => 'hot',
          multisigType: () => 'tss',
        } as any as IWallet,
        requestedApiVersion: undefined,
        expectedApiVersion: 'lite',
        expectedErrorMessage: '',
      },
      ...['hot', 'cold', 'custodial', 'backing'].map((walletType) => {
        return {
          wallet: {
            baseCoin: { getMPCAlgorithm: () => 'ecdsa' },
            type: () => walletType,
            multisigType: () => 'tss',
          } as any as IWallet,
          requestedApiVersion: 'full',
          expectedApiVersion: 'full',
          expectedErrorMessage: '',
          shouldThrow: false,
        };
      }),
      ...['hot', 'cold', 'custodial', 'backing'].map((walletType) => {
        return {
          wallet: {
            baseCoin: { getMPCAlgorithm: () => 'ecdsa' },
            type: () => walletType,
            multisigType: () => 'tss',
          } as any as IWallet,
          requestedApiVersion: undefined,
          expectedApiVersion: 'full',
          expectedErrorMessage: '',
          shouldThrow: false,
        };
      }),
      ...['hot', 'cold', 'custodial', 'backing'].map((walletType) => {
        return {
          wallet: {
            baseCoin: { getMPCAlgorithm: () => 'eddsa' },
            type: () => walletType,
            multisigType: () => 'tss',
          } as any as IWallet,
          requestedApiVersion: 'full',
          expectedApiVersion: 'full',
          expectedErrorMessage: '',
          shouldThrow: false,
        };
      }),
      ...['cold', 'custodial', 'backing'].map((walletType) => {
        return {
          wallet: {
            baseCoin: { getMPCAlgorithm: () => 'eddsa' },
            type: () => walletType,
            multisigType: () => 'tss',
          } as any as IWallet,
          requestedApiVersion: undefined,
          expectedApiVersion: 'full',
          expectedErrorMessage: '',
          shouldThrow: false,
        };
      }),
    ];

    testCases.forEach((testCase) => {
      if (testCase.expectedErrorMessage) {
        it(`should throw an error if requested apiVersion is ${
          testCase.requestedApiVersion
        } for wallet type ${testCase.wallet.type()} for a ${testCase.wallet.baseCoin.getMPCAlgorithm()} wallet`, () => {
          (() =>
            getTxRequestApiVersion(
              testCase.wallet,
              testCase.requestedApiVersion as ApiVersion | undefined
            )).should.throw(testCase.expectedErrorMessage);
        });
      } else {
        it(`should return ${testCase.expectedApiVersion} if requested apiVersion is ${
          testCase.requestedApiVersion
        } for wallet type ${testCase.wallet.type()} for a ${testCase.wallet.baseCoin.getMPCAlgorithm()} wallet`, () => {
          getTxRequestApiVersion(testCase.wallet, testCase.requestedApiVersion as ApiVersion | undefined).should.equal(
            testCase.expectedApiVersion
          );
        });
      }
    });
  });
});
