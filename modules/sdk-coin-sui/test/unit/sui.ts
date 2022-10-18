import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Sui, Tsui } from '../../src';
import * as testData from '../resources/sui';
import * as _ from 'lodash';
import assert from 'assert';

describe('SUI:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let newTxPrebuild;
  let newTxParams;

  const txPrebuild = {
    txHex: testData.TRANSFER_TX,
    txInfo: {},
  };

  const txParams = {
    recipients: [
      {
        address: testData.recipients.recipient1,
        amount: testData.AMOUNT.toString(),
      },
    ],
  };

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('sui', Sui.createInstance);
    bitgo.safeRegister('tsui', Tsui.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tsui');
    newTxPrebuild = () => {
      return _.cloneDeep(txPrebuild);
    };
    newTxParams = () => {
      return _.cloneDeep(txParams);
    };
  });

  it('should retun the right info', function () {
    const sui = bitgo.coin('sui');
    const tsui = bitgo.coin('tsui');

    sui.getChain().should.equal('sui');
    sui.getFamily().should.equal('sui');
    sui.getFullName().should.equal('Sui');
    sui.getBaseFactor().should.equal(1e9);

    tsui.getChain().should.equal('tsui');
    tsui.getFamily().should.equal('sui');
    tsui.getFullName().should.equal('Testnet Sui');
    tsui.getBaseFactor().should.equal(1e9);
  });

  describe('Verify transaction: ', () => {
    it('should succeed to verify transaction in base64 encoding', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });
  });

  describe('Address Validation', () => {
    let keychains;
    let commonKeychain;

    before(function () {
      commonKeychain =
        '035528bc7daa7f7edec706888d74593c431e393fd71161136d7348d6674e67a858e148f34c5c72d58ddbe6c7b29dedb750e0428a79595b68d6c2e55f5eb7410a';
      keychains = [
        {
          id: '63472ac54b1bf500071c181ef3f2cb0f',
          source: 'user',
          type: 'tss',
          commonKeychain:
            '035528bc7daa7f7edec706888d74593c431e393fd71161136d7348d6674e67a858e148f34c5c72d58ddbe6c7b29dedb750e0428a79595b68d6c2e55f5eb7410a',
          encryptedPrv:
            '{"iv":"BFNnW1rRhVvRt9U21oaAsg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"wKaYa4gei0Y=","ct":"q/7NAYv+l0n0lNJA2MlWt0i5hwV4ZGmAyuRjYi7esbcpbsHW//ZrmrUJC+9PmuNpnv+8rdg5effc3KzI9OiEAXSry1vkB7Iwi6qrXwUIgwAZm0BbbK67+zieGFdYqjr1ic9iVStRoMLMY9pdeYheND8NgyoKK/iAXltB1420+AC4AvZCSr+C2uvrUapkYYLWBO5hfdtLjzOqsZbRWWjnINHh/Ikk+3jXgqp3aE9G8PMou9Tu1myPfpdiqyx5B4k2SEi0u/3YeSuZW3iuXxNwsKLCsgndnJRRZ/PZ/hMEFlrul7spTG0KlsVyDzuDvDyI48gT/aDMdx350nnt/Vn9IxYet4j4fJDe4IOa84nwr4BcxbXDoTPJCLOGExggz4irASz908WCpG+TmiksGh5RQAF2tB+ME016JsN/Rn4F39SU3p4lU3bhu+FxtQwAK7YueYdDXg0a8IhoU5yydf44WD7wjD9Bzny39uJtOZVGNKnO5NtCB/Jzu0beuHShXWFgjRKO560W0P7iSXJf81rg3NcZJznpfzY7CRzo3wOFMj+LcHpiqBml8zo1jalreWUzGecpWrboyYB/dUi6q5tm6XeFqTfh1D8VtQdQLmWpDVuutfDV+YkP0kNWLUdcznMZIcusTKe7BLXdA5gqhl2EiDB67a51Y7wGgSfeF+C7djwX70+q5cA5G27wW5gco//z4WiD8LZqFM86cMI+eLa7v5FJgzOtOwNaSNsSmQ3MPdIVRNS6WrhhjTpThfep3eHZSsQU0Etv/cwrNcMPszk5lc2Xb3npKRcAopehEIFKzDzOXP+VD9zmZtkBEGEKgZLb+39sNKdIf2LSG4wPUi8XjDWFUFr6BrsIDf397zrUDwIQCIXP+evLsjeKhcekEIl00o9102q5WZdqg/3E4zOaCXPPV9VMeSKHMfyC2LysJ0ZDyvS6nPc0choeeUX5LIv7id8CVGWbS2LLb0iU0LxKwI4+ho5sDTWVYk1fguV6SObmr5xxbCxbm2g="}',
        },
        {
          id: '63472ac54b1bf500071c1824e1b47665',
          source: 'backup',
          type: 'tss',
          commonKeychain:
            '035528bc7daa7f7edec706888d74593c431e393fd71161136d7348d6674e67a858e148f34c5c72d58ddbe6c7b29dedb750e0428a79595b68d6c2e55f5eb7410a',
        },
        {
          id: '63472ac44b1bf500071c18140d6eff1d',
          source: 'bitgo',
          type: 'tss',
          commonKeychain:
            '035528bc7daa7f7edec706888d74593c431e393fd71161136d7348d6674e67a858e148f34c5c72d58ddbe6c7b29dedb750e0428a79595b68d6c2e55f5eb7410a',
          isBitGo: true,
        },
      ];
    });

    it('should return true when validating a well formatted address', async function () {
      const address = 'd4f6d75cf725f5931ba62b5b554c2d7efa709f66';
      basecoin.isValidAddress(address).should.equal(true);
    });

    it('should return true when validating a well formatted address prefixed with 0x', async function () {
      const address = '0xd4f6d75cf725f5931ba62b5b554c2d7efa709f66';
      basecoin.isValidAddress(address).should.equal(true);
    });

    it('should return false when validating an incorrectly formatted', async function () {
      const address = 'wrongaddress';
      basecoin.isValidAddress(address).should.equal(false);
    });

    it('should return true for isWalletAddress with valid address for index 4', async function () {
      const newAddress = '2959bfc3fdb7dc23fed8deba2fafb70f3e606a59';
      const index = 4;

      const params = { commonKeychain, address: newAddress, index, keychains };
      (await basecoin.isWalletAddress(params)).should.equal(true);
    });

    it('should return false for isWalletAddress with valid address for index 5 and address is for a different index', async function () {
      const wrongAddressForIndex5 = '2959bfc3fdb7dc23fed8deba2fafb70f3e606a59';
      const index = 5;

      const params = { commonKeychain, address: wrongAddressForIndex5, index, keychains };
      (await basecoin.isWalletAddress(params)).should.equal(false);
    });

    it('should throw error for isWalletAddress when keychains is missing', async function () {
      const address = '2959bfc3fdb7dc23fed8deba2fafb70f3e606a59';
      const index = 0;

      const params = { commonKeychain, address, index };
      await assert.rejects(async () => basecoin.isWalletAddress(params));
    });

    it('should throw error for isWalletAddress when new address is invalid', async function () {
      const wrongAddress = 'badAddress';
      const index = 0;

      const params = { commonKeychain, address: wrongAddress, index };
      await assert.rejects(async () => basecoin.isWalletAddress(params), {
        message: `invalid address: ${wrongAddress}`,
      });
    });
  });
});
