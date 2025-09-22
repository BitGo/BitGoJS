import { BitGoAPI } from '@bitgo-beta/sdk-api';
import { common, ITransactionRecipient, TransactionPrebuild, Wallet } from '@bitgo-beta/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo-beta/sdk-test';

import { Nep141Token } from '../../src';
import * as testData from '../resources/near';
import nock from 'nock';
import assert from 'assert';

/**
 * [
 *     {
 *         "txRequestId": "485fa500-d1c7-4c68-8c9e-050578638dad",
 *         "walletId": "62e156dbd641c000076bbabe",
 *         "txHex": "400000006562376433623333313166616261653338393062363731383536343838383066663831383766353465623565626665343336646131313338333130396638623500eb7d3b3311fabae3890b67185648880ff8187f54eb5ebfe436da11383109f8b5cea6d8a6f86100004000000033653232313065313138346234356236346338613433346330613765376232336363303465613765623761366333633332353230643033643461666362386166acf71fa4e1ff78cfe2b34359efc8c0085d8110d5f85649c4a48edb8976a7df8b01000000020b00000066745f7472616e73666572660000007b22616d6f756e74223a223130303030303030222c2272656365697665725f6964223a2261393465333937306165633436626262313536393331636130393065643735666633616164653439373966666566366437346337326435613234376365393466227d00e057eb481b000001000000000000000000000000000000",
 *         "feeInfo": {
 *             "fee": 297990720389700000000,
 *             "feeString": "297990720389700000000"
 *         },
 *         "txInfo": {
 *             "minerFee": "0",
 *             "spendAmount": "10000000",
 *             "spendAmounts": [
 *                 {
 *                     "coinName": "tnear:usdc",
 *                     "amountString": "10000000"
 *                 }
 *             ],
 *             "payGoFee": "0",
 *             "outputs": [
 *                 {
 *                     "address": "a94e3970aec46bbb156931ca090ed75ff3aade4979ffef6d74c72d5a247ce94f",
 *                     "value": 10000000,
 *                     "wallet": "62e156dbd641c000076bbabe",
 *                     "wallets": [
 *                         "62e156dbd641c000076bbabe"
 *                     ],
 *                     "enterprise": "6111785f59548d0007a4d13c",
 *                     "enterprises": [
 *                         "6111785f59548d0007a4d13c"
 *                     ],
 *                     "valueString": "10000000",
 *                     "coinName": "tnear:usdc",
 *                     "walletType": "hot",
 *                     "walletTypes": [
 *                         "hot"
 *                     ]
 *                 }
 *             ],
 *             "inputs": [
 *                 {
 *                     "value": 10000000,
 *                     "address": "eb7d3b3311fabae3890b67185648880ff8187f54eb5ebfe436da11383109f8b5",
 *                     "valueString": "10000000"
 *                 }
 *             ],
 *             "type": "6"
 *         },
 *         "consolidateId": "68af1af09a63756a636abe8cc65859cc",
 *         "coin": "tnear",
 *         "token": "tnear:usdc"
 *     }
 * ]
 */
