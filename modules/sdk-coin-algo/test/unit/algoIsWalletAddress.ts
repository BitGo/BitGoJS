import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Talgo, VerifyAlgoAddressOptions } from '../../src';
import { AssertionError } from 'assert';

const should = require('should');

describe('Algo class', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('talgo', Talgo.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('talgo');
  });

  describe('for method isWalletAddress', () => {
    const ROOT_ADDRESS = 'AND6YSSWQMMFOROH6NINCLNDNHXYIICIPIOPORA5VWELJVZ5J6OBAZCB6E';
    const USE_UNDEFINED = 'use undefined';
    const INVALID_KEY = { pub: 'XH3WEL22VP6EAPVIUHUZCKBYZEJFSLZD3K4PK44MZCVSA4RFSB2ZH4SGLQ' };

    const keychains = [
      { pub: '5II7OEXHVZUDTTLYMX2VESDSD6NZZ3CJKSYHKNQRU7RW2AEWBBM46VSPRE' }, // '62228ac8c01c5500072dc71d'
      { pub: '6JMXSB37MWGTALLCUUVJGKMC4LQCU3EEJHRRUZMIOQS4CPLQU2KVYWLR3M' }, // '62228ac8c01c5500072dc726'
      { pub: 'OH3WEL22VP6EAPVIUHUZCKBYZEJFSLZD3K4PK44MZCVSA4RFSB2ZH4SGLQ' }, // '62228ac9c01c5500072dc72f'
    ];

    const makeVerifyAddressOptions = (
      address: string,
      rootAddress: string,
      bitgoPubKey?: string,
      useKeyChain?: typeof keychains | string
    ): VerifyAlgoAddressOptions => ({
      address,
      chain: 0,
      index: 0,
      coin: 'talgo',
      wallet: '62228ae1c01c5500072dc7a1',
      coinSpecific: {
        rootAddress,
        bitgoKey: '62228ac8c01c5500072dc71d',
        addressVersion: 1,
        threshold: 2,
        ...(bitgoPubKey ? { bitgoPubKey } : {}),
      },
      ...(typeof useKeyChain === 'string' ? {} : { keychains }),
    });

    const otherAddress = 'AWSC7RL3RM72HSUW5QU4XTX3AOHY7QD3WLUZC2CAHWP6BTI5Q7IABVUXTA';
    const receivingAddress = 'BIJ332IS63LGDG4HIPBMUWQLE4AMIS3D7A3IPNGGDS5FKGWURCHE5NVMXI';

    // Test cases
    [
      {
        title: 'should validate root address',
        address: ROOT_ADDRESS,
        expected: true,
      },
      {
        title: 'should not validate address outside wallet',
        address: otherAddress,
        expected: false,
      },
      {
        title: 'should validate a receiving address',
        address: receivingAddress,
        bitgoKey: '62237caa05ff6900076196d0',
        bitgoPubKey: 'TZUQM3QPLGLAWIRDSN6REATX6HOSZGBXZFSFGD55OKUVE4JHXFWI5SZ6GY',
        expected: true,
      },
      {
        title: 'should not validate a not owned receiving address',
        address: 'GD64YIY3TWGDMCNPP553DZPPR6LDUSFQOIJVFDPPXWEG3FVOJCCDBBHU5A',
        bitgoKey: '62237caa05ff6900076196d0',
        bitgoPubKey: 'TZUQM3QPLGLAWIRDSN6REATX6HOSZGBXZFSFGD55OKUVE4JHXFWI5SZ6GY',
        expected: false,
      },
      {
        title: 'should report error for invalid formatted address',
        address: 'GD64YIY3TWGDMCNPP553DZPPR6LDUSFQOIJVFDPPXWEG3FVOJ',
        throws: /invalid address/,
      },
      {
        title: 'should report error for invalid checksum address',
        address: 'GD64YIY3TWGDMCNPP553DZPPR6LDUSFQOIJVFDPPXWEG3F999',
        throws: /invalid address/,
      },
      {
        title: 'should report error if keychain is missing',
        address: ROOT_ADDRESS,
        keychains: USE_UNDEFINED,
        throws: /missing required param keychains/,
      },
      {
        title: 'should report error if any key is invalid',
        address: ROOT_ADDRESS,
        keychains: [keychains[0], keychains[1], INVALID_KEY],
        throws: /invalid public key/,
      },
    ].forEach(({ title, address, expected, bitgoPubKey, throws, keychains }) => {
      it(title, async () => {
        // GIVEN parameter options for created address
        const params = makeVerifyAddressOptions(address, ROOT_ADDRESS, bitgoPubKey, keychains);

        try {
          // WHEN checking address
          const result = await basecoin.isWalletAddress(params);

          // THEN no error was expected
          should(throws).be.undefined();
          // THEN address is validated as expected
          result.should.be.equal(expected);
        } catch (e) {
          if (e instanceof AssertionError) {
            // Do not hide other assertions
            throw e;
          }
          should(throws).be.not.undefined();
          should(expected).be.undefined();
          (() => {
            throw e;
          }).should.throw(throws || 'never reaches here but compiler is unhappy without this');
        }
      });
    });
  });
});
