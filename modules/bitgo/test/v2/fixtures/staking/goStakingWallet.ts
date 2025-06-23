import {
  GoStakingRequest,
  GoStakingRequestResults,
  GoStakingWalletObject,
  GoStakingWalletResults,
  UnsignedGoStakingRequest,
} from '@bitgo/sdk-core';

export default {
  previewGoStakingRequest: function (coin: string): UnsignedGoStakingRequest {
    return {
      payload:
        '{"coin":"ofctsol","recipients":[{"address":"ANTqf3wcfUqdPWcn1YsYF5X4BBsC1E4gVKKJW7QaRYGh","amount":"1000000"}],"fromAccount":"6733daae98a5c3f5a565a719e328c2a7","nonce":"2cc231b3-693c-497d-a2fa-8d43f3c9f219","timestamp":"2025-03-04T14:41:46.671Z","feeString":"0","shortCircuitBlockchainTransfer":false,"isIntraJXTransfer":false}',
      feeInfo: {
        feeString: '0',
      },
      coin: 'ofc',
      token: coin,
    };
  },
  finalizeGoStakingRequest: function (coin: string, type: 'STAKE' | 'UNSTAKE'): GoStakingRequest {
    return {
      id: 'string',
      amount: '1',
      type: type,
      coin: coin,
      status: 'NEW',
      goSpecificStatus: 'NEW',
      statusModifiedDate: '2025-01-03T22:04:29.264Z',
      createdDate: '2025-01-03T22:04:29.264Z',
    };
  },
  getGoStakingRequestsByCoin: function (coin: string): GoStakingRequestResults {
    return {
      requests: [this.finalizeGoStakingRequest(coin, 'STAKE'), this.finalizeGoStakingRequest(coin, 'UNSTAKE')],
      page: 1,
      totalPages: 1,
      totalElements: 2,
    };
  },
  getGoStakingRequests: function (coins: string[]): GoStakingRequestResults {
    return {
      requests: coins.map((coin) => this.finalizeGoStakingRequest(coin, 'STAKE')),
      page: 1,
      totalPages: 1,
      totalElements: coins.length,
    };
  },
  getGoStakingWallet: function (coin: string): GoStakingWalletObject {
    return {
      coin: coin,
      activeStake: '1000000',
      pendingStake: '500000',
      pendingUnstake: '200000',
      rewards: '10000',
      attributes: {
        permissionAttributes: {
          staking: {
            enabled: true,
            allowClientToUseOwnValidator: true,
          },
          unstaking: {
            enabled: true,
          },
          wallet: {
            useValidatorList: true,
            allowPartialUnstake: true,
            validatorNotNeededForStake: false,
          },
        },
        spendableAttributes: {
          staking: {
            fee: '1000',
            max: '10000000',
            min: '1000',
            netMax: '9000000',
            netMin: '500',
            minStakeMore: '1000',
            minDuration: '3600',
            maxDuration: '86400',
          },
          unstaking: {
            fee: '500',
            max: '5000000',
            min: '1000',
            multipleDelegations: true,
            requiresAmount: true,
            requiresDelegationId: false,
            requiresDelegationIds: false,
          },
        },
        disclaimerAttributes: {
          staking: {
            info: ['Staking is subject to network conditions and may vary.'],
            rewardPercentageRate: '5.0',
            stakeWarmupPeriodDesc: 'Staking warmup period is 24 hours.',
          },
          unstaking: {
            info: ['Unstaking may take up to 7 days to complete.'],
            unStakeCooldownPeriodDesc: 'Unstaking cooldown period is 7 days.',
          },
          nextRewards: {
            rewardCycle: 30,
          },
        },
      },
    };
  },
  getGoStakingWallets: function (coinList: string[]): GoStakingWalletResults {
    return {
      coins: coinList.map((coin) => this.getGoStakingWallet(coin)),
      page: 1,
      totalPages: 1,
      totalElements: coinList.length,
    };
  },
};