describe('Nep141Token', () => {
  const nep141TokenName = 'tnear:tnep24dp';
  let bitgo: TestBitGoAPI;
  let baseCoin: Nep141Token;
  let newTxPrebuild: () => { txHex: string; txInfo: Record<string, unknown> };
  let newTxParams: () => { recipients: ITransactionRecipient[] };
  let wallet: Wallet;

  const txPreBuild = {
    txHex: testData.rawTx.fungibleTokenTransfer.unsigned,
    txInfo: {},
  };

  const txParams = {
    recipients: [
      {
        address: testData.accounts.account2.address,
        amount: '100',
      },
    ],
  };

  before(() => {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.initializeTestVars();
    Nep141Token.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    newTxPrebuild = () => {
      return structuredClone(txPreBuild);
    };
    newTxParams = () => {
      return structuredClone(txParams);
    };
    baseCoin = bitgo.coin(nep141TokenName) as Nep141Token;
    wallet = new Wallet(bitgo, baseCoin, {});
  });

  describe('Verify Transaction', () => {
    it('should succeed to verify an unsigned transaction without storage deposit', async () => {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      const isTransactionVerified = await baseCoin.verifyTransaction({ txParams, txPrebuild, wallet });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify an unsigned transaction with storage deposit', async () => {
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = testData.rawTx.fungibleTokenTransferWithStorageDeposit.unsigned;
      const txParams = newTxParams();
      const isTransactionVerified = await baseCoin.verifyTransaction({ txParams, txPrebuild, wallet });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify an unsigned transaction with self storage deposit', async () => {
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = testData.rawTx.fungibleTokenTransferWithSelfStorageDeposit.unsigned;
      const txParams = newTxParams();
      const isTransactionVerified = await baseCoin.verifyTransaction({ txParams, txPrebuild, wallet });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify a signed transaction without storage deposit', async () => {
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = testData.rawTx.fungibleTokenTransfer.signed;
      const txParams = newTxParams();
      const isTransactionVerified = await baseCoin.verifyTransaction({ txParams, txPrebuild, wallet });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify a signed transaction with storage deposit', async () => {
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = testData.rawTx.fungibleTokenTransferWithStorageDeposit.signed;
      const txParams = newTxParams();
      const isTransactionVerified = await baseCoin.verifyTransaction({ txParams, txPrebuild, wallet });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify a signed transaction with self storage deposit', async () => {
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = testData.rawTx.fungibleTokenTransferWithSelfStorageDeposit.signed;
      const txParams = newTxParams();
      const isTransactionVerified = await baseCoin.verifyTransaction({ txParams, txPrebuild, wallet });
      isTransactionVerified.should.equal(true);
    });

    it('should fail when tx hex is missing', async () => {
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = '';
      const txParams = newTxParams();
      await baseCoin
        .verifyTransaction({ txParams, txPrebuild, wallet })
        .should.rejectedWith('missing required tx prebuild property txHex');
    });

    it('should fail when recipients and outputs are not matching', async () => {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      txParams.recipients[0].address = testData.accounts.account3.address;
      await baseCoin
        .verifyTransaction({ txParams, txPrebuild, wallet })
        .should.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should verify spoofed consolidation transaction', async function () {
      // Set up wallet data
      const walletData = {
        id: '62e156dbd641c000076bbabe04041a90',
        coin: 'tnear',
        keys: [
          '5b3424f91bf349930e34017500000000',
          '5b3424f91bf349930e34017600000000',
          '5b3424f91bf349930e34017700000000',
        ],
        coinSpecific: {
          rootAddress: '3a1b77653ea1705ad297db7abe259953b4ad5d2ecc5b50bee9a486f785dd90db',
        },
        multisigType: 'tss',
      };

      const consolidationTx = {
        txRequestId: '485fa500-d1c7-4c68-8c9e-050578638dad',
        walletId: '62e156dbd641c000076bbabe',
        txHex:
          '400000006562376433623333313166616261653338393062363731383536343838383066663831383766353465623565626665343336646131313338333130396638623500eb7d3b3311fabae3890b67185648880ff8187f54eb5ebfe436da11383109f8b5cea6d8a6f86100004000000033653232313065313138346234356236346338613433346330613765376232336363303465613765623761366333633332353230643033643461666362386166acf71fa4e1ff78cfe2b34359efc8c0085d8110d5f85649c4a48edb8976a7df8b01000000020b00000066745f7472616e73666572660000007b22616d6f756e74223a223130303030303030222c2272656365697665725f6964223a2261393465333937306165633436626262313536393331636130393065643735666633616164653439373966666566366437346337326435613234376365393466227d00e057eb481b000001000000000000000000000000000000',
        feeInfo: {
          fee: 297990720389700000000,
          feeString: '297990720389700000000',
        },
        txInfo: {
          minerFee: '0',
          spendAmount: '10000000',
          spendAmounts: [
            {
              coinName: 'tnear:usdc',
              amountString: '10000000',
            },
          ],
          payGoFee: '0',
          outputs: [
            {
              address: 'a94e3970aec46bbb156931ca090ed75ff3aade4979ffef6d74c72d5a247ce94f',
              value: 10000000,
              wallet: '62e156dbd641c000076bbabe',
              wallets: ['62e156dbd641c000076bbabe'],
              enterprise: '6111785f59548d0007a4d13c',
              enterprises: ['6111785f59548d0007a4d13c'],
              valueString: '10000000',
              coinName: 'tnear:usdc',
              walletType: 'hot',
              walletTypes: ['hot'],
            },
          ],
          inputs: [
            {
              value: 10000000,
              address: 'eb7d3b3311fabae3890b67185648880ff8187f54eb5ebfe436da11383109f8b5',
              valueString: '10000000',
            },
          ],
          type: '6',
        },
        consolidateId: '68af1af09a63756a636abe8cc65859cc',
        coin: 'tnear',
        token: 'tnear:usdc',
      };
      const bgUrl = common.Environments['mock'].uri;
      const walletObj = new Wallet(bitgo, baseCoin, walletData);

      nock(bgUrl)
        .post('/api/v2/tnear:tnep24dp/wallet/62e156dbd641c000076bbabe04041a90/consolidateAccount/build')
        .reply(200, [
          {
            ...consolidationTx,
            txHex:
              '400000006139346533393730616563343662626231353639333163613039306564373566663361616465343937396666656636643734633732643561323437636539346600a94e3970aec46bbb156931ca090ed75ff3aade4979ffef6d74c72d5a247ce94f223dec154a57000040000000663261373866383033366638613432663837303139623164316463363361316233376231393333656536326464643533653734386335303232663164353739617770e822d797eb15e4b297bc056320a1a8e1538017931ce0d85cdd90d4da300b0100000003000000a1edccce1bc2d3000000000000',
          },
        ]);

      nock(bgUrl)
        .get('/api/v2/tnear:tnep24dp/key/5b3424f91bf349930e34017500000000')
        .reply(200, [
          {
            encryptedPrv: 'fakePrv',
          },
        ]);

      nock(bgUrl)
        .get('/api/v2/tnear:tnep24dp/wallet/62e156dbd641c000076bbabe04041a90/addresses?sort=-1&limit=1')
        .reply(200, [
          {
            address: 'a94e3970aec46bbb156931ca090ed75ff3aade4979ffef6d74c72d5a247ce94f',
          },
        ]);

      // Call the function to test
      await assert.rejects(
        async () => {
          await walletObj.sendAccountConsolidations({
            walletPassphrase: 'password',
            verification: {
              consolidationToBaseAddress: true,
            },
          });
        },
        {
          message: 'tx outputs does not match with expected address',
        }
      );
    });

    it('should verify valid a consolidation transaction', async () => {
      // Set up wallet data
      const walletData = {
        id: '62e156dbd641c000076bbabe04041a90',
        coin: 'tnear',
        keys: [
          '5b3424f91bf349930e34017500000000',
          '5b3424f91bf349930e34017600000000',
          '5b3424f91bf349930e34017700000000',
        ],
        coinSpecific: {
          rootAddress: '3a1b77653ea1705ad297db7abe259953b4ad5d2ecc5b50bee9a486f785dd90db',
        },
        multisigType: 'tss',
      };

      const consolidationTx = {
        txRequestId: 'd0486dfd-3c7e-4e66-8159-990b4eba4b79',
        walletId: '62e156dbd641c000076bbabe',
        txHex:
          '400000006562376433623333313166616261653338393062363731383536343838383066663831383766353465623565626665343336646131313338333130396638623500eb7d3b3311fabae3890b67185648880ff8187f54eb5ebfe436da11383109f8b5cfa6d8a6f8610000400000003365323231306531313834623435623634633861343334633061376537623233636330346561376562376136633363333235323064303364346166636238616603400ca7f8e8266e2da00774f5860694f8aae83f3d8534fdcb2f7534db6a2c1401000000020b00000066745f7472616e73666572660000007b22616d6f756e74223a223130303030303030222c2272656365697665725f6964223a2261393465333937306165633436626262313536393331636130393065643735666633616164653439373966666566366437346337326435613234376365393466227d00e057eb481b000001000000000000000000000000000000',
        feeInfo: {
          fee: 297990720389700000000,
          feeString: '297990720389700000000',
        },
        txInfo: {
          minerFee: '0',
          spendAmount: '10000000',
          spendAmounts: [
            {
              coinName: 'tnear:usdc',
              amountString: '10000000',
            },
          ],
          payGoFee: '0',
          outputs: [
            {
              address: 'a94e3970aec46bbb156931ca090ed75ff3aade4979ffef6d74c72d5a247ce94f',
              value: 10000000,
              wallet: '62e156dbd641c000076bbabe',
              wallets: ['62e156dbd641c000076bbabe'],
              enterprise: '6111785f59548d0007a4d13c',
              enterprises: ['6111785f59548d0007a4d13c'],
              valueString: '10000000',
              coinName: 'tnear:usdc',
              walletType: 'hot',
              walletTypes: ['hot'],
            },
          ],
          inputs: [
            {
              value: 10000000,
              address: 'eb7d3b3311fabae3890b67185648880ff8187f54eb5ebfe436da11383109f8b5',
              valueString: '10000000',
            },
          ],
          type: '6',
        },
        consolidateId: '68af1e000137c83efb0c3a8daad994f2',
        coin: 'tnear',
        token: 'tnear:usdc',
      };
      const bgUrl = common.Environments['mock'].uri;

      nock(bgUrl)
        .get('/api/v2/tnear:tnep24dp/wallet/62e156dbd641c000076bbabe04041a90/addresses?sort=-1&limit=1')
        .reply(200, [
          {
            address: 'a94e3970aec46bbb156931ca090ed75ff3aade4979ffef6d74c72d5a247ce94f',
          },
        ]);

      try {
        if (
          !(await baseCoin.verifyTransaction({
            txParams: {},
            txPrebuild: consolidationTx as unknown as TransactionPrebuild,
            walletType: 'tss',
            wallet: new Wallet(bitgo, baseCoin, walletData),
            verification: {
              consolidationToBaseAddress: true,
            },
          }))
        ) {
          assert.fail('Transaction should pass verification');
        }
      } catch (e) {
        assert.fail('Transaction should pass verification');
      }
    });
  });
});
